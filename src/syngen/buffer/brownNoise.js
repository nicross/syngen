syngen.buffer.brownNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/brown-noise-node
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    let lastBrown = 0

    for (let i = 0; i < size; i += 1) {
      const white = (2 * Math.random()) - 1
      const brown = (lastBrown + (0.02 * white)) / 1.02

      data[i] = brown * 3.5
      lastBrown = brown
    }
  }

  return buffer
}
