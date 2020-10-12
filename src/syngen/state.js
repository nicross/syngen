/**
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.state = syngen.utility.pubsub.decorate({
  /**
   * @memberof syngen.state
   */
  export: function () {
    const data = {}
    this.emit('export', data)
    return data
  },
  /**
   * @memberof syngen.state
   */
  import: function (data = {}) {
    this.reset()
    this.emit('import', data)
    return this
  },
  /**
   * @memberof syngen.state
   */
  reset: function () {
    this.emit('reset')
    return this
  }
})
