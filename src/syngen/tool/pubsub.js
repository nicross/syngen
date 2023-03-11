/**
 * Provides an interface for a publish-subscribe messaging pattern.
 * Objects can be decorated with an existing or new instance with the static {@link syngen.tool.pubsub.decorate|decorate} method.
 * @interface
 * @see syngen.tool.pubsub.create
 * @see syngen.tool.pubsub.decorate
 */
syngen.tool.pubsub = {}

/**
 * Instantiates a new pubsub instance.
 * @returns {syngen.tool.pubsub}
 * @static
 */
syngen.tool.pubsub.create = function () {
  return Object.create(this.prototype).construct()
}

/**
 * Decorates `target` with a new or existing `instance` and returns it.
 * This exposes its methods on `target` as if they are its own.
 * @param {Object} target
 * @param {syngen.tool.pubsub} [instance]
 * @returns {Object}
 * @static
 */
syngen.tool.pubsub.decorate = function (target, instance) {
  if (!this.prototype.isPrototypeOf(instance)) {
    instance = this.create()
    target.pubsub = instance
  }

  instance.decorate(target)

  return target
}

syngen.tool.pubsub.prototype = {
  /**
   * Instantiates the instance.
   * @instance
   * @private
   */
  construct: function() {
    this._handler = {}
    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function() {
    this.off()
    return this
  },
  /**
   * Decorates `target` with methods from this instance so it can be used as an event emitter.
   * @instance
   * @param {Object} target
   */
  decorate: function (target) {
    const instance = this

    ;['emit', 'off', 'on', 'once'].forEach((method) => {
      target[method] = function (...args) {
        instance[method](...args)
        return this
      }
    })

    return target
  },
  /**
   * Dispatches `event` to all subscribers with optional `...data`.
   * @instance
   * @param {String} event
   * @param {...*} [...data]
   */
  emit: function (event, ...data) {
    if (!this._handler[event]) {
      return this
    }

    const execute = (handler) => handler(...data),
      handlers = [...this._handler[event]]

    handlers.forEach(execute)

    return this
  },
  /**
   * Unsubscribes `handler` from the handlers listening for `event`.
   * If no `handler` is specified, then all handlers for `event` are removed.
   * If no `event` is specified, then all handlers for all events are removed.
   * @instance
   * @param {String} [event]
   * @param {Function} [handler]
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
   * Subscribes `handler` to listen for `event`.
   * @instance
   * @param {String} event
   * @param {Function} handler
   */
  on: function (event, handler) {
    if (!(handler instanceof Function)) {
      return this
    }

    if (!this._handler[event]) {
      this._handler[event] = []
    }

    this._handler[event].push(handler)

    return this
  },
  /**
   * Subscribed `handler` to listen for `event` once.
   * The `handler` is removed after its next dispatch.
   * @instance
   * @param {String} event
   * @param {Function} handler
   */
  once: function (event, handler) {
    const wrapper = (...data) => {
      this.off(event, wrapper)
      handler(...data)
    }

    return this.on(event, wrapper)
  },
}
