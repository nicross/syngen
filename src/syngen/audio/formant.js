// SEE: https://www.soundonsound.com/techniques/formant-synthesis
// SEE: https://www.researchgate.net/figure/Target-and-reproduced-vowel-formant-frequencies_tbl1_2561802
// SEE: https://www.reasonstudios.com/blog/thor-demystified-17-filters-pt-5-formant-filters
// SEE: http://www.ipachart.com

syngen.audio.formant = {}

syngen.audio.formant.blend = (a, b, mix = 0) => {
  const getFrequency = (array, index) => (array[index] && array[index].frequency) || syngen.const.zero
  const getGain = (array, index) => (array[index] && array[index].gain) || syngen.const.zeroGain
  const getQ = (array, index) => (array[index] && array[index].q) || 1

  return [...Array(Math.max(a.length, b.length))].map((_, i) => ({
    frequency: syngen.utility.lerp(getFrequency(a, i), getFrequency(b, i), mix),
    gain: syngen.utility.lerp(getGain(a, i), getGain(b, i), mix),
    q: syngen.utility.lerp(getQ(a, i), getQ(b, i), mix),
  }))
}

syngen.audio.formant.create = (frequencies = []) => {
  const context = syngen.audio.context()

  const input = context.createGain(),
    output = context.createGain()

  const filters = frequencies.map(({frequency = 10, gain = 1, q = 1}) => {
    const filter = context.createBiquadFilter()
    filter.frequency.value = frequency
    filter.Q.value = q
    filter.type = 'bandpass'

    const gainNode = context.createGain()
    gainNode.gain.value = gain

    input.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(output)

    return {
      filter,
      gain: gainNode,
    }
  })

  return {
    filters,
    input,
    output,
  }
}

syngen.audio.formant.createA = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.a()
  )
}

syngen.audio.formant.createE = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.e()
  )
}

syngen.audio.formant.createI = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.i()
  )
}

syngen.audio.formant.createO = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.o()
  )
}

syngen.audio.formant.createU = () => {
  return syngen.audio.formant.create(
    syngen.audio.formant.u()
  )
}

syngen.audio.formant.transition = function(formant, frequencies = [], duration) {
  formant.filters.forEach((filter, i) => {
    if (!frequencies[i]) {
      syngen.audio.ramp.linear(filter.gain.gain, syngen.const.zeroGain, duration)
      return
    }

    const {frequency, gain, q} = frequencies[i]

    if (typeof frequency != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.frequency, frequency, duration)
    }

    if (typeof gain != 'undefined') {
      syngen.audio.ramp.linear(filter.gain.gain, gain, duration)
    }

    if (typeof q != 'undefined') {
      syngen.audio.ramp.exponential(filter.filter.Q, q, duration)
    }
  })

  return syngen.utility.timing.promise(duration * 1000)
}

syngen.audio.formant.a = () => [
  {
    frequency: 599,
    gain: 1,
    q: 5,
  },
  {
    frequency: 1001,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2045,
    gain: 1,
    q: 50,
  },
  {
    frequency: 2933,
    gain: 1,
    q: 80,
  },
]

syngen.audio.formant.e = () => [
  {
    frequency: 469,
    gain: 1,
    q: 5,
  },
  {
    frequency: 2150,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2836,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3311,
    gain: 1,
    q: 80,
  },
]

syngen.audio.formant.i = () => [
  {
    frequency: 274,
    gain: 1,
    q: 5,
  },
  {
    frequency: 1704,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2719,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3404,
    gain: 1,
    q: 80,
  },
]

syngen.audio.formant.o = () => [
  {
    frequency: 411,
    gain: 1,
    q: 5,
  },
  {
    frequency: 784,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2176,
    gain: 1,
    q: 50,
  },
  {
    frequency: 2987,
    gain: 1,
    q: 80,
  },
]

syngen.audio.formant.u = () => [
  {
    frequency: 290,
    gain: 1,
    q: 5,
  },
  {
    frequency: 685,
    gain: 1,
    q: 20,
  },
  {
    frequency: 2190,
    gain: 1,
    q: 50,
  },
  {
    frequency: 3154,
    gain: 1,
    q: 80,
  },
]
