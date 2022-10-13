export class Ellipsoid {
  static Wgs84 = new Ellipsoid(6378137.0, 6378137.0, 6356752.314245);
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}
