import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { Tile } from "../geographic/Tile.js";

function loadWebGL() {
  const engine = new Engine("webgl");

  const camera = new Camera([25378137, 0, 0], [0, 0, 0], [0, 1, 0]);
  const tile = new Tile(engine, 1, 0, 1);

  engine.getActiveUniform(tile.program);

  const sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
  };

  engine.setActiveUniform(sceneData);

  const gl = engine.gl;
  gl.drawElements(gl.POINTS, Tile.indices.length, gl.UNSIGNED_BYTE, 0);
}

ready(loadWebGL);
