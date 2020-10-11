syngen.audio.mixer.bus.props = (() => {
  const bus = syngen.audio.mixer.createBus()
  return () => bus
})()
