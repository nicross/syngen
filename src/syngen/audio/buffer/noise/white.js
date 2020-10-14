/**
 * Returns brown noise with equal intensity at all frequencies.
 * @method
 * @returns {AudioBuffer}
 */
syngen.audio.buffer.noise.white = (() => {
  const context = syngen.audio.context()

  const sampleRate = context.sampleRate,
    size = 5 * sampleRate

  const buffer = context.createBuffer(1, size, sampleRate),
    data = buffer.getChannelData(0)

  for (let i = 0; i < size; i += 1) {
    data[i] = (2 * Math.random()) - 1
  }

  return () => buffer
})()
