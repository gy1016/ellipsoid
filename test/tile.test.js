import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { Tile } from "../geographic/Tile.js";

async function loadWebGL() {
  const engine = new Engine("webgl");
  const camera = new Camera([16378137, 0, 16378137], [0, 0, 0], [0, 1, 0]);

  const curLevel = 2;
  // 瓦片数量与层级的关系：2^n * 2^n
  const tileCountSqrt = 1 << curLevel;
  const sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
    u_Sampler: [0, null],
  };

  const gl = engine.gl;

  for (let i = 0; i < tileCountSqrt; ++i) {
    for (let j = 0; j < tileCountSqrt; ++j) {
      const tile = new Tile(engine, curLevel, i, j);
      engine.getActiveUniform(Tile.program);
      const img = await loadImage(tile.url);
      sceneData.u_Sampler[1] = img;
      engine.setActiveUniform(sceneData);
      // UNSIGNED_BYTE VS UNSIGNED_SHORT
      gl.drawElements(gl.TRIANGLES, tile.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }
}

ready(loadWebGL);
