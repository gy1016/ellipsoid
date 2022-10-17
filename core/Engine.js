import { Uniform } from "./Uniform.js";
import { TileLayer } from "../geographic/TileLayer.js";
import { Tile } from "../geographic/Tile.js";

export class Engine {
  constructor(id) {
    this.uniforms = Object.create(null);
    this.gl = document.getElementById(id).getContext("webgl");
    this.initState();
    this.sceneData = Object.create(null);
    this.layers = [];
  }

  initState() {
    const gl = this.gl;
    // gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.EQUAL);
    gl.enable(gl.CULL_FACE);
    // gl.cullFace(gl.BACK);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  }

  getActiveUniform(program) {
    if (Object.keys(this.uniforms).length > 0) return;
    const gl = this.gl;
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; ++i) {
      const info = gl.getActiveUniform(program, i);
      const loc = gl.getUniformLocation(program, info.name);
      this.uniforms[info.name] = new Uniform(gl, info.name, info.type, loc);
    }
  }

  setActiveUniform(data) {
    const keys = Object.keys(this.uniforms);
    for (let key of keys) {
      this.uniforms[key].applyfunc(data[key]);
    }
  }

  render() {
    // 渲染瓦片图层
    this.gl.useProgram(Tile.program);
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = this.layers[i];
      layer.refresh();
    }
    requestAnimationFrame(this.render.bind(this));
  }

  run() {
    const tileLayer = new TileLayer(this, 2);
    this.layers.push(tileLayer);
    requestAnimationFrame(this.render.bind(this));
  }
}
