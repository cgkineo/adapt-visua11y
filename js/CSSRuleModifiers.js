import Color from './Color';
import Colors from './Colors';

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
    // Remove text shadows
    'text-shadow',
    Boolean,
    function () {
      if (!this.noTransparency) return;
      return 'none';
    }
  ],
  [
    // Remove box shadows with transparency
    'box-shadow',
    Boolean,
    function (output) {
      if (!this.noTransparency) return;
      const zeroOffsetAndBlur = '0px 0px 0px';
      if (output.includes(zeroOffsetAndBlur)) return;
      return 'none';
    }
  ],
  [
    // Increase opacity either way
    'opacity',
    Boolean,
    function (output) {
      if (!this.noTransparency || isNaN(output)) return;
      return parseInt(output) <= 0.4 ? 0 : 1;
    }
  ],
  [
    // Remove background images
    'background-image',
    Boolean,
    function () {
      return this.noBackgroundImages ? 'none !important' : undefined;
    }
  ],
  [
    // Preserve transform properties (no modification)
    name => ['scale', 'transform', 'translate', 'rotate'].includes(name),
    null,
    output => output
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
      return Color.parse(output).applyTextContrast(this);
    }
  ],
  [
    // Increase opacity on colors
    name => /color/i.test(name),
    Color.parse,
    function (output) {
      return Color.parse(output).applyTransparency(this);
    }
  ],
  [
    // Apply output color profile to rule properties with 'color' in the name
    // where the name is not a defined property (so that they don't get processed twice)
    function (name) {
      return /color/i.test(name) && !this.cssPropertyNames?.includes(name);
    },
    Color.parse,
    function (output) {
      return Color.parse(output).applyColorProfile(this);
    }
  ],
  [
    // Apply output color profile to css color property rule 'initial-value'
    function (name) {
      return name === 'initial-value';
    },
    Color.parse,
    function (output) {
      return Color.parse(output).applyColorProfile(this);
    }
  ],
  [
    // Apply output color profile to properties containing many colour values
    name => [
      'background-image',
      'background'
    ].includes(name),
    Colors.has,
    function (output) {
      const color = Colors.parse(output).applyTransparency(this);
      return Colors.parse(color).applyColorProfile(this);
    }
  ],
  [
    // Apply output color profile to defined css color properties
    // where they are defined in rules
    function (name) {
      return this.cssPropertyNames?.includes(name);
    },
    Color.parse,
    function (output) {
      return Color.parse(output).applyColorProfile(this);
    }
  ]
];
