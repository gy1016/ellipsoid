export class RayCastedGlobe {
  static vs = `
    attribute vec4 position;
    varying vec3 worldPosition;
    uniform mat4 og_modelViewPerspectiveMatrix;

    void main()
    {
        gl_Position = og_modelViewPerspectiveMatrix * position;
        worldPosition = position.xyz;
    }
  `;

  static fs = `
    precision mediump float;
    const float og_oneOverTwoPi = ${1 / (2 * Math.PI)};
    const float og_oneOverPi = ${1 / Math.PI};

    varying vec3 worldPosition;
    uniform vec3 og_cameraEye;
    uniform vec3 u_cameraEyeSquared;
    uniform vec3 u_globeOneOverRadiiSquared;
    uniform vec4 og_diffuseSpecularAmbientShininess;
    uniform sampler2D og_texture0;
    uniform vec3 og_cameraLightPosition;

    struct Intersection
    {
        bool  Intersects;
        float NearTime;
        float FarTime;
    };

    Intersection RayIntersectEllipsoid(vec3 rayOrigin, vec3 rayOriginSquared, vec3 rayDirection, vec3 oneOverEllipsoidRadiiSquared)
    {
        float a = dot(rayDirection * rayDirection, oneOverEllipsoidRadiiSquared);
        float b = 2.0 * dot(rayOrigin * rayDirection, oneOverEllipsoidRadiiSquared);
        float c = dot(rayOriginSquared, oneOverEllipsoidRadiiSquared) - 1.0;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant < 0.0)
        {
            return Intersection(false, 0.0, 0.0);
        }
        else if (discriminant == 0.0)
        {
            float time = -0.5 * b / a;
            return Intersection(true, time, time);
        }

        float t = -0.5 * (b + (b > 0.0 ? 1.0 : -1.0) * sqrt(discriminant));
        float root1 = t / a;
        float root2 = c / t;

        return Intersection(true, min(root1, root2), max(root1, root2));
    }

    vec3 GeodeticSurfaceNormal(vec3 positionOnEllipsoid, vec3 oneOverEllipsoidRadiiSquared)
    {
        return normalize(positionOnEllipsoid * oneOverEllipsoidRadiiSquared);
    }

    float LightIntensity(vec3 normal, vec3 toLight, vec3 toEye, vec4 diffuseSpecularAmbientShininess)
    {
        vec3 toReflectedLight = reflect(-toLight, normal);

        float diffuse = max(dot(toLight, normal), 0.0);
        float specular = max(dot(toReflectedLight, toEye), 0.0);
        specular = pow(specular, diffuseSpecularAmbientShininess.w);

        return (diffuseSpecularAmbientShininess.x * diffuse) +
            (diffuseSpecularAmbientShininess.y * specular) +
                diffuseSpecularAmbientShininess.z;
    }

    vec2 ComputeTextureCoordinates(vec3 normal)
    {
        return vec2(atan(normal.x, normal.z) * og_oneOverTwoPi + 0.5, asin(normal.y) * og_oneOverPi + 0.5);
    }

    void main()
    {
        vec3 rayDirection = normalize(worldPosition - og_cameraEye);
        Intersection i = RayIntersectEllipsoid(og_cameraEye, u_cameraEyeSquared, rayDirection, u_globeOneOverRadiiSquared);

        if (i.Intersects)
        {
            vec3 position = og_cameraEye + (i.NearTime * rayDirection);
            vec3 normal = GeodeticSurfaceNormal(position, u_globeOneOverRadiiSquared);

            vec3 toLight = normalize(og_cameraLightPosition - position);
            vec3 toEye = normalize(og_cameraEye - position);

            float intensity = LightIntensity(normal, toLight, toEye, og_diffuseSpecularAmbientShininess);
            gl_FragColor = vec4(intensity * texture2D(og_texture0, ComputeTextureCoordinates(normal)).rgb, 1.0);
            // gl_FragColor = vec4(1.0, 0, 0, 1.0);
        }
        else
        {
            discard;
        }
    }
  `;

  // prettier-ignore
  static position = new Float32Array([
   -6378137, 6356752.314245, -6378137, 6378137, 6356752.314245, -6378137, 6378137, 6356752.314245, 6378137, -6378137, 6356752.314245, 6378137,
   -6378137, -6356752.314245, -6378137, 6378137, -6356752.314245, -6378137, 6378137, -6356752.314245, 6378137, -6378137, -6356752.314245, 6378137,
   -6378137, 6356752.314245, -6378137, -6378137, 6356752.314245, 6378137, -6378137, -6356752.314245, 6378137, -6378137, -6356752.314245, -6378137,
   6378137, 6356752.314245, -6378137, 6378137, 6356752.314245, 6378137, 6378137, -6356752.314245, 6378137, 6378137, -6356752.314245, -6378137,
   -6378137, 6356752.314245, 6378137, 6378137, 6356752.314245, 6378137, 6378137, -6356752.314245, 6378137, -6378137, -6356752.314245, 6378137,
   -6378137, 6356752.314245, -6378137, 6378137, 6356752.314245, -6378137, 6378137, -6356752.314245, -6378137, -6378137, -6356752.314245, -6378137
  ]);

  static indices = new Uint8Array([
    0, 2, 1, 2, 0, 3, 4, 6, 7, 6, 4, 5, 8, 10, 9, 10, 8, 11, 12, 14, 15, 14, 12,
    13, 16, 18, 17, 18, 16, 19, 20, 22, 23, 22, 20, 21,
  ]);

  constructor(engine) {
    this.gl = engine.gl;
    this.program = createProgram(this.gl, RayCastedGlobe.vs, RayCastedGlobe.fs);
    this.gl.useProgram(this.program);
    this.initArrayBuffer(RayCastedGlobe.position, "position", 3, this.gl.FLOAT);
    this.initElementBuffer(RayCastedGlobe.indices);
  }

  initArrayBuffer(data, name, num, type) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, name);
    gl.vertexAttribPointer(loc, num, type, false, 0, 0);
    gl.enableVertexAttribArray(loc);
  }

  initElementBuffer(data) {
    const gl = this.gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }
}
