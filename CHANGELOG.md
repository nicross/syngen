# syngen changelog
## v0.2.0
- Improved performance of Perlin noise generation
- Breaking changes
  - **Mouse input.**
  Improved accuracy of mouse input by memoizing values between frames.
  Implementations might have previously used a hack to derive the correct values.
  - **Noise pruning.**
  Removed automatic memory management from Perlin noise utilities.
  Implementations should call `reset()` manually when memory becomes an issue.
  - **Reverb routing.**
  Fixed a routing issue where changing reverb impulses bypassed pre-delay.
  Implementations may need to increase reverb levels by 3 decibels to achieve the same loudness.
