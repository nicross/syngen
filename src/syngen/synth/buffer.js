/**
 * Creates a synthesizer which uses an `AudioBufferSourceNode`.
 * @param {Object} [options={}]
 * @param {AudioBuffer} options.buffer
 * @param {Number} [options.detune=0]
 * @param {Number} [options.gain={@link syngen.const.zeroGain}]
 * @param {Boolean} [options.loop=true]
 * @param {Number} [options.loopEnd]
 * @param {Number} [options.loopStart]
 * @param {String} [options.playbackRate=1]
 * @param {Number} [options.when={@link syngen.time|syngen.time()}]
 * @returns {syngen.synth~Synth}
 * @static
 */
syngen.synth.buffer = ({
  buffer,
  detune = 0,
  gain = syngen.const.zeroGain,
  loop = true,
  loopEnd,
  loopStart,
  playbackRate = 1,
  when = syngen.time(),
} = {}) => {
  const context = syngen.context()

  const output = context.createGain(),
    source = context.createBufferSource()

  source.buffer = buffer
  source.loop = loop
  source.connect(output)
  source.start(when, syngen.fn.randomFloat(0, buffer.length))

  if (loop && loopEnd !== undefined) {
    source.loopEnd = loopEnd
  }

  if (loop && loopStart !== undefined) {
    source.loopStart = loopStart
  }

  syngen.synth.fn.setAudioParams(
    [source.detune, detune, when],
    [source.playbackRate, playbackRate, when],
    [output.gain, gain, when],
  )

  return syngen.synth.fn.decorate({
    _chain: source,
    output,
    param: {
      detune: source.detune,
      gain: output.gain,
      playbackRate: source.playbackRate,
    },
    source,
    stop: function (when = syngen.time()) {
      source.onended = () => {
        output.disconnect()
      }

      source.stop(when)

      return this
    },
  })
}
