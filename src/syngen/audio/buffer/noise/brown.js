/**
 * @static
 */
syngen.audio.buffer.noise.brown = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 5 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate),
    data = buffer.getChannelData(0)

  let lastBrown = 0

  // SEE: https://noisehack.com/generate-noise-web-audio-api
  // SEE: https://github.com/mohayonao/brown-noise-node
  for (let i = 0; i < size; i += 1) {
    const white = (2 * Math.random()) - 1
    const brown = (lastBrown + (0.02 * white)) / 1.02

    data[i] = brown * 3.5
    lastBrown = brown
  }

  return () => buffer
})()
