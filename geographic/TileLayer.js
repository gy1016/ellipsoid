import { Tile } from "./Tile.js";
import { TILE_SIZE } from "../config/constant.js";
import { MathUtil } from "./MathUtil.js";

export class TileLayer {
  constructor(engine, level) {
    this.engine = engine;

    this.level = level;
    // 当前层及下一行或一列最多有的瓦片数量
    this.limit = 1 << level;
    this.tileCountSqrt = 1 << level;

    this.lastRowMinNum = -1;
    this.lastColMinNum = -1;
    this.lastRowMaxNum = -1;
    this.lastColMaxNum = -1;

    this.childrens = [];
    this.getVisibleTilesByLevel();
    // this.lastCameraPosition = [-1, -1, -1];
    // this.updateTilesNoOptimize();
    // this.getTileBound();
  }

  // 根据相机位置和当前层级得到能够看到的瓦片
  getVisibleTilesByLevel() {
    const level = this.level;
    let result = [];

    // 上下左右最大的循环次数
    const LOOP_LIMIT = Math.min(10, Math.pow(2, level) - 1);

    const cameraWordPos = this.engine.camera.position;
    const cameraGeodeticPos = this.engine.ellipsoid.toGeodetic3D(cameraWordPos);
    const cameraMercatorPos = MathUtil.geodetic2Mercator({
      lon: cameraGeodeticPos[0],
      lat: cameraGeodeticPos[1],
    });
    const centerTileInfo = MathUtil.getTileRowAndCol(
      cameraMercatorPos[0],
      cameraMercatorPos[1],
      this.level
    );
    let rowResult = this.handleRow(centerTileInfo[0], centerTileInfo[1]);
    result = result.concat(rowResult);

    let grid;
    // 循环向下处理至不可见
    let bottomLoopTime = 0;
    let bottomRow = centerTileInfo[0];
    while (bottomLoopTime < LOOP_LIMIT) {
      bottomLoopTime++;
      grid = Tile.getTileGridByBrother(
        this.level,
        bottomRow,
        centerTileInfo[1],
        "bottom"
      );
      bottomRow = grid[0];
      rowResult = this.handleRow(grid[0], grid[1]);
      if (rowResult.length > 0) {
        result = result.concat(rowResult);
      } else {
        //已经向下循环到不可见，停止向下循环
        break;
      }
    }

    // 循环向上处理至不可见
    let topLoopTime = 0;
    let topRow = centerTileInfo[0];
    while (topLoopTime < LOOP_LIMIT) {
      topLoopTime++;
      grid = Tile.getTileGridByBrother(
        this.level,
        topRow,
        centerTileInfo[1],
        "top"
      );
      topRow = grid[0];
      rowResult = this.handleRow(grid[0], grid[1]);
      if (rowResult.length > 0) {
        result = result.concat(rowResult);
      } else {
        //已经向下循环到不可见，停止向上循环
        break;
      }
    }

    console.log(result);
    this.childrens = result;
  }

  /* 
    算法：
    瓦片的面积要大于阈值；
    瓦片四个角点ndc是顺时针，这样能确保瓦片是正面而不是背面；
    至少有一个点是可见的；
  */
  // ! 这个判断条件很关键，阈值的选取很重要！
  checkVisible(visibleInfo) {
    // visibleInfo.clockwise &&
    if (visibleInfo.area >= 500 && visibleInfo.visibleCount >= 1) {
      return true;
    }
    return false;
  }

  // 处理当前行列号这行的瓦片，得到可见瓦片数组
  handleRow(row, col) {
    const LOOP_LIMIT = Math.min(10, Math.pow(2, this.level) - 1);

    const result = [];
    let grid = new Tile(this.engine, this.level, col, row);
    const visibleInfo = this.getTileVisibleInfo(grid.level, grid.row, grid.col);
    const isRowCenterVisible = this.checkVisible(visibleInfo);
    if (isRowCenterVisible) {
      grid.visibleInfo = visibleInfo;
      result.push(grid);

      // 向左遍历至不可见
      var leftLoopTime = 0; //向左循环的次数
      var leftColumn = col;
      var visible;
      while (leftLoopTime < LOOP_LIMIT) {
        leftLoopTime++;
        const [newRow, newCol] = Tile.getTileGridByBrother(
          this.level,
          row,
          leftColumn,
          "left"
        );
        leftColumn = newCol;
        const curVisibleInfo = this.getTileVisibleInfo(
          this.level,
          newRow,
          newCol
        );
        visible = this.checkVisible(curVisibleInfo);
        if (visible) {
          const newTile = new Tile(this.engine, this.level, newCol, newRow);
          newTile.visibleInfo = curVisibleInfo;
          result.push(newTile);
        } else {
          break;
        }
      }

      var rightLoopTime = 0; //向右循环的次数
      var rightColumn = col;
      while (rightLoopTime < LOOP_LIMIT) {
        rightLoopTime++;
        const [newRow, newCol] = Tile.getTileGridByBrother(
          this.level,
          row,
          rightColumn,
          "right"
        );
        rightColumn = newCol;
        const curVisibleInfo = this.getTileVisibleInfo(
          this.level,
          newRow,
          newCol
        );
        visible = this.checkVisible(curVisibleInfo);
        if (visible) {
          const newTile = new Tile(this.engine, this.level, newCol, newRow);
          newTile.visibleInfo = curVisibleInfo;
          result.push(newTile);
        } else {
          break;
        }
      }
    }

    return result;
  }

  // 判断当前瓦片是否可见
  // ! 感觉应该放在相机里面
  getTileVisibleInfo(level, row, col) {
    const result = {
      lb: {
        lon: null,
        lat: null,
        verticeInWorld: null,
        verticeInNDC: null,
        visible: false,
      },
      lt: {
        lon: null,
        lat: null,
        verticeInWorld: null,
        verticeInNDC: null,
        visible: false,
      },
      rt: {
        lon: null,
        lat: null,
        verticeInWorld: null,
        verticeInNDC: null,
        visible: false,
      },
      rb: {
        lon: null,
        lat: null,
        verticeInWorld: null,
        verticeInNDC: null,
        visible: false,
      },
      Egeo: null,
      visibleCount: 0,
      clockwise: false,
      width: null,
      height: null,
      area: null,
    };
    result.Egeo = MathUtil.getTileGeodeticByGrid(level, row, col);

    const tileMinLon = result.Egeo.minLon;
    const tileMaxLon = result.Egeo.maxLon;
    const tileMinLat = result.Egeo.minLat;
    const tileMaxLat = result.Egeo.maxLat;

    // 左下角
    result.lb.lon = tileMinLon;
    result.lb.lat = tileMinLat;
    result.lb.verticeInWorld = MathUtil.geodeticToCartesian({
      radLat: result.lb.lat,
      radLon: result.lb.lon,
    });
    result.lb.verticeInNDC = MathUtil.cartesianToNDC(
      this.engine.camera,
      result.lb.verticeInWorld
    );
    result.lb.visible = this.engine.camera.isWorldVisibleInCanvas(
      result.lb.verticeInWorld,
      {
        verticeInNDC: result.lb.verticeInNDC,
      }
    );
    if (result.lb.visible) {
      result.visibleCount++;
    }

    // 左上角
    result.lt.lon = tileMinLon;
    result.lt.lat = tileMaxLat;
    result.lt.verticeInWorld = MathUtil.geodeticToCartesian({
      radLat: result.lt.lat,
      radLon: result.lt.lon,
    });
    result.lt.verticeInNDC = MathUtil.cartesianToNDC(
      this.engine.camera,
      result.lt.verticeInWorld
    );
    result.lt.visible = this.engine.camera.isWorldVisibleInCanvas(
      result.lt.verticeInWorld,
      {
        verticeInNDC: result.lt.verticeInNDC,
      }
    );
    if (result.lt.visible) {
      result.visibleCount++;
    }

    // 右上角
    result.rt.lon = tileMaxLon;
    result.rt.lat = tileMaxLat;
    result.rt.verticeInWorld = MathUtil.geodeticToCartesian({
      radLat: result.rt.lat,
      radLon: result.rt.lon,
    });
    result.rt.verticeInNDC = MathUtil.cartesianToNDC(
      this.engine.camera,
      result.rt.verticeInWorld
    );
    result.rt.visible = this.engine.camera.isWorldVisibleInCanvas(
      result.rt.verticeInWorld,
      {
        verticeInNDC: result.rt.verticeInNDC,
      }
    );
    if (result.rt.visible) {
      result.visibleCount++;
    }

    // 右下角
    result.rb.lon = tileMaxLon;
    result.rb.lat = tileMinLat;
    result.rb.verticeInWorld = MathUtil.geodeticToCartesian({
      radLat: result.rb.lat,
      radLon: result.rb.lon,
    });
    result.rb.verticeInNDC = MathUtil.cartesianToNDC(
      this.engine.camera,
      result.rb.verticeInWorld
    );
    result.rb.visible = this.engine.camera.isWorldVisibleInCanvas(
      result.rb.verticeInWorld,
      {
        verticeInNDC: result.rb.verticeInNDC,
      }
    );
    if (result.rb.visible) {
      result.visibleCount++;
    }

    const ndcs = [
      result.lb.verticeInNDC,
      result.lt.verticeInNDC,
      result.rt.verticeInNDC,
      result.rb.verticeInNDC,
    ];

    const vector03 = [
      ndcs[3][0] - ndcs[0][0],
      ndcs[3][1] - ndcs[0][1],
      ndcs[3][2] - ndcs[0][2],
    ];
    vector03[2] = 0;
    const vector01 = [
      ndcs[1][0] - ndcs[0][0],
      ndcs[1][1] - ndcs[0][1],
      ndcs[1][2] - ndcs[0][2],
    ];
    vector03[2] = 0;

    let cx = vector03[1] * vector01[2] - vector03[2] * vector01[1];
    let cy = vector03[2] * vector01[0] - vector03[0] * vector01[2];
    let cz = vector03[0] * vector01[1] - vector03[1] * vector01[0];

    const cross = [cx, cy, cz];
    result.clockwise = cross[2] > 0;

    const topWidth =
      (Math.sqrt(
        (ndcs[1][0] - ndcs[2][0]) ** 2 + (ndcs[1][1] - ndcs[2][1]) ** 2
      ) *
        this.engine.canvas.clientWidth) /
      2;
    const bottomWidth =
      (Math.sqrt(
        (ndcs[0][0] - ndcs[3][0]) ** 2 + (ndcs[0][1] - ndcs[3][1]) ** 2
      ) *
        this.engine.canvas.clientWidth) /
      2;
    result.width = Math.floor((topWidth + bottomWidth) / 2);
    const leftHeight =
      (Math.sqrt(
        (ndcs[0][0] - ndcs[1][0]) ** 2 + (ndcs[0][1] - ndcs[1][1]) ** 2
      ) *
        this.engine.canvas.clientHeight) /
      2;
    const rightHeight =
      (Math.sqrt(
        (ndcs[2][0] - ndcs[3][0]) ** 2 + (ndcs[2][1] - ndcs[3][1]) ** 2
      ) *
        this.engine.canvas.clientHeight) /
      2;
    result.height = Math.floor((leftHeight + rightHeight) / 2);
    result.area = result.width * result.height;

    return result;
  }

  // ! BUG 可能超出瓦片边界
  // 得到需要加载的瓦片范围
  getTileBound() {
    const engine = this.engine;
    const camera = engine.camera;
    if (
      this.lastCameraPosition[0] == camera.position[0] &&
      this.lastCameraPosition[1] == camera.position[1] &&
      this.lastCameraPosition[2] == camera.position[2]
    ) {
      return;
    }
    this.lastCameraPosition = [...camera.position];

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
    // 根据墨卡托坐标系和层级得到相机所在的瓦片
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

    console.log(
      "I am here",
      this.rowMinNum,
      this.colMinNum,
      this.rowMaxNum,
      this.colMaxNum
    );

    if (
      this.lastRowMinNum != this.rowMinNum ||
      this.lastColMinNum != this.colMinNum ||
      this.lastRowMaxNum != this.rowMaxNum ||
      this.lastColMaxNum != this.colMaxNum
    ) {
      this.updateTiles();
      this.lastRowMinNum = this.rowMinNum;
      this.lastColMinNum = this.colMinNum;
      this.lastRowMaxNum = this.rowMaxNum;
      this.lastColMaxNum = this.colMaxNum;
    }
  }

  // 平面计算逻辑，更新瓦片子数组
  updateTiles() {
    const engine = this.engine;
    const level = this.level;
    this.childrens = [];
    for (let i = -this.rowMinNum; i <= this.rowMaxNum; ++i) {
      // 如果超出当前层及的瓦片直接退出当前循环
      const tileX = this.centerTile[0] + i;
      if (tileX > this.limit || tileX < 0) continue;
      for (let j = -this.colMinNum; j <= this.colMaxNum; ++j) {
        const tileY = this.centerTile[1] + j;
        if (tileY > this.limit || tileY < 0) continue;
        // ! LRU缓存是不是应该在这里
        const tile = new Tile(engine, level, tileX, tileY);
        this.childrens.push(tile);
      }
    }
  }

  // 不做任何剔除
  updateTilesNoOptimize() {
    const engine = this.engine;
    const level = this.level;
    this.childrens = [];
    for (let i = 0; i <= 1 << level; ++i) {
      for (let j = 0; j <= 1 << level; ++j) {
        const tile = new Tile(engine, level, i, j);
        this.childrens.push(tile);
      }
    }
  }

  refresh() {
    const engine = this.engine;
    const gl = engine.gl;
    const sceneData = this.engine.sceneData;

    // ! 缓存应该加在这里
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
      // ! 需要考虑一个地球有不同的层级
      // 一张一张瓦片的画
      gl.drawElements(gl.TRIANGLES, tile.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }
}
