//+++++++++++++++++++++++++++
// Function to Calculate control points on sin , cos , tan  curve
//+++++++++++++++++++++++++++

/**
 * Generates a series of points forming a wavy line between two points.
 *
 * Purpose:
 * - Creates a wave (sine, cosine, or tangent) along a straight line from `(x1, y1)` to `(x2, y2)`.
 * - Allows control over the number of waves, their amplitude (`stiffness`), and wave type.
 * - Useful for animating wavy paths, drawing decorative curves, or simulating oscillations.
 *
 * Dependency:
 * - Uses basic JavaScript math functions (`Math.sin`, `Math.cos`, `Math.tan`, `Math.atan2`, `Math.hypot`).
 * - Does not rely on any graphics API, DOM API, or external library.
 *
 * @param x1 - X-coordinate of the starting point.
 * @param y1 - Y-coordinate of the starting point.
 * @param x2 - X-coordinate of the ending point.
 * @param y2 - Y-coordinate of the ending point.
 * @param numberOfWaves - Number of complete wave cycles to generate between the two points.
 * @param stiffness - Optional amplitude of the wave; default is 20.
 * @param type - Type of wave function: `'sin'` (default), `'cos'`, or `'tan'`.
 *
 * @returns An array of points `{ x, y }` representing the wavy path along the line.
 */

export function Wave(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  numberOfWaves: number,
  stiffness: number = 20,
  type: "sin" | "cos" | "tan" = "sin",
) {
  const amplitude = stiffness;
  const waveSegments: { x: number; y: number }[] = [];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLength = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const wavelength = totalLength / numberOfWaves;
  const smoothness = wavelength;

  for (let wave = 0; wave < numberOfWaves; wave++) {
    const startX = wave * wavelength;
    for (let i = 0; i <= smoothness; i++) {
      const t = i / smoothness;
      const localX = startX + t * wavelength;

      let rawY: number;

      if (type === "cos") {
        rawY = Math.cos((2 * Math.PI * localX) / wavelength);
      } else if (type === "tan") {
        // Clamp tan to avoid extreme spikes
        rawY = Math.tan((2 * Math.PI * localX) / wavelength);
        rawY = Math.max(-1, Math.min(1, rawY)); // clamp between -1 and 1
      } else {
        rawY = Math.sin((2 * Math.PI * localX) / wavelength);
      }

      const localY = amplitude * rawY;

      const rotatedX = localX * Math.cos(angle) - localY * Math.sin(angle);
      const rotatedY = localX * Math.sin(angle) + localY * Math.cos(angle);

      waveSegments.push({
        x: Number((x1 + rotatedX).toFixed(5)),
        y: Number((y1 + rotatedY).toFixed(5)),
      });
    }
  }

  console.log(waveSegments);
  return waveSegments;
}
