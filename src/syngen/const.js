/**
 * @namespace
 */
syngen.const = {
  /**
    @type {Number}
  */
  acousticShadowFrequency: 343 / 0.1524, // speedOfSound / binauralHeadWidth
  /**
    @type {Number}
  */
  audioLookaheadTime: 0, // TODO: Improve support for non-zero values
  /**
    @type {Number}
  */
  binauralHeadWidth: 0.1524, // m
  /**
    @type {Number}
  */
  binauralShadowOffset: Math.PI / 4, // radian offset of each ear from +/- 90 deg
  /**
    @type {Number}
  */
  binauralShadowRolloff: 1, // m
  /**
    @type {Number}
  */
  distancePower: 2, // 1 / (d ** distancePower)
  /**
    @type {Number}
  */
  distancePowerHorizon: false, // Whether to dropoff power calculations as a ratio of streamer radius
  /**
    @type {Number}
  */
  distancePowerHorizonExponent: 0, // Speed of the distance dropoff
  /**
    @type {String}
  */
  eulerToQuaternion: 'ZYX', // One of eight supported tuples, see syngen.utility.quaternion
  /**
    @type {Number}
  */
  gravity: 9.8, // m/s
  /**
    @type {Number}
  */
  idleDelta: 1/60, // s
  /**
    @type {Number}
  */
  maxFrequency: 20000, // Hz
  /**
    @type {Number}
  */
  maxSafeFloat: (2 ** 43) - 1, // Math.MAX_SAFE_INTEGER / (2 ** 10), or about 3 decimal places of precision
  /**
    @type {Number}
  */
  midiReferenceFrequency: 440, // Hz
  /**
    @type {Number}
  */
  midiReferenceNote: 69, // A4
  /**
    @type {Number}
  */
  minFrequency: 20, // Hz
  /**
    @type {Number}
  */
  positionRadius: 0.25, // m
  /**
    @type {Number}
  */
  propFadeDuration: 0.005, // s
  /**
    @type {String}
  */
  seedSeparator: '~', // separator for arrays used as syngen.utility.srand() seeds
  /**
    @type {Number}
  */
  speedOfSound: 343, // m/s
  /**
    @type {Number}
  */
  subFrequency: 60, // Hz
  /**
    @type {Number}
  */
  tau: Math.PI * 2, // circle constant
  /**
    @type {Number}
  */
  unit: 1, // 1D line segment
  /**
    @type {Number}
  */
  unit2: Math.sqrt(2) / 2, // 2D unit circle
  /**
    @type {Number}
  */
  unit3: Math.sqrt(3) / 3, // 3D unit sphere
  /**
    @type {Number}
  */
  unit4: Math.sqrt(4) / 4, // 4D unit hypersphere
  /**
    @type {Number}
  */
  zero: 10 ** -32, // Close enough to zero
  /**
    @type {Number}
  */
  zeroDb: -96, // dB, close enough to silence
  /**
    @type {Number}
  */
  zeroGain: syngen.utility.fromDb(-96), // syngen.utility.fromDb(zeroDb)
  /**
    @type {Number}
  */
  zeroTime: 0.005, // s, close enough to instantaneous
}
