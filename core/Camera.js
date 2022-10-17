export class Camera {
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

  constructor(pos, target, up) {
    this.position = pos;
    this.target = target;
    this.up = up;
  }
}
