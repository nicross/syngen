/**
 * Provides factories for building simple prefabricated synthesizers.
 * Importantly, these are _not_ the only way to generate audio with syngen.
 * Implementations can build their own synthesizers or use any external library that supports connecting to its audio graph.
 * @namespace
 */
syngen.synth = {}

/**
 * A prefabricated synth returned from a {@link syngen.synth} factory method.
 * They wrap their `AudioNode`s with an interface that exposes their `AudioParam`s and provides methods to build more sophisticated circuits.
 * Internally they maintain a pointer to the last node before output so they can unlink them and dynamically add plugins to the output chain.
 * @property {Function} assign
 *   Assigns `plugin` to `key` and merges its parameters.
 * @property {Function} chain
 *   Adds `plugin` to the output chain and ensures they stop together.
 * @property {Function} chainAssign
 *   Assigns and chains `plugin` to `key`.
 *   This is shorthand for calling both `chain()` and `assign()`.
 * @property {Function} chainStop
 *   Ensures `plugin` stops when the synth is stopped.
 *   This is called internally by `chain()`.
 *   Implementations should only call this manually if `plugin` is not part of its output chain.
 * @property {Function} connect
 *   Connects synth output to `node` with optional `...args`.
 * @property {Function} disconnect
 *   Disconnects synth output from `node` with optional `...args`.
 * @property {Function} filtered
 *   Adds a `BiquadFilterNode` to the output chain with `options`.
 * @property {GainNode} output
 *   The final output after all chained plugins.
 * @property {Object} param
 *   Hash of all `AudioParam`s.
 * @property {Function} shaped
 *   Adds a `WaveShaperNode` to the output chain with `curve`.
 * @property {Function} stop
 *   Stops the synth and all chained plugins.
 * @todo Improve documentation as an interface
 * @typedef {Object} syngen.synth~Synth
 */
syngen.synth.prototype = {
  assign: function (...args) {
    return syngen.synth.fn.assign(this, ...args)
  },
  chain: function (...args) {
    return syngen.synth.fn.chain(this, ...args)
  },
  chainAssign: function (...args) {
    return syngen.synth.fn.chainAssign(this, ...args)
  },
  chainStop: function (...args) {
    return syngen.synth.fn.chainStop(this, ...args)
  },
  connect: function (...args) {
    this.output.connect(...args)
    return this
  },
  disconnect: function (...args) {
    this.output.disconnect(...args)
    return this
  },
  filtered: function (...args) {
    return syngen.synth.fn.filtered(this, ...args)
  },
  shaped: function (...args) {
    return syngen.synth.fn.shaped(this, ...args)
  },
}

/**
 * A plugin compatible with synth chaining.
 * Typically returned from a {@link syngen.effect} or {@link syngen.formant} factory method.
 * Implementations can create their own plugins for synths as long as they have an `input` and `output`.
 * @property {AudioNode} input
 *   The plugin output.
 * @property {AudioNode} output
 *   The plugin output.
 * @property {Object} [param]
 *   Hash of all `AudioParam`s.
 * @property {Function} [stop]
 *   Stops the plugins.
 * @todo Improve documentation as an interface
 * @typedef {Object} syngen.synth~Plugin
 */
