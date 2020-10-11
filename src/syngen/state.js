syngen.state = syngen.utility.pubsub.decorate({
  export: function () {
    const data = {}
    this.emit('export', data)
    return data
  },
  import: function (data = {}) {
    this.reset()
    this.emit('import', data)
    return this
  },
  reset: function () {
    this.emit('reset')
    return this
  }
})
