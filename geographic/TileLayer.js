import { Tile } from "./Tile.js";
import { TILE_SIZE, EARTH_PERIMETER } from "../config/constant.js";
import { MathUtil } from "./MathUtil.js";

export class TileLayer {
  constructor(engine, level) {
    this.engine = engine;
    this.childrens = [];
    this.level = level;
    this.tileCountSqrt = 1 << level;

    this.getTileBound();

    for (let i = -this.rowMinNum; i <= this.rowMaxNum; ++i) {
      for (let j = -this.colMinNum; j <= this.colMaxNum; ++j) {
        const tile = new Tile(
          engine,
          level,
          this.centerTile[0] + i,
          this.centerTile[1] + j
        );
        this.childrens.push(tile);
      }
    }
  }

  // 得到需要加载的瓦片范围
  getTileBound() {
    const engine = this.engine;
    const camera = engine.camera;
    const ellipsoid = this.engine.ellipsoid;
    // 根据相机的笛卡尔坐标系得到地理坐标系
    const cameraLatAndLon = ellipsoid.toGeodetic3D([
      camera.position[2],
      camera.position[0],
      camera.position[1],
    ]);
    // 根据相机地理坐标系得到web墨卡托坐标系
    const cameraMercator = MathUtil.geodetic2Mercator({
      lon: cameraLatAndLon[0],
      lat: cameraLatAndLon[1],
    });
    const centerTile = MathUtil.getTileRowAndCol(
      cameraMercator[0],
      cameraMercator[1],
      this.level
    );
    this.centerTile = centerTile;
    // 中心点瓦片左上角在世界坐标系下对应的像素坐标
    let centerTilePos = [centerTile[0] * TILE_SIZE, centerTile[1] * TILE_SIZE];
    let centerPos = MathUtil.getPxFromGeodetic(
      {
        lon: cameraLatAndLon[0],
        lat: cameraLatAndLon[1],
      },
      this.level
    );
    let offset = [
      centerPos[0] - centerTilePos[0],
      centerPos[1] - centerTilePos[1],
    ];
    const width = this.engine.canvas.width;
    const height = this.engine.canvas.height;

    this.rowMinNum = Math.ceil((width / 2 - offset[0]) / TILE_SIZE); // 左
    this.colMinNum = Math.ceil((height / 2 - offset[1]) / TILE_SIZE); // 上
    this.rowMaxNum = Math.ceil(
      (width / 2 - (TILE_SIZE - offset[0])) / TILE_SIZE
    ); // 右
    this.colMaxNum = Math.ceil(
      (height / 2 - (TILE_SIZE - offset[1])) / TILE_SIZE
    ); // 下
  }

  refresh() {
    const engine = this.engine;
    const gl = engine.gl;
    const sceneData = this.engine.sceneData;

    for (let i = 0; i < this.childrens.length; ++i) {
      const tile = this.childrens[i];
      tile.initArrayBuffer(tile.vertices, "position", 3, gl.FLOAT);
      tile.initElementBuffer(tile.indices);
      if (!tile.img) {
        loadImage(tile.url).then((res) => {
          tile.img = res;
        });
        return;
      }
      engine.getActiveUniform(Tile.program);
      sceneData.u_Sampler[1] = tile.img;
      engine.setActiveUniform(sceneData);
      gl.drawElements(gl.TRIANGLES, tile.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }
}
