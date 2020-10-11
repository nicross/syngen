const syngen = (() => {
  const ready = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve)
  })

  return {
    input: {},
    prop: {},
    ready: (callback) => {
      return typeof callback == 'function'
        ? ready.then(callback)
        : ready
    },
    utility: {},
  }
})()
