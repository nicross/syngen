/**
 * @namespace
 */
syngen.seed = (() => {
  let seed

  return {
    /**
     * @memberof syngen.seed
     */
    get: () => seed,
    /**
     * @memberof syngen.seed
     */
    set: function (value) {
      seed = value
      return this
    },
    /**
     * @memberof syngen.seed
     */
    valueOf: () => seed,
  }
})()

syngen.state.on('export', (data = {}) => data.seed = syngen.seed.get())
syngen.state.on('import', (data = {}) => syngen.seed.set(data.seed))
syngen.state.on('reset', () => syngen.seed.set())
