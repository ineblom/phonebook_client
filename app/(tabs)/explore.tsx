import { View } from "react-native";
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
import { useEffect, useState } from "react";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSharedValue, useAnimatedReaction } from "react-native-reanimated";
import { jwtDecode } from "jwt-decode";
import React from "react";
import { storage } from "@/utils/storage";
import { api_getContacts } from "@/api/requests";

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
    nodes: [{ x: 200, y: 200, label: "You", radius: 30, color: "lightblue" }],
    edges: [],
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

  useEffect(() => {
    const auth_token = storage.getString("auth_token");
    if (!auth_token) return;

    const data = jwtDecode(auth_token) as { user_key?: string };
    if (!data || !data.user_key) return;

    api_getContacts(data.user_key)
      .then((contacts) => {
        const newNodes = contacts.map((contact, idx) => ({
          x: Math.sin((Math.PI * 2 * idx) / contacts.length) * 500,
          y: Math.cos((Math.PI * 2 * idx) / contacts.length) * 500,
          label: contact.name,
          radius: 30,
          color: "lightblue",
        }));

        const newEdges = contacts.map((contact, idx) => ({
          source: 0,
          target: idx + 1,
        }));

        setGraph({
          nodes: [
            { x: 0, y: 0, label: "You", radius: 30, color: "lightblue" },
            ...newNodes,
          ],
          edges: [...newEdges],
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

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
                    key={`edge-${edge.source}-${edge.target}-${source.x}-${source.y}-${target.x}-${target.y}`}
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
                  <React.Fragment
                    key={`group-${node.label}-${node.x}-${node.y}`}
                  >
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
        <View className="flex-1">{renderGraph(graph)}</View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
