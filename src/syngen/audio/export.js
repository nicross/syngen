/**
 * Records the output of the provided input and exports it as a WebM file.
 * When no duration is passed, the [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) _must_ be stopped to complete the export.
 * @param {Object} [options]
 * @param {Number} [options.duration=0]
 * @param {AudioNode} [options.input=syngen.audio.mixer.master.output]
 * @param {String} [options.name=export.webm]
 * @returns {MediaRecorder}
 * @static
 */
syngen.audio.export = ({
  duration = 0,
  input = syngen.audio.mixer.master.output,
  name = 'export.webm',
} = {}) => {
  if (!(input instanceof AudioNode)) {
    throw new Error('Input must be an AudioNode')
  }

  const context = syngen.audio.context(),
    data = [],
    destination = context.createMediaStreamDestination(),
    recorder = new MediaRecorder(destination.stream)

  recorder.ondataavailable = (e) => data.push(e.data)

  recorder.onstop = () => {
    try {
      input.disconnect(destination)
    } catch (e) {}

    const blob = new Blob(data, {type: recorder.mimeType}),
      url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = name
    link.href = url

    link.click()
    link.remove()
  }

  input.connect(destination)
  recorder.start()

  if (duration > 0) {
    setTimeout(() => recorder.stop(), duration * 1000)
  }

  return recorder
}
