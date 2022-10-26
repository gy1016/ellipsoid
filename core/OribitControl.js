import { Spherical } from "./Spherical.js";

export class OribitControl {
  constructor(engine) {
    this._isMouseUp = true;
    this._rotateStart = [0, 0];
    this._rotateEnd = [0, 0];
    this._rotateDelta = [0, 0];
    this._offset = [0, 0, 0];
    this._target = [0, 0, 0];
    this._position = [0, 0, 0];
    this._scale = 1;
    this._zoomFrag = 0;

    this.camera = engine.camera;
    this.canvas = engine.canvas;

    this._spherical = new Spherical(0, 0, 0);
    this._sphericalDelta = new Spherical(0, 0, 0);

    this.constEvents = [
      { type: "mousedown", listener: this.onMouseDown.bind(this) },
      { type: "wheel", listener: this.onMouseWheel.bind(this) },
    ];

    this.mouseUpEvents = [
      { type: "mousemove", listener: this.onMouseMove.bind(this) },
      { type: "mouseup", listener: this.onMouseUp.bind(this) },
    ];

    this.constEvents.forEach((ele) => {
      this.canvas.addEventListener(ele.type, ele.listener, false);
    });
  }

  rotateLeft(radian) {
    this._sphericalDelta.theta -= radian;
  }

  rotateUp(radian) {
    this._sphericalDelta.phi -= radian;
  }

  zoomIn(zoomScale) {
    this._scale *= zoomScale;
  }

  zoomOut(zoomScale) {
    this._scale /= zoomScale;
  }

  onMouseDown(event) {
    event.preventDefault();

    this._isMouseUp = false;

    this.handleMouseDownRotate(event);

    this.mouseUpEvents.forEach((ele) => {
      this.canvas.addEventListener(ele.type, ele.listener, false);
    });
  }

  onMouseMove(event) {
    event.preventDefault();
    this.handleMouseMoveRotate(event);
  }

  onMouseWheel(event) {
    event.preventDefault();
    event.stopPropagation();

    this.handleMouseWheel(event);
  }

  onMouseUp() {
    this._isMouseUp = true;

    this.mouseUpEvents.forEach((ele) => {
      this.canvas.removeEventListener(ele.type, ele.listener, false);
    });
  }

  // TODO: 缩放太快
  handleMouseWheel(event) {
    if (event.deltaY < 0) {
      this.zoomIn(Math.pow(0.95, 1));
    } else if (event.deltaY > 0) {
      this.zoomOut(Math.pow(0.95, 1));
    }
  }

  handleMouseDownRotate(event) {
    this._rotateStart = [event.clientX, event.clientY];
  }

  handleMouseMoveRotate(event) {
    this._rotateEnd = [event.clientX, event.clientY];
    this._rotateDelta = [
      this._rotateEnd[0] - this._rotateStart[0],
      this._rotateEnd[1] - this._rotateStart[1],
    ];

    this.rotateLeft(
      2 * Math.PI * (this._rotateDelta[0] / this.canvas.clientWidth)
    );
    this.rotateUp(
      2 * Math.PI * (this._rotateDelta[1] / this.canvas.clientHeight)
    );

    this._rotateStart = [...this._rotateEnd];
  }

  update() {
    // 先获取到当前相机的位置
    const position = this.camera.position;
    // 计算出与原点的差值矢量
    this._offset = [
      position[0] - this._target[0],
      position[1] - this._target[1],
      position[2] - this._target[2],
    ];
    // 根据差值矢量得到球面坐标
    this._spherical.setFromVec3(this._offset);

    // 将当前球面坐标加上偏移量
    this._spherical.theta += this._sphericalDelta.theta;
    this._spherical.phi += this._sphericalDelta.phi;

    if (this._scale !== 1) {
      this._zoomFrag = this._spherical.radius * (this._scale - 1);
    }
    this._spherical.radius += this._zoomFrag;

    // 加上偏移量后，生成新的offset
    this._spherical.setToVec3(this._offset);

    // 将offset赋值给内置position
    this._position = [...this._target];
    this._position = [
      this._position[0] + this._offset[0],
      this._position[1] + this._offset[1],
      this._position[2] + this._offset[2],
    ];

    this.camera.position = this._position;
    this._sphericalDelta.set(0, 0, 0);
    this._zoomFrag = 0;
    this._scale = 1;
  }
}
