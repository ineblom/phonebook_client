import { ExpoWebGLRenderingContext } from "expo-gl";

const NUM_CIRCLE_VERTICES = 50;

const MAX_NUM_CIRCLES = 128;
const MAX_NUM_LINES = 128;

export interface Renderer {
  circles_program: WebGLProgram;
  circles_projectionLocation: WebGLUniformLocation;
  circles_viewLocation: WebGLUniformLocation;
  circles_vao: WebGLVertexArrayObject;
  circles_vbo: WebGLBuffer;
  circles_instances_bo: WebGLBuffer;

  num_circles: number;
  circles_data: Float32Array;

  lines_program: WebGLProgram;
  lines_projectionLocation: WebGLUniformLocation;
  lines_viewLocation: WebGLUniformLocation;
  lines_vao: WebGLVertexArrayObject;
  lines_vbo: WebGLBuffer;
  lines_instances_bo: WebGLBuffer;

  num_lines: number;
  lines_data: Float32Array;
}

export function ortho(left: number, right: number, bottom: number, top: number) {
  "worklet";
  // biome-ignore format: matrix
  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, -1, 0,
    (left + right) / (left - right), (top + bottom) / (bottom - top), 0, 1,
  ]);
}

export function translate(x: number, y: number) {
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

export function init_renderer(gl: ExpoWebGLRenderingContext): Renderer | null {
  "worklet";

  const circles_vert = `
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
  const circles_frag = `
    #version 300 es
    precision mediump float;

    in vec3 v_color;

    layout (location = 0) out vec4 outColor;

    void main(void) {
      outColor = vec4(v_color, 1.0);
    }
    `;
  const circles_program = create_shader_program(gl, circles_vert, circles_frag);
  if (!circles_program) {
    console.error("Failed to create shader program");
    return null;
  }
  
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.96, 0.96, 0.96, 1);

  // Circles
  const circles_vao = gl.createVertexArray();
  gl.bindVertexArray(circles_vao);

  const circle_vertices = [];
  for (let i = 0; i < 360; i += 360 / NUM_CIRCLE_VERTICES) {
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

  const circles_instances_bo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, circles_instances_bo);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_CIRCLES * 5 * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 0);
  gl.vertexAttribDivisor(1, 1);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 5 * 4, 2 * 4);
  gl.vertexAttribDivisor(2, 1);


  gl.useProgram(circles_program);
  const circles_projectionLocation = gl.getUniformLocation(circles_program, "u_projection");
  if (!circles_projectionLocation) {
    console.error("Failed to get uniform location");
    return null;
  }
  const circles_viewLocation = gl.getUniformLocation(circles_program, "u_view");
  if (!circles_viewLocation) {
    console.error("Failed to get uniform location");
    return null;
  }
  // Lines
  const lines_vert = `
    #version 300 es
    precision mediump float;

    layout (location = 0) in vec2 a_position;
    layout (location = 1) in vec2 a_start;
    layout (location = 2) in vec2 a_end;

    uniform mat4 u_projection;
    uniform mat4 u_view;

    void main(void) {
      float width = 0.03;

      vec2 x_basis = a_end - a_start;
      vec2 y_basis = normalize(vec2(-x_basis.y, x_basis.x));
      vec2 point = a_start + x_basis * a_position.x + y_basis * width * a_position.y;
      gl_Position = u_projection * u_view * vec4(point, 0.0, 1.0);
    }
    `;
  const lines_frag = `
    #version 300 es
    precision mediump float;
    
    layout (location = 0) out vec4 outColor;

    void main(void) {
      outColor = vec4(0.263, 0.729, 0.831, 1.0);
    }
    `;
  
  const lines_program = create_shader_program(gl, lines_vert, lines_frag);
  if (!lines_program) {
    console.error("Failed to create shader program");
    return null;
  }

  const lines_vao = gl.createVertexArray();
  gl.bindVertexArray(lines_vao);

  const lines_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lines_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, -0.5,  // bottom left
    0,  0.5,  // top left
    1, -0.5,  // bottom right
    1,  0.5   // top right
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const lines_instances_bo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lines_instances_bo);
  gl.bufferData(gl.ARRAY_BUFFER, MAX_NUM_LINES * 4 * 4, gl.DYNAMIC_DRAW);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 2 * 4);
  gl.vertexAttribDivisor(2, 1);

  const lines_projectionLocation = gl.getUniformLocation(lines_program, "u_projection");
  if (!lines_projectionLocation) {
    console.error("Failed to get uniform location");
    return null;
  }
  const lines_viewLocation = gl.getUniformLocation(lines_program, "u_view");
  if (!lines_viewLocation) {
    console.error("Failed to get uniform location");
    return null;
  }
  return {
    circles_program,
    circles_projectionLocation,
    circles_viewLocation,
    circles_vao,
    circles_vbo,
    circles_instances_bo,

    num_circles: 0,
    circles_data: new Float32Array(MAX_NUM_CIRCLES * 5),

    lines_program,
    lines_projectionLocation,
    lines_viewLocation,
    lines_vao,
    lines_vbo,
    lines_instances_bo,

    num_lines: 0,
    lines_data: new Float32Array(MAX_NUM_LINES * 4),
  }
}

export function push_circle(renderer: Renderer, x: number, y: number, r: number, g: number, b: number) {
  "worklet";
  const i = renderer.num_circles * 5;
  renderer.circles_data[i + 0] = x;
  renderer.circles_data[i + 1] = y;
  renderer.circles_data[i + 2] = r;
  renderer.circles_data[i + 3] = g;
  renderer.circles_data[i + 4] = b;
  renderer.num_circles++;
}

export function push_line(renderer: Renderer, x1: number, y1: number, x2: number, y2: number) {
  "worklet";
  const i = renderer.num_lines * 4;
  renderer.lines_data[i + 0] = x1;
  renderer.lines_data[i + 1] = y1;
  renderer.lines_data[i + 2] = x2;
  renderer.lines_data[i + 3] = y2;
  renderer.num_lines++;
}

export function renderer_render(renderer: Renderer, gl: ExpoWebGLRenderingContext, view: Float32Array, projection: Float32Array) {
  "worklet";

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.circles_instances_bo);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, renderer.circles_data);

  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.lines_instances_bo);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, renderer.lines_data);

  gl.useProgram(renderer.lines_program);
  gl.bindVertexArray(renderer.lines_vao);
  gl.uniformMatrix4fv(renderer.lines_viewLocation, false, view);
  gl.uniformMatrix4fv(renderer.lines_projectionLocation, false, projection);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, renderer.num_lines);

  gl.useProgram(renderer.circles_program);
  gl.bindVertexArray(renderer.circles_vao);
  gl.uniformMatrix4fv(renderer.circles_viewLocation, false, view);
  gl.uniformMatrix4fv(renderer.circles_projectionLocation, false, projection);
  gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, NUM_CIRCLE_VERTICES, renderer.num_circles);


  renderer.num_lines = 0;
  renderer.num_circles = 0;

  gl.flush();
  gl.endFrameEXP();
}