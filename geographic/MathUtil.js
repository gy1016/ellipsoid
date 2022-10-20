import { EARTH_PERIMETER } from "../config/constant.js";

export class MathUtil {
  // 根据3857坐标及缩放层级计算瓦片行列号
  static getTileRowAndCol(x, y, z) {
    const newX = x + EARTH_PERIMETER / 2 - y;
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
}
