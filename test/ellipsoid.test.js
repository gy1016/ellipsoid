import { Ellipsoid } from "../geographic/Ellipsoid.js";

const ellipsoid = Ellipsoid.Wgs84;

let res = ellipsoid.scaleToGeodeticSurface([6378137, 6378137, 6378137]);
console.log(res);
