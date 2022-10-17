import { Tile } from "./Tile.js";

export class TileLayer {
  constructor(engine, level) {
    this.engine = engine;
    this.childrens = [];
    this.level = level;
    this.tileCountSqrt = 1 << level;

    for (let i = 0; i < this.tileCountSqrt; ++i) {
      for (let j = 0; j < this.tileCountSqrt; ++j) {
        const tile = new Tile(engine, level, i, j);
        this.childrens.push(tile);
      }
    }
  }

  refresh() {
    const engine = this.engine;
    const gl = engine.gl;
    const sceneData = this.engine.sceneData;

    for (let i = 0; i < this.childrens.length; ++i) {
      const tile = this.childrens[i];
      tile.initArrayBuffer(tile.vertices, "position", 3, gl.FLOAT);
      tile.initElementBuffer(tile.indices);
      if (!tile.img) {
        loadImage(tile.url).then((res) => {
          tile.img = res;
        });
        return;
      }
      engine.getActiveUniform(Tile.program);
      sceneData.u_Sampler[1] = tile.img;
      engine.setActiveUniform(sceneData);
      gl.drawElements(gl.TRIANGLES, tile.indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }
}
