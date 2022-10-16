export class Camera {
  position = new Float32Array([0, 0, 20378139]);
  // axisMatrix = new Matrix4();

  modelMatrix = new Matrix4().setIdentity();
  viewMatrix = new Matrix4().setIdentity();
  perspectMatrix = new Matrix4().setIdentity();

  get mvpMatrix() {
    return new Matrix4()
      .setIdentity()
      .multiply(this.perspectMatrix)
      .multiply(this.viewMatrix)
      .multiply(this.modelMatrix);
  }

  constructor(pos, target, up) {
    if (pos.length) {
      this.position = pos;
    }

    // this.axisMatrix.elements = new Float32Array([
    //   0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1,
    // ]);
    // this.modelMatrix.multiply(this.axisMatrix);

    // prettier-ignore
    this.viewMatrix = new Matrix4().setLookAt(
         pos[0],    pos[1],    pos[2],
      target[0], target[1], target[2],
          up[0],     up[1],     up[2]
    );

    this.perspectMatrix = new Matrix4().setPerspective(
      60,
      1,
      1.0,
      6378137 * 50
    );
  }
}
