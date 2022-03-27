/**
 * Creates a synthesizer which applies amplitude modulation to an `AudioBufferSourceNode`.
 * @param {Object} [options={}]
 * @param {AudioBuffer} options.buffer
 * @param {Number} [options.carrierGain=1]
 * @param {Number} [options.detune=0]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Boolean} [options.loop=true]
 * @param {Number} [options.loopEnd]
 * @param {Number} [options.loopStart]
 * @param {Number} [options.modDepth={@link syngen.const.zeroGain}]
 * @param {Number} [options.modDetune=0]
 * @param {Number} [options.modFrequency=440]
 * @param {String} [options.modType=sine]
 * @param {String} [options.modWhen]
 * @param {String} [options.playbackRate=1]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 * @todo Leverage {@link syngen.synth.createLfo} internally
 */
syngen.synth.amBuffer = ({
  buffer,
  carrierGain: carrierGainAmount = 1,
  detune = 0,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  modDepth: modDepthAmount = syngen.const.zeroGain,
  modDetune = 0,
  modFrequency,
  modType = 'sine',
  modWhen,
  playbackRate = 1,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const carrierGain = context.createGain(),
    modDepth = context.createGain(),
    modOscillator = context.createOscillator(),
    output = context.createGain(),
    source = context.createBufferSource()

  carrierGain.connect(output)

  source.buffer = buffer
  source.loop = loop
  source.connect(carrierGain)
  source.start(when, syngen.fn.randomFloat(0, buffer.length))

  if (loop && loopEnd !== undefined) {
    source.loopEnd = loopEnd
  }

  if (loop && loopStart !== undefined) {
    source.loopStart = loopStart
  }

  modDepth.connect(carrierGain.gain)
  modOscillator.connect(modDepth)
  modOscillator.type = modType
  modOscillator.start(modWhen || when)

  syngen.synth.fn.setAudioParams(
    [carrierGain.gain, carrierGainAmount],
    [source.detune, detune],
    [source.playbackRate, playbackRate],
    [modDepth.gain, modDepthAmount],
    [modOscillator.detune, modDetune],
    [modOscillator.frequency, modFrequency],
    [output.gain, gain],
  )

  return syngen.synth.fn.decorate({
    _chain: carrierGain,
    output,
    param: {
      carrierGain: carrierGain.gain,
      detune: source.detune,
      gain: output.gain,
      mod: {
        depth: modDepth.gain,
        detune: modOscillator.detune,
        frequency: modOscillator.frequency,
      },
      playbackRate: source.playbackRate,
    },
    stop: function (when = syngen.time()) {
      source.onended = () => {
        output.disconnect()
      }

      source.stop(when)
      modOscillator.stop(when)

      return this
    },
  })
}
