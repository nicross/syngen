# syngen changelog
## v0.2.0
- Improved performance of Perlin noise generation
- Breaking changes
  - **Noise pruning.**
  Removed automatic memory management from Perlin noise utilities.
  Implementations should call `reset()` manually when memory becomes an issue.
