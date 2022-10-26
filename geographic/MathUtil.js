import {
  EARTH_PERIMETER,
  EARTH_RADIUS,
  TILE_SIZE,
} from "../config/constant.js";

export class MathUtil {
  // 根据行列号得到瓦片最大最小经纬度
  static getTileGeodeticByGrid(level, row, col) {
    const Eproj = MathUtil.gridToWebMercator(level, row, col);
    const pMin = MathUtil.mercatorToGeodetic({ x: Eproj.minX, y: Eproj.minY });
    const pMax = MathUtil.mercatorToGeodetic({ x: Eproj.maxX, y: Eproj.maxY });
    return {
      minLon: pMin.radLon,
      minLat: pMin.radLat,
      maxLon: pMax.radLon,
      maxLat: pMax.radLat,
    };
  }

  // 根据行列号得到墨卡托坐标
  static gridToWebMercator(level, row, col) {
    // 这里按球考虑了
    const k = Math.PI * 6378137;
    const size = (2 * k) / Math.pow(2, level);
    const minX = -k + col * size;
    const maxX = minX + size;
    const maxY = k - row * size;
    const minY = maxY - size;
    return {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
    };
  }

  // 根据3857坐标及缩放层级计算瓦片行列号
  static getTileRowAndCol(x, y, z) {
    const newX = x + EARTH_PERIMETER / 2;
    const newY = EARTH_PERIMETER / 2 - y;
    const resolution = MathUtil.getResolution(z);
    const col = Math.floor(newX / resolution / TILE_SIZE);
    const row = Math.floor(newY / resolution / TILE_SIZE);
    return [row, col];
  }

  // 获取某一层级下的分辨率
  static getResolution(n) {
    const tileNums = 1 << n;
    const tileTotalPixel = tileNums * TILE_SIZE;
    return EARTH_PERIMETER / tileTotalPixel;
  }

  // 根据地理坐标得到表面法线
  static geodeticSurfaceNormal(geodetic) {
    const cosLat = Math.cos(geodetic.radLat);
    return [
      cosLat * Math.cos(geodetic.radLon),
      cosLat * Math.sin(geodetic.radLon),
      Math.sin(geodetic.radLat),
    ];
  }

  // 虚拟地球书的方法：将地理坐标系转为笛卡尔坐标系
  static geodeticToCartesian(geodetic) {
    const n = MathUtil.geodeticSurfaceNormal(geodetic);
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
    let a = Math.PI / 4 + geodetic.lat / 2;
    let b = Math.tan(a);
    let c = Math.log(b);
    let y = EARTH_RADIUS * c;
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

  // 将笛卡尔坐标系的坐标转换至NDC
  static cartesianToNDC(camera, cartesian) {
    // const p = [...cartesian, 1];
    const p = [cartesian[1], cartesian[2], cartesian[0], 1];
    const e = camera.mvpMatrix.elements;
    const res = [];
    res[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[8] + p[3] * e[12];
    res[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[9] + p[3] * e[13];
    res[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
    res[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

    const w = res[3];
    const ndc = [res[0] / w, res[1] / w, res[2] / w];

    return ndc;
  }

  // 射线与椭球地球相交，并排序
  static rayIntersectEllipsoid(
    rayOrigin,
    rayOriginSquared,
    rayDirection,
    oneOverEllipsoidRadiiSquared
  ) {
    let tmp1 = rayDirection.map((r) => r * r);
    let tmp2 = [
      rayOrigin[0] * rayDirection[0],
      rayOrigin[1] * rayDirection[1],
      rayOrigin[2] * rayDirection[2],
    ];
    const a =
      tmp1[0] * oneOverEllipsoidRadiiSquared[0] +
      tmp1[1] * oneOverEllipsoidRadiiSquared[1] +
      tmp1[2] * oneOverEllipsoidRadiiSquared[2];
    const b =
      2.0 *
      (tmp2[0] * oneOverEllipsoidRadiiSquared[0] +
        tmp2[1] * oneOverEllipsoidRadiiSquared[1] +
        tmp2[2] * oneOverEllipsoidRadiiSquared[2]);
    const c =
      rayOriginSquared[0] * oneOverEllipsoidRadiiSquared[0] +
      rayOriginSquared[1] * oneOverEllipsoidRadiiSquared[1] +
      rayOriginSquared[2] * oneOverEllipsoidRadiiSquared[2] -
      1.0;
    const discriminant = b * b - 4.0 * a * c;
    if (discriminant < 0.0) {
      return {
        intersects: false,
        near: 0.0,
        far: 0.0,
      };
    } else if (discriminant == 0.0) {
      const time = (-0.5 * b) / a;
      return {
        intersects: true,
        near: time,
        far: time,
      };
    }
    const t = -0.5 * (b + (b > 0.0 ? 1.0 : -1.0) * Math.sqrt(discriminant));
    const root1 = t / a;
    const root2 = c / t;
    return {
      intersects: true,
      near: Math.min(root1, root2),
      far: Math.max(root1, root2),
    };
  }
}
