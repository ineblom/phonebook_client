import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Canvas,
  Circle,
  Group,
  Line,
  Text as SkText,
  useFont,
  Skia,
} from "@shopify/react-native-skia";
import { useState } from "react";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import React from "react";

interface Node {
  x: number;
  y: number;
  label: string;
  radius: number;
  color: string;
}

interface Edge {
  source: number;
  target: number;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export default function Home() {
  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 16);

  const [graph, setGraph] = useState<Graph>({
    nodes: [
      { x: 200, y: 200, label: "You", radius: 30, color: "lightblue" },
    ],
    edges: [
    ],
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const skiaMatrix = useSharedValue(Skia.Matrix());

  useAnimatedReaction(
    () => [translateX.value, translateY.value, scale.value],
    ([x, y, s]) => {
      "worklet";
      const matrix = Skia.Matrix();
      matrix.translate(x, y);
      matrix.scale(s, s);
      skiaMatrix.value = matrix;
    },
  );

  const panGesture = Gesture.Pan().onChange((e) => {
    "worklet";
    translateX.value += e.changeX;
    translateY.value += e.changeY;
  });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      "worklet";
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onChange((e) => {
      "worklet";
      const contentFocalX = (focalX.value - translateX.value) / scale.value;
      const contentFocalY = (focalY.value - translateY.value) / scale.value;

      const newScale = scale.value * e.scaleChange;
      const clampedScale = Math.min(Math.max(0.5, newScale), 5);

      translateX.value = focalX.value - contentFocalX * clampedScale;
      translateY.value = focalY.value - contentFocalY * clampedScale;

      scale.value = clampedScale;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const renderGraph = ({ nodes, edges }: Graph) => {
    if (!font) return null;

    return (
      <GestureDetector gesture={composedGesture}>
        <View className="w-full h-full">
          <Canvas style={{ flex: 1 }}>
            <Group matrix={skiaMatrix}>
              {edges.map((edge) => {
                const source = nodes[edge.source];
                const target = nodes[edge.target];

                if (!source || !target) return null;

                return (
                  <Line
                    key={`edge-${edge.source}-${edge.target}`}
                    p1={{ x: source.x, y: source.y }}
                    p2={{ x: target.x, y: target.y }}
                    color="rgba(0, 0, 0, 0.2)"
                    style="stroke"
                    strokeWidth={2}
                  />
                );
              })}

              {nodes.map((node) => {
                const width = font.measureText(node.label).width;

                return (
                  <React.Fragment key={`node-group-${node.label}`}>
                    <Circle
                      key={`node-circle-${node.label}`}
                      cx={node.x}
                      cy={node.y}
                      r={node.radius}
                      color={node.color}
                    />
                    <SkText
                      key={`node-text-${node.label}`}
                      x={node.x - width / 2}
                      y={node.y + node.radius + 16}
                      text={node.label}
                      font={font}
                    />
                  </React.Fragment>
                );
              })}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="bg-neutral-100 h-full">
        <View className="flex-1">
          <Text className="text-2xl font-semibold px-4">Network</Text>
          {renderGraph(graph)}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
