export class Ellipsoid {
  static Wgs84 = new Ellipsoid(6378137.0, 6378137.0, 6356752.314245);
  constructor(a, b, c) {
    this.radii = [a, b, c];
    this.radiiSquared = [a * a, b * b, c * c];
    this.radiiToTheFourth = this.radiiSquared.map((p) => p * p);
    this.oneOverRadiiSquared = [1 / (a * a), 1 / (b * b), 1 / (c * c)];
  }

  scaleToGeocentricSurface(position) {
    const beta =
      1.0 /
      Math.sqrt(
        position[0] * position[0] * this.oneOverRadiiSquared[0] +
          position[1] * position[1] * this.oneOverRadiiSquared[1] +
          position[2] * position[2] * this.oneOverRadiiSquared[2]
      );
    return position.map((p) => beta * p);
  }

  scaleToGeodeticSurface(position) {
    const beta =
      1.0 /
      Math.sqrt(
        position[0] * position[0] * this.oneOverRadiiSquared[0] +
          position[1] * position[1] * this.oneOverRadiiSquared[1] +
          position[2] * position[2] * this.oneOverRadiiSquared[2]
      );
    const n = Math.sqrt(
      [
        beta * position[0] * this.oneOverRadiiSquared[0],
        beta * position[1] * this.oneOverRadiiSquared[1],
        beta * position[2] * this.oneOverRadiiSquared[2],
      ].reduce((pre, cur) => pre + cur * cur, 0)
    );
    let alpha =
      ((1.0 - beta) *
        Math.sqrt(position.reduce((pre, cur) => pre + cur * cur, 0))) /
      n;

    const x2 = position[0] * position[0];
    const y2 = position[1] * position[1];
    const z2 = position[2] * position[2];

    let da = 0.0;
    let db = 0.0;
    let dc = 0.0;

    let s = 0.0;
    let dSdA = 1.0;

    do {
      alpha -= s / dSdA;

      da = 1.0 + alpha * this.oneOverRadiiSquared[0];
      db = 1.0 + alpha * this.oneOverRadiiSquared[1];
      dc = 1.0 + alpha * this.oneOverRadiiSquared[2];

      let da2 = da * da;
      let db2 = db * db;
      let dc2 = dc * dc;

      let da3 = da * da2;
      let db3 = db * db2;
      let dc3 = dc * dc2;

      s =
        x2 / (this.radiiSquared[0] * da2) +
        y2 / (this.radiiSquared[1] * db2) +
        z2 / (this.radiiSquared[2] * dc2) -
        1.0;

      dSdA =
        -2.0 *
        (x2 / (this.radiiToTheFourth[0] * da3) +
          y2 / (this.radiiToTheFourth[1] * db3) +
          z2 / (this.radiiToTheFourth[2] * dc3));
    } while (Math.abs(s) > 1e-10);

    return [position[0] / da, position[1] / db, position[2] / dc];
  }
}
