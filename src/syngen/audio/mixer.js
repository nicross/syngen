/**
 * Provides a mastering process and utilities for routing audio into it like a virtual mixing board.
 * Implementations are encouraged to leverage this instead of the main audio destination directly.
 * @namespace
 */
syngen.audio.mixer = (() => {
  const context = syngen.audio.context()

  const masterCompensator = context.createGain(),
    masterCompressor = context.createDynamicsCompressor(),
    masterInput = context.createGain(),
    masterOutput = context.createGain()

  let masterHighpass,
    masterLowpass

  masterCompressor.connect(masterCompensator)
  masterCompensator.connect(masterOutput)
  masterOutput.connect(context.destination)

  masterCompensator.gain.value = 1
  masterCompressor.attack.value = syngen.const.zeroTime
  masterCompressor.knee.value = 0
  masterCompressor.ratio.value = 20
  masterCompressor.release.value = syngen.const.zeroTime
  masterCompressor.threshold.value = 0

  createFilters()

  function createFilters(highpassFrequency = syngen.const.minFrequency, lowpassFrequency = syngen.const.maxFrequency) {
    masterHighpass = context.createBiquadFilter()
    masterHighpass.type = 'highpass'
    masterHighpass.frequency.value = highpassFrequency

    masterLowpass = context.createBiquadFilter()
    masterLowpass.type = 'lowpass'
    masterLowpass.frequency.value = lowpassFrequency

    masterInput.connect(masterHighpass)
    masterHighpass.connect(masterLowpass)
    masterLowpass.connect(masterCompressor)
  }

  function destroyFilters() {
    masterInput.disconnect()
    masterLowpass.disconnect()
    masterLowpass = null
    masterHighpass.disconnect()
    masterHighpass = null
  }

  return {
    /**
     * A collection of auxiliary sends that provide optional parallel effects processing.
     * @memberof syngen.audio.mixer
     * @namespace
     */
    auxiliary: {},
    /**
     * Creates a `GainNode` that's connected to the master input.
     * Implementations can leverage buses to create submixes.
     * @memberof syngen.audio.mixer
     * @returns {GainNode}
     */
    createBus: () => {
      const input = context.createGain()
      input.connect(masterInput)
      return input
    },
    /**
     * Exposes the nodes and parameters associated with the mastering process.
     * Here's an overview of its routing:
     * - `GainNode` input
     * - `BiquadFilterNode` highpass
     * - `BiquadFilterNode` lowpass
     * - `DynamicsCompressorNode` limiter
     * - `GainNode` limiter makeup gain
     * - `GainNode` output
     * - `AudioDestinationNode` `{@link syngen.audio.context}().destination`
     * @memberof syngen.audio.mixer
     * @property {Function} input
     *   Returns the master input `GainNode`.
     * @property {Function} output
     *   Returns the master output `GainNode`.
     * @property {Object} param
     *   Useful parameters for tuning the mastering process.
     * @property {AudioParam} param.gain
     * @property {Object} param.highpass
     * @property {AudioParam} param.highpass.frequency
     * @property {Object} param.limiter
     * @property {AudioParam} param.limiter.attack
     * @property {AudioParam} param.limiter.gain
     * @property {AudioParam} param.limiter.knee
     * @property {AudioParam} param.limiter.ratio
     * @property {AudioParam} param.limiter.release
     * @property {AudioParam} param.limiter.threshold
     * @property {Object} param.lowpass
     * @property {AudioParam} param.lowpass.frequency
     */
    master: {
      input: () => masterInput,
      output: () => masterOutput,
      param: {
        gain: masterOutput.gain,
        highpass: {
          frequency: masterHighpass.frequency,
        },
        limiter: {
          attack: masterCompressor.attack,
          gain: masterCompensator.gain,
          knee: masterCompressor.knee,
          ratio: masterCompressor.ratio,
          release: masterCompressor.release,
          threshold: masterCompressor.threshold,
        },
        lowpass: {
          frequency: masterLowpass.frequency,
        },
      },
    },
    /**
     * Occasionally the master filters can enter an unstable or bad state.
     * When this happens the entire mix can drop out to silence.
     * This provides a solution for replacing them with stable filters.
     * Implementations can proactively check for invalid states with an {@link https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode|AnalyserNode} or {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode|AudioWorkletNode}.
     * Beware that the nodes that caused the issue may also need reset.
     * @memberof syngen.audio.mixer
     * @todo Reset reverb filters once implemented
     */
    rebuildFilters: function () {
      const highpassFrequency = masterHighpass.frequency.value,
        lowpassFrequency = masterLowpass.frequency.value

      destroyFilters()
      createFilters(highpassFrequency, lowpassFrequency)

      this.master.param.highpass.frequency = masterHighpass.frequency
      this.master.param.lowpass.frequency = masterLowpass.frequency

      return this
    },
    /**
     * A collection of circuits that route signals to auxiliary sends.
     * @namespace syngen.audio.mixer.send
     */
    send: {},
  }
})()
