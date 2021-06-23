import {
  COLORtoHSLAObject,
  HSLAObjectToRGBAString,
  invert,
  chooseAColor
} from './utils';
import PRIMARY_COLORS from './PRIMARY_COLORS';

/**
 * List of object representing stylesheet modifications
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
 * The this context of each function is a reference to Adapt.visua11y
 */
export default [
  [
    // Remove box shadows
    'box-shadow',
    null,
    function () {
      return 'none';
    }
  ],
  [
    // Increase opacity either way
    'opacity',
    null,
    function (output) {
      if (!this.increaseOpacity) return output;
      return output <= 0.4 ? 0 : 1;
    }
  ],
  [
    // Remove background images
    'background-image',
    null,
    function (output, original) {
      return this.removeBackgroundImages ? 'none' : original;
    }
  ],
  [
    // Change text to white / black
    'color',
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfile) return;
      const color = COLORtoHSLAObject(output);
      // Text: black or white
      const bottomColor = PRIMARY_COLORS[1];
      if (color.l <= 80) {
        // Force black if lightness is less than 80%
        const newColor = {
          ...bottomColor,
          a: color.a // Make sure to bring alpha through for later analysis
        };
        return HSLAObjectToRGBAString(newColor);
      }
      // Choose between black and white
      const topColor = PRIMARY_COLORS[PRIMARY_COLORS.length - 1];
      return HSLAObjectToRGBAString(chooseAColor(color, bottomColor, topColor, 100));
    }
  ],
  [
    // Change non-text colors to primary colors
    name => name !== 'color' && /color/i.test(name),
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfile) return;
      const color = COLORtoHSLAObject(output);
      for (let i = 1, l = PRIMARY_COLORS.length; i < l - 1; i++) {
        const bottomColor = PRIMARY_COLORS[i];
        const topColor = PRIMARY_COLORS[i + 1];
        const newColor = chooseAColor(color, bottomColor, topColor);
        if (newColor) return HSLAObjectToRGBAString(newColor);
      }
    }
  ],
  [
    // Increase text opacity either way
    name => /color/i.test(name),
    COLORtoHSLAObject,
    function (output) {
      if (!this.increaseOpacity) return;
      const color = COLORtoHSLAObject(output);
      const isTransparent = (color.a <= 0.4);
      if (isTransparent) {
        // No color opacity less than 0.4
        const newColor = { ...color, a: 0 };
        return HSLAObjectToRGBAString(newColor);
      }
      const isSemiTransparent = (color.a > 0.4 && color.a <= 0.99999);
      if (isSemiTransparent) {
        // Clip opacity between 0.4 and 0.99999
        const newColor = { ...color, a: 1 };
        return HSLAObjectToRGBAString(newColor);
      }
    }
  ],
  [
    // Invert colors accordingly
    name => /color/i.test(name),
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfile) return;
      const color = COLORtoHSLAObject(output);
      // Invert the color lightness if required (change to bright on black)
      color.l = this.isInverted ? invert(color.l, 100) : color.l;
      // Invert the color saturation if required (change to pastiles on white)
      color.s = this.isInverted ? color.s : color.s * 0.20;
      return HSLAObjectToRGBAString(color);
    }
  ]
];
