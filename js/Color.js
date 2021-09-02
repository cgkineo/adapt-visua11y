import NAMED_COLOR from './COLOR_NAMES';

class Color {

  constructor(color = null) {
    this.h = null;
    this.s = null;
    this.l = null;
    this.r = null;
    this.g = null;
    this.b = null;
    this.a = null;
    this.luminance = null;
    if (color === null) return;
    this.parseString(color);
  }

  clone() {
    const clone = new Color();
    clone.h = this.h;
    clone.s = this.s;
    clone.l = this.l;
    clone.r = this.r;
    clone.g = this.g;
    clone.b = this.b;
    clone.a = this.a;
    clone.luminance = this.luminance;
    clone.source = this.source;
    return clone;
  }

  parseString(color) {
    color = color.toLowerCase();
    this.source = color;
    const isHEX = color.startsWith('#');
    const isRGB = color.startsWith('rgb');
    const isHSL = color.startsWith('hsl');
    if (isHEX) return this.parseHEXAString(color);
    if (isRGB) return this.parseRGBAString(color);
    if (isHSL) return this.parseHSLAString(color);
    return this.parseCOLORNAME(color);
  }

  parseHSLAString(hsla) {
    const sep = hsla.indexOf(',') > -1 ? ',' : ' ';
    hsla = hsla.substr(5).split(')')[0].split(sep);
    if (hsla.indexOf('/') > -1) { hsla.splice(3, 1); }
    let h = hsla[0];
    let s = hsla[1]; // .substr(0, hsla[1].length - 1);
    let l = hsla[2]; // .substr(0, hsla[2].length - 1);
    const a = parseFloat(hsla[3] ?? 1);
    if (h.indexOf('deg') > -1) {
      h = h.substr(0, h.length - 3);
    } else if (h.indexOf('rad') > -1) {
      h = Math.round(h.substr(0, h.length - 3) * (180 / Math.PI));
    } else if (h.indexOf('turn') > -1) {
      h = Math.round(h.substr(0, h.length - 4) * 360);
    }
    if (h >= 360) { h %= 360; }
    h = parseFloat(h);
    s = parseFloat(s);
    l = parseFloat(l);
    this.h = h;
    this.s = s;
    this.l = l;
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    this.r = Math.round((r + m) * 255);
    this.g = Math.round((g + m) * 255);
    this.b = Math.round((b + m) * 255);
    this.luminance = ((this.r / 255 * 21.26) + (this.g / 255 * 71.52) + (this.b / 255 * 7.22));
    this.a = a;
    return this;
  }

  parseRGBAString(rgba) {
    const sep = rgba.indexOf(',') > -1 ? ',' : ' ';
    rgba = rgba.split('(')[1].split(')')[0].split(sep);
    // Strip the slash if using space-separated syntax
    if (rgba.indexOf('/') > -1) rgba.splice(3, 1);
    for (const R in rgba) {
      const r = rgba[R];
      if (r.indexOf('%') === -1) {
        rgba[R] = R < 3 ? parseInt(rgba[R]) : rgba[R];
        continue;
      }
      const p = r.substr(0, r.length - 1) / 100;
      rgba[R] = R < 3 ? Math.round(p * 255) : p;
    }
    const r = rgba[0] / 255;
    const g = rgba[1] / 255;
    const b = rgba[2] / 255;
    const a = parseFloat(rgba[3] ?? 1);
    // Find greatest and smallest channel values
    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;
    let h = 0;
    let s = 0;
    let l = 0;
    // Calculate hue
    // No difference
    if (delta === 0) {
      h = 0;
    } else if (cmax === r) {
    // Red is max
      h = ((g - b) / delta) % 6;
    } else if (cmax === g) {
    // Green is max
      h = (b - r) / delta + 2;
    } else {
    // Blue is max
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    // Make negative hues positive behind 360°
    if (h < 0) h += 360;
    // Calculate lightness
    l = (cmax + cmin) / 2;
    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    this.h = h;
    this.s = s;
    this.l = l;
    this.r = rgba[0];
    this.g = rgba[1];
    this.b = rgba[2];
    this.luminance = ((rgba[0] / 255 * 21.26) + (rgba[1] / 255 * 71.52) + (rgba[2] / 255 * 7.22));
    this.a = a;
    return this;
  }

  parseHEXAString(hex) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 255;
    if (hex.length === 5) {
      r = '0x' + hex[1] + hex[1];
      g = '0x' + hex[2] + hex[2];
      b = '0x' + hex[3] + hex[3];
      a = '0x' + hex[4] + hex[4];
    } else if (hex.length === 7) {
      r = '0x' + hex[1] + hex[2];
      g = '0x' + hex[3] + hex[4];
      b = '0x' + hex[5] + hex[6];
    } else if (hex.length === 9) {
      r = '0x' + hex[1] + hex[2];
      g = '0x' + hex[3] + hex[4];
      b = '0x' + hex[5] + hex[6];
      a = '0x' + hex[7] + hex[8];
    }
    a = +(a / 255).toFixed(3);
    this.parseRGBAString(`rgba(${parseInt(r)},${parseInt(g)},${parseInt(b)},${a})`);
    return this;
  }

  parseCOLORNAME(name) {
    name = name.toLowerCase();
    if (!NAMED_COLOR[name]) throw new Error(`Invalid color: ${name}`);
    this.parseHEXAString(NAMED_COLOR[name]);
    return this;
  }

  toRGBAString() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }

  toHEXString() {
    if (this.a === 0) {
      return '#00000000';
    }
    if (this.a === 1) {
      return `#${((1 << 24) + (parseInt(this.r) << 16) + (parseInt(this.g) << 8) + (parseInt(this.b))).toString(16).slice(1)}`.toLowerCase();
    }
    return `#${((1 << 24) + (parseInt(this.r) << 16) + (parseInt(this.g) << 8) + (parseInt(this.b))).toString(16).slice(1)}${((1 << 8) + parseInt(this.a * 255)).toString(16).slice(1)}`.toLowerCase();
  }

  toColorString() {
    const hex = this.toHEXString();
    return Object.entries(NAMED_COLOR).find(([name, h]) => h.toLocaleLowerCase() === hex)?.[0] ?? hex;
  }

  get isTransparent() {
    return (this.a === 0);
  }

  /** @returns {Color} */
  static get BLACK() {
    return (this._BLACK = (this._BLACK || new Color('black')));
  }

  /** @returns {Color} */
  static get WHITE() {
    return (this._WHITE = (this._WHITE || new Color('white')));
  }

  /** @returns {Color} */
  static get TRANSPARENT() {
    return (this._TRANSPARENT = (this._TRANSPARENT || new Color('transparent')));
  }

  static parse(color) {
    if (color instanceof Color) return color.clone();
    return new Color(color);
  }

  static isTransparent(color) {
    return Color.parse(color).isTransparent;
  }

  static bestLuminanceMatch(color, bottomColor, topColor) {
    const colorLuminance = Math.round(color.luminance);
    const rangeBottom = Math.round(bottomColor.luminance);
    const rangeTop = Math.round(topColor.luminance);
    const bottomDistance = Math.abs(colorLuminance - rangeBottom);
    const topDistance = Math.abs(colorLuminance - rangeTop);
    if (colorLuminance < rangeBottom || colorLuminance > rangeTop) {
      return false;
    }
    if (bottomDistance === topDistance && (color.a !== bottomColor.a || color.a !== topColor.a)) {
      if (color.a !== bottomColor.a && color.a !== topColor.a) return false;
      if (color.a === bottomColor.a) return bottomColor;
      return topColor;
    }
    return (bottomDistance <= topDistance) ? bottomColor : topColor;
  }

  static toRGBAString(color) {
    return Color.parse(color).toRGBAString();
  }

  static toHEXString(color) {
    return Color.parse(color).toHEXString();
  }

  static toColorString(color) {
    return Color.parse(color).toColorString();
  }

}

export default Color;
