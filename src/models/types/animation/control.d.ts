/**
 * Playback direction.
 */
export type PlaybackDirection = "normal" | "reverse" | "alternate";

/**
 * Frame optimization strategy.
 */
export type OptimizationTechnique =
  "fitPolynomialCoefficient" | "preComputeFrames";

/**
 * Animation playback controls.
 */
export type AnimationControls = {
  loop?: boolean;

  direction?: PlaybackDirection;

  optimizationTechnique?: OptimizationTechnique;
};
