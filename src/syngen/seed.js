syngen.seed = (() => {
  let seed

  return {
    get: () => seed,
    set: function (value) {
      seed = value
      return this
    },
    valueOf: () => seed,
  }
})()

syngen.state.on('export', (data = {}) => data.seed = syngen.seed.get())
syngen.state.on('import', (data = {}) => syngen.seed.set(data.seed))
syngen.state.on('reset', () => syngen.seed.set())
