## aframe-spherical-controls-component

[![Version](http://img.shields.io/npm/v/aframe-spherical-controls-component.svg?style=flat-square)](https://npmjs.org/package/aframe-spherical-controls-component)
[![License](http://img.shields.io/npm/l/aframe-spherical-controls-component.svg?style=flat-square)](https://npmjs.org/package/aframe-spherical-controls-component)

A Fly Spherical component for A-Frame.
This component orbits the camera automatically around a sphere. It is not a universial control, because it is mostly designed for mobile devices using the rotation. You can not set it directly on the camera, however it needs to be set as a rig around the camera (aka _camera rig pattern_).
It differs from the (Orbit controls component)[https://github.com/ngokevin/kframe/tree/master/components/orbit-controls] in that way that it does not substitute _look-controls_ component, but uses it for determing the movement direction.

For [A-Frame](https://aframe.io).

### API

The component sets the matrix of the entity directly. Use the _position_ and _rotation_ properties from the object to obtain positional and rotational data.

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| enabled | Whether the controls are enabled | true |
| radius | The radius of the spherical movement | 1 |
| minRadius | The minimum offset from the radius for of the spherical movement | 0.1 |
| maxRadius | The maximum offset from the radius of the spherical movement | 0.1 |
| speed | Movement speed | 1 |
| latLng | Sets the initial position according to latitude (-90, 90) and longitude (-180, 180) | [0,0] |
| upVector | Sets the up vector. Hardly ever needed to set manually | 0 1 0 |

### Methods

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| getLatLonAzimuth | Returns the current latitude, longitude position and looking direction azimuth in radians | `{lat: 0, lon: 0, azimuth: 0}`

### Usage
Do not set the  _position_ or _rotation_ directly on this component because the get overriden. Always create a surrounding entity for relative moving.

The current implementation does not work with together with the other movement controls like _wasd-controls_ on the _camera_ entity.

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.8.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-spherical-controls-component/dist/aframe-spherical-controls-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity spherical-controls="foo: bar"></a-entity>
  </a-scene>
</body>
```

#### npm

Install via npm:

```bash
npm install aframe-spherical-controls-component
```

Then require and use.

```js
require('aframe');
require('aframe-spherical-controls-component');
```
