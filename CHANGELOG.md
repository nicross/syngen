# syngen changelog
## v0.2.0
- Added utilities for generating seeded OpenSimplex noise in 2D, 3D, and 4D
- Improved performance of noise generation with octaves
- Improved performance of Perlin noise generation
- **[BREAKING]**
Improved accuracy of mouse input by memoizing values between frames.
Implementations can remove any hacks used to derive the correct values.
- **[BREAKING]**
Removed automatic memory management from Perlin noise utilities.
Implementations should call `reset()` manually whenever memory becomes an issue.
- **[BREAKING]**
Fixed a routing issue where changing reverb impulses bypassed pre-delay.
Implementations may increase the reverb gain by 3 decibels to achieve the same loudness.
- **[BREAKING]**
Marked `syngen.utility.createPerlinWithOctaves` as deprecated to be removed in a later release.
Please see `syngen.utility.createNoiseWithOctaves` for a replacement.

## v0.1.4
- Fixed keypresses not clearing within `syngen.input.keyboard` when the window loses focus

## v0.1.3
This release was skipped due to a publishing error.

## v0.1.2
- Removed `height` and `width` as required parameters from `syngen.utility.quadtree.prototype.find()`
- Removed `depth`, `height`, and `width` as required parameters from `syngen.utility.octree.prototype.find()`

## v0.1.1
- Fixed an exception thrown when calling `syngen.audio.mixer.auxiliary.reverb.setActive()`
