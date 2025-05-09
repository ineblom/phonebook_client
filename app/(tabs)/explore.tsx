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

function ortho(left: number, right: number, bottom: number, top: number) {
  "worklet";
  // biome-ignore format: matrix
  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -1, 0,
    (left + right) / (left - right), (top + bottom) / (bottom - top), 0, 1,
  ]);
}

function translate(x: number, y: number) {
  "worklet";
  // biome-ignore format: matrix
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1]);
}

function create_shader_program(gl: ExpoWebGLRenderingContext, vert: string, frag: string): WebGLProgram | null {
  "worklet";
  const vert_shader = gl.createShader(gl.VERTEX_SHADER);
  if (!vert_shader) {
    console.error("Failed to create vertex shader");
    return null;
  }
  gl.shaderSource(
    vert_shader,
    vert,
  );
  gl.compileShader(vert_shader);

  if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
    console.error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(vert_shader)}`,
    );
    gl.deleteShader(vert_shader);
    return null;
  }

  const frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!frag_shader) {
    console.error("Failed to create fragment shader");
    return null;
  }
  gl.shaderSource(
    frag_shader,
    frag,
  );
  gl.compileShader(frag_shader);

  if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
    console.error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(frag_shader)}`,
    );
    gl.deleteShader(frag_shader);
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vert_shader);
  gl.attachShader(program, frag_shader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`,
    );
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);

  return program;
}

function run(
  gl: ExpoWebGLRenderingContext,
  camera: Camera,
  zoom: SharedValue<number>,
) {
  "worklet";
  const vert = `
    #version 300 es
    precision mediump float;

    layout (location = 0) in vec2 a_position;
    layout (location = 1) in vec2 a_offset;
    layout (location = 2) in vec3 a_color;

    out vec3 v_color;

    uniform mat4 u_projection;
    uniform mat4 u_view;

    void main(void) {
      vec2 position = a_position + a_offset;
      gl_Position = u_projection * u_view * vec4(position, 0.0, 1.0);
      v_color = a_color;
    }
    `
  const frag = `
    #version 300 es
    precision mediump float;

    in vec3 v_color;

    layout (location = 0) out vec4 outColor;

    void main(void) {
      outColor = vec4(v_color, 1.0);
    }
    `;
  const program = create_shader_program(gl, vert, frag);
  if (!program) {
    console.error("Failed to create shader program");
    return;
  }
  
  // Ensure zoom is initialized to the correct value
  if (zoom.value === 1.0) {
    zoom.value = INITIAL_ZOOM_LEVEL;
  }

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.96, 0.96, 0.96, 1);


  const circles_vao = gl.createVertexArray();
  gl.bindVertexArray(circles_vao);

  const circle_vertices = [];
  for (let i = 0; i < 360; i += 5) {
    const angle = (i / 180) * Math.PI;
    const x = Math.cos(angle) * 0.5;
    const y = Math.sin(angle) * 0.5;
    circle_vertices.push(x, y);
  }

  const circles_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circles_vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(circle_vertices),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const circles_data = [];
  const num_circles = 1;
  circles_data.push(0, 0);
  circles_data.push(0.1, 0.5, 0.9);

  const circles_instances_bo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circles_instances_bo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(circles_data),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 0);
  gl.vertexAttribDivisor(1, 1);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 5 * 4, 2 * 4);
  gl.vertexAttribDivisor(2, 1);

  const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;

  const projectionLocation = gl.getUniformLocation(program, "u_projection");
  const viewLocation = gl.getUniformLocation(program, "u_view");

  const render = (time_ms: number) => {
    "worklet";
    const time = time_ms / 1000;

    gl.clear(gl.COLOR_BUFFER_BIT);

    const view = translate(-camera.x.value, -camera.y.value);
    gl.uniformMatrix4fv(viewLocation, false, view);

    const viewSize = 1 / zoom.value;
    const projection = ortho(
      -viewSize * aspect,
      viewSize * aspect,
      -viewSize,
      viewSize,
    );
    gl.uniformMatrix4fv(projectionLocation, false, projection);

    gl.bindVertexArray(circles_vao);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, circle_vertices.length / 2, num_circles);

    gl.flush();
    gl.endFrameEXP();

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
    console.log("width", width);
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
