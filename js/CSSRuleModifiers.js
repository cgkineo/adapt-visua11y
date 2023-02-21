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
      if (!this.noTransparency) return;
      return 'none';
    }
  ],
  [
    // Increase opacity either way
    'opacity',
    null,
    function (output) {
      if (!this.noTransparency || isNaN(output)) return;
      return parseInt(output) <= 0.4 ? 0 : 1;
    }
  ],
  [
    // Remove background images
    'background-image',
    null,
    function () {
      return this.noBackgroundImages ? 'none !important' : undefined;
    }
  ],
  [
    // Filter psuedo element background images
    (name, selector) => {
      return (selector && name === 'background-image') && (
        String(selector).endsWith(':before') ||
        String(selector).endsWith(':after')
      );
    },
    null,
    function (output, original, style) {
      if (output === 'none') return;
      style.filter = 'invert(var(--visua11y-invert)) var(--visua11y-color-profile-url) contrast(var(--visua11y-contrast)) brightness(var(--visua11y-brightness))';
      return output;
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
      const lineHeight = this.lineHeight ?? 1;
      const adjusted = (value === 0)
        ? lineHeight
        : value * lineHeight;
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
      const spacing = this.letterSpacing ?? 1;
      const adjusted = (value === 0)
        ? (spacing - 1)
        : value * (spacing - 1);
      const unit = output.match(/[^0-9.]+/)?.[0];
      const modified = adjusted + (unit ?? 'em');
      return modified;
    }
  ],
  [
    // Change word spacing
    // https://developer.mozilla.org/en-US/docs/Web/CSS/word-spacing
    'word-spacing',
    null,
    function (output) {
      if (output === 'normal') output = 0;
      output = String(output);
      const value = parseFloat(output);
      if (isNaN(value)) return output;
      const spacing = this.wordSpacing ?? 1;
      const adjusted = (value === 0)
        ? (spacing - 1)
        : value * (spacing - 1);
      const unit = output.match(/[^0-9.]+/)?.[0];
      const modified = adjusted + (unit ?? 'em');
      return modified;
    }
  ],
  [
    // Change paragraph spacing
    // https://developer.mozilla.org/en-US/docs/Web/CSS/word-spacing
    (name, selector) => {
      if (!selector || !['margin-top', 'margin-bottom', 'margin-block-start', 'margin-block-end'].some(p => p === name)) return;
      const elements = selector.split(/[*, >~+|]/).filter(Boolean).map(e => e.toLowerCase());
      if (elements.length === 0) return;
      const isPTagSelector = [elements[0], elements[elements.length - 1]].some(e => (/^p[^\w]+/.test(e) || e === 'p') && !e.includes(':'));
      return isPTagSelector;
    },
    null,
    function (output, original, style, selector, propertyName) {
      if (output === '') {
        const camelPropertyName = propertyName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        output = this.tagMeasurements.p[camelPropertyName];
        output = (parseFloat(output) / parseFloat(this.originalFontSize)) + 'em';
      }
      output = String(output);
      const value = parseFloat(output);
      if (isNaN(value)) return output;
      const spacing = this.paragraphSpacing ?? 1;
      const adjusted = value * spacing;
      const unit = output.match(/[^0-9.]+/)?.[0];
      const modified = adjusted + (unit ?? 0);
      return modified;
    }
  ],
  [
    // Change text to white / black
    'color',
    Color.parse,
    function (output) {
      if (!this.highContrast) return;
      const color = Color.parse(output);
      if (color.isTransparent) return;
      // Text: black or white
      if (color.luminance <= 80) {
        // Force black if lightness is less than 80%
        return Color.BLACK.toRGBAString();
      }
      // Choose between black and white
      return Color.bestLuminanceMatch(color, Color.BLACK, Color.WHITE).toRGBAString();
    }
  ],
  [
    // Increase opacity on colors
    name => /color/i.test(name),
    Color.parse,
    function (output) {
      if (!this.noTransparency) return;
      const color = Color.parse(output);
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
      const colorIndex = this.distinctColors.findIndex(primaryColor => {
        return (color.r === primaryColor.r && color.g === primaryColor.g && color.b === primaryColor.b && color.a === primaryColor.a);
      });
      if (colorIndex !== -1) {
        color = this.outputColors[colorIndex].clone();
      }
      return color.toRGBAString();
    }
  ]
];
