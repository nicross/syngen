syngen.buffer.pinkNoise = ({
  channels = 1,
  duration = 0,
} = {}) => {
  const context = syngen.context()

  const sampleRate = context.sampleRate,
    size = duration * sampleRate

  const buffer = context.createBuffer(channels, size, sampleRate)

  channels = Math.max(1, Math.round(channels))

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/pink-noise-node
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0

    for (let i = 0; i < size; i += 1) {
      const white = (2 * Math.random()) - 1

      b0 = (0.99886 * b0) + (white * 0.0555179)
      b1 = (0.99332 * b1) + (white * 0.0750759)
      b2 = (0.96900 * b2) + (white * 0.1538520)
      b3 = (0.86650 * b3) + (white * 0.3104856)
      b4 = (0.55000 * b4) + (white * 0.5329522)
      b5 = (-0.7616 * b5) - (white * 0.0168980)

      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + (white * 0.5362)) * 0.11
      b6 = white * 0.115926
    }
  }

  return buffer
}
