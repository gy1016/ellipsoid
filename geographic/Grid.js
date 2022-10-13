export class Grid {
  static vs = `
    attribute vec4 position;
    uniform mat4 u_MvpMatrix;
    void main() {
      gl_Position = u_MvpMatrix * position;
      gl_PointSize = 10.0;
    }
  `;

  static fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.2, 0, 0, 1);
    }  
  `;

  static position = new Float32Array([]);
  static indices = new Uint8Array([]);

  constructor(engine, division) {
    this.gl = engine.gl;
    this.program = createProgram(this.gl, Grid.vs, Grid.fs);
    this.gl.useProgram(this.program);

    this.division = division;

    this.vertices = [];
    this.indices = [];

    this.generateVertex();

    Grid.position = new Float32Array(this.vertices);
    Grid.indices = new Uint8Array(this.indices);

    this.initArrayBuffer(Grid.position, "position", 2, this.gl.FLOAT);
    this.initElementBuffer(Grid.indices);
  }

  generateVertex() {
    const delta = 2 / this.division;

    const divisions = [];

    for (let i = 0; i <= this.division; ++i) {
      divisions.push(-1 + i * delta);
    }

    for (let i = 0; i <= this.division; ++i) {
      const y = divisions[i];
      for (let j = 0; j <= this.division; ++j) {
        const x = divisions[j];
        this.vertices.push(x, y);
      }
    }

    for (let i = 0; i < this.division; ++i) {
      for (let j = 0; j < this.division; ++j) {
        const idx0 = (this.division + 1) * i + j;
        const idx1 = (this.division + 1) * (i + 1) + j;
        const idx2 = idx1 + 1;
        const idx3 = idx0 + 1;
        this.indices.push(idx0, idx1, idx2, idx2, idx3, idx0);
      }
    }
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
