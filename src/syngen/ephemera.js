// TODO: Support prioritization / customizable intervals
syngen.ephemera = (() => {
  const ephemera = new Set(),
    interval = 60

  let timer

  resetTimer()

  function resetManaged() {
    for (const item of ephemera) {
      resetManagedItem(item)
    }
  }

  function resetManagedItem(item) {
    if (item.clear) {
      item.clear()
    } else if (item.reset) {
      item.reset()
    }
  }

  function resetTimer() {
    timer = interval
  }

  return {
    add: function (item) {
      if (!item || (!item.clear && !item.reset)) {
        return this
      }

      ephemera.add(item)

      return this
    },
    remove: function (item, reset = true) {
      ephemera.delete(item)

      if (reset) {
        resetManagedItem(item)
      }

      return this
    },
    reset: function () {
      resetManaged()
      resetTimer()

      return this
    },
    update: function (delta) {
      timer -= delta

      if (timer <= 0) {
        this.reset()
      }

      return this
    },
  }
})()

syngen.loop.on('frame', ({delta, paused}) => {
  if (paused) {
    return
  }

  syngen.ephemera.update(delta)
})

syngen.state.on('reset', () => syngen.ephemera.reset())
