/**
 * Provides an interface for finite-state machines.
 * Machines have defined finite states with actions that transition it to other states.
 * Implementations can leverage machines to handle state and subscribe to their events to respond to changes in state.
 * @augments syngen.utility.pubsub
 * @interface
 * @see syngen.utility.machine.create
 */
syngen.utility.machine = {}

/**
 * Instantiates a new finite-state machine.
 * @param {Object} options
 * @param {Object} [options={}]
 * @param {Object} [options.state=none]
 *   The initial state.
 * @param {Object} [options.transition={}]
 *   A hash of states and their actions.
 *   Each state is a hash of one or more actions.
 *   Each action is a function which _should_ call {@link syngen.utility.machine.change|this.change()} to change state.
 *   Actions _can_ have branching logic that results in multiple states.
 * @returns {syngen.utility.machine}
 * @static
 */
syngen.utility.machine.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.utility.machine.prototype = {
  /**
   * Changes to `state` with `data`.
   * @fires syngen.utility.machine#event:enter
   * @fires syngen.utility.machine#event:enter-{state}
   * @fires syngen.utility.machine#event:exit
   * @fires syngen.utility.machine#event:exit-{state}
   * @instance
   * @param {String} state
   * @param {Object} [data={}]
   */
  change: function (state, data = {}) {
    if (!(state in this.transition) || this.is(state)) {
      return this
    }

    const exitPayload = {
      currentState: this.state,
      nextState: state,
      ...data,
    }

    /**
     * Fired whenever states are exited.
     * @event syngen.utility.machine#event:exit
     * @type {Object}
     * @param {String} currentState
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit('exit', exitPayload)

    /**
     * Fired whenever a particular state is exited.
     * If the state is `foo`, then the event is named `exit-foo`.
     * @event syngen.utility.machine#event:exit-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const enterPayload = {
      currentState: state,
      previousState: this.state,
      ...data,
    }

    this.setState(state)

    /**
     * Fired whenever states are entered.
     * @event syngen.utility.machine#event:enter
     * @type {Object}
     * @param {String} currentState
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit('enter', enterPayload)

    /**
     * Fired whenever a particular state is entered.
     * If the state is `foo`, then the event is named `enter-foo`.
     * @event syngen.utility.machine#event:enter-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit(`enter-${this.state}`, enterPayload)

    return this
  },
  /**
   * Initializes the instance with `options`.
   * @instance
   * @param {Object} options
   * @private
   */
  construct: function ({
    state = 'none',
    transition = {}
  } = {}) {
    this.transition = {...transition}
    this.setState(state)

    syngen.utility.pubsub.decorate(this)

    return this
  },
  /**
   * Prepares the instance for garbage collection.
   * @instance
   */
  destroy: function () {
    this.pubsub.destroy()
    return this
  },
  /**
   * Calls the function defined for `action` in the current state with `data`.
   * @fires syngen.utility.machine#event:after
   * @fires syngen.utility.machine#event:after-{event}
   * @fires syngen.utility.machine#event:after-{state}-{event}
   * @fires syngen.utility.machine#event:before
   * @fires syngen.utility.machine#event:before-{event}
   * @fires syngen.utility.machine#event:before-{state}-{event}
   * @instance
   */
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

      /**
       * Fired before an event is dispatched.
       * @event syngen.utility.machine#event:before
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('before', beforePayload)

      /**
       * Fired before a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.utility.machine#event:before-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${event}`, beforePayload)

      /**
       * Fired before a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.utility.machine#event:before-{state}-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      action.call(this, data)

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      /**
       * Fired after an event is dispatched.
       * @event syngen.utility.machine#event:after
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('after', afterPayload)

      /**
       * Fired after a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.utility.machine#event:after-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${event}`, afterPayload)

      /**
       * Fired after a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.utility.machine#event:after-{state}-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${state}-${event}`, afterPayload)
    }

    return this
  },
  /**
   * Returns the current state.
   * @instance
   * @returns {String}
   */
  getState: function () {
    return this.state
  },
  /**
   * Returns whether `state` is the current state.
   * @instance
   * @param {String} state
   * @returns {Boolean}
   */
  is: function (state) {
    return this.state == state
  },
  /**
   * Sets the current state to `state` immediately.
   * @instance
   * @param {String} state
   * @returns {String}
   */
  setState: function (state) {
    if (state in this.transition) {
      this.state = state
    }

    return this
  },
  /**
   * The current state.
   * @instance
   * @type {String}
   */
  state: undefined,
}
