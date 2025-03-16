import { View, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Canvas, Group, Circle, Line } from "@shopify/react-native-skia";
import { useState } from "react";

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
  const renderGraph = ({ nodes, edges }: Graph) => {
    const width = Dimensions.get("window").width;
    const height = Dimensions.get("window").height * 0.8;

    return (
      <Canvas style={{ width, height }}>
        {edges.map((edge) => {
          const source = nodes[edge.source];
          const target = nodes[edge.target];

          if (!source || !target) return null;

          return (
            <Line
              key={`edge-${target.x}-${target.y}-${source.x}-${source.y}`}
              p1={{ x: source.x, y: source.y }}
              p2={{ x: target.x, y: target.y }}
              color="rgba(0, 0, 0, 0.6)"
              style="stroke"
              strokeWidth={3}
            />
          );
        })}

        {nodes.map((node, index) => (
          <Circle
            key={`node-${node.x}-${node.y}-${index}`}
            cx={node.x}
            cy={node.y}
            r={node.radius}
            color={node.color}
          />
        ))}
      </Canvas>
    );
  };

  const [graph, setGraph] = useState<Graph>({
    nodes: [
      { x: 100, y: 100, label: "Node 1", radius: 30, color: "lightblue" },
      { x: 200, y: 200, label: "Node 2", radius: 30, color: "lightblue" },
      { x: 150, y: 400, label: "Node 3", radius: 30, color: "lightblue" },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
    ],
  });

  return (
    <SafeAreaView className="bg-neutral-100 h-full">
      <View className="p-4">
        <Text className="text-2xl font-semibold">Network</Text>

        {renderGraph(graph)}
      </View>
    </SafeAreaView>
  );
}
