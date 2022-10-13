import { Engine } from "../core/Engine.js";
import { RayCastedGlobe } from "../geographic/RayCastedGlobe.js";

function loadWebGL() {
  const engine = new Engine("webgl");

  const cameraPos = [30378139, 0, 0];
  const rayCastedGlobe = new RayCastedGlobe(engine);

  engine.getActiveUniform(rayCastedGlobe.program);

  const modelMatrix = new Matrix4().setIdentity();

  // prettier-ignore
  const viewMatrix = new Matrix4().setLookAt(
    cameraPos[0], cameraPos[1], cameraPos[2],
    0.0, 0.0, 0.0,
    0, 1, 0
  );
  const presMatrix = new Matrix4().setPerspective(60, 1, 1.0, 6378137 * 2);
  const mvpMatrix = new Matrix4()
    .setIdentity()
    .multiply(presMatrix)
    .multiply(viewMatrix)
    .multiply(modelMatrix);

  const uploadData = {
    og_modelViewPerspectiveMatrix: mvpMatrix.elements,
    og_cameraEye: new Float32Array([cameraPos[0], cameraPos[1], cameraPos[2]]),
    og_cameraLightPosition: new Float32Array([
      cameraPos[0],
      cameraPos[1],
      cameraPos[2],
    ]),
    u_cameraEyeSquared: new Float32Array([
      cameraPos[0] * cameraPos[0],
      cameraPos[1] * cameraPos[1],
      cameraPos[2] * cameraPos[2],
    ]),
    u_globeOneOverRadiiSquared: new Float32Array([
      1 / (6378137.0 * 6378137.0),
      1 / (6378137.0 * 6378137.0),
      1 / (6356752.314245 * 6356752.314245),
    ]),
    og_diffuseSpecularAmbientShininess: new Float32Array([0.5, 0.5, 0.5, 1]),
    og_texture0: [0, null],
  };

  loadImage("http://121.199.160.202/images/earth.jpg").then((img) => {
    const gl = engine.gl;
    uploadData.og_texture0[1] = img;
    engine.setActiveUniform(uploadData);
    const n = RayCastedGlobe.indices.length;
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  });
}

ready(loadWebGL);

// static position = new Float32Array([
//  -6378137, 6378137, -6356752.314245, 6378137, 6378137, -6356752.314245, 6378137, 6378137, 6356752.314245, -6378137, 6378137, 6356752.314245,
//  -6378137, -6378137, -6356752.314245, 6378137, -6378137, -6356752.314245, 6378137, -6378137, 6356752.314245, -6378137, -6378137, 6356752.314245,
//  -6378137, 6378137, -6356752.314245, -6378137, 6378137, 6356752.314245, -6378137, -6378137, 6356752.314245, -6378137, -6378137, -6356752.314245,
//  6378137, 6378137, -6356752.314245, 6378137, 6378137, 6356752.314245, 6378137, -6378137, 6356752.314245, 6378137, -6378137, -6356752.314245,
//  -6378137, 6378137, 6356752.314245, 6378137, 6378137, 6356752.314245, 6378137, -6378137, 6356752.314245, -6378137, -6378137, 6356752.314245,
//  -6378137, 6378137, -6356752.314245, 6378137, 6378137, -6356752.314245, 6378137, -6378137, -6356752.314245, -6378137, -6378137, -6356752.314245
// ]);
