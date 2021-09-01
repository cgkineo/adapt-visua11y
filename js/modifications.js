import Color from './Color';

/**
 * List of objects representing stylesheet modifications
 *
 * Example:
 *
 * [
 *  {
 *    stylePropertyName|stylePropertyName(name), // string or function returning boolean
 *    null|validation(value), // function to throw error on failure
 *    modifier(output, original, style) // returns modified value or undefined
 *  }
 * ]
 *
 * The `this` context of each function is a reference to Adapt.visua11y
 */
export default [
  [
    // Remove box shadows
    'box-shadow',
    null,
    function () {
      if (!this.increaseOpacity) return;
      return 'none';
    }
  ],
  [
    // Increase opacity either way
    'opacity',
    null,
    function (output) {
      if (!this.increaseOpacity || isNaN(output)) return;
      return parseInt(output) <= 0.4 ? 0 : 1;
    }
  ],
  [
    // Remove background images
    'background-image',
    null,
    function () {
      return this.removeBackgroundImages ? 'none' : undefined;
    }
  ],
  [
    // Change line height
    // https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
    'line-height',
    null,
    function (output) {
      if (output === 'normal') output = 1.2;
      output = String(output);
      const value = parseFloat(output);
      if (isNaN(value)) return output;
      const lineHeightMultiplier = this.lineHeightMultiplier ?? 1;
      const adjusted = (value === 0)
        ? lineHeightMultiplier
        : value * lineHeightMultiplier;
      const unit = output.match(/[^0-9.]+/)?.[0];
      return adjusted + (unit ?? '');
    }
  ],
  [
    // Change letter spacing
    // https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing
    'letter-spacing',
    null,
    function (output) {
      if (output === 'normal') output = 0;
      output = String(output);
      const value = parseFloat(output);
      if (isNaN(value)) return output;
      const letterSpacingMultiplier = this.letterSpacingMultiplier ?? 1;
      const adjusted = (value === 0)
        ? (letterSpacingMultiplier - 1)
        : value * (letterSpacingMultiplier - 1);
      const unit = output.match(/[^0-9.]+/)?.[0];
      const modified = adjusted + (unit ?? 'em');
      return modified;
    }
  ],
  [
    // Change letter spacing
    // https://developer.mozilla.org/en-US/docs/Web/CSS/word-spacing
    'word-spacing',
    null,
    function (output) {
      if (output === 'normal') output = 0;
      output = String(output);
      const value = parseFloat(output);
      if (isNaN(value)) return output;
      const wordSpacingMultiplier = this.wordSpacingMultiplier ?? 1;
      const adjusted = (value === 0)
        ? (wordSpacingMultiplier - 1)
        : value * (wordSpacingMultiplier - 1);
      const unit = output.match(/[^0-9.]+/)?.[0];
      const modified = adjusted + (unit ?? 'em');
      return modified;
    }
  ],
  [
    // Change text to white / black
    'color',
    Color.parse,
    function (output) {
      if (!this.increaseContrast) return;
      const color = Color.parse(output); // COLORtoHSLAObject(output);
      if (color.isTransparent) return;
      // Text: black or white
      const bottomColor = Color.BLACK;
      if (color.luminance <= 80) {
        // Force black if lightness is less than 80%
        return bottomColor.toRGBAString();
      }
      // Choose between black and white
      const topColor = Color.WHITE;
      return Color.bestLuminanceMatch(color, bottomColor, topColor, 255).toRGBAString();
    }
  ],
  [
    // Increase opacity on colors
    function(name) {
      return /color/i.test(name);
    },
    Color.parse,
    function (output) {
      if (!this.increaseOpacity) return;
      const color = Color.parse(output); // COLORtoHSLAObject(output);
      const isTransparent = (color.a <= 0.4);
      if (isTransparent) {
        // No color opacity less than 0.4
        return Color.TRANSPARENT.toRGBAString();
      }
      // Bump opacity between 0.4 and 1 to 1
      color.a = 1;
      return color.toRGBAString();
    }
  ],
  [
    // Apply output color profile
    name => /color/i.test(name),
    Color.parse,
    function (output) {
      let color = Color.parse(output);
      if (color.isTransparent) return color.toRGBAString();
      const swapColor = this.outputColors;
      const colorIndex = this.distinctColors.findIndex(primaryColor => {
        return (color.r === primaryColor.r && color.g === primaryColor.g && color.b === primaryColor.b && color.a === primaryColor.a);
      });
      if (colorIndex !== -1) {
        color = swapColor[colorIndex].clone();
      }
      return color.toRGBAString();
    }
  ]
];
