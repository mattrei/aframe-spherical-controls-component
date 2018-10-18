/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Spherical controls component for A-Frame.
 */
AFRAME.registerComponent('spherical-controls', {
  schema: {
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
    },
    vrMode: {
      type: 'boolean',
      default: false
    },
    tilt: {
      default: 0
    },
    enabled: {
      type: 'boolean',
      default: true
    },
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    this.enabled = !data.vrMode;

    if (data.vrMode) {
      el.sceneEl.addEventListener('enter-vr', () => {
	if (!AFRAME.utils.device.checkHeadsetConnected() &&
	    !AFRAME.utils.device.isMobile()) { return; }
	this.enabled = true;
      });

      el.sceneEl.addEventListener('exit-vr', () => {
	if (!AFRAME.utils.device.checkHeadsetConnected() &&
	    !AFRAME.utils.device.isMobile()) { return; }
	this.enabled = false;
      });
    }

    this.paused = false;
    this.camera = el.sceneEl.camera;

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
    const matrix = new THREE.Matrix4();
    const rotationMatrix = new THREE.Matrix4();

    return function (time, delta) {
      if (!this.data.enabled || this.paused || !this.enabled || this.speed <= 0) return;

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

      rotationMatrix.makeRotationX(THREE.Math.degToRad(this.data.tilt));
      matrix.multiply(rotationMatrix);

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


/***/ })
/******/ ]);