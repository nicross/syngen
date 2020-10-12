/**
 * @interface
 * @property {syngen.audio.binaural.monaural} left
 * @property {syngen.audio.binaural.monaural} right
 */
syngen.audio.binaural = {}

/**
 * @static
 */
syngen.audio.binaural.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.audio.binaural.prototype = {
  /**
   * @instance
   */
  construct: function () {
    const context = syngen.audio.context()

    this.left = syngen.audio.binaural.monaural.create({
      pan: -1,
    })

    this.right = syngen.audio.binaural.monaural.create({
      pan: 1,
    })

    this.merger = context.createChannelMerger()
    this.left.to(this.merger, 0, 0)
    this.right.to(this.merger, 0, 1)

    return this
  },
  /**
   * @instance
   */
  destroy: function () {
    this.left.destroy()
    this.right.destroy()
    this.merger.disconnect()
    return this
  },
  /**
   * @instance
   */
  from: function (input) {
    this.left.from(input)
    this.right.from(input)
    return this
  },
  /**
   * @instance
   */
  to: function (output) {
    this.merger.connect(output)
    return this
  },
  /**
   * @instance
   */
  update: function (...args) {
    this.left.update(...args)
    this.right.update(...args)
    return this
  },
}
