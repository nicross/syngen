/**
 * @interface
 */
syngen.utility.pubsub = {}

/**
 * @static
 */
syngen.utility.pubsub.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

/**
 * @static
 */
syngen.utility.pubsub.decorate = function (target, instance) {
  if (!this.prototype.isPrototypeOf(instance)) {
    instance = this.create()
    target.pubsub = instance
  }

  ['emit', 'off', 'on', 'once'].forEach((method) => {
    target[method] = function (...args) {
      instance[method](...args)
      return this
    }
  })

  return target
}

syngen.utility.pubsub.prototype = {
  /**
   * @instance
   */
  construct: function() {
    this._handler = {}
    return this
  },
  /**
   * @instance
   */
  destroy: function() {
    this.off()
    return this
  },
  /**
   * @instance
   */
  emit: function (event, ...args) {
    if (!this._handler[event]) {
      return this
    }

    const execute = (handler) => handler(...args),
      handlers = [...this._handler[event]]

    handlers.forEach(execute)

    return this
  },
  /**
   * @instance
   */
  off: function (event, handler) {
    if (event === undefined) {
      this._handler = {}
      return this
    }

    if (handler === undefined) {
      delete this._handler[event]
      return this
    }

    if (!this._handler[event]) {
      return this
    }

    const handlers = this._handler[event],
      index = handlers.indexOf(handler)

    if (index != -1) {
      handlers.splice(index, 1)
    }

    return this
  },
  /**
   * @instance
   */
  on: function (event, handler) {
    if (!this._handler[event]) {
      this._handler[event] = []
    }

    this._handler[event].push(handler)

    return this
  },
  /**
   * @instance
   */
  once: function (event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }

    return this.on(event, wrapper)
  },
}
