/**
 * Returns a formant definition for the vowel I.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.i = () => [
  {
    frequency: 274,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 1704,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2719,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3404,
    gain: 1,
    Q: 80,
  },
]

/**
 * Creates a formant effect for the vowel I.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createI = () => {
  return syngen.formant.create(
    syngen.formant.i()
  )
}
