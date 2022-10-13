import { Camera } from "./core/Camera.js";
import { Ellipsoid } from "./core/Ellipsoid.js";
import { Engine } from "./core/Engine.js";
import { RayCastedGlobe } from "./geographic/RayCastedGlobe.js";

function loadWebGL() {
  const engine = new Engine("webgl");
  const camera = new Camera([6378137, 0, 0], [0, 0, 0], [0, 1, 0]);
  const rayCastedGlobe = new RayCastedGlobe(engine);

  const ellipsoid = Ellipsoid.Wgs84;

  engine.getActiveUniform(rayCastedGlobe.program);

  const sceneData = {
    og_cameraEye: camera.position,
    og_cameraLightPosition: camera.position,
    u_cameraEyeSquared: new Float32Array([
      Math.pow(camera.position[0], 2),
      Math.pow(camera.position[1], 2),
      Math.pow(camera.position[2], 2),
    ]),
    og_diffuseSpecularAmbientShininess: new Float32Array([0.5, 0.5, 0.5, 1]),
    og_modelViewPerspectiveMatrix: camera.mvpMatrix.elements,
    u_globeOneOverRadiiSquared: new Float32Array([
      1 / Math.pow(ellipsoid.a, 2),
      1 / Math.pow(ellipsoid.b, 2),
      1 / Math.pow(ellipsoid.c, 2),
    ]),
    og_texture0: [0, null],
  };

  loadImage("http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x=0&y=0&z=0&s=Gali").then(
    (img) => {
      const gl = engine.gl;
      sceneData.og_texture0[1] = img;
      engine.setActiveUniform(sceneData);
      const n = RayCastedGlobe.indices.length;
      gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    }
  );
}

ready(loadWebGL);
