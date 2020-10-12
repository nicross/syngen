/**
 * @namespace
 */
syngen.utility.random = {}

/**
 * @method
 */
syngen.utility.random.float = (min = 0, max = 1) => {
  return min + (Math.random() * (max - min))
}

/**
 * @method
 */
syngen.utility.random.integer = function (min = 0, max = 1) {
  return Math.round(
    this.float(min, max)
  )
}

/**
 * @method
 */
syngen.utility.random.sign = (bias = 0.5) => Math.random() < bias ? 1 : -1

/**
 * @method
 */
syngen.utility.random.key = function (bag) {
  const keys = Object.keys(bag)
  return keys[
    this.integer(0, keys.length - 1)
  ]
}

/**
 * @method
 */
syngen.utility.random.value = function (bag) {
  return bag[
    this.key(bag)
  ]
}
