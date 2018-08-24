/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Fly Spherical component for A-Frame.
 */
AFRAME.registerComponent('spherical-controls', {
  schema: {
    radius: {
      type: 'number',
      default: 1.1
    },
    inner: {
      type: 'number',
      default: 0.1
    },
    outer: {
      type: 'number',
      default: 0.1
    },
    speed: {
      type: 'int',
      default: 1
    },
    latLng: {
      type: 'array',
      default: [0,0]
    },
    enabled: {
      type: 'boolean',
      default: true
    }

  },


  init: function () {
    this.paused = false;
    this.camera = this.el.sceneEl.camera;

    this.origin = new THREE.Vector3(); 

    this.position = new THREE.Vector3(0, 1, 0);
//    this.position = this.camera.getWorldPosition();
    this.position.setLength(this.data.radius);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.look = new THREE.Vector3(0, 0, 1);
  },
  update: function (oldData) {

    const data = this.data;
    const pos = this.xyzFromLatLon(data.latLng[0], data.latLng[1]) 

    pos.multiplyScalar(data.radius)
    this.position.copy(pos);
  },

  tick: function (time, delta) {
    if (!this.data.enabled || this.paused) return;

    this.move(delta);
  },

  getForward: function () {
    const zaxis = new THREE.Vector3();
    return function () {
      this.camera.getWorldDirection(zaxis);
      return zaxis;
    };
  }(),

  move: function (delta) {
    const data = this.data;
    var distance = data.speed * (delta / 1000);

    // set length of forward z-axis
    var forward = this.getForward().setLength(distance);

    // change position by forward
    if (this.position.add(forward)) { 
      var length = this.position.length();

      // set max and min height
      if (length < data.radius - data.inner) {
        this.position.setLength(data.radius - data.inner);
      } else if (length > data.radius + data.outer) {
        this.position.setLength(data.radius + data.outer);
      }
    }

    // thats were cross products are used most
    // https://classroom.udacity.com/courses/cs291/lessons/158750187/concepts/1694147620923#
    // find the frame of reference

    // calculate with the cross product the real forward/look vector

    // up or normal vector
    var up = this.position.clone().sub(this.origin).normalize();
    // tangent vector
    var tangent = up.clone().cross(this.look).normalize();
    // look vector or binormal/bitangent vector
    var look = tangent.clone().cross(up).normalize();


    // object.quaternion.setFromUnitVectors(this.forward, look);
    this.look = look;

    var matrix = new THREE.Matrix4();
    const c = matrix.elements;
    // aplpy x, y and z axis basis vector
    // 4th column is position
    c[0] = tangent.x, c[1] = tangent.y, c[2] = tangent.z, c[3] = 0;   // tangent vector
    c[4] = up.x, c[5] = up.y, c[6] = up.z, c[7] = 0;   // up Vector
    c[8] = look.x, c[9] = look.y, c[10] = look.z, c[11] = 0; // look vector
    c[12] = this.position.x, c[13] = this.position.y, c[14] = this.position.z, c[15] = 1;

    
    const object = this.el.object3D;
    object.matrixAutoUpdate = false;
    object.matrix = matrix;
    object.updateMatrixWorld();  // also apply to child
    
  },

  _calcPosFromLatLonRad: function (lat, lon, radius) {

    var phi = (90 - lat) * (Math.PI / 180)
    var theta = (lon + 180) * (Math.PI / 180)

    x = -((radius) * Math.sin(phi) * Math.cos(theta))
    z = ((radius) * Math.sin(phi) * Math.sin(theta))
    y = ((radius) * Math.cos(phi))

    return new THREE.Vector3(x, y, z)

  },
  getLatLonAzimuth: function () {
    const position = this.position.clone()

    const nextPosition = position.clone().add(this.getForward())           // EXTRAHIERT DEN ANGESTREBTEN Z-VEKTOR!

    const latLon = this.latLonFromXYZ(position.x, position.y, position.z)     // AKTUELLE POSITON
    const nextLatLon = this.latLonFromXYZ(nextPosition.x, nextPosition.y, nextPosition.z);     // VORWÄRTSBEWEGUNG

    // DELTA "VEKTOR" ROTATION BERECHNEN
    var azimuth = Math.atan2(-(nextLatLon.lon - latLon.lon), nextLatLon.lat - latLon.lat);

    return {
      lat: latLon.lat,
      lon: latLon.lon,
      azimuth: azimuth
    };
  },
  latLonFromXYZ: function (x, y, z) {
    var radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)),
      lat = Math.asin(y / radius),    // or acos(z / radius)
      lon = Math.atan2(x, z) - Math.PI / 2;   // or atan2(y, x)

    // reset longitude to the positive datum of the world
    if (lon < -Math.PI) {
      lon += 2 * Math.PI;
    }
    return {
      lat: lat,
      lon: lon
    };
  },
  xyzFromLatLon: function (lat, lon) {
    // center lat and lon
    var nlat = lat * Math.PI / 180,
      nlon = (lon + 180) * Math.PI / 180;

    var x = -Math.cos(nlat) * Math.cos(nlon),
      y = Math.sin(nlat),
      z = Math.cos(nlat) * Math.sin(nlon);


      return new THREE.Vector3(x, y, z)
      /*
    return {
      x: x,
      y: y,
      z: z
    };
    */
  },

  remove: function () { },

  pause: function () { 
    this.paused = true;
  },

  play: function () {
    this.paused = false;
  }
});
