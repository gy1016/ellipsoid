import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { OribitControl } from "../core/OribitControl.js";

async function loadWebGL() {
  const engine = new Engine("webgl");
  // 6378137
  const camera = new Camera([0, 0, 6378139 * 5], [0, 0, 0], [0, 1, 0]);

  engine.camera = camera;
  engine.oribitControl = new OribitControl(engine);
  engine.sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
    u_Sampler: [0, null],
  };

  engine.run();
}

ready(loadWebGL);
