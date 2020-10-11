syngen.utility.machine = {}

syngen.utility.machine.create = function (...args) {
  return Object.create(this.prototype).construct(...args)
}

syngen.utility.machine.is = function (x) {
  return this.prototype.isPrototypeOf(x)
}

syngen.utility.machine.prototype = {
  change: function (state, data = {}) {
    if (this.is(state)) {
      return this
    }

    const exitPayload = {
      currentState: this.state,
      nextState: state,
      ...data,
    }

    this.pubsub.emit('exit', exitPayload)
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const previousState = this.state
    this.state = state

    const enterPayload = {
      currentState: state,
      previousState,
      ...data,
    }

    this.pubsub.emit('enter', enterPayload)
    this.pubsub.emit(`enter-${this.state}`, enterPayload)

    return this
  },
  construct: function ({state = 'none', transition = {}} = {}) {
    this.state = state
    this.transition = {...transition}

    syngen.utility.pubsub.decorate(this)

    return this
  },
  destroy: function () {
    this.pubsub.destroy()
    return this
  },
  dispatch: function (event, data = {}) {
    const actions = this.transition[this.state]

    if (!actions) {
      return this
    }

    const action = actions[event]

    if (action) {
      const state = this.state

      const beforePayload = {
        event,
        state,
        ...data,
      }

      this.pubsub.emit('before', beforePayload)
      this.pubsub.emit(`before-${event}`, beforePayload)
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      action.call(this, data)

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      this.pubsub.emit('after', afterPayload)
      this.pubsub.emit(`after-${event}`, afterPayload)
      this.pubsub.emit(`after-${state}-${event}`, afterPayload)
    }

    return this
  },
  getState: function () {
    return this.state
  },
  is: function (state) {
    return this.state == state
  },
}
