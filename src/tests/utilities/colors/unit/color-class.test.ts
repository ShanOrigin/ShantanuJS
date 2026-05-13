import { C } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';
import Color from '../../../../utils/colors/colors.js';

import { describe, test, expect } from 'vitest';

describe('Color Class testing : ', () => {
  const colors = [
    // Lowercase
    ['red', 'named'],
    ['rgb(90, 45, 20)', 'rgb'],
    ['rgba(70, 65, 80, 0.4)', 'rgba'],
    ['#3456', 'hex'],
    ['#7823aa', 'hex'],
    ['hsl(150, 50%, 90%)', 'hsl'],
    ['hsla(80, 96%, 70%, 0.7)', 'hsla'],
    // Uppercase
    ['RED', 'named'],
    ['RGB(90, 45, 20)', 'rgb'],
    ['RGBA(70, 65, 80, 0.4)', 'rgba'],
    ['#3456', 'hex'], // Hex is case-insensitive, but uppercase versions follow
    ['#7823AA', 'hex'],
    ['HSL(150, 50%, 90%)', 'hsl'],
    ['HSLA(80, 96%, 70%, 0.7)', 'hsla'],

    // Mixed case
    ['ReD', 'named'],
    ['RgB(90,45,20)', 'rgb'],
    ['RgBa(70,65,80,0.4)', 'rgba'],
    ['#7823aA', 'hex'],
    ['HsL(150, 50%, 90%)', 'hsl'],
    ['HsLa(80, 96%, 70%, 0.7)', 'hsla']
  ];

  colors.forEach((c) => {
    test(`checking Valid  colors ${c[0]} ->  `, () => {
      const colorT = new Color(c[0]);

      // console.log(colorT.isColor());

      expect(colorT.isColor()).toBe(c[0]);
    });
  });

  colors.forEach((c) => {
    test(`checking Valid colors Format and color fmt : ${c[1]} -> color : ${c[0]} ->  `, () => {
      const colorT = new Color(c[0]);

      const info = colorT.isColor('', true);

      expect(info[0]).toBe(c[1]);
      expect(info[1]).toBe(c[0]);
    });
  });

  colors.forEach((c) => {
    test(`checking Valid  color with .isColor() method not by Constructor  : ${c[0]} ->  `, () => {
      const colorT = new Color('none');

      expect(colorT.isColor(c[0])).toBe(c[0]);
    });
  });

  colors.forEach((c) => {
    test(`checking Valid color  with .isColor() method not by Constructor   Format and color fmt : ${c[1]} -> color : ${c[0]} ->  `, () => {
      const colorT = new Color('none');

      const info = colorT.isColor(c[0], true);

      expect(info[0]).toBe(c[1]);
      expect(info[1]).toBe(c[0]);
    });
  });

  // if given color is not color then by default it converted into 'none'
  const nonColors = [
    // Invalid named colors
    ['bluish', 'none'],
    ['redd', 'none'],
    ['greeen', 'none'],
    ['transparentish', 'none'],

    // Invalid hex values
    ['#fffh', 'none'], // Invalid character "h"
    ['#12345', 'none'], // 5 digits, not 3/4/6/8
    ['#1234567', 'none'], // 7 digits
    ['#12G', 'none'], // Invalid "G"
    ['#ZZZZZZ', 'none'], // Non-hex characters
    ['#123456789', 'none'], // Too long

    // Invalid RGB values (outside 0-255 range, wrong format)
    ['rgb(256, 0, 0)', 'none'],
    ['rgb(-1, 100, 100)', 'none'],
    ['rgb(90, 90)', 'none'], // Too few components
    ['rgb(90, 90, 90, 90)', 'none'], // Too many components
    ['rgb(300, 0, 0)', 'none'],
    ['rgb(90 90 90)', 'none'], // Missing commas
    ['rgb(90,90,)', 'none'], // Trailing comma

    // Invalid RGBA values
    ['rgba(255,255,255,2)', 'none'], // Alpha > 1
    ['rgba(255,255,255,-0.1)', 'none'], // Alpha < 0
    ['rgba(255,255,255,)', 'none'], // Missing alpha value
    ['rgba(255,255,255,abc)', 'none'], // Invalid alpha
    ['rgba(256,0,0,0.5)', 'none'], // Invalid RGB component

    // Invalid HSL values
    ['hsl(361, 50%, 50%)', 'none'], // Hue > 360
    ['hsl(-10, 50%, 50%)', 'none'], // Hue < 0
    ['hsl(120, 101%, 50%)', 'none'], // Saturation > 100%
    ['hsl(120, 50%, 101%)', 'none'], // Lightness > 100%
    ['hsl(120, 50, 50)', 'none'], // Missing % signs
    ['hsl(120,%,%)', 'none'], // Malformed

    // Invalid HSLA values
    ['hsla(400, 50%, 50%, 1)', 'none'], // Hue > 360
    ['hsla(120, 50%, 50%, 1.5)', 'none'], // Alpha > 1
    ['hsla(120, 50%, 50%, -0.5)', 'none'], // Alpha < 0
    ['hsla(120, 50%, 101%, 0.5)', 'none'], // Lightness > 100%
    ['hsla(120, 101%, 50%, 0.5)', 'none'], // Saturation > 100%
    ['hsla(120 50% 50% 0.5)', 'none'] // Missing commas
  ];

  nonColors.forEach((c) => {
    test(`checking non Valid colors ${c[0]} ->  `, () => {
      const colorT = new Color(c[0]);

      // console.log(colorT.isColor());

      expect(colorT.isColor()).toBe(c[1]);
    });
  });

  nonColors.forEach((c) => {
    test(`checking non Valid  colors Format and color fmt : ${c[1]} -> color : ${c[0]} ->  `, () => {
      const colorT = new Color(c[0]);

      const info = colorT.isColor('', true);

      expect(info[0]).toBe('named');
      expect(info[1]).toBe('none');
    });
  });

  nonColors.forEach((c) => {
    test(`checking non Valid  color with .isColor() method not by Constructor  : ${c[0]} ->  `, () => {
      const colorT = new Color('none');

      expect(colorT.isColor(c[0])).toBe('none');
    });
  });

  nonColors.forEach((c) => {
    test(`checking Valid color  with .isColor() method not by Constructor   Format and color fmt : ${c[1]} -> color : ${c[0]} ->  `, () => {
      const colorT = new Color('none');

      const info = colorT.isColor(c[0], true);

      expect(info[0]).toBe('named');
      expect(info[1]).toBe('none');
    });
  });

  const colorEquivalents = [
    ['#ff0000', 'red'],
    ['rgb(0, 0, 255)', 'blue'],
    ['rgba(0, 128, 0, 1)', 'green'],
    ['hsl(60, 100%, 50%)', 'yellow'],
    ['hsla(0, 100%, 50%, 1)', 'red'],
    ['#00ffff', 'aqua'],
    ['rgb(255, 165, 0)', 'orange'],
    ['rgba(128, 0, 128, 1)', 'purple'],
    ['hsl(120, 100%, 25%)', 'green'],
    ['hsla(240, 100%, 50%, 1)', 'blue'],
    ['white', 'white'],
    ['black', 'black'],
    ['gray', 'gray'],
    ['#f0f8ff', 'aliceblue'],
    ['rgb(250, 235, 215)', 'antiquewhite'],

    ['hsl(240, 100%, 50%)', 'blue'],

    ['#7fffd4', 'aquamarine'],
    ['rgb(127, 255, 212)', 'aquamarine'],
    ['rgba(165, 42, 42, 1)', 'brown'],
    ['#5f9ea0', 'cadetblue'],
    ['rgb(95, 158, 160)', 'cadetblue'],

    ['hsl(150, 100%, 50%)', 'springgreen'],

    ['#ff7f50', 'coral'],

    ['rgb(255, 105, 180)', 'hotpink'],
    ['hsl(330, 100%, 71%)', 'hotpink'],
    ['#9932cc', 'darkorchid'],
    ['rgba(139, 0, 0, 1)', 'darkred'],
    ['hsl(0, 100%, 27%)', 'darkred'],
    ['#8fbc8f', 'darkseagreen'],
    ['rgb(0, 206, 209)', 'darkturquoise']
  ];

  // These test cases won't match 100% of all color formats perfectly, but they provide ~90% accuracy across common formats.
  // This accounts for slight rounding differences in color conversions (e.g., HSL to RGB).
  colorEquivalents.forEach(([inputColor, expectedName]) => {
    test(`should correctly parse color format "${inputColor}" to match named color "${expectedName}"`, () => {
      const colorT = new Color('none');

      const parsed = colorT.parseColor(inputColor); // [r1, g1, b1, a1]
      const expected = colorT.parseColor(expectedName); // [r2, g2, b2, a2]

      // Allowing ±2 difference in RGB, ±0.1 in alpha
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(parsed[i] - expected[i])).toBeLessThanOrEqual(2);
      }
      expect(Math.abs(parsed[3] - expected[3])).toBeLessThanOrEqual(0.1);
    });
  });

  const colorConversions = [
    // [input, format, expected output]
    ['#ff0000', 'rgb', 'rgb(255, 0, 0)'],
    ['#ff0000', 'rgba', 'rgba(255, 0, 0, 1)'],
    ['rgb(0, 255, 0)', 'hex', '#00ff00'],
    ['rgba(0, 0, 255, 0.5)', 'hex', '#0000ff'],
    ['rgba(0, 0, 255, 0.5)', 'rgba', 'rgba(0, 0, 255, 0.5)'],
    ['#00ff00', 'hsl', 'hsl(120, 100%, 50%)'],
    ['#00ff00', 'hsla', 'hsla(120, 100%, 50%, 1)'],
    ['hsl(240, 100%, 50%)', 'rgb', 'rgb(0, 0, 255)'],
    ['hsla(0, 100%, 50%, 0.3)', 'rgba', 'rgba(255, 0, 0, 0.3)'],
    ['black', 'hex', '#000000'],
    ['white', 'rgba', 'rgba(255, 255, 255, 1)'],
    ['#ff0000', 'rgb', 'rgb(255, 0, 0)'],
    ['#ff0000', 'rgba', 'rgba(255, 0, 0, 1)'],
    ['#ff0000', 'lerp', [255, 0, 0, 1]],
    ['rgba(0, 0, 255, 0.5)', 'lerp', [0, 0, 255, 0.5]],
    ['rgb(0, 255, 0)', 'hex', '#00ff00'],
    ['#00ff00', 'hsl', 'hsl(120, 100%, 50%)'],
    ['#00ff00', 'hsla', 'hsla(120, 100%, 50%, 1)'],
    ['hsl(240, 100%, 50%)', 'rgb', 'rgb(0, 0, 255)'],
    ['hsla(0, 100%, 50%, 0.3)', 'rgba', 'rgba(255, 0, 0, 0.3)'],
    ['black', 'hex', '#000000'],
    ['white', 'rgba', 'rgba(255, 255, 255, 1)']
  ];

  colorConversions.forEach(([inputColor, format, expected]) => {
    test(`convertColor("${inputColor}", "${format}") => ${expected}`, () => {
      const colorT = new Color('none');
      const result = colorT.convertColor(
        inputColor as string,
        format as string
      );

      if (Array.isArray(result)) {
        // Handle lerp (array output)
        expect(Array.isArray(expected)).toBe(true);
        const expectedArr = expected as number[];
        for (let i = 0; i < 4; i++) {
          expect(Math.abs(result[i] - expectedArr[i])).toBeLessThanOrEqual(1); // or 0.1 for alpha
        }
      } else {
        // Handle string output (e.g., rgb, hex)
        expect(result.toLowerCase()).toBe((expected as string).toLowerCase());
      }
    });
  });
});
