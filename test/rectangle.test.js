import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { Rectangle } from "../geographic/Rectangle.js";

function loadWebGL() {
  const engine = new Engine("webgl");

  const camera = new Camera([20378139, 0, 0], [0, 0, 0], [0, 1, 0]);
  const rect = new Rectangle(engine);

  engine.getActiveUniform(rect.program);

  const sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
  };

  engine.setActiveUniform(sceneData);

  const gl = engine.gl;
  gl.drawElements(gl.TRIANGLES, Rectangle.indices.length, gl.UNSIGNED_BYTE, 0);
}

ready(loadWebGL);
