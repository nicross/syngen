/**
 * Provides a wrapper for the seed value.
 * The seed primarily influences {@link syngen.utility.srand()} as well as any other systems and utilities that rely on it.
 * It can be randomized to deliver unique experiences.
 * @namespace
 */
syngen.seed = (() => {
  let seed,
    separator = '~'

  return {
    /**
     * Concatenates variadic `seeds`
     * @memberof syngen.seed
     * @param {...String} [...seeds]
     * @returns {String}
     */
    concat: (...seeds) => {
      seeds.unshift(seed)
      return seeds.join(separator)
    },
    /**
     * Returns the seed value.
     * @listens syngen.state#event.import
     * @memberof syngen.seed
     * @returns {String}
     */
    get: () => seed,
    /**
     * Returns the separator value.
     * @memberof syngen.seed
     * @returns {String}
     */
    getSeparator: () => separator,
    /**
     * Sets the seed value.
     * @listens syngen.state#event:import
     * @listens syngen.state#event:reset
     * @memberof syngen.seed
     * @param {String} [value]
     */
    set: function (value) {
      seed = value
      return this
    },
    /**
     * Sets the separator value.
     * @memberof syngen.seed
     * @param {String} value
     */
    setSeparator: function (value) {
      if (typeof value == 'string') {
        separator = value
      }

      return this
    },
    /**
     * @ignore
     */
    valueOf: () => seed,
  }
})()

syngen.state.on('export', (data = {}) => data.seed = syngen.seed.get())
syngen.state.on('import', (data = {}) => syngen.seed.set(data.seed))
syngen.state.on('reset', () => syngen.seed.set())
