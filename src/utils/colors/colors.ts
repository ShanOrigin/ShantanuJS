import { namedColorsList } from './colorsInfo.js';

export default class Colors {
  #color: string;
  constructor(color: string) {
    this.#color = color;
  }

  /**
   * Checks whether a given string represents a named CSS color.
   *
   * Purpose:
   * This method verifies if the provided color string matches a recognized named color
   * (like "red", "blue", "gold") using a predefined list of named colors.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a named color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Relies on a predefined `namedColorsList` object or array. Does NOT depend on DOM or graphics APIs.
   */

  #isNamedColor(color: string = ''): boolean {
    return color.toLowerCase() in namedColorsList;
  }

  /**
   * Checks whether a given string represents a valid hexadecimal color.
   *
   * Purpose:
   * Validates hex color formats such as `#fff`, `#ffffff`, `#ffff`, or `#ffffffff`.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a valid hex color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Pure string validation. No DOM or graphics dependencies.
   */

  #isHex(color: string = ''): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
      color
    );
  }

  /**
   * Checks whether a given string represents a valid RGB color.
   *
   * Purpose:
   * Validates strings like `rgb(255, 0, 128)` where each channel is 0-255.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a valid RGB color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Pure string validation. No DOM or graphics dependencies.
   */

  #isRGB(color: string = ''): boolean {
    return /^rgb\(\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*,\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*,\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*\)$/i.test(
      color
    );
  }

  /**
   * Checks whether a given string represents a valid RGBA color.
   *
   * Purpose:
   * Validates strings like `rgba(255, 0, 128, 0.5)` where the first three channels are 0-255
   * and alpha is 0-1.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a valid RGBA color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Pure string validation. No DOM or graphics dependencies.
   */

  #isRGBA(color: string = ''): boolean {
    return /^rgba\(\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*,\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*,\s*(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\s*,\s*(1|0|0?\.\d+)\s*\)$/i.test(
      color
    );
  }

  /**
   * Checks whether a given string represents a valid HSL color.
   *
   * Purpose:
   * Validates strings like `hsl(120, 50%, 50%)` where hue is 0-360 and saturation/lightness are 0%-100%.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a valid HSL color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Pure string validation. No DOM or graphics dependencies.
   */

  #isHSL(color: string = ''): boolean {
    return /^hsl\(\s*(?:360|3[0-5]\d|[12]?\d{1,2}|0)\s*,\s*(?:100|[1-9]?\d)%\s*,\s*(?:100|[1-9]?\d)%\s*\)$/i.test(
      color
    );
  }

  /**
   * Checks whether a given string represents a valid HSLA color.
   *
   * Purpose:
   * Validates strings like `hsla(120, 50%, 50%, 0.5)` where hue is 0-360, saturation/lightness are 0%-100%,
   * and alpha is 0-1.
   *
   * Parameters:
   * @param color - The color string to test. Defaults to an empty string if not provided.
   *
   * Returns:
   * - `true` if the string is a valid HSLA color.
   * - `false` otherwise.
   *
   * Dependencies:
   * - Pure string validation. No DOM or graphics dependencies.
   */

  #isHSLA(color: string = ''): boolean {
    return /^hsla\(\s*(?:360|3[0-5]\d|[12]?\d{1,2}|0)\s*,\s*(?:100|[1-9]?\d)%\s*,\s*(?:100|[1-9]?\d)%\s*,\s*(?:1|0|0?\.\d+)\s*\)$/i.test(
      color
    );
  }

  #isRGBo(color: string = ''): boolean {
    return /^rgb\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*\)$/i.test(
      color
    );
  }

  #isRGBAo(color: string = ''): boolean {
    return /^rgba\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]?[0-9])\s*(,\s*(0|1|0?\.\d+))?\s*\)$/i.test(
      color
    );
  }

  #isHSLo(color: string = ''): boolean {
    return /^hsl\(\s*(360|[1-9]?\d{1,2}|1[0-9]{2})\s*,\s*(\d{1,2}|100)%\s*,\s*(\d{1,2}|100)%\s*\)$/i.test(
      color
    );
  }

  #isHSLAo(color: string = ''): boolean {
    return /^hsla\(\s*(360|[1-9]?\d{1,2}|1[0-9]{2})\s*,\s*(\d{1,2}|100)%\s*,\s*(\d{1,2}|100)%\s*,?\s*(0|1|0?\.\d+)?\s*\)$/i.test(
      color
    );
  }

  /**
   * Determines if a given string represents a valid color and optionally returns its type.
   *
   * Purpose:
   * This method checks whether the provided color string matches one of several recognized formats:
   * named colors, RGB, RGBA, hex, HSL, or HSLA. It can optionally return the type of color along
   * with the validated string.
   *
   * Parameters:
   * @param color - The color string to test. If not provided, the method will use the internal
   *                default color stored in the class (`this.#color`).
   * @param info  - If `true`, returns a tuple `[type, color]` indicating both the color type
   *                and the validated color string. Defaults to `false`.
   *
   * Returns:
   * - If `info` is `false`: returns the validated color string or `'none'` if invalid.
   * - If `info` is `true`: returns `[type, color]`, where `type` is one of `'named'`, `'rgb'`,
   *   `'rgba'`, `'hex'`, `'hsl'`, `'hsla'`, or `'named'` with `'none'` for invalid colors.
   *
   * Behavior:
   * - Warns in the console if the input color format is invalid and defaults to `'none'`.
   * - Handles empty strings and uses an internal fallback color if needed.
   *
   * Dependencies:
   * - Relies on the private methods `#isNamedColor`, `#isRGB`, `#isRGBA`, `#isHex`, `#isHSL`,
   *   and `#isHSLA` for format validation.
   * - Does NOT depend on DOM or any graphics APIs.
   */

  public isColor(
    color: string = '',
    info: boolean = false
  ): string | [string, string] {
    try {
      const checks: [string, () => boolean][] = [
        ['named', this.#isNamedColor.bind(this)],
        ['rgb', this.#isRGB.bind(this)],
        ['rgba', this.#isRGBA.bind(this)],
        ['hex', this.#isHex.bind(this)],
        ['hsl', this.#isHSL.bind(this)],
        ['hsla', this.#isHSLA.bind(this)]
      ];

      const testColor = color != '' ? color : this.#color;

      for (const [type, check] of checks) {
        if ((check as (t: string) => boolean)(testColor)) {
          return info ? [type, testColor] : testColor;
        }
      }

      const hint = this.#color.trim().toLowerCase().split('(');
      const formatHint = checks.find(([type]) => type === hint[0]);
      const failedType = formatHint?.[0] || 'unknown';

      console.warn(
        `The given Format : ${failedType} -> Color  ${
          this.#color
        } is not in a proper color format. by default set 'none' = rgba(0,0,0,0)`
      );
      return info ? ['named', 'none'] : 'none';
    } catch (e) {
      console.error(e);
      return info ? ['named', 'none'] : 'none';
    }
  }

  /**
   * Converts a color string into an RGBA numeric array.
   *
   * Purpose:
   * This method parses a given color in various formats and returns its components as an
   * array `[R, G, B, A]`, where R, G, B are in 0–255 and A is 0–1. Supports multiple formats:
   * - Named CSS colors
   * - Hex codes (#RGB, #RRGGBB, #RRGGBBAA)
   * - RGB and RGBA strings
   * - HSL and HSLA strings (converted to RGB)
   *
   * Parameters:
   * @param color - A color string to parse. Defaults to the class’s internal color (`this.#color`)
   *                if not provided.
   *
   * Returns:
   * - Array `[R, G, B, A]` representing the color in RGBA numeric format.
   *
   * Behavior:
   * - Converts HSL/HSLA to RGB internally.
   * - Throws an error if the input color format is not recognized or invalid.
   *
   * Dependencies:
   * - Relies on internal methods: `#isNamedColor`, `#isHex`, `#isRGB`, `#isRGBA`, `#isHSL`, `#isHSLA`.
   * - Does NOT depend on DOM elements, graphics APIs, or canvas.
   */

  public parseColor(color: string = this.#color): number[] {
    color = color.trim().toLowerCase();

    // Named Color
    if (namedColorsList[color]) {
      return namedColorsList[color] as number[];
    }

    // Hex
    if (color.startsWith('#') && this.#isHex(color)) {
      let r: number,
        g: number,
        b: number,
        a = 1;
      if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else if (color.length === 7) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      } else if (color.length === 9) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
        a = parseInt(color.slice(7, 9), 16) / 255;
      } else {
        throw new Error('Invalid hex color');
      }
      return [r, g, b, a];
    }

    // RGB or RGBA
    const rgbMatch = color.match(
      /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
    );
    if ((this.#isRGB(color) || this.#isRGBA(color)) && rgbMatch) {
      return [
        parseFloat(rgbMatch[1]),
        parseFloat(rgbMatch[2]),
        parseFloat(rgbMatch[3]),
        rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
      ];
    }

    // HSL or HSLA
    const hslMatch = color.match(
      /hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/
    );
    if ((this.#isHSL(color) || this.#isHSLA(color)) && hslMatch) {
      const h = parseFloat(hslMatch[1]);
      const s = parseFloat(hslMatch[2]) / 100;
      const l = parseFloat(hslMatch[3]) / 100;
      const a = hslMatch[4] ? parseFloat(hslMatch[4]) : 1;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;
      let r = 0,
        g = 0,
        b = 0;

      if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
      else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
      else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
      else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
      else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
      else if (h >= 300 && h < 360) [r, g, b] = [c, 0, x];

      return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
        a
      ];
    }

    throw new Error('Unsupported color format');
  }

  /**
   * Converts a color from any supported format to a specified target format.
   *
   * Purpose:
   * This method takes a color string, parses it into numeric RGBA components, and then
   * converts it into the requested output format. Supported target formats include:
   * - "hex" → CSS hex string (#RRGGBB)
   * - "rgb" → CSS rgb() string
   * - "rgba" → CSS rgba() string
   * - "hsl" → CSS hsl() string
   * - "hsla" → CSS hsla() string
   * - "lerp" → numeric array `[R, G, B, A]` for interpolation purposes
   *
   * Parameters:
   * @param color - A string representing the input color in any supported format (named, hex, rgb/rgba, hsl/hsla).
   * @param targetFormat - A string indicating the desired output format ("hex", "rgb", "rgba", "hsl", "hsla", "lerp").
   *
   * Returns:
   * - The color in the requested format. Could be a string (CSS format) or an array of numbers if "lerp" is used.
   *
   * Dependencies:
   * - Relies on `parseColor()` internally for parsing input colors.
   * - Does NOT depend on DOM elements, graphics APIs, or canvas.
   *
   * Throws:
   * - An error if the target format is unsupported.
   */

  public convertColor(color: string, targetFormat: string): string | number[] {
    const [r, g, b, a] = this.parseColor(color);
    if (targetFormat == 'lerp') return [r, g, b, a];
    switch (targetFormat.toLowerCase()) {
      case 'hex':
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      case 'rgba':
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      case 'rgb':
        return `rgb(${r}, ${g}, ${b})`;
      case 'hsla':
      case 'hsl':
        const rNorm = r / 255,
          gNorm = g / 255,
          bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        let h = 0,
          s = 0,
          l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case rNorm:
              h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
              break;
            case gNorm:
              h = (bNorm - rNorm) / d + 2;
              break;
            case bNorm:
              h = (rNorm - gNorm) / d + 4;
              break;
          }

          h *= 60;
        }

        h = Math.round(h);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        if (targetFormat.toLowerCase() === 'hsla') {
          return `hsla(${h}, ${s}%, ${l}%, ${a})`;
        } else {
          return `hsl(${h}, ${s}%, ${l}%)`;
        }

      default:
        throw new Error('Unsupported target format');
    }
  }
}

/*
 *
const named = new Colors('skyblue');
const rgb = new Colors('rgba(23 , 46 , 67 , 0.6 )');


console.log(named.isColor());
console.log(rgb.isColor());

console.log(named.isColor('', true));
console.log(rgb.isColor('', true));

console.log(named.isColor('#ffff'));
console.log(rgb.isColor('rgb(77,34,56)'));

console.log(named.isColor('#ffff', true));
console.log(rgb.isColor('rgb(77,34,56)', true));

console.log(named.parseColor('#fff'));
console.log(rgb.parseColor('rgb(77,34,56)'));

console.log(named.parseColor('hsla(120,70%,90% , 0.4)'));
console.log(rgb.parseColor('rgba(2,84,58 , 0.7)'));

console.log(named.convertColor('#fff', 'rgb'));

console.log(named.convertColor('#fff', 'hsl'));

*/
