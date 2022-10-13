export class Uniform {
  static selectFunction(uniform) {
    const gl = uniform.gl;
    switch (uniform.glint) {
      case 35665:
        uniform.applyfunc = (data) => gl.uniform3fv(uniform.loc, data);
        break;
      case 35666:
        uniform.applyfunc = (data) => gl.uniform4fv(uniform.loc, data);
        break;
      case 35676:
        uniform.applyfunc = (data) =>
          gl.uniformMatrix4fv(uniform.loc, false, data);
        break;
      case 35678:
        uniform.applyfunc = (data) => {
          const texture = gl.createTexture();
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_T,
            gl.MIRRORED_REPEAT
          );
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            data[1]
          );
          gl.uniform1i(uniform.loc, data[0]);
          gl.clear(gl.COLOR_BUFFER_BIT);
        };
        break;
      default:
        uniform.applyfunc = () => console.log("not found!");
    }
  }

  constructor(gl, name, glint, loc) {
    this.gl = gl;
    this.name = name;
    this.glint = glint;
    this.loc = loc;
    Uniform.selectFunction(this);
  }
}
