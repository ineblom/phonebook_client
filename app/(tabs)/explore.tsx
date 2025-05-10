import { View, Text, type LayoutChangeEvent } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  type ExpoWebGLRenderingContext,
  getWorkletContext,
  GLView,
} from "expo-gl";
import {
  runOnUI,
  type SharedValue,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { init_renderer, ortho, push_circle, renderer_render, translate } from "@/lib/renderer";

interface Node {
  x: number;
  y: number;
  label: string;
  user_key: string;
}

interface Edge {
  source: number;
  target: number;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface Camera {
  x: SharedValue<number>;
  y: SharedValue<number>;
}

const INITIAL_ZOOM_LEVEL = 0.5;

function run(
  gl: ExpoWebGLRenderingContext,
  camera: Camera,
  zoom: SharedValue<number>,
) {
  "worklet";

  const renderer = init_renderer(gl);
  if (!renderer) {
    console.error("Failed to initialize renderer");
    return;
  }

  if (zoom.value === 1.0) {
    zoom.value = INITIAL_ZOOM_LEVEL;
  }

  const render = (time_ms: number) => {
    "worklet";
    const time = time_ms / 1000;

    push_circle(renderer, 0, 0, 1, 0, 0);
    push_circle(renderer, 1.5, 0, 0, 1, 0);
    push_circle(renderer, 0, 1.5, 0, 0, 1);

    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const view = translate(-camera.x.value, -camera.y.value);
    const viewSize = 1 / zoom.value;
    const projection = ortho(
      -viewSize * aspect,
      viewSize * aspect,
      -viewSize,
      viewSize,
    );

    renderer_render(renderer, gl, view, projection);

    requestAnimationFrame(render);
  };
  render(0);
}

function onContextCreate(
  gl: ExpoWebGLRenderingContext,
  camera: Camera,
  zoom: SharedValue<number>,
) {
  runOnUI((contextId: number, cam: Camera, z: SharedValue<number>) => {
    "worklet";
    const glWorklet = getWorkletContext(contextId);
    if (!glWorklet) {
      console.error("Failed to get context");
      return;
    }
    run(glWorklet, cam, z);
  })(gl.contextId, camera, zoom);
}

export default function Home() {
  const [key, setKey] = useState<number>(0);
  const [layoutDims, setLayoutDims] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setKey((prevKey) => prevKey + 1);
  }, []);

  const camera = { x: useSharedValue(0), y: useSharedValue(0) };
  const zoom = useSharedValue(INITIAL_ZOOM_LEVEL);
  const pixelToWorldScale = useSharedValue(1);

  useEffect(() => {
    runOnUI(() => {
      "worklet";
      zoom.value = INITIAL_ZOOM_LEVEL;
    })();
  }, []);

  useEffect(() => {
    if (layoutDims && layoutDims.width > 0) {
      const viewSize = 1 / zoom.value;
      pixelToWorldScale.value = viewSize / layoutDims.width;
    }
  }, [layoutDims, pixelToWorldScale, zoom]);

  const panGesture = Gesture.Pan().onChange((event) => {
    "worklet";
    const { changeX, changeY } = event;
    camera.x.value -= changeX * pixelToWorldScale.value;
    camera.y.value += changeY * pixelToWorldScale.value;
  });

  const pinchGesture = Gesture.Pinch()
    .onChange((event) => {
      "worklet";
      zoom.value = Math.max(0.1, zoom.value * event.scaleChange);
      
      if (layoutDims && layoutDims.width > 0) {
        const viewSize = 1 / zoom.value;
        pixelToWorldScale.value = viewSize / layoutDims.width;
      }
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayoutDims({ width, height });
    }
  }

  return (
    <SafeAreaView className="bg-neutral-100 flex-1" edges={["top"]}>
      <GestureHandlerRootView className="flex-1">
        <GestureDetector gesture={gesture}>
          <GLView
            onLayout={handleLayout}
            className="w-full h-full"
            enableExperimentalWorkletSupport
            onContextCreate={(gl) => onContextCreate(gl, camera, zoom)}
            key={key}
          />
        </GestureDetector>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
