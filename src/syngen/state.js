/**
 * Provides a helper for importing and exporting state.
 * Systems can subscribe to its events to persist and load their inner states.
 * @implements syngen.utility.pubsub
 * @namespace
 */
syngen.state = syngen.utility.pubsub.decorate({
  /**
   * Exports the state.
   * The inverse of {@link syngen.state.import}.
   * @fires syngen.state#event:export
   * @memberof syngen.state
   * @returns {Object}
   */
  export: function () {
    const state = {}

    /**
     * Fired when state is exported.
     * Subscribers should add an entry to the passed object with their exported state.
     * @event syngen.state#event:export
     * @type {Object}
     */
    this.emit('export', state)

    return state
  },
  /**
   * Imports the state.
   * The inverse of {@link syngen.state.export}.
   * @fires syngen.state#event:import
   * @memberof syngen.state
   * @param {Object} [state]
   */
  import: function (state = {}) {
    this.reset()

    /**
     * Fired when state is imported.
     * Subscribers should consume the entry they added during export, if one exists.
     * @event syngen.state#event:import
     * @type {Object}
     */
    this.emit('import', state)

    return this
  },
  /**
   * Resets to a blank state.
   * @fires syngen.state#event:import
   * @memberof syngen.state
   */
  reset: function () {
    /**
     * Fired when state is reset.
     * Subscribers should clear their internal state when fired.
     * @event syngen.state#event:reset
     */
    this.emit('reset')
    return this
  }
})
