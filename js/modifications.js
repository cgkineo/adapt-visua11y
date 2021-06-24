import {
  COLORtoHSLAObject,
  HSLAObjectToRGBAString,
  chooseAColor
} from './utils';
import MATCH_COLOR from './MATCH_COLOR';
import NAMED_COLOR from './NAMED_COLOR';

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
      if (!this.increaseOpacity) return;
      return output <= 0.4 ? 0 : 1;
    }
  ],
  [
    // Remove background images
    'background-image',
    null,
    function (output, original, style) {
      return this.removeBackgroundImages ? 'none' : undefined;
    }
  ],
  [
    // Change text to white / black
    'color',
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfileId) return;
      const color = COLORtoHSLAObject(output);
      // Text: black or white
      const bottomColor = MATCH_COLOR[1];
      if (color.l <= 80) {
        // Force black if lightness is less than 80%
        const newColor = {
          ...bottomColor,
          a: color.a // Make sure to bring alpha through for later analysis
        };
        return HSLAObjectToRGBAString(newColor);
      }
      // Choose between black and white
      const topColor = MATCH_COLOR[MATCH_COLOR.length - 1];
      return HSLAObjectToRGBAString(chooseAColor(color, bottomColor, topColor, 100));
    }
  ],
  [
    // Change non-text colors to primary colors
    name => name !== 'color' && /color/i.test(name),
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfileId) return;
      const color = COLORtoHSLAObject(output);
      for (let i = 1, l = MATCH_COLOR.length; i < l - 1; i++) {
        const bottomColor = MATCH_COLOR[i];
        const topColor = MATCH_COLOR[i + 1];
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
        const newColor = COLORtoHSLAObject(NAMED_COLOR.transparent);
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
    // Apply named profile
    name => /color/i.test(name),
    COLORtoHSLAObject,
    function (output) {
      if (!this.colorProfileId) return;
      const SWAP_COLOR = this.colorProfiles.find(profile => profile._id === this.colorProfileId)._colors;
      if (!SWAP_COLOR) return;
      const swapColor = SWAP_COLOR.map(color => COLORtoHSLAObject(color));
      const color = COLORtoHSLAObject(output);
      const colorIndex = MATCH_COLOR.findIndex(primaryColor => {
        return (color.h === primaryColor.h && color.s === primaryColor.s && color.l === primaryColor.l && color.a === primaryColor.a);
      });
      if (colorIndex === -1) return;
      return HSLAObjectToRGBAString(swapColor[colorIndex]);
    }
  ]
];
