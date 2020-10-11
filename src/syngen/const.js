syngen.const = {
  acousticShadowFrequency: 343 / 0.1524, // speedOfSound / binauralHeadWidth
  audioLookaheadTime: 0, // TODO: Improve support for non-zero values
  binauralHeadWidth: 0.1524, // m
  binauralShadowOffset: Math.PI / 4, // radian offset of each ear from +/- 90 deg
  binauralShadowRolloff: 1, // m
  distancePower: 2, // 1 / (d ** distancePower)
  distancePowerHorizon: false, // Whether to dropoff power calculations as a ratio of streamer radius
  distancePowerHorizonExponent: 0, // Speed of the distance dropoff
  eulerToQuaternion: 'ZYX', // One of eight supported tuples, see syngen.utility.quaternion
  gravity: 9.8, // m/s
  idleDelta: 1/60, // s
  maxFrequency: 20000, // Hz
  maxSafeFloat: (2 ** 43) - 1, // Math.MAX_SAFE_INTEGER / (2 ** 10), or about 3 decimal places of precision
  midiReferenceFrequency: 440, // Hz
  midiReferenceNote: 69, // A4
  minFrequency: 20, // Hz
  positionRadius: 0.25, // m
  propFadeDuration: 0.005, // s
  seedSeparator: '~', // separator for arrays used as syngen.utility.srand() seeds
  speedOfSound: 343, // m/s
  subFrequency: 60, // Hz
  tau: Math.PI * 2, // circle constant
  unit: 1, // 1D line segment
  unit2: Math.sqrt(2) / 2, // 2D unit circle
  unit3: Math.sqrt(3) / 3, // 3D unit sphere
  unit4: Math.sqrt(4) / 4, // 4D unit hypersphere
  zero: 10 ** -32, // Close enough to zero
  zeroDb: -96, // dB, close enough to silence
  zeroGain: syngen.utility.fromDb(-96), // syngen.utility.fromDb(zeroDb)
  zeroTime: 0.005, // s, close enough to instantaneous
}
