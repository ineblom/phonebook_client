import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  type ExpoWebGLRenderingContext,
  getWorkletContext,
  GLView,
} from "expo-gl";
import { runOnUI } from "react-native-reanimated";

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

function run(gl: ExpoWebGLRenderingContext) {
  "worklet";

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.96, 0.96, 0.96, 1);

  const vert = gl.createShader(gl.VERTEX_SHADER);
  if (!vert) {
    console.error("Failed to create vertex shader");
    return;
  }
  gl.shaderSource(
    vert,
    `
    uniform float u_time;

    void main(void) {
      gl_Position = vec4(sin(u_time)*0.5, cos(u_time)*0.5, 0.0, 1.0);
      gl_PointSize = 150.0;
    }
    `,
  );
  gl.compileShader(vert);

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  if (!frag) {
    console.error("Failed to create fragment shader");
    return;
  }
  gl.shaderSource(
    frag,
    `
    void main(void) {
      gl_FragColor = vec4(0.3, 1.0, 0.5, 1.0);
    }
    `,
  );
  gl.compileShader(frag);

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.useProgram(program);

  const timeLocation = gl.getUniformLocation(program, "u_time");
  gl.uniform1f(timeLocation, 0);

  const render = (time_ms: number) => {
    const time = time_ms / 1000;

    gl.uniform1f(timeLocation, time);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, 1);

    gl.flush();
    gl.endFrameEXP();

    requestAnimationFrame(render);
  };
  render(0);

  console.log("Context created");
}

function onContextCreate(gl: ExpoWebGLRenderingContext) {
  runOnUI((contextId: number) => {
    "worklet";
    const gl = getWorkletContext(contextId);
    if (!gl) {
      console.error("Failed to get context");
      return;
    }
    run(gl);
  })(gl.contextId);
}

export default function Home() {
  const [key, setKey] = useState<number>(0);
  useEffect(() => {
    setKey((prevKey) => prevKey + 1);
  }, []);

  return (
    <SafeAreaView className="bg-neutral-100 flex-1" edges={["top"]}>
      <GLView
        className="w-full h-full"
        enableExperimentalWorkletSupport
        onContextCreate={onContextCreate}
        key={key}
      />
    </SafeAreaView>
  );
}
