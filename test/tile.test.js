import { Engine } from "../core/Engine.js";

async function loadWebGL() {
  const engine = new Engine("webgl");

  engine.sceneData = {
    u_Sampler: [0, null],
  };

  engine.run();
}

ready(loadWebGL);
