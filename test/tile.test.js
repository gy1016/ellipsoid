import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";

async function loadWebGL() {
  const engine = new Engine("webgl");
  const camera = new Camera([11900000, 0, 11900000], [0, 0, 0], [0, 1, 0]);

  engine.sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
    u_Sampler: [0, null],
  };

  engine.run();
}

ready(loadWebGL);
