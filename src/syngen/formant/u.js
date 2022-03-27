/**
 * Returns a formant definition for the vowel U.
 * @returns {syngen.formant~Definition}
 * @static
 */
syngen.formant.u = () => [
  {
    frequency: 290,
    gain: 1,
    Q: 5,
  },
  {
    frequency: 685,
    gain: 1,
    Q: 20,
  },
  {
    frequency: 2190,
    gain: 1,
    Q: 50,
  },
  {
    frequency: 3154,
    gain: 1,
    Q: 80,
  },
]

/**
 * Creates a formant effect for the vowel U.
 * @returns {syngen.synth~Plugin}
 * @static
 */
syngen.formant.createU = () => {
  return syngen.formant.create(
    syngen.formant.u()
  )
}
