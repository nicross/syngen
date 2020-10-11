syngen.audio.circuit = {}

// Multiplies input by -scale
syngen.audio.circuit.invert = ({
  from,
  scale = 1,
  to,
} = {}) => {
  const context = syngen.audio.context(),
    inverter = context.createGain()

  inverter.gain.value = -Math.abs(scale)

  if (from) {
    from.connect(inverter)
  }

  if (to) {
    inverter.connect(to)
  }

  return inverter
}

// Scales input [0,1] to [min,max], e.g. for controlling AudioParams via ConstantSourceNodes
syngen.audio.circuit.lerp = ({
  chainStop, // syngen.audio.synth
  from, // ConstantSourceNode
  max: maxValue = 1,
  min: minValue = 0,
  to, // AudioParam
  when,
} = {}) => {
  const context = syngen.audio.context()

  const lerp = context.createGain(),
    max = context.createConstantSource(),
    min = context.createConstantSource()

  lerp.gain.value = 0
  max.offset.value = maxValue - minValue
  min.offset.value = minValue
  to.value = 0

  from.connect(lerp.gain)
  max.connect(lerp)
  lerp.connect(to)
  min.connect(to)

  max.start(when)
  min.start(when)

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      max.stop(when)
      min.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}

// Scales input [fromMin,fromMax] to [toMin,toMax], e.g. for controlling AudioParams via ConstantSourceNodes
syngen.audio.circuit.scale = ({
  chainStop, // syngen.audio.synth
  from, // ConstantSourceNode
  fromMax = 1,
  fromMin = 0,
  to, // AudioParam
  toMax = 1,
  toMin = 0,
  when,
} = {}) => {
  const context = syngen.audio.context()

  const offset = context.createConstantSource(),
    scale = context.createGain()

  offset.offset.value = -fromMin // Translate to [0,fromMax-fromMin]
  scale.gain.value = 1 / (fromMax - fromMin) // Scale down to [0,1]

  offset.connect(scale)
  from.connect(scale)

  offset.start(when)

  // Leverage lerp to handle upscale
  const lerp = syngen.audio.circuit.lerp({
    from: scale,
    max: toMax,
    min: toMin,
    to,
    when,
  })

  const wrapper = {
    stop: (when = syngen.audio.time()) => {
      lerp.stop(when)
      offset.stop(when)
      return this
    },
  }

  if (chainStop) {
    syngen.audio.synth.chainStop(chainStop, wrapper)
  }

  return wrapper
}
