/**
 * @namespace
 */
syngen.props = (() => {
  const pool = new Set()

  function isValidPrototype(prototype) {
    return syngen.prop.base.isPrototypeOf(prototype)
  }

  return {
    /**
     * @memberof syngen.props
     */
    add: function (...props) {
      for (const prop of props) {
        if (isValidPrototype(prop)) {
          pool.add(prop)
        }
      }

      return this
    },
    /**
     * @memberof syngen.props
     */
    create: function (prototype, options) {
      if (!isValidPrototype(prototype)) {
        prototype = syngen.prop.null
      }

      const prop = Object.create(prototype).construct(options)
      pool.add(prop)

      return prop
    },
    /**
     * @memberof syngen.props
     */
    destroy: function (...props) {
      for (const prop of props) {
        if (prop.destroy) {
          prop.destroy()
        }

        pool.delete(prop)
      }

      return this
    },
    /**
     * @memberof syngen.props
     */
    get: () => [...pool],
    /**
     * @memberof syngen.props
     */
    reset: function () {
      pool.forEach((prop) => prop.destroy())
      pool.clear()
      return this
    },
    /**
     * @memberof syngen.props
     */
    update: function ({delta, paused}) {
      pool.forEach((prop) => prop.update({delta, paused}))
      return this
    },
  }
})()

syngen.loop.on('frame', (e) => syngen.props.update(e))
syngen.state.on('reset', () => syngen.props.reset())
