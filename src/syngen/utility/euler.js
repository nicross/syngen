syngen.utility.euler = {}

syngen.utility.euler.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.euler.fromQuaternion = function ({
  w = 0,
  x = 0,
  y = 0,
  z = 0,
} = {}, sequence = syngen.const.eulerToQuaternion) {
  // SEE: http://bediyap.com/programming/convert-quaternion-to-euler-rotations/
  const w2 = w ** 2,
    wx = w * x,
    wy = w * y,
    wz = w * z,
    x2 = x ** 2,
    xy = x * y,
    xz = x * z,
    y2 = y ** 2,
    yz = y * z,
    z2 = z ** 2

  switch (sequence) {
    case 'XYZ':
      return this.create({
        pitch: Math.asin(2 * (xz + wy)),
        roll: Math.atan2(-2 * (yz - wx), w2 - x2 - y2 + z2),
        yaw: Math.atan2(-2 * (xy - wz), w2 + x2 - y2 - z2),
      })
    case 'XZY':
      return this.create({
        pitch: Math.atan2(2 * (xz + wy), w2 + x2 - y2 - z2),
        roll: Math.atan2(2 * (yz + wx), w2 - x2 + y2 - z2),
        yaw: Math.asin(-2 * (xy - wz)),
      })
    case 'YXZ':
      return this.create({
        pitch: Math.atan2(2 * (xz + wy), w2 - x2 - y2 + z2),
        roll: Math.asin(-2 * (yz - wx)),
        yaw: Math.atan2(2 * (xy + wz), w2 - x2 + y2 - z2),
      })
    case 'YZX':
      return this.create({
        pitch: Math.atan2(-2 * (xz - wy), w2 + x2 - y2 - z2),
        roll: Math.atan2(-2 * (yz - wx), w2 - x2 + y2 - z2),
        yaw: Math.asin(2 * (xy + wz)),
      })
    case 'ZXY':
      return this.create({
        pitch: Math.atan2(-2 * (xz - wy), w2 - x2 - y2 + z2),
        roll: Math.asin(2 * (yz + wx)),
        yaw: Math.atan2(-2 * (xy - wz), w2 - x2 + y2 - z2),
      })
    case 'ZYX':
      return this.create({
        pitch: Math.asin(-2 * (xz - wy)),
        roll: Math.atan2(2 * (yz + wx), w2 - x2 - y2 + z2),
        yaw: Math.atan2(2 * (xy + wz), w2 + x2 - y2 - z2),
      })
  }
}

syngen.utility.euler.prototype = {
  clone: function () {
    return syngen.utility.euler.create(this)
  },
  construct: function ({
    pitch = 0,
    roll = 0,
    yaw = 0,
  } = {}) {
    this.pitch = pitch
    this.roll = roll
    this.yaw = yaw
    return this
  },
  forward: function () {
    return syngen.utility.vector3d.unitX().rotateEuler(this)
  },
  isZero: function () {
    return !this.pitch && !this.roll && !this.yaw
  },
  right: function () {
    return syngen.utility.vector3d.unitY().rotateEuler(this)
  },
  scale: function (scalar = 0) {
    return syngen.utility.euler.create({
      pitch: this.pitch * scalar,
      roll: this.roll * scalar,
      yaw: this.yaw * scalar,
    })
  },
  set: function ({
    pitch = 0,
    roll = 0,
    yaw = 0,
  } = {}) {
    this.pitch = pitch
    this.roll = roll
    this.yaw = yaw
    return this
  },
  up: function () {
    return syngen.utility.vector3d.unitZ().rotateEuler(this)
  },
}
