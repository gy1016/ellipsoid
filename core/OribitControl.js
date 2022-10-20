export class OribitControl {
  constructor(engine) {
    this.camera = engine.camera;
    this.canvas = engine.canvas;

    this.canvas.addEventListener("wheel", this.onMouseWheel.bind(this), false);
  }

  onMouseWheel(event) {
    event.preventDefault();
    event.stopPropagation();

    this.handleMouseWheel(event);
  }

  handleMouseWheel(event) {
    if (event.deltaY < 0) {
      this.camera.position[2] -= 3189068;
    } else if (event.deltaY > 0) {
      this.camera.position[2] += 3189068;
    }
  }
}
