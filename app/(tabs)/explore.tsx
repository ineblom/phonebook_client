import { View, useWindowDimensions } from "react-native";
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
import { useEffect, useState, useRef, useCallback } from "react";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { jwtDecode } from "jwt-decode";
import React from "react";
import { storage } from "@/utils/storage";
import { api_getContacts } from "@/api/requests";

const RADIUS = 30;

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

export default function Home() {
  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"), 16);
  const { width, height } = useWindowDimensions();

  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  });

  const translateX = useSharedValue(width / 2);
  const translateY = useSharedValue(height / 2);
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Define the transform at component level
  const transform = useDerivedValue(() => {
    return [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ];
  });

  const checkNodesInView = useCallback(() => {
    const left = translateX.value;
    const top = translateY.value;
    const right = left + width;
    const bottom = top + height;
    const currentVisibleNodes = new Set<string>();

    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      const nodeX = node.x * scale.value + translateX.value;
      const nodeY = node.y * scale.value + translateY.value;

      if (
        nodeX + RADIUS >= left &&
        nodeX - RADIUS <= right &&
        nodeY + RADIUS >= top &&
        nodeY - RADIUS <= bottom
      ) {
        currentVisibleNodes.add(node.user_key);
      }
    }
  }, [graph.nodes, translateX, translateY, scale, width, height]);

  const panGesture = Gesture.Pan().onChange((e) => {
    translateX.value += e.changeX;
    translateY.value += e.changeY;
  });

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onChange((e) => {
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
    const jwt = jwtDecode(auth_token) as { user_key?: string };
    if (!jwt || !jwt.user_key) return;

    setGraph({
      nodes: [
        { x: 0, y: 0, label: "You", user_key: jwt.user_key },
      ],
      edges: [],
    });
  }, []);

  const renderGraph = ({ nodes, edges }: Graph) => {
    if (!font) return null;

    return (
      <GestureDetector gesture={composedGesture}>
        <View className="w-full h-full">
          <Canvas style={{ flex: 1 }}>
            <Group transform={transform}>
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

              {nodes.map((node, index) => {
                const width = font.measureText(node.label).width;
                const nodeColor = "lightblue";

                return (
                  <React.Fragment
                    key={`group-${node.user_key}-${node.x}-${node.y}`}
                  >
                    <Circle
                      key={`node-circle-${node.user_key}`}
                      cx={node.x}
                      cy={node.y}
                      r={RADIUS}
                      color={nodeColor}
                    />
                    <SkText
                      key={`node-text-${node.user_key}`}
                      x={node.x - width / 2}
                      y={node.y + RADIUS + 16}
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
