export class Rectangle {
  static vs = `
    attribute vec4 position;
    uniform mat4 u_MvpMatrix;
    void main()
    {
        gl_Position = u_MvpMatrix * position;
        gl_PointSize = 10.0;
    }
  `;

  static fs = `
    precision mediump float;
    // uniform vec4 u_Color;
    void main() {
      gl_FragColor = vec4(0.2, 0, 0, 1);
    }
  `;

  // static position = new Float32Array([
  //   1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1,
  // ]);
  // prettier-ignore
  static position = new Float32Array([
    0, 6332896.014929354, -552058.2246914064, 
    0, 6332896.014929354, 552058.2246914064, 
    0, 0, 6378137,
    0, 0, -6378137,
  ]);
  static indices = new Uint8Array([0, 1, 2, 2, 0, 3]);

  // [
  //   4.883827135133567e-9, 0, -6378137,
  //   0, 6332896.014929354, 552058.2246914064,
  //   4.227185678077398e-10, 6332896.014929354, -552058.2246914064,
  //   6332896.014929354, 552058.2246914064, 0
  // ]

  constructor(engine) {
    this.gl = engine.gl;
    this.program = createProgram(this.gl, Rectangle.vs, Rectangle.fs);
    this.gl.useProgram(this.program);
    this.initArrayBuffer(Rectangle.position, "position", 3, this.gl.FLOAT);
    this.initElementBuffer(Rectangle.indices);
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

  initElementBuffer(data) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }
}
