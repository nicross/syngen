/**
 * Provides methods for producing random values.
 * @namespace
 */
syngen.utility.random = {}

/**
 * Returns a random float between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.random.float = (min = 0, max = 1) => {
  return min + (Math.random() * (max - min))
}

/**
 * Returns a random integer between `min` and `max`.
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @returns {Number}
 * @static
 */
syngen.utility.random.integer = function (min = 0, max = 1) {
  return Math.round(
    this.float(min, max)
  )
}

/**
 * Returns a random sign as a positive or negative `1`.
 * @returns {Number}
 * @static
 */
syngen.utility.random.sign = () => Math.random() < 0.5 ? 1 : -1

/**
 * Returns a random key in `bag`.
 * @param {Array|Map|Object} bag
 * @returns {String}
 * @static
 */
syngen.utility.random.key = function (bag) {
  const keys = bag instanceof Map
    ? [...bag.keys()]
    : Object.keys(bag)

  return keys[
    this.integer(0, keys.length - 1)
  ]
}

/**
 * Returns a random value in `bag`.
 * @param {Array|Map|Object|Set} bag
 * @returns {*}
 * @static
 */
syngen.utility.random.value = function (bag) {
  if (bag instanceof Set) {
    bag = [...bag.values()]
  }

  const key = this.key(bag)

  if (bag instanceof Map) {
    return bag.get(key)
  }

  return bag[key]
}
