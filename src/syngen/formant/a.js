/**
 * Returns a formant definition for the vowel A.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.a = () => [
  {
    frequency: 599,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 1001,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2045,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 2933,
    gain: 1,
    Q: 80,
  },
]

/**
 * Creates a formant effect for the vowel A.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createA = () => {
  return syngen.formant.create(
    syngen.formant.a()
  )
}
