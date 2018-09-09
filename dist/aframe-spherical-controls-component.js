(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Spherical controls component for A-Frame.
 */
AFRAME.registerComponent('spherical-controls', {
  schema: {
    enabled: {
      type: 'boolean',
      default: true
    },
    radius: {
      type: 'number',
      default: 1.1
    },
    minRadius: {
      type: 'number',
      default: 0
    },
    maxRadius: {
      type: 'number',
      default: 0
    },
    speed: {
      type: 'number',
      default: 1
    },
    lat: {
      type: 'number',
      default: 0,
    },
    lng: {
      type: 'number',
      default: 0,
    },
    upVector: {
      type: 'vec3',
      default: {x: 0, y: 1, z: 0}
    }
  },

  init: function () {
    const data = this.data;

    this.paused = false;
    this.camera = this.el.sceneEl.camera;

    this.origin = new THREE.Vector3();

    this.position = new THREE.Vector3(0, 1, 0);
    this.position.setLength(this.data.radius);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.look = new THREE.Vector3(
      -data.upVector.x,
      -data.upVector.y,
      -data.upVector.z
    );
  },

  update: function (oldData) {
    const data = this.data;

    if (oldData.lat !== data.lat || oldData.lng !== data.lng) {
      const pos = this.latLngToPosition(data.lat, -data.lng).multiplyScalar(data.radius);
      this.position.copy(pos);
    }
  },

  tick: (function () {
    var matrix = new THREE.Matrix4();

    return function (time, delta) {
      if (!this.data.enabled || this.paused || this.speed <= 0) return;

      delta = delta / 1000;
      const data = this.data;

      const velocity = data.speed * delta;

      // set length of forward z-axis
      // var forward = this.getForward().setLength(velocity.length());
      var forward = this._getForward().setLength(velocity);

      // change position by forward
      if (this.position.add(forward)) {
        const length = this.position.length();
	// set max and min height
        if (length < data.radius - data.minRadius) {
          this.position.setLength(data.radius - data.minRadius);
        } else if (length > data.radius + data.maxRadius) {
          this.position.setLength(data.radius + data.maxRadius);
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
    };
  })(),

  _getForward: (function () {
    const zaxis = new THREE.Vector3();
    return function () {
      this.camera.getWorldDirection(zaxis);
      return zaxis;
    };
  }()),

  getLatLngAzimuth: function () {
    const position = this.position.clone();

    const nextPosition = position.clone().add(this._getForward());

    const latLng = this.positionToLatLng(position.x, position.y, position.z);
    const nextLatLng = this.positionToLatLng(nextPosition.x, nextPosition.y, nextPosition.z);

    const azimuth = Math.atan2(-(nextLatLng.lng - latLng.lng), nextLatLng.lat - latLng.lat);

    return {
      lat: THREE.Math.radToDeg(latLng.lat),
      lng: THREE.Math.radToDeg(latLng.lng),
      azimuth: THREE.Math.radToDeg(azimuth)
    };
  },

  positionToLatLng: function (x, y, z) {
    const radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

    const lat = Math.asin(y / radius);    // or acos(z / radius)
    var lng = Math.atan2(x, z) - Math.PI / 2;   // or atan2(y, x)

    // reset longitude to the positive datum of the world
    if (lng < -Math.PI) {
      lng += 2 * Math.PI;
    }

    return {
      lat: lat,
      lng: lng
    };
  },

  latLngToPosition: function (lat, lng) {
    // center lat and lng
    const nlat = THREE.Math.degToRad(lat);
    // 0 is in the middle however the sphere starts on the left, thats why we need to offset
    const nlng = THREE.Math.degToRad(lng + 0);

    return new THREE.Vector3(
      Math.cos(nlat) * Math.cos(nlng),
      Math.sin(nlat),
      Math.cos(nlat) * Math.sin(nlng)
    );
  },

  remove: function () { },

  pause: function () {
    this.paused = true;
  },

  play: function () {
    this.paused = false;
  }
});

})));
