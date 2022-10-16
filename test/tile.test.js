import { Camera } from "../core/Camera.js";
import { Engine } from "../core/Engine.js";
import { Tile } from "../geographic/Tile.js";

async function loadWebGL() {
  const engine = new Engine("webgl");

  // 12756274 原平面距离
  const camera = new Camera([16378137, 0, 0], [0, 0, 0], [0, 1, 0]);
  const tile1 = new Tile(engine, 1, 0, 0);

  engine.getActiveUniform(Tile.program);

  const sceneData = {
    u_MvpMatrix: camera.mvpMatrix.elements,
    u_Sampler: [0, null],
  };

  const gl = engine.gl;

  const img1 = await loadImage(tile1.url);
  sceneData.u_Sampler[1] = img1;
  engine.setActiveUniform(sceneData);
  // UNSIGNED_BYTE VS UNSIGNED_SHORT
  gl.drawElements(gl.TRIANGLES, tile1.indices.length, gl.UNSIGNED_SHORT, 0);

  const tile2 = new Tile(engine, 1, 0, 1);
  const img2 = await loadImage(tile2.url);
  sceneData.u_Sampler[1] = img2;
  engine.setActiveUniform(sceneData);
  gl.drawElements(gl.TRIANGLES, tile2.indices.length, gl.UNSIGNED_SHORT, 0);

  const tile3 = new Tile(engine, 1, 1, 0);
  const img3 = await loadImage(tile3.url);
  sceneData.u_Sampler[1] = img3;
  engine.setActiveUniform(sceneData);
  gl.drawElements(gl.TRIANGLES, tile3.indices.length, gl.UNSIGNED_SHORT, 0);

  const tile4 = new Tile(engine, 1, 1, 1);
  const img4 = await loadImage(tile4.url);
  sceneData.u_Sampler[1] = img4;
  engine.setActiveUniform(sceneData);
  gl.drawElements(gl.TRIANGLES, tile4.indices.length, gl.UNSIGNED_SHORT, 0);
}

ready(loadWebGL);
