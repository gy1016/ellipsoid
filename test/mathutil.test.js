import { Camera } from "../core/Camera.js";
import { MathUtil } from "../geographic/MathUtil.js";

const camera = new Camera(this, [0, 18278137, 0], [0, 0, 0], [0, 1, 0]);

const ndc1 = MathUtil.cartesianToNDC(
  camera,
  [7.221040043379708e-10, 2549109.6871217275, -5826992.329015122]
);
const ndc2 = MathUtil.cartesianToNDC(
  camera,
  [1.8067791634013897e-9, 6378137, 0]
);
const ndc3 = MathUtil.cartesianToNDC(
  camera,
  [-6378137, 3.6135583268027793e-9, 0]
);
const ndc4 = MathUtil.cartesianToNDC(
  camera,
  [-2549109.6871217275, 1.4442080086759417e-9, -5826992.329015122]
);

console.log(ndc1);
console.log(ndc2);
console.log(ndc3);
console.log(ndc4);
