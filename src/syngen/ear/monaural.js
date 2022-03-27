/**
 * Provides an interface for processing audio as an observer in a physical space.
 * Importantly, it models interaural intensity differences, interaural arrival time, and acoustic shadow.
 * @interface
 * @todo Document private members
 */
syngen.ear.monaural = {}

/**
 * Instantiates a monaural processor.
 * @param {Object} [options={}]
 * @param {Number} [options.pan=0]
 *   Between `[-1, 1]` representing hard-left to hard-right.
 * @returns {syngen.ear.monaural}
 * @static
 */
syngen.ear.monaural.create = function (options) {
  return Object.create(this.prototype).construct(options)
}

syngen.ear.monaural.prototype = {
  defaults: {
    confusionRadius: 1,
  },
  /**
   * Initializes the instance.
   * @instance
   * @private
   */
  construct: function ({
    confusionRadius = this.defaults.confusionRadius,
    filterModel = syngen.ear.filterModel.head,
    gainModel = syngen.ear.gainModel.realistic,
  } = {}) {
    const context = syngen.context()

    this.options = {
      confusionRadius,
    }

    this.filterModel = filterModel
    this.gainModel = gainModel

    this.delay = context.createDelay()
    this.filter = context.createBiquadFilter()
    this.gain = context.createGain()

    this.filter.frequency.value = syngen.const.maxFrequency
    this.gain.gain.value = syngen.const.zeroGain

    this.delay.connect(this.filter)
    this.filter.connect(this.gain)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    return this
  },
  /**
   * Connects `input` to this with additional `...args`.
   * @instance
   * @param {AudioNode} input
   * @param {...*} [...args]
   */
  from: function (input, ...args) {
    input.connect(this.delay, ...args)
    return this
  },
  /**
   * Connects this to `output` with additional `...args`.
   * @instance
   * @param {AudioNode} output
   * @param {...*} [...args]
   */
  to: function (output, ...args) {
    this.gain.connect(output, ...args)
    return this
  },
  /**
   * Updates the internal circuit with `options` relative to an observer facing 0° at the origin.
   * @instance
   * @todo Document parameters
   */
  update: function ({
    normal = syngen.tool.vector3d.create(),
    relative = syngen.tool.vector3d.create(),
  } = {}) {
    const distance = relative.distance()

    if (distance > 1) {
      relative = relative.scale(1 / distance)
    }

    // Calculate dot product, with a unit sphere of confusion
    // Dot product of two normalized vectors is [-1, 1]
    const dotProduct = syngen.fn.lerp(1, relative.dotProduct(normal), syngen.fn.clamp(distance / this.options.confusionRadius))

    const delayTime = syngen.fn.clamp(distance / syngen.const.speedOfSound, syngen.const.zeroTime, 1),
      filterFrequency = this.filterModel.calculate(dotProduct),
      inputGain = this.gainModel.calculate(distance)

    syngen.fn.setParam(this.delay.delayTime, delayTime)
    syngen.fn.setParam(this.filter.frequency, filterFrequency)
    syngen.fn.setParam(this.gain.gain, inputGain)

    return this
  },
}
