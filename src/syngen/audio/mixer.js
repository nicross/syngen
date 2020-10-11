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

  function createFilters() {
    masterHighpass = context.createBiquadFilter()
    masterHighpass.type = 'highpass'
    masterHighpass.frequency.value = syngen.const.minFrequency

    masterLowpass = context.createBiquadFilter()
    masterLowpass.type = 'lowpass'
    masterLowpass.frequency.value = syngen.const.maxFrequency

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
    auxiliary: {},
    bus: {},
    createAuxiliary: () => {
      const input = context.createGain(),
        output = context.createGain()

      output.connect(masterInput)

      return {
        input,
        output,
      }
    },
    createBus: () => {
      const input = context.createGain()
      input.connect(masterInput)
      return input
    },
    master: {
      input: masterInput,
      output: masterOutput,
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
    rebuildFilters: function () {
      destroyFilters()
      createFilters()

      this.master.param.highpass.frequency = masterHighpass.frequency
      this.master.param.lowpass.frequency = masterLowpass.frequency

      return this
    },
  }
})()
