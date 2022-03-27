// TODO: Support prioritization / customizable intervals
syngen.ephemera = (() => {
  const ephemera = new Set(),
    interval = 60

  let timer

  resetTimer()

  function resetManaged() {
    for (const ephemeral of ephemera) {
      if (ephemeral.clear) {
        ephemeral.clear()
      } else if (ephemeral.reset) {
        ephemeral.reset()
      }
    }
  }

  function resetTimer() {
    timer = interval
  }

  return {
    add: function (ephemeral) {
      if (!ephemeral || (!ephemeral.clear && !ephemeral.reset)) {
        return this
      }

      ephemera.add(ephemeral)

      return this
    },
    remove: function (ephemeral) {
      ephemera.delete(ephemeral)
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
