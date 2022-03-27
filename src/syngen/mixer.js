/**
 * Provides a mastering process and utilities for routing audio into it like a virtual mixing board.
 * Implementations are encouraged to leverage this instead of the main audio destination directly.
 * @namespace
 */
syngen.mixer = (() => {
  const context = syngen.context()

  const mainCompensator = context.createGain(),
    mainCompressor = context.createDynamicsCompressor(),
    mainInput = context.createGain(),
    mainOutput = context.createGain()

  let mainHighpass,
    mainLowpass

  mainCompressor.connect(mainCompensator)
  mainCompensator.connect(mainOutput)
  mainOutput.connect(context.destination)

  mainCompensator.gain.value = 1
  mainCompressor.attack.value = syngen.const.zeroTime
  mainCompressor.knee.value = 0
  mainCompressor.ratio.value = 20
  mainCompressor.release.value = syngen.const.zeroTime
  mainCompressor.threshold.value = 0

  createFilters()

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    mainHighpass = context.createBiquadFilter()
    mainHighpass.type = 'highpass'
    mainHighpass.frequency.value = highpassFrequency

    mainLowpass = context.createBiquadFilter()
    mainLowpass.type = 'lowpass'
    mainLowpass.frequency.value = lowpassFrequency

    mainInput.connect(mainHighpass)
    mainHighpass.connect(mainLowpass)
    mainLowpass.connect(mainCompressor)
  }

  function destroyFilters() {
    mainInput.disconnect()
    mainLowpass.disconnect()
    mainLowpass = null
    mainHighpass.disconnect()
    mainHighpass = null
  }

  return {
    /**
     * Creates a `GainNode` that's connected to the main input.
     * Implementations can leverage buses to create submixes.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    createBus: () => {
      const input = context.createGain()
      input.connect(mainInput)
      return input
    },
    /**
     * Returns the main input `GainNode`.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    input: () => mainInput,
    /**
     * Returns the main output `GainNode`.
     * @memberof syngen.mixer
     * @returns {GainNode}
     */
    output: () => mainOutput,
    /**
     * Exposes the parameters associated with the mastering process.
     * Here's an overview of its routing:
     * - `GainNode` input
     * - `BiquadFilterNode` highpass
     * - `BiquadFilterNode` lowpass
     * - `DynamicsCompressorNode` limiter
     * - `GainNode` limiter makeup gain
     * - `GainNode` output
     * - `AudioDestinationNode` `{@link syngen.context}().destination`
     * @memberof syngen.mixer
     * @property {AudioParam} gain
     * @property {Object} highpass
     * @property {AudioParam} highpass.frequency
     * @property {Object} limiter
     * @property {AudioParam} limiter.attack
     * @property {AudioParam} limiter.gain
     * @property {AudioParam} limiter.knee
     * @property {AudioParam} limiter.ratio
     * @property {AudioParam} limiter.release
     * @property {AudioParam} limiter.threshold
     * @property {Object} lowpass
     * @property {AudioParam} lowpass.frequency
     * @property {AudioParam} preGain
     */
    param: {
      gain: mainOutput.gain,
      highpass: {
        frequency: mainHighpass.frequency,
      },
      limiter: {
        attack: mainCompressor.attack,
        gain: mainCompensator.gain,
        knee: mainCompressor.knee,
        ratio: mainCompressor.ratio,
        release: mainCompressor.release,
        threshold: mainCompressor.threshold,
      },
      lowpass: {
        frequency: mainLowpass.frequency,
      },
      preGain: mainInput.gain,
    },
    /**
     * Occasionally the main filters can enter an unstable or bad state.
     * When this happens the entire mix can drop out to silence.
     * This provides a solution for replacing them with stable filters.
     * Implementations can proactively check for invalid states with an {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode|AnalyserNode} or {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode|AudioWorkletNode}.
     * Beware that the nodes that caused the issue may also need reset.
     * @memberof syngen.mixer
     */
    rebuildFilters: function () {
      const highpassFrequency = mainHighpass.frequency.value,
        lowpassFrequency = mainLowpass.frequency.value

      this.auxiliary.reverb.rebuildFilters()

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.param.highpass.frequency = mainHighpass.frequency
      this.param.lowpass.frequency = mainLowpass.frequency

      return this
    },
  }
})()
