export class Tile {
  static vs = `
    attribute vec4 position;
    // attribute vec2 a_Textcoord;
    // varying vec2 v_Textcoord;
    uniform mat4 u_MvpMatrix;
    void main() {
      gl_Position = u_MvpMatrix * position;
      gl_PointSize = 10.0;
      // v_Textcoord = a_Textcoord;
    }
  `;

  static fs = `
    precision mediump float;
    // varying vec2 v_Textcoord;
    // uniform sampler2D u_Sampler;
    void main() {
      // gl_FragColor = texture2D(u_Sampler, v_Textcoord);
      gl_FragColor = vec4(0.2, 0, 0, 1);
    }  
  `;

  static position = new Float32Array([]);
  static indices = new Uint8Array([]);

  constructor(engine, level, col, row) {
    this.gl = engine.gl;
    this.program = createProgram(this.gl, Tile.vs, Tile.fs);
    this.gl.useProgram(this.program);

    this.row = row;
    this.col = col;
    this.level = level;

    this.vertices = [];
    this.indices = [];

    this.gridToWebMercator();
    let tmp = this.webMercatorToGeodetic({ x: this.minX, y: this.minY });
    this.minLon = tmp.radLon;
    this.minLat = tmp.radLat;
    tmp = this.webMercatorToGeodetic({ x: this.maxX, y: this.maxY });
    this.maxLon = tmp.radLon;
    this.maxLat = tmp.radLat;

    this.generateVertex();

    Tile.position = new Float32Array(this.vertices);
    Tile.indices = new Uint8Array(this.indices);

    this.initArrayBuffer(Tile.position, "position", 3, this.gl.FLOAT);
    this.initElementBuffer(Tile.indices);
  }

  // 根据行列号得到web墨卡坐标
  gridToWebMercator() {
    // 这里按球考虑了
    const k = Math.PI * 6378137;
    const size = (2 * k) / Math.pow(2, this.level);
    this.minX = -k + this.col * size;
    this.maxX = this.minX + size;
    this.maxY = k - this.row * size;
    this.minY = this.maxY - size;
    return {
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY,
    };
  }

  // 墨卡托坐标转至地理坐标系，返回弧度制
  webMercatorToGeodetic(mercator) {
    const radLon = mercator.x / 6378137;
    const a = mercator.y / 6378137;
    const b = Math.pow(Math.E, a);
    const c = Math.atan(b);
    const radLat = 2 * c - Math.PI / 2;
    return {
      radLon,
      radLat,
    };
  }

  // 将地理坐标系转为笛卡尔坐标系
  geodeticToCartesian(geodetic) {
    const n = this.geodeticSurfaceNormal(geodetic);
    const radiiSquared = [
      6378137.0 * 6378137.0,
      6378137.0 * 6378137.0,
      6356752.314245 * 6356752.314245,
    ];
    const k = [
      radiiSquared[0] * n[0],
      radiiSquared[1] * n[1],
      radiiSquared[2] * n[2],
    ];
    const gamma = Math.sqrt(k[0] * n[0] + k[1] * n[1] + k[2] * n[2]);
    return k.map((i) => i / gamma);
  }

  // 根据地理坐标系计算表面法线
  geodeticSurfaceNormal(geodetic) {
    const cosLat = Math.cos(geodetic.radLat);
    return [
      cosLat * Math.cos(geodetic.radLon),
      cosLat * Math.sin(geodetic.radLon),
      Math.sin(geodetic.radLat),
    ];
  }

  // 根据分段产生顶点数据
  generateVertex() {
    // 层级为6的时候可能就不需要分段了；
    if (this.level < 6) {
      this.segment = 1 << (6 - this.level);
    } else {
      this.segment = 1;
    }

    const deltaX = (this.maxX - this.minX) / this.segment;
    const deltaY = (this.maxY - this.minY) / this.segment;

    // 存储墨卡托最小x到最大x的间隙值
    const mercatorXs = [];
    const mercatorYs = [];

    // 从左上到右下进行存储
    for (let i = 0; i <= this.segment; i++) {
      mercatorXs.push(this.minX + i * deltaX);
      mercatorYs.push(this.maxY - i * deltaY);
    }

    // 填充position数组（x, y z）
    for (let i = 0; i <= this.segment; ++i) {
      const merY = mercatorYs[i];
      for (let j = 0; j <= this.segment; ++j) {
        const merX = mercatorXs[j];
        const geodetic = this.webMercatorToGeodetic({ x: merX, y: merY });
        const p = this.geodeticToCartesian(geodetic);
        // ! 这里填充顺序可能要注意下
        this.vertices.push(p[1], p[2], p[0]);
      }
    }

    // 填充indices数组，注意这里没有等于号
    /**
     * 0,1,2; 2,3,0;
     * 0    3
     *
     * 1    2
     */
    for (let i = 0; i < this.segment; ++i) {
      for (let j = 0; j < this.segment; ++j) {
        const idx0 = (this.segment + 1) * i + j;
        const idx1 = (this.segment + 1) * (i + 1) + j;
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

// const tile1 = new Tile(1, 0, 0);
// console.log(tile1);
// console.log(tile1.vertices.length);
// console.log(tile1.indices);
// const tile2 = new Tile(1, 0, 1);
// const tile3 = new Tile(1, 1, 0);
// const tile4 = new Tile(1, 1, 1);

// console.log(tile1);
// console.log(tile2);
// console.log(tile3);
// console.log(tile4);

// const caeresian1 = tile1.geodeticToCartesian({
//   lon: tile1.minLon,
//   lat: tile1.minLat,
// });
// const caeresian2 = tile1.geodeticToCartesian({
//   lon: tile1.maxLon,
//   lat: tile1.maxLat,
// });
// const caeresian3 = tile1.geodeticToCartesian({
//   lon: tile1.minLon,
//   lat: tile1.maxLat,
// });
// const caeresian4 = tile1.geodeticToCartesian({
//   lon: tile1.maxLon,
//   lat: tile1.minLat,
// });
// console.log(caeresian1);
// console.log(caeresian2);
// console.log(caeresian3);
// console.log(caeresian4);

// [ -6378137, 4.883827135133567e-9, 0 ]
// [ 552058.2246914064, 0, 6332896.014929354 ]
// [ -552058.2246914064, 4.227185678077398e-10, 6332896.014929354 ]
// [ 6378137, 0, 0 ]

// [ 0, 6332896.014929354, 552058.2246914064,  ]
// [  4.227185678077398e-10, 6332896.014929354, -552058.2246914064]
// [ 0, 0, 6378137 ]
// [  4.883827135133567e-9, 0, -6378137]

// [ 0, 6332896.014929354, 552058.2246914064,
//   4.227185678077398e-10, 6332896.014929354, -552058.2246914064,
//   0, 0, 6378137,
//   4.883827135133567e-9, 0, -6378137
// ]