/**
 * Provides an interface for finite-state machines.
 * Machines have defined finite states with actions that transition it to other states.
 * Implementations can leverage machines to handle state and subscribe to their events to respond to changes in state.
 * @augments syngen.tool.pubsub
 * @interface
 * @see syngen.tool.fsm.create
 */
syngen.tool.fsm = {}

/**
 * Instantiates a new finite-state machine.
 * @param {Object} options
 * @param {Object} [options={}]
 * @param {Object} [options.state=none]
 *   The initial state.
 * @param {Object} [options.transition={}]
 *   A hash of states and their actions.
 *   Each state is a hash of one or more actions.
 *   Each action is a function which _should_ call {@link syngen.tool.fsm.change|this.change()} to change state.
 *   Actions _can_ have branching logic that results in multiple states.
 * @returns {syngen.tool.fsm}
 * @static
 */
syngen.tool.fsm.create = function (options = {}) {
  return Object.create(this.prototype).construct(options)
}

syngen.tool.fsm.prototype = {
  /**
   * Changes to `state` with `data`.
   * @fires syngen.tool.fsm#event:enter
   * @fires syngen.tool.fsm#event:enter-{state}
   * @fires syngen.tool.fsm#event:exit
   * @fires syngen.tool.fsm#event:exit-{state}
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
      event: this._lastEvent,
      nextState: state,
      ...data,
    }

    /**
     * Fired whenever states are exited.
     * @event syngen.tool.fsm#event:exit
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit('exit', exitPayload)

    /**
     * Fired whenever a particular state is exited.
     * If the state is `foo`, then the event is named `exit-foo`.
     * @event syngen.tool.fsm#event:exit-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} nextState
     * @param {...*} ...data
     */
    this.pubsub.emit(`exit-${this.state}`, exitPayload)

    const enterPayload = {
      currentState: state,
      event: this._lastEvent,
      previousState: this.state,
      ...data,
    }

    this.setState(state)

    /**
     * Fired whenever states are entered.
     * @event syngen.tool.fsm#event:enter
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
     * @param {String} previousState
     * @param {...*} ...data
     */
    this.pubsub.emit('enter', enterPayload)

    /**
     * Fired whenever a particular state is entered.
     * If the state is `foo`, then the event is named `enter-foo`.
     * @event syngen.tool.fsm#event:enter-{state}
     * @type {Object}
     * @param {String} currentState
     * @param {?String} event
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

    syngen.tool.pubsub.decorate(this)

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
   * @fires syngen.tool.fsm#event:after
   * @fires syngen.tool.fsm#event:after-{event}
   * @fires syngen.tool.fsm#event:after-{state}-{event}
   * @fires syngen.tool.fsm#event:before
   * @fires syngen.tool.fsm#event:before-{event}
   * @fires syngen.tool.fsm#event:before-{state}-{event}
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
       * @event syngen.tool.fsm#event:before
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit('before', beforePayload)

      /**
       * Fired before a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.tool.fsm#event:before-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${event}`, beforePayload)

      /**
       * Fired before a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.tool.fsm#event:before-{state}-{event}
       * @type {Object}
       * @param {String} event
       * @param {Object} state
       * @param {...*} ...data
       */
      this.pubsub.emit(`before-${state}-${event}`, beforePayload)

      this._lastEvent = event
      action.call(this, data)
      delete this._lastEvent

      const afterPayload = {
        currentState: this.state,
        event,
        previousState: state,
        ...data,
      }

      /**
       * Fired after an event is dispatched.
       * @event syngen.tool.fsm#event:after
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {...*} ...data
       */
      this.pubsub.emit('after', afterPayload)

      /**
       * Fired after a particular event is dispatched.
       * If the event is `foo`, then the event is named `before-foo`.
       * @event syngen.tool.fsm#event:after-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
       * @param {...*} ...data
       */
      this.pubsub.emit(`after-${event}`, afterPayload)

      /**
       * Fired after a particular event is dispatched in a particular state.
       * If the state is `foo` and the event is `bar`, then the event is named `before-foo-bar`.
       * @event syngen.tool.fsm#event:after-{state}-{event}
       * @type {Object}
       * @param {String} currentState
       * @param {String} event
       * @param {String} previousState
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
