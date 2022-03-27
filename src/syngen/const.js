/**
 * A collection of useful constants used throughout the library.
 * These can be overridden at runtime.
 * @namespace
 */
syngen.const = {}

/**
 * Default rotation sequence when converting Euler angles to quaternions. Valid values include:
 * - XYZ
 * - XZY
 * - YXZ
 * - YZX
 * - ZXY
 * - ZYX
 * @type {String}
*/
syngen.const.eulerToQuaternion = 'ZYX'

/**
 * The gravitational constant.
 * @type {Number}
 */
syngen.const.gravity = 6.6743E-11

/**
 * Upper bound of perceptible frequencies, in Hertz.
 * @type {Number}
*/
syngen.const.maxFrequency = 20000

/**
 * The largest float before precision loss becomes problematic.
 * This value is derived from `Number.MAX_SAFE_INTEGER / (2 ** 10)` to deliver about three decimal places of precision, which is suitable for most purposes.
 * @type {Number}
*/
syngen.const.maxSafeFloat = (2 ** 43) - 1

/**
 * Frequency of the MIDI reference note, in Hertz.
 * @type {Number}
*/
syngen.const.midiReferenceFrequency = 440

/**
 * Reference note number used when converting MIDI notes to frequencies.
 * @type {Number}
*/
syngen.const.midiReferenceNote = 69

/**
 * Lower bound of perceptible frequencies, in Hertz.
 * @type {Number}
*/
syngen.const.minFrequency = 20

/**
 * The speed of sound, in meters per second.
 * @type {Number}
*/
syngen.const.speedOfSound = 343

/**
 * The circle constant, i.e. 2π.
 * @type {Number}
*/
syngen.const.tau = Math.PI * 2

/**
 * Length that satisfies `x=y` for a 2D unit circle.
 * @type {Number}
*/
syngen.const.unit2 = Math.sqrt(2) / 2

/**
 * Length that satisfies `x=y=z` for a 3D unit sphere.
 * @type {Number}
*/
syngen.const.unit3 = Math.sqrt(3) / 3

/**
 * Length that satisfies `w=x=y=z` for a 4D unit hypersphere.
 * @type {Number}
*/
syngen.const.unit4 = Math.sqrt(4) / 4

/**
 * Close enough to zero for most calculations that can't use zero, like ramping `AudioParam`s exponentially to zero.
 * @type {Number}
*/
syngen.const.zero = 10 ** -32

/**
 * Value in decibels that, for most purposes, is perceptibly silent.
 * @type {Number}
*/
syngen.const.zeroDb = -96

/**
 * Value in gain that, for most purposes, is perceptibly silent.
 * @type {Number}
*/
syngen.const.zeroGain = 10 ** (-96 / 10) // syngen.fn.fromDb(syngen.const.zeroDb)

/**
 * Length of time that, for most purposes, is perceptibly instantaneous.
 * @type {Number}
*/
syngen.const.zeroTime = 0.005
