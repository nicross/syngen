# syngen changelog
## v0.2.0
- Breaking changes
  - **Noise pruning.**
  Removed automatic memory management from noise utilities such as `syngen.utility.perlin1d`.
  Implementations should call `reset()` manually when memory becomes an issue.
