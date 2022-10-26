export class Spherical {
  constructor(radius, phi, theta) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
  }

  set(radius, phi, theta) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;

    return this;
  }

  setFromVec3(v3) {
    this.radius = Math.sqrt(v3[0] ** 2 + v3[1] ** 2 + v3[2] ** 2);
    this.theta = Math.atan2(v3[1], v3[0]);
    this.phi = Math.acos(v3[2] / this.radius);
  }

  // ! js函数传参也是引用拷贝
  setToVec3(v3) {
    const sinPhiRadius = Math.sin(this.phi) * this.radius;
    v3[1] = sinPhiRadius * Math.sin(this.theta);
    v3[2] = Math.cos(this.phi) * this.radius;
    v3[0] = sinPhiRadius * Math.cos(this.theta);

    return this;
  }
}
