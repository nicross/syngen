/**
 * Provides a helper for instantiating, destroying, and updating all props each frame.
 * Implementations are encouraged to use this for handling these tasks.
 * @namespace
 */
syngen.props = (() => {
  const props = new Set()

  function isValidPrototype(prototype) {
    return syngen.prop.base.isPrototypeOf(prototype)
  }

  return {
    /**
     * Instantiates a prop of `prototype` with `options`.
     * @memberof syngen.props
     * @param {syngen.prop.base} prototype
     * @param {Object} [options]
     */
    create: function (prototype, options = {}) {
      if (!isValidPrototype(prototype)) {
        prototype = syngen.prop.null
      }

      const prop = Object.create(prototype).construct(options)
      props.add(prop)

      return prop
    },
    /**
     * Destroys the passed prop(s).
     * @memberof syngen.props
     * @param {...syngen.prop.base} ...values
     */
    destroy: function (...values) {
      for (const prop of values) {
        if (prop.destroy) {
          prop.destroy()
        }

        props.delete(prop)
      }

      return this
    },
    /**
     * Returns all props.
     * @memberof syngen.props
     * @returns {syngen.prop.base[]}
     */
    get: () => [...props],
    /**
     * Destroys all props.
     * @listens syngen.state#event:reset
     * @memberof syngen.props
     */
    reset: function () {
      props.forEach((prop) => prop.destroy())
      props.clear()
      return this
    },
    /**
     * Updates all props.
     * @listens syngen.loop#event:frame
     * @memberof syngen.props
     */
    update: function ({...options} = {}) {
      props.forEach((prop) => prop.update({...options}))
      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.props.update(e))
syngen.state.on('reset', () => syngen.props.reset())
