/**
 * @namespace
 */
syngen.audio.shape = (() => {
  const crush6 = createBitcrush(6),
    crush8 = createBitcrush(8),
    crush12 = createBitcrush(12),
    distort = createSigmoid(Math.PI * 8),
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
    noiseZero = createNoise(syngen.const.zeroGain),
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
   * @memberof syngen.audio.shape
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
   * @memberof syngen.audio.shape
   */
  function createNoise(variance = 2, samples = 2 ** 16) {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createNoise')

    const noise = () => srand(-variance, variance),
      y = (x) => syngen.utility.wrapAlternate(x + noise(), 0, 2) - 1

    for (let i = 0; i < shape.length; i += 1) {
      const x = i * 2 / (samples - 1)
      shape[i] = y(x)
    }

    shape[samples - 1] = y(2)

    return shape
  }

  /**
   * @memberof syngen.audio.shape
   */
  function createRandom(samples = 2, seed = '') {
    const shape = new Float32Array(samples),
      srand = syngen.utility.srand('syngen.audio.shape.createRandom', seed)

    for (let i = 0; i < samples; i += 1) {
      shape[i] = srand(-1, 1)
    }

    return shape
  }

  // NOTE: amount should be in radians
  /**
   * @memberof syngen.audio.shape
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
   * @memberof syngen.audio.shape
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
   * @memberof syngen.audio.shape
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
    createBitcrush,
    createNoise,
    createRandom,
    createSigmoid,
    createTuple,
    createTuplePulse,
    crush12: () => crush12,
    /**
     * @memberof syngen.audio.shape
     */
    crush6: () => crush6,
    /**
     * @memberof syngen.audio.shape
     */
    crush8: () => crush8,
    /**
     * @memberof syngen.audio.shape
     */
    distort: () => distort,
    /**
     * @memberof syngen.audio.shape
     */
    double: () => double,
    /**
     * @memberof syngen.audio.shape
     */
    doublePulse: () => doublePulse,
    /**
     * @memberof syngen.audio.shape
     */
    equalFadeIn: () => equalFadeIn,
    /**
     * @memberof syngen.audio.shape
     */
    equalFadeOut: () => equalFadeOut,
    /**
     * @memberof syngen.audio.shape
     */
    hot: () => hot,
    /**
     * @memberof syngen.audio.shape
     */
    invert: () => invert,
    /**
     * @memberof syngen.audio.shape
     */
    invertShape: (shape) => new Float32Array([...shape].reverse()),
    /**
     * @memberof syngen.audio.shape
     */
    linear: () => linear,
    /**
     * @memberof syngen.audio.shape
     */
    noise: () => noise,
    /**
     * @memberof syngen.audio.shape
     */
    noise2: () => noise2,
    /**
     * @memberof syngen.audio.shape
     */
    noise4: () => noise4,
    /**
     * @memberof syngen.audio.shape
     */
    noise8: () => noise8,
    /**
     * @memberof syngen.audio.shape
     */
    noise16: () => noise16,
    /**
     * @memberof syngen.audio.shape
     */
    noise32: () => noise32,
    /**
     * @memberof syngen.audio.shape
     */
    noiseZero: () => noiseZero,
    /**
     * @memberof syngen.audio.shape
     */
    offset: (offset = syngen.const.zeroGain) => new Float32Array([offset, offset]),
    /**
     * @memberof syngen.audio.shape
     */
    offsetShape: (shape, offset = syngen.const.zeroGain) => shape.map((value) => value + offset),
    /**
     * @memberof syngen.audio.shape
     */
    one: () => one,
    /**
     * @memberof syngen.audio.shape
     */
    pulse: () => pulse,
    /**
     * @memberof syngen.audio.shape
     */
    rectify: () => rectify,
    /**
     * @memberof syngen.audio.shape
     */
    rectifyShape: (shape) => shape.map(Math.abs),
    /**
     * @memberof syngen.audio.shape
     */
    reverseShape: (shape) => shape.slice().reverse(),
    /**
     * @memberof syngen.audio.shape
     */
    square: () => square,
    /**
     * @memberof syngen.audio.shape
     */
    triple: () => triple,
    /**
     * @memberof syngen.audio.shape
     */
    triplePulse: () => triplePulse,
    /**
     * @memberof syngen.audio.shape
     */
    warm: () => warm,
    /**
     * @memberof syngen.audio.shape
     */
    zero: () => zero,
  }
})()
