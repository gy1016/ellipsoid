import { MathUtil } from "../geographic/MathUtil.js";

export class Camera {
  level = 2;
  lastLevel = 2;
  _position = [0, 0, 20378139];

  get position() {
    const geoX = this._position[2];
    const geoY = this._position[0];
    const geoZ = this._position[1];

    return [geoX, geoY, geoZ];
  }

  set position(value) {
    const deviceX = value[1];
    const deviceY = value[2];
    const deviceZ = value[0];
    this._position = [deviceX, deviceY, deviceZ];
  }

  get mvpMatrix() {
    return new Matrix4()
      .setIdentity()
      .multiply(this.perspectMatrix)
      .multiply(this.viewMatrix)
      .multiply(this.modelMatrix);
  }

  get modelMatrix() {
    return new Matrix4().setIdentity();
  }

  // prettier-ignore
  get viewMatrix() {
    return new Matrix4().setLookAt(
      this._position[0],
      this._position[1],
      this._position[2],
      this.target[0],
      this.target[1],
      this.target[2],
      this.up[0],
      this.up[1],
      this.up[2]
    );
  }

  get perspectMatrix() {
    return new Matrix4().setPerspective(60, 1, 1.0, 6378137 * 50);
  }

  constructor(engine, pos, target, up) {
    this.engine = engine;
    this.position = pos;
    this.target = target;
    this.up = up;
    this.change = false;
    this.oneOverEllipsoidRadiiSquared = [
      1 / (6378137.0 * 6378137.0),
      1 / (6378137.0 * 6378137.0),
      1 / (6356752.314245 * 6356752.314245),
    ];
  }

  // 判断世界坐标系中的点是否在canvans中
  isWorldVisibleInCanvas(world, options) {
    const cameraP = this.position;
    const cameraPosSquared = cameraP.map((p) => p * p);

    const dir = [
      world[0] - cameraP[0],
      world[1] - cameraP[1],
      world[2] - cameraP[2],
    ];

    const len = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    const normalDir = [dir[0] / len, dir[1] / len, dir[2] / len];

    const i = MathUtil.rayIntersectEllipsoid(
      cameraP,
      cameraPosSquared,
      normalDir,
      this.oneOverEllipsoidRadiiSquared
    );

    if (i.intersects) {
      const pickVertice = [
        cameraP[0] + i.near * normalDir[0],
        cameraP[1] + i.near * normalDir[1],
        cameraP[2] + i.near * normalDir[2],
      ];
      const length2Vertice = Math.sqrt(
        (cameraP[0] - world[0]) ** 2 +
          (cameraP[1] - world[1]) ** 2 +
          (cameraP[2] - world[2]) ** 2
      );

      const length2Pick = Math.sqrt(
        (cameraP[0] - pickVertice[0]) ** 2 +
          (cameraP[1] - pickVertice[1]) ** 2 +
          (cameraP[2] - pickVertice[2]) ** 2
      );
      if (length2Vertice < length2Pick + 5) {
        const res =
          options.verticeInNDC[0] >= -1 &&
          options.verticeInNDC[0] <= 1 &&
          options.verticeInNDC[1] >= -1 &&
          options.verticeInNDC[1] <= 1;
        return res;
      }
    }

    return false;
  }

  // 更新相机最新坐标和对应层级
  update() {
    // 相机距离原点的欧氏距离，减去地球半径，得到距离地球表面的距离
    const engine = this.engine;
    const prePosition = [...this.position];
    // ! 只会更新相机坐标，无返回值
    engine.oribitControl.update();
    const curPosition = [...this.position];

    const position = this.position;
    this.change =
      prePosition[0] !== curPosition[0] ||
      prePosition[1] !== curPosition[1] ||
      prePosition[2] !== prePosition[2];

    const surface = engine.ellipsoid.scaleToGeodeticSurface(position);

    const h = Math.sqrt(
      (position[0] - surface[0]) ** 2 +
        (position[1] - surface[1]) ** 2 +
        (position[2] - surface[2]) ** 2
    );

    // TODO: 这个该用视锥体进行数学计算
    if (h <= 100) {
      this.level = 19;
    } else if (h <= 300) {
      this.level = 18;
    } else if (h <= 660) {
      this.level = 17;
    } else if (h <= 1300) {
      this.level = 16;
    } else if (h <= 2600) {
      this.level = 15;
    } else if (h <= 6400) {
      this.level = 14;
    } else if (h <= 13200) {
      this.level = 13;
    } else if (h <= 26000) {
      this.level = 12;
    } else if (h <= 67985) {
      this.level = 11;
    } else if (h <= 139780) {
      this.level = 10;
    } else if (h <= 250600) {
      this.level = 9;
    } else if (h <= 380000) {
      this.level = 8;
    } else if (h <= 640000) {
      this.level = 7;
    } else if (h <= 1280000) {
      this.level = 6;
    } else if (h <= 2600000) {
      this.level = 5;
    } else if (h <= 6100000) {
      this.level = 4;
    } else if (h <= 11900000) {
      this.level = 3;
    } else {
      this.level = 2;
    }
  }
}
