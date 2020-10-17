/**
 * A collection of useful constants used throughout the library.
 * These can be overridden at runtime.
 * @namespace
 */
syngen.const = {
  /**
   * Lowpass frequency of the acoustic shadow, in Hertz.
   * Typically this value is the speed of sound divided by the width of the head.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  acousticShadowFrequency: 343 / 0.1524, // speedOfSound / binauralHeadWidth
  /**
   * Latency added to calculated times, in seconds.
   * @todo Improve support for nonzero values
   * @type {Number}
  */
  audioLookaheadTime: 0,
  /**
   * Width of head, in meters.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralHeadWidth: 0.1524,
  /**
   * Offset that ears point away from +/- 90 degrees, in radians.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralShadowOffset: Math.PI / 4,
  /**
   * Upper bound where acoustic shadow gradually increases in strength, in meters.
   * @todo Move to syngen.audio.binaural.model
   * @type {Number}
  */
  binauralShadowRolloff: 1,
  /**
   * The rolloff applied to
   * Typically in physical space this value is derived from the distance-square law and is exactly two.
   * @todo Move to dedicated distance models
   * @type {Number}
  */
  distancePower: 2,
  /**
   * Whether to multiply calculated gains by the ratio between distance and the horizon defined by syngen.streamer.
   * This allows sounds to gradually fade out around the edges of the streamed area.
   * @todo Move to dedicated distance models
   * @type {Boolean}
  */
  distancePowerHorizon: false,
  /**
   * Speed of the gain dropoff applied when the horizon is enabled.
   * @todo Move to dedicated distance models
   * @type {Number}
  */
  distancePowerHorizonExponent: 0,
  /**
   * Rotation sequence when converting Euler angles to quaternions. Valid values include:
   * - XYZ
   * - XZY
   * - YXZ
   * - YZX
   * - ZXY
   * - ZYX
   * @type {String}
  */
  eulerToQuaternion: 'ZYX',
  /**
   * Acceleration due to gravity, in meters per second per second.
   * @type {Number}
  */
  gravity: 9.8,
  /**
   * Duration that the loop should ideally run when the window is blurred, in seconds.
   * @todo Move to syngen.loop
   * @type {Number}
  */
  idleDelta: 1/60,
  /**
   * Upper bound of perceptible frequencies, in Hertz.
   * @type {Number}
  */
  maxFrequency: 20000,
  /**
   * The largest float before precision loss becomes problematic.
   * This value is derived from `Number.MAX_SAFE_INTEGER / (2 ** 10)` to deliver about three decimal places of precision, which is suitable for most purposes.
   * @type {Number}
  */
  maxSafeFloat: (2 ** 43) - 1,
  /**
   * Frequency of the MIDI reference note, in Hertz.
   * @type {Number}
  */
  midiReferenceFrequency: 440,
  /**
   * Reference note number used when converting MIDI notes to frequencies.
   * @type {Number}
  */
  midiReferenceNote: 69,
  /**
   * Lower bound of perceptible frequencies, in Hertz.
   * @type {Number}
  */
  minFrequency: 20, // Hz
  /**
   * Radius of the observer, in meters.
   * @todo Move into syngen.position
   * @type {Number}
  */
  positionRadius: 0.25,
  /**
   * The speed of sound, in meters per second.
   * @type {Number}
  */
  speedOfSound: 343,
  /**
   * Upper bound for sub-bass frequencies, in Hertz.
   * @type {Number}
  */
  subFrequency: 65.4064,
  /**
   * The circle constant, i.e. 2π.
   * @type {Number}
  */
  tau: Math.PI * 2,
  /**
   * Length that satisfies `x=y` for a 2D unit circle.
   * @type {Number}
  */
  unit2: Math.sqrt(2) / 2,
  /**
   * Length that satisfies `x=y=z` for a 3D unit sphere.
   * @type {Number}
  */
  unit3: Math.sqrt(3) / 3,
  /**
   * Length that satisfies `w=x=y=z` for a 4D unit hypersphere.
   * @type {Number}
  */
  unit4: Math.sqrt(4) / 4,
  /**
   * Close enough to zero for most calculations that can't use zero, like ramping `AudioParam`s exponentially to zero.
   * @type {Number}
  */
  zero: 10 ** -32,
  /**
   * Value in decibels that, for most purposes, is perceptibly silent.
   * @type {Number}
  */
  zeroDb: -96,
  /**
   * Value in gain that, for most purposes, is perceptibly silent.
   * @type {Number}
  */
  zeroGain: syngen.utility.fromDb(-96), // syngen.utility.fromDb(zeroDb)
  /**
   * Length of time that, for most purposes, is perceptibly instantaneous.
   * @type {Number}
  */
  zeroTime: 0.005,
}
