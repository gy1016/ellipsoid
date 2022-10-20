import {
  EARTH_PERIMETER,
  EARTH_RADIUS,
  TILE_SIZE,
} from "../config/constant.js";

export class MathUtil {
  // 根据3857坐标及缩放层级计算瓦片行列号
  static getTileRowAndCol(x, y, z) {
    const newX = x + EARTH_PERIMETER / 2;
    const newY = EARTH_PERIMETER / 2 - y;
    const resolution = MathUtil.getResolution(z);
    const row = Math.floor(newX / resolution / TILE_SIZE);
    const col = Math.floor(newY / resolution / TILE_SIZE);
    return [row, col];
  }

  // 获取某一层级下的分辨率
  static getResolution(n) {
    const tileNums = 1 << n;
    const tileTotalPixel = tileNums * TILE_SIZE;
    return EARTH_PERIMETER / tileTotalPixel;
  }

  // 虚拟地球书的方法：将地理坐标系转为笛卡尔坐标系
  static geodeticToCartesian(geodetic) {
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

  // 4326转3857地理坐标系到墨卡托坐标系
  static geodetic2Mercator(geodetic) {
    // 弧长为 弧长 = 弧度 * 半径
    let x = geodetic.lon * EARTH_RADIUS;
    let sin = Math.sin(geodetic.lat);
    let y = (EARTH_RADIUS / 2) * Math.log((1 + sin) / (1 - sin));
    return [x, y];
  }

  // 3587转4326墨卡托坐标系到地理坐标系
  static mercatorToGeodetic(mercator) {
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

  // 根据经纬度得到对应的像素坐标
  static getPxFromGeodetic(geodetic, level) {
    let [_x, _y] = MathUtil.geodetic2Mercator(geodetic);
    // 转成世界平面图的坐标
    _x += EARTH_PERIMETER / 2;
    _y = EARTH_PERIMETER / 2 - _y;
    let resolution = MathUtil.getResolution(level); // 该层级的分辨率
    // 米/分辨率得到像素
    let x = Math.floor(_x / resolution);
    let y = Math.floor(_y / resolution);
    return [x, y];
  }
}
