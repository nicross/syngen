syngen.buffer.whiteNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    for (let i = 0; i < size; i += 1) {
      data[i] = (2 * Math.random()) - 1
    }
  }

  return buffer
}
