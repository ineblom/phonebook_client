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
import { useSharedValue, useAnimatedReaction } from "react-native-reanimated";
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

  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [unexploredNodes, setUnexploredNodes] = useState<Set<string>>(new Set());

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

  const checkNodesInView = () => {
    const left = translateX.value;
    const top = translateY.value;
    const right = left + width;
    const bottom = top + height;
    const currentVisibleNodes = new Set<string>();

    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      const nodeX = node.x * scale.value + translateX.value;
      const nodeY = node.y * scale.value + translateY.value;

      // Check if node is in view
      if (
        nodeX + RADIUS >= left &&
        nodeX - RADIUS <= right &&
        nodeY + RADIUS >= top &&
        nodeY - RADIUS <= bottom
      ) {
        currentVisibleNodes.add(node.user_key);
      }
    }
  };

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

  /*useEffect(() => {
    (async () => {
      const auth_token = storage.getString("auth_token");
      if (!auth_token) return;
      const jwt = jwtDecode(auth_token) as { user_key?: string };
      if (!jwt || !jwt.user_key) return;

      const { data: contacts, error } = await api_getContacts(jwt.user_key);
      if (error) return;

      const distance = 600;
      const newNodes = contacts.map((contact, idx) => ({
        x: Math.sin((Math.PI * 2 * idx) / contacts.length) * distance,
        y: Math.cos((Math.PI * 2 * idx) / contacts.length) * distance,
        label: contact.name,
        user_key: contact.user_key,
        explored: false,
      }));

      const newEdges = contacts.map((contact, idx) => ({
        source: 0,
        target: idx + 1,
      }));

      setGraph({
        nodes: [
          { x: 0, y: 0, label: "You", user_key: jwt.user_key, explored: true },
          ...newNodes,
        ],
        edges: [...newEdges],
      });
      
      // Check nodes in view after initial load
      setTimeout(checkNodesInView, 500);
    })();
  }, []);*/

  // Check for nodes in view periodically
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

    // const interval = setInterval(checkNodesInView, 500);
    // return () => clearInterval(interval);
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
