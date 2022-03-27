syngen.buffer.impulse = ({
  buffer,
  power = 1,
}) => {
  if (!(buffer instanceof AudioBuffer)) {
    throw new Error('Invalid AudioBuffer.')
  }

  const size = buffer.length

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)

    for (let i = 0; i < size; i += 1) {
      data[i] *= ((size - i) / size) ** power
    }
  }

  return buffer
}
