/**
 * Provides methods that simplify working with timers.
 * @namespace
 */
syngen.utility.timing = {}

/**
 * Returns a cancelable promise that resolves after `duration` milliseconds.
 * @param {Number} duration
 * @returns {Promise}
 *   Has a `cancel` method that can reject itself prematurely.
 * @static
 */
syngen.utility.timing.cancelablePromise = (duration) => {
  const scope = {}

  const promise = new Promise((resolve, reject) => {
    scope.reject = reject
    scope.resolve = resolve
  })

  const timeout = setTimeout(scope.resolve, duration)

  promise.cancel = function () {
    scope.reject()
    clearTimeout(timeout)
    return this
  }

  promise.catch(() => {})

  return promise
}

/**
 * Returns a promise that resolves after `duration` milliseconds.
 * @param {Number} duration
 * @returns {Promise}
 * @static
 */
syngen.utility.timing.promise = (duration) => new Promise((resolve) => setTimeout(resolve, duration))
