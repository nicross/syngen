/**
 * Provides a variety of curves and curve generators that can be used with `WaveShaperNode`s.
 * @namespace
 */
syngen.audio.shape = (() => {
  const crush4 = createBitcrush(4),
    crush6 = createBitcrush(6),
    crush8 = createBitcrush(8),
    crush12 = createBitcrush(12),
    distort = createSigmoid(Math.PI * 8),
    dither = createNoise(syngen.const.zeroGain),
    double = createTuple(2),
    doublePulse = createTuplePulse(2),
    equalFadeIn = new Float32Array(2 ** 16),
    hot = createSigmoid(Math.PI * 4),
    invert = new Float32Array([1, 0, -1]),
    linear = new Float32Array([-1, 0, 1]),
    noise = createNoise(1),
    noise2 = createNoise(syngen.utility.fromDb(-3)),
    noise4 = createNoise(syngen.utility.fromDb(-6)),
    noise8 = createNoise(syngen.utility.fromDb(-9)),
    noise16 = createNoise(syngen.utility.fromDb(-12)),
    noise32 = createNoise(syngen.utility.fromDb(-15)),
    one = new Float32Array([1, 1]),
    pulse = new Float32Array([0, 0, 1]),
    rectify = new Float32Array([1, 0, 1]),
    square = new Float32Array(2 ** 7),
    triple = createTuple(3),
    triplePulse = createTuplePulse(3),
    warm = createSigmoid(Math.PI),
    zero = new Float32Array([0, 0])

  for (let i = 0; i < equalFadeIn.length; i += 1) {
    const t = (i / (equalFadeIn.length - 1) * 2) - 1
    equalFadeIn[i] = Math.sqrt(0.5 * (1 + t))
  }

  const equalFadeOut = equalFadeIn.slice().reverse()

  for (let i = 0; i < square.length; i += 1) {
    square[i] = i < square.length / 2 ? -1 : 1
  }

  /**
   * Generates a linear curve of arbitrary bit `depth` of `samples` length.
   * @param {Number} [depth=16]
   * @param {Number} [samples=2**16]
   * @memberof syngen.audio.shape
   * @returns {Float32Array}
   */
  function createBitcrush(depth = 16, samples = 2 ** 16) {
    const factor = 2 ** (depth - 1),
      shape = new Float32Array(samples)

    for (let i = 0; i < shape.length; i += 1) {
      const x = (i * 2 / (samples - 1)) - 1
      shape[i] = Math.round(x * factor) / factor
    }

    shape[samples - 1] = 1

    return shape
  }

  /**
   * Generates a linear curve with noise at `gain` of `samples` length.
   * @memberof syngen.audio.shape
   * @param {Number} [gain=1]
   * @param {Number} [samples=2**16]
   * @returns {Float32Array}
   */
  function createNoise(gain = 1, samples = 2 ** 16) {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createNoise', gain)

    const noise = () => srand(-gain, gain),
      y = (x) => syngen.utility.wrapAlternate(x + noise(), 0, 2) - 1

    for (let i = 0; i < shape.length; i += 1) {
      const x = i * 2 / (samples - 1)
      shape[i] = y(x)
    }

    shape[samples - 1] = y(2)

    return shape
  }

  /**
   * Generates a curve having random `steps` with `seed`.
   * @memberof syngen.audio.shape
   * @param {Number} [steps=3]
   * @param {String} [seed]
   * @returns {Float32Array}
   */
  function createRandom(steps = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createRandom', seed)

    for (let i = 0; i < steps; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  /**
   * Generates a sigmoid curve with `amount` in radians of `samples` length.
   * Smaller values tend to be warmer, whereas larger values tend to be more distorted.
   * @memberof syngen.audio.shape
   * @param {Number} [amount=0]
   * @param {Number} [samples=2**16]
   * @returns {Float32Array}
   */
  function createSigmoid(amount = 0, samples = 2 ** 16) {
    const shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2 / samples) - 1
      shape[i] = x * (Math.PI + amount) / (Math.PI + (amount * Math.abs(x)))
    }

    return shape
  }

  /**
   * Generates a curve that bounces a number of `times` before its zero crossing.
   * This effectively adds `times` harmonics to a signal at decreasing amplitudes similar to a sawtooth wave.
   * @memberof syngen.audio.shape
   * @param [times=1]
   * @returns {Float32Array}
   */
  function createTuple(times = 1) {
    const samples = (times * 4) - 1,
      shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      if (i % 2) {
        shape[i] = 0
        continue
      }

      if (i < samples / 2) {
        shape[i] = -(2 ** -(i / 2))
        continue
      }

      shape[i] = 2 ** -Math.floor((samples - i) / 2)
    }

    return shape
  }

  /**
   * Generates a rectified curve that bounces a number of `times`.
   * @memberof syngen.audio.shape
   * @param [times=1]
   * @returns {Float32Array}
   */
  function createTuplePulse(times = 1) {
    const samples = times * 2,
      shape = new Float32Array(samples)

    for (let i = 0; i < samples; i += 1) {
      shape[i] = i % 2 ? 0 : 2 ** -(i / 2)
    }

    return shape
  }

  return {
    /**
     * Generates a curve that applies constant `offset`.
     * @memberof syngen.audio.shape
     * @param {Number} [offset=0]
     * @returns {Float32Array}
     */
    constant: (offset = 0) => new Float32Array([offset, offset]),
    createBitcrush,
    createNoise,
    createRandom,
    createSigmoid,
    createTuple,
    createTuplePulse,
    /**
     * Applies a 12-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush12: () => crush12,
    /**
     * Applies a 4-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush4: () => crush4,
    /**
     * Applies a 6-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush6: () => crush6,
    /**
     * Applies an 8-bit resolution.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    crush8: () => crush8,
    /**
     * Applies a heavy overdrive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    distort: () => distort,
    /**
     * Applies dither, or -96 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    dither: () => dither,
    /**
     * A double tuple.
     * The result of `{@link syngen.audio.shape.createTuple|syngen.audio.shape.createTuple(2)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    double: () => double,
    /**
     * A double pulse tuple.
     * The result of `{@link syngen.audio.shape.createTuplePulse|syngen.audio.shape.createTuplePulse(2)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    doublePulse: () => doublePulse,
    /**
     * Returns an equal-power fade-in curve.
     * This is useful
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    equalFadeIn: () => equalFadeIn,
    /**
     * Returns an equal-power fade-out curve.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    equalFadeOut: () => equalFadeOut,
    /**
     * Applies a moderate overdrive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    hot: () => hot,
    /**
     * Inverts a signal.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    invert: () => invert,
    /**
     * Returns an inverted copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {}
     * @returns {Float32Array}
     */
    invertShape: (shape) => shape.map((value) => -value),
    /**
     * Identity curve resulting in no shaping.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    linear: () => linear,
    /**
     * Noise curve with 0 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise: () => noise,
    /**
     * Applies -3 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise2: () => noise2,
    /**
     * Applies -6 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise4: () => noise4,
    /**
     * Applies -9 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise8: () => noise8,
    /**
     * Applies -12 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise16: () => noise16,
    /**
     * Applies -15 decibels of noise.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    noise32: () => noise32,
    /**
     * Applies a constant `offset` to a copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @param {Number} [offset=0]
     * @returns {Float32Array}
     */
    offsetShape: (shape, offset = 0) => shape.map((value) => value + offset),
    /**
     * Always one.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    one: () => one,
    /**
     * Omits troughs so only positive values are audible.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    pulse: () => pulse,
    /**
     * Returns a copy of `shape` with troughs set to zero.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    pulseShape: (shape) => shape.map((value) => value > 0 ? value : 0),
    /**
     * Rectifies a signal so it's always positive.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    rectify: () => rectify,
    /**
     * Returns a rectified copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    rectifyShape: (shape) => shape.map(Math.abs),
    /**
     * Returns a reversed copy of `shape`.
     * @memberof syngen.audio.shape
     * @param {Float32Array} shape
     * @returns {Float32Array}
     */
    reverseShape: (shape) => shape.slice().reverse(),
    /**
     * Applies a hard threshold where values round to -1 or 1.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    square: () => square,
    /**
     * A triple tuple.
     * The result of `{@link syngen.audio.shape.createTuple|syngen.audio.shape.createTuple(3)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    triple: () => triple,
    /**
     * A triple pulse tuple.
     * The result of `{@link syngen.audio.shape.createTuplePulse|syngen.audio.shape.createTuplePulse(3)}`
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    triplePulse: () => triplePulse,
    /**
     * Applies a slight overdrive
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    warm: () => warm,
    /**
     * Always zero.
     * @memberof syngen.audio.shape
     * @returns {Float32Array}
     */
    zero: () => zero,
  }
})()
