/**
 * Returns a formant definition for the vowel E.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.e = () => [
  {
    frequency: 469,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 2150,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2836,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3311,
    gain: 1,
    Q: 80,
  },
]

/**
 * Creates a formant effect for the vowel E.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createE = () => {
  return syngen.formant.create(
    syngen.formant.e()
  )
}
