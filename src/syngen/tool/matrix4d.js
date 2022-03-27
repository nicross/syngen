syngen.tool.matrix4d = {}

syngen.tool.matrix4d.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.tool.matrix4d.fromEuler = function ({
  pitch = 0,
  roll = 0,
  yaw = 0,
}, sequence = syngen.const.eulerToQuaternion) {
  const X = syngen.tool.matrix4d.create([
    1, 0, 0, 0,
    0, Math.cos(roll), Math.sin(roll), 0,
    0, -Math.sin(roll), Math.cos(roll), 0,
    0, 0, 0, 1,
  ])

  const Y = syngen.tool.matrix4d.create([
    Math.cos(pitch), 0, -Math.sin(pitch), 0,
    0, 1, 0, 0,
    Math.sin(pitch), 0, Math.cos(pitch), 0,
    0, 0, 0, 1,
  ])

  const Z = syngen.tool.matrix4d.create([
    Math.cos(yaw), -Math.sin(yaw), 0, 0,
    Math.sin(yaw), Math.cos(yaw), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])

  switch (sequence) {
    case 'XYZ':
      return Y.multiply(Y).multiply(X)
    case 'XZY':
      return Y.multiply(Z).multiply(X)
    case 'YXZ':
      return Z.multiply(X).multiply(X)
    case 'YZX':
      return X.multiply(Z).multiply(Y)
    case 'ZXY':
      return Y.multiply(X).multiply(X)
    case 'ZYX':
      return X.multiply(Y).multiply(Z)
  }
}

syngen.tool.matrix4d.fromQuaternion = function (quaternion, sequence = syngen.const.eulerToQuaternion) {
  return this.fromEuler(syngen.tool.euler.fromQuaternion(quaternion), sequence)
}

syngen.tool.matrix4d.identity = function (...args) {
  return this.create([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.scale = function (value = 1) {
  const isNumber = typeof value == 'number'

  const x = isNumber ? value : ('x' in value ? value.x : 1),
    y = isNumber ? value : ('y' in value ? value.y : 1),
    z = isNumber ? value : ('z' in value ? value.z : 1)

  return this.create([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.translate = function ({
  x = 0,
  y = 0,
  z = 0,
} = {}) {
  return syngen.tool.matrix4d.create([
    1, 0, 0, x,
    0, 1, 0, y,
    0, 0, 1, z,
    0, 0, 0, 1,
  ])
}

syngen.tool.matrix4d.prototype = {
  construct: function (elements = []) {
    this.elements = [
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ]

    elements = elements.slice(0, 16)

    for (const index in elements) {
      this.elements[index] = elements[index]
    }

    return this
  },
  applyToVector3d: function ({
    x = 0,
    y = 0,
    z = 0,
  } = {}) {
    const w = 1

    const [
      e11, e21, e31, e41,
      e12, e22, e32, e42,
      e13, e23, e33, e43,
      e14, e24, e34, e44,
    ] = this.elements

    return syngen.tool.vector3d.create({
      x: (x * e11) + (y * e12) + (z * e13) + (w * e14),
      y: (x * e21) + (y * e22) + (z * e23) + (w * e24),
      z: (x * e31) + (y * e32) + (z * e33) + (w * e34),
    })
  },
  multiply: function (b = syngen.tool.matrix4d.identity()) {
    if (!syngen.tool.matrix4d.prototype.isPrototypeOf(b)) {
      b = syngen.tool.matrix4d.create(b)
    }

    const [
      a11, a21, a31, a41,
      a12, a22, a32, a42,
      a13, a23, a33, a43,
      a14, a24, a34, a44,
    ] = this.elements

    const [
      b11, b21, b31, b41,
      b12, b22, b32, b42,
      b13, b23, b33, b43,
      b14, b24, b34, b44,
    ] = b.elements

    const result = []

    result[0] = (a11 * b11) + (a12 * b21) + (a13 * b31) + (a14 * b41)
		result[4] = (a11 * b12) + (a12 * b22) + (a13 * b32) + (a14 * b42)
		result[8] = (a11 * b13) + (a12 * b23) + (a13 * b33) + (a14 * b43)
		result[12] = (a11 * b14) + (a12 * b24) + (a13 * b34) + (a14 * b44)

		result[1] = (a21 * b11) + (a22 * b21) + (a23 * b31) + (a24 * b41)
		result[5] = (a21 * b12) + (a22 * b22) + (a23 * b32) + (a24 * b42)
		result[9] = (a21 * b13) + (a22 * b23) + (a23 * b33) + (a24 * b43)
		result[13] = (a21 * b14) + (a22 * b24) + (a23 * b34) + (a24 * b44)

		result[2] = (a31 * b11) + (a32 * b21) + (a33 * b31) + (a34 * b41)
		result[6] = (a31 * b12) + (a32 * b22) + (a33 * b32) + (a34 * b42)
		result[10] = (a31 * b13) + (a32 * b23) + (a33 * b33) + (a34 * b43)
		result[14] = (a31 * b14) + (a32 * b24) + (a33 * b34) + (a34 * b44)

		result[3] = (a41 * b11) + (a42 * b21) + (a43 * b31) + (a44 * b41)
		result[7] = (a41 * b12) + (a42 * b22) + (a43 * b32) + (a44 * b42)
		result[11] = (a41 * b13) + (a42 * b23) + (a43 * b33) + (a44 * b43)
		result[15] = (a41 * b14) + (a42 * b24) + (a43 * b34) + (a44 * b44)

    return syngen.tool.matrix4d.create(result)
  },
  set: function (column, row, value) {
    const index = (row * 4) + column
    return this.setIndex(index, value)
  },
  setIndex: function (index, value) {
    this.elements[index] = value
    return this
  },
  transpose: function () {
    const [
      a11, a21, a31, a41,
      a12, a22, a32, a42,
      a13, a23, a33, a43,
      a14, a24, a34, a44,
    ] = this.elements

    return syngen.tool.matrix4d.create([
      a11, a12, a13, a14,
      a21, a22, a23, a24,
      a31, a32, a33, a34,
      a41, a42, a43, a44,
    ])
  },
}
