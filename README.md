# syngen
A spatial sound and synthesis library for audio game development and experience design.

## Disclaimer
This is experimental and under active development.
Use at your own risk.

## Overview
**syngen** provides a light wrapper around the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for building synths and positioning them as props on a three-dimensional binaural soundstage.
Its event loop fires each frame to update props and core systems.
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
const prototype = syngen.prop.base.invent({
  onConstruct: function () {
    this.synth = syngen.audio.synth.createSimple({
      frequency: syngen.utility.midiToFrequency(60),
      gain: syngen.utility.fromDb(-6),
    }).connect(this.output)
  },
  onDestroy: function () {
    this.synth.stop()
  },
})

const instance = syngen.props.create(prototype)
```

Please browse the `example` directory or the projects below for more elaborate real-world examples.

### Example projects
- [Audo](https://github.com/nicross/audo) – Endless audio racing game
- [Auraboros](https://github.com/nicross/auraboros) – Endless audio bullet hell
- [E.X.O.](https://github.com/nicross/exo) – Exoskeletal exoplanet explorer
- [Kaleidophone](https://github.com/nicross/kaleidophone) – Relaxing generative audio toy
- [S.E.A.](https://github.com/nicross/sea) – Chill watercraft simulator
- [Wurmus](https://github.com/nicross/wurmus) – Endless snake-like game of tag

#### Commercial projects
- [soundStrider](https://soundstrider.shiftbacktick.io) – Psychedelic audio exploration game

#### See also
- [API Documentation](https://syngen.shiftbacktick.io)
- [syngen-template](https://github.com/nicross/syngen-template) - Template for audio game development

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
