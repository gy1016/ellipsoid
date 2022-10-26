export class Tile {
  static vs = `
    attribute vec4 position;
    attribute vec2 a_Textcoord;
    varying vec2 v_Textcoord;
    uniform mat4 u_MvpMatrix;
    void main() {
      gl_Position = u_MvpMatrix * position;
      // gl_PointSize = 10.0;
      v_Textcoord = a_Textcoord;
    }
  `;

  static fs = `
    precision mediump float;
    varying vec2 v_Textcoord;
    uniform sampler2D u_Sampler;
    void main() {
      gl_FragColor = texture2D(u_Sampler, v_Textcoord);
      // gl_FragColor = vec4(0.2, 0, 0, 1);
    }  
  `;

  static program = null;

  static getTileGridByBrother(level, row, col, position) {
    const maxSize = 1 << level;
    let newRow = row,
      newCol = col;
    // TODO: 用取余数可以优化
    if (position == "left") {
      newCol = col === 0 ? maxSize - 1 : col - 1;
    } else if (position == "right") {
      newCol = col === maxSize - 1 ? 0 : col + 1;
    } else if (position == "top") {
      newRow = row === 0 ? maxSize - 1 : row - 1;
    } else if (position == "bottom") {
      newRow = row === maxSize - 1 ? 0 : row + 1;
    } else {
      throw "invalid position";
    }
    return [newRow, newCol];
  }

  static getUniqueKey(level, row, col) {
    return `${level}_${row}_${col}`;
  }

  constructor(engine, level, col, row) {
    // this.url = `http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x=${col}&y=${row}&z=${level}&s=Gali`;
    this.url = `https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/${level}/${row}/${col}`;
    this.img = null;
    this.gl = engine.gl;
    if (Tile.program === null) {
      Tile.program = createProgram(this.gl, Tile.vs, Tile.fs);
    }

    this.row = row;
    this.col = col;
    this.level = level;

    this.vertices = [];
    this.indices = [];
    this.textureSs = [];
    this.textureTs = [];

    this.gridToWebMercator();
    let tmp = this.webMercatorToGeodetic({ x: this.minX, y: this.minY });
    this.minLon = tmp.radLon;
    this.minLat = tmp.radLat;
    tmp = this.webMercatorToGeodetic({ x: this.maxX, y: this.maxY });
    this.maxLon = tmp.radLon;
    this.maxLat = tmp.radLat;

    this.generateVertex();
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

  // 虚拟地球书的方法：将地理坐标系转为笛卡尔坐标系
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

  // 地理经纬格网的方法：将地理坐标系转为笛卡尔坐标系
  geodeticToCartesian2(geodetic) {
    const r = 6378137;
    const { radLon, radLat } = geodetic;
    var sin1 = Math.sin(radLon);
    var cos1 = Math.cos(radLon);
    var sin2 = Math.sin(radLat);
    var cos2 = Math.cos(radLat);
    var x = r * sin1 * cos2;
    var y = r * sin2;
    var z = r * cos1 * cos2;
    return [x, y, z];
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
      // this.segment = 15;
    } else {
      this.segment = 1;
    }

    // ! deltaX和deltaY应该是相同的
    const deltaX = (this.maxX - this.minX) / this.segment;
    const deltaY = (this.maxY - this.minY) / this.segment;
    const deltaT = 1.0 / this.segment;

    // 存储墨卡托最小x到最大x的间隙值
    const mercatorXs = [];
    const mercatorYs = [];

    // 从左上到右下进行存储
    for (let i = 0; i <= this.segment; i++) {
      mercatorXs.push(this.minX + i * deltaX);
      mercatorYs.push(this.maxY - i * deltaY);
      const b = i * deltaT;
      this.textureSs.push(b);
      this.textureTs.push(1 - b);
    }

    // 填充position数组（x, y z）
    for (let i = 0; i <= this.segment; ++i) {
      const merY = mercatorYs[i];
      for (let j = 0; j <= this.segment; ++j) {
        const merX = mercatorXs[j];
        const geodetic = this.webMercatorToGeodetic({ x: merX, y: merY });
        const p = this.geodeticToCartesian(geodetic);
        // const p = this.geodeticToCartesian2(geodetic);

        // ! 这里填充顺序可能要注意下
        this.vertices.push(
          p[1],
          p[2],
          p[0],
          this.textureSs[j],
          this.textureTs[i]
        );
        // this.vertices.push(...p);
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

    const vertexData = new Float32Array(data);
    const FSIZE = vertexData.BYTES_PER_ELEMENT;

    // 获取变量地址
    const positionLoc = gl.getAttribLocation(Tile.program, name);
    const textureLoc = gl.getAttribLocation(Tile.program, "a_Textcoord");
    // 创建并填充buffer
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
    // 开启顶点数据
    // stride: 属性相同的两组数据之间的间隔：
    // 坐标1, 坐标2, 坐标3, 纹理1, 纹理2, 坐标1...
    // 坐标1到坐标1的距离为：FSIZE * 5
    gl.vertexAttribPointer(positionLoc, num, type, false, FSIZE * 5, 0);
    // 开启纹理数据
    gl.vertexAttribPointer(textureLoc, 2, type, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(positionLoc);
    gl.enableVertexAttribArray(textureLoc);
  }

  initElementBuffer(data) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(data),
      gl.STATIC_DRAW
    );
  }
}
