import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { Grid } from "../geographic/Grid.js";

function loadWebGL() {
  const engine = new Engine("webgl");

  const camera = new Camera([0, 0, 2], [0, 0, 0], [0, 1, 0]);
  const grid = new Grid(engine, 5);

  engine.getActiveUniform(grid.program);

  const sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
  };

  engine.setActiveUniform(sceneData);

  const gl = engine.gl;
  gl.drawElements(gl.POINTS, Grid.indices.length, gl.UNSIGNED_BYTE, 0);
}

ready(loadWebGL);
