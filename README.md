# syngen
A spatial audio, synthesis, and game development toolkit.

## Disclaimer
This is experimental and under active development.
Specifically, the API has changed significantly from previous versions.
Many of these changes are yet to be documented.
Please use at your own risk.

## Overview
**syngen** provides a light wrapper around the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for building sounds and positioning them on a three-dimensional binaural soundstage.
Its event loop fires each frame to update sounds and core systems.
Additional utilities provide tools for engineering custom systems that hook into its API to deliver rich experiences.

### Getting started
Please download or clone this repository, or install with your favorite package manager:
```sh
npm install syngen
```

From there you might `require('syngen')` or include `dist/syngen.min.js`.

### Example usage
This library _must_ be used within a browser environment so it can access the `window` object.
It can be imported or required as a UMD module, or accessed from the `syngen` global.

This example demonstrates how to define a prop and instantiate one on the soundstage:

```js
const prototype = syngen.sound.invent({
  onConstruct: function () {
    this.synth = syngen.synth.simple({
      frequency: syngen.fn.fromMidi(60),
      gain: syngen.fn.fromDb(-6),
    }).connect(this.output)
  },
  onDestroy: function () {
    this.synth.stop()
  },
})

const instance = sound.instantiate()
```

Please browse the `example` directory or the projects below for more elaborate real-world examples.

### Example projects
- [Fishyphus](https://shiftbacktick.itch.io/fishyphus) - Sisyphean fishing horror
- [Lacus Opportunitas](https://shiftbacktick.itch.io/lacus-opportunitas) - Lunar lake trading simulator
- [Project Ephemera](https://shiftbacktick.itch.io/project-ephemera) - Forgotten demo disc of synths

#### Commercial projects
- [Periphery Synthetic EP](https://periphery-synthetic-ep.shiftbacktick.io) – Extrasolar musical explorer

## Development
To get started, please clone this repository:
```sh
git clone https://github.com/nicross/syngen.git
```

Then use [npm](https://nodejs.org) to install the required dependencies
```sh
npm install
```

### Common tasks
Common tasks have been automated with [Gulp](https://gulpjs.com):

#### Build distributables only
```sh
gulp dist
```

#### Build documentation only
```sh
gulp docs
```

#### Build everything once
```sh
gulp build
```

#### Build everything continuously
```sh
gulp watch
```
