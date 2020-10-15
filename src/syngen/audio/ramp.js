/**
 * Provides utility methods for ramping `AudioParam`s.
 * @namespace
 */
syngen.audio.ramp = {}

/**
 * Ramps `audioParam` to the values in `curve` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number[]} curve
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.curve = function (audioParam, curve, duration = syngen.const.zeroTime) {
  audioParam.cancelScheduledValues(0)
  audioParam.setValueCurveAtTime(curve, syngen.audio.time(), syngen.audio.time(duration))
  return this
}

/**
 * Exponentially ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.exponential = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.exponentialRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * Holds `audioParam` at its current time and cancels future values.
 * This is a polyfill for {@link https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime|AudioParam.cancelAndHoldAtTime()}.
 * @param {AudioParam} audioParam
 * @static
 */
syngen.audio.ramp.hold = function (audioParam) {
  audioParam.value = audioParam.value
  audioParam.cancelScheduledValues(0)
  return this
}

/**
 * Linearly ramps `audioParam` to `value` over `duration` seconds.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @param {Number} [duration={@link syngen.const.zeroTime}]
 * @static
 */
syngen.audio.ramp.linear = function (audioParam, value, duration = syngen.const.zeroTime) {
  syngen.audio.ramp.hold(audioParam)
  audioParam.linearRampToValueAtTime(value, syngen.audio.time(duration))
  return this
}

/**
 * Sets `audioParam` to `value` without pops or clicks.
 * The duration depends on the average frame rate.
 * @param {AudioParam} audioParam
 * @param {Number} value
 * @see syngen.performance.delta
 * @static
 */
syngen.audio.ramp.set = function (audioParam, value) {
  syngen.audio.ramp.linear(audioParam, value, syngen.performance.delta())
  return this
}
