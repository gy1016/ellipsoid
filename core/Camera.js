export class Camera {
  level = 2;
  position = [0, 0, 20378139];
  // axisMatrix = new Matrix4();

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
      this.position[0],
      this.position[1],
      this.position[2],
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
  }

  update() {
    // 相机距离原点的欧氏距离，减去地球半径，得到距离地球表面的距离
    const engine = this.engine;
    engine.oribitControl.update();
    const position = this.position;

    const surface = engine.ellipsoid.scaleToGeodeticSurface(position);

    const h = Math.sqrt(
      (position[0] - surface[0]) ** 2 +
        (position[1] - surface[1]) ** 2 +
        (position[2] - surface[2]) ** 2
    );

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
