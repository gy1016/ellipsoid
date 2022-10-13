export class Triangle {
  static vs = `
    attribute vec4 position;
     
    void main()
    {
        gl_Position = position;
    }
  `;

  static fs = `
    precision mediump float;
    uniform vec4 u_Color;
    void main() {
      gl_FragColor = u_Color;
    }
  `;

  static positions = new Float32Array([1, 1, -1, 1, -1, -1]);

  constructor(engine) {
    this.gl = engine.gl;
    this.program = createProgram(this.gl, Triangle.vs, Triangle.fs);
    this.gl.useProgram(this.program);
    this.initArrayBuffer(Triangle.positions, "position", 2, this.gl.FLOAT);
  }

  initArrayBuffer(data, name, num, type) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, name);
    gl.vertexAttribPointer(loc, num, type, false, 0, 0);
    gl.enableVertexAttribArray(loc);
  }
}
