import type { ParsedDaTa } from '../../../../types/transformations';

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++ method to parse combine transformations string  +++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/**
 * Parses a string expression representing a transformation (Translate, Rotate, Scale, Skew, Flip)
 * and returns a structured object describing the transformation parameters.
 *
 * Purpose:
 * This function allows interpreting textual transformation commands like `T(10,20)`, `R(45)`, `S(2,2)`,
 * etc., into a structured format that can be used for programmatic transformations.
 * It supports optional pivot points, type specifications (absolute, relative, pivot), and flip directions.
 *
 * Parameters:
 * @param expr - A string containing the transformation expression.
 *               Examples:
 *                 - "T(10,20)" → Translate by (10, 20)
 *                 - "R(45,a,50,50)" → Rotate 45 degrees around pivot (50, 50)
 *                 - "S(2,2,p,0,0)" → Scale by 2 on both axes using pivot (0,0)
 *                 - "H(10,5)" → Skew X by 10 and Y by 5
 *                 - "F(true,false,x+,y-)" → Flip horizontally but not vertically
 *
 * Returns:
 * - A `ParsedDaTa` object containing:
 *   - `tName`: The type of transformation ("Translate", "Rotate", "Scale", "Skew", "Flip")
 *   - `data`: The parsed parameters for that transformation
 * - Returns `null` if the expression does not match any known transformation pattern.
 *
 * Dependencies:
 * - Purely string parsing; does NOT depend on DOM or graphics APIs.
 */

export function parseExpression(expr: string): ParsedDaTa | null {
  try {
    const patterns = {
      T: /^T\(\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*(?:,\s*(?:"([^"]+)"|(\w+))\s*)?(?:,\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*)?\)$/,
      R: /^R\(\s*(-?(?:\d+\.\d+|\d+))\s*(?:,\s*(?:"([^"]+)"|(\w+))\s*)?(?:,\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*)?\)$/,
      S: /^S\(\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*(?:,\s*(?:"([^"]+)"|(\w+))\s*)?(?:,\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*)?\)$/,
      H: /^H\(\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-?(?:\d+\.\d+|\d+))\s*(?:,\s*(?:"([^"]+)"|(\w+))\s*)?(?:,\s*(-?(?:\d+\.\d+|\d+))\s*,\s*(-d+))\s*\)?\)$/,
      F: /^F\(\s*(true|false)\s*,\s*(true|false)\s*(?:,\s*(?:"([^"]+)"|(\w+))\s*,\s*(?:"([^"]+)"|(\w+))\s*)?\)$/
    };

    const firstChar = expr[0];
    const pattern = patterns[firstChar as keyof typeof patterns];
    if (!pattern) return null;

    const match = expr.match(pattern);
    if (!match) return null;

    switch (firstChar) {
      case 'T':
        return {
          tName: 'Translate',
          data: {
            x: parseFloat(match[1]),
            y: parseFloat(match[2]),
            type: match[3] ?? match[4] ?? 'a',
            px: match[5] !== undefined ? parseFloat(match[5]) : 0,
            py: match[6] !== undefined ? parseFloat(match[6]) : 0
          }
        };

      case 'S':
        return {
          tName: 'Scale',
          data: {
            sx: parseFloat(match[1]),
            sy: parseFloat(match[2]),
            type: match[3] ?? match[4] ?? 'a',
            px: match[5] !== undefined ? parseFloat(match[5]) : 0,
            py: match[6] !== undefined ? parseFloat(match[6]) : 0
          }
        };

      case 'H':
        return {
          tName: 'Skew',
          data: {
            sx: parseFloat(match[1]),
            sy: parseFloat(match[2]),
            type: match[3] ?? match[4] ?? 'a',
            px: match[5] !== undefined ? parseFloat(match[5]) : 0,
            py: match[6] !== undefined ? parseFloat(match[6]) : 0
          }
        };

      case 'R':
        return {
          tName: 'Rotate',
          data: {
            angle: parseFloat(match[1]),
            type: match[2] ?? match[3] ?? 'a',
            px: match[4] !== undefined ? parseFloat(match[4]) : 0,
            py: match[5] !== undefined ? parseFloat(match[5]) : 0
          }
        };

      case 'F':
        return {
          tName: 'Flip',
          data: {
            flipX: match[1] === 'true',
            flipY: match[2] === 'true',
            dirX: match[3] ?? match[4] ?? 'x+',
            dirY: match[5] ?? match[6] ?? 'y+'
          }
        };

      default:
        return null;
    }
  } catch (e) {
    //console.log('Error : ', e);
    throw e;
  }
}
