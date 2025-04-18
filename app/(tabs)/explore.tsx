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
    precision mediump float;

    attribute vec2 a_position;

    uniform mat4 u_projection;
    uniform mat4 u_view;

    void main(void) {
      gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
    }
    `,
  );
  gl.compileShader(vert);

  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    console.error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(vert)}`,
    );
    gl.deleteShader(vert);
    return;
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  if (!frag) {
    console.error("Failed to create fragment shader");
    return;
  }
  gl.shaderSource(
    frag,
    `
    void main(void) {
      gl_FragColor = vec4(0.188, 0.871, 0.718, 1.0);
    }
    `,
  );
  gl.compileShader(frag);

  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    console.error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(frag)}`,
    );
    gl.deleteShader(frag);
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`,
    );
    gl.deleteProgram(program);
    return;
  }

  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const circle_vertices = [];
  for (let i = 0; i < 360; i += 5) {
    const angle = (i / 180) * Math.PI;
    const x = Math.cos(angle) * 0.5;
    const y = Math.sin(angle) * 0.5;
    circle_vertices.push(x, y);
  }

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(circle_vertices),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
  const projection = ortho(-1, 1, -1 / aspect, 1 / aspect);

  const projectionLocation = gl.getUniformLocation(program, "u_projection");
  const viewLocation = gl.getUniformLocation(program, "u_view");
  gl.uniformMatrix4fv(projectionLocation, false, projection);

  const camera = { x: 0, y: 0 };

  const render = (time_ms: number) => {
    const time = time_ms / 1000;

    camera.x = Math.sin(time);

    gl.clear(gl.COLOR_BUFFER_BIT);

    const view = translate(-camera.x, -camera.y);
    gl.uniformMatrix4fv(viewLocation, false, view);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, circle_vertices.length / 2);

    gl.flush();
    gl.endFrameEXP();

    requestAnimationFrame(render);
  };
  render(0);
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
