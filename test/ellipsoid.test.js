import { Ellipsoid } from "../geographic/Ellipsoid.js";

const ellipsoid = Ellipsoid.Wgs84;

let res = ellipsoid.toGeodetic3D([6378137, 6378137, 6378137]);
console.log(res[0], res[1], res[2]);
// console.log((res[0] * 180) / Math.PI, (res[1] * 180) / Math.PI, res[2]);
