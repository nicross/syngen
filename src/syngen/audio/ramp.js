/**
 * @namespace
 */
syngen.audio.ramp = {}

/**
 * @static
 */
syngen.audio.ramp.createMachine = function (audioParam, rampFn) {
  let timeout,
    state = false

  const container = (value, duration) => {
    rampFn(audioParam, value, duration)

    state = true
    timeout = syngen.utility.timing.cancelablePromise(duration * 1000)

    timeout.then(() => {
      state = false
      timeout = null
    }, () => syngen.audio.ramp.hold(audioParam))

    return timeout
  }

  container.cancel = function () {
    if (timeout) {
      timeout.cancel()
    }
    return this
  }

  container.state = () => state

  return container
}

/**
 * @static
 */
syngen.audio.ramp.curve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.audio.time(), syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.exponential = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.hold = function (audioParam) {
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
  return this
}

/**
 * @static
 */
syngen.audio.ramp.linear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * @static
 */
syngen.audio.ramp.set = function (audioParam, value) {
  syngen.audio.ramp.linear(audioParam, value, syngen.performance.delta())
  return this
}
