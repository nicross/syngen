/**
 * Returns a formant definition for the vowel O.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.o = () => [
  {
    frequency: 411,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 784,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2176,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 2987,
    gain: 1,
    Q: 80,
  },
]

/**
 * Creates a formant effect for the vowel O.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createO = () => {
  return syngen.formant.create(
    syngen.formant.o()
  )
}
