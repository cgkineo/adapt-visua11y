import NAMED_COLOR from './NAMED_COLOR';

export function COLORtoHSLAObject(c) {
  c = c.toLowerCase();
  const isHEX = c.startsWith('#');
  const isRGB = c.startsWith('rgb');
  const isHSL = c.startsWith('hsl');
  const hsla = isHSL
    ? HSLAStringToObject(c)
    : isRGB
      ? RGBAStringToHSLAObject(c)
      : isHEX
        ? RGBAStringToHSLAObject(HEXAStringtoRGBAString(c))
        : RGBAStringToHSLAObject(HEXAStringtoRGBAString(COLORNAMEtoHEXString(c)));
  hsla.source = c;
  return hsla;
}

export function HSLAStringToObject(hsla) {
  const sep = hsla.indexOf(',') > -1 ? ',' : ' ';
  hsla = hsla.substr(5).split(')')[0].split(sep);
  if (hsla.indexOf('/') > -1) { hsla.splice(3, 1); }
  let h = hsla[0];
  const s = hsla[1].substr(0, hsla[1].length - 1) / 100;
  const l = hsla[2].substr(0, hsla[2].length - 1) / 100;
  const a = parseFloat(hsla[3] ?? 1);
  if (h.indexOf('deg') > -1) {
    h = h.substr(0, h.length - 3);
  } else if (h.indexOf('rad') > -1) {
    h = Math.round(h.substr(0, h.length - 3) * (180 / Math.PI));
  } else if (h.indexOf('turn') > -1) {
    h = Math.round(h.substr(0, h.length - 4) * 360);
  }
  if (h >= 360) { h %= 360; }
  return { h, s, l, a };
}

export function COLORNAMEtoHEXString(n) {
  n = n.toLowerCase();
  if (!NAMED_COLOR[n]) throw new Error(`Invalid color: ${n}`);
  return NAMED_COLOR[n];
}

export function HEXAStringtoRGBAString(h) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 255;
  if (h.length === 5) {
    r = '0x' + h[1] + h[1];
    g = '0x' + h[2] + h[2];
    b = '0x' + h[3] + h[3];
    a = '0x' + h[4] + h[4];
  } else if (h.length === 7) {
    r = '0x' + h[1] + h[2];
    g = '0x' + h[3] + h[4];
    b = '0x' + h[5] + h[6];
  } else if (h.length === 9) {
    r = '0x' + h[1] + h[2];
    g = '0x' + h[3] + h[4];
    b = '0x' + h[5] + h[6];
    a = '0x' + h[7] + h[8];
  }
  a = +(a / 255).toFixed(3);
  return `rgba(${r},${g},${b},${a})`;
}

export function RGBAStringToHSLAObject(rgba) {
  const sep = rgba.indexOf(',') > -1 ? ',' : ' ';
  rgba = rgba.split('(')[1].split(')')[0].split(sep);
  // Strip the slash if using space-separated syntax
  if (rgba.indexOf('/') > -1) rgba.splice(3, 1);
  for (const R in rgba) {
    const r = rgba[R];
    if (r.indexOf('%') === -1) continue;
    const p = r.substr(0, r.length - 1) / 100;
    rgba[R] = R < 3 ? Math.round(p * 255) : p;
  }
  // Make r, g, and b fractions of 1
  const r = rgba[0] / 255;
  const g = rgba[1] / 255;
  const b = rgba[2] / 255;
  const brightness = RGBABrightness(r, g, b);
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
  return { h, s, l, a, b: brightness };
}

export function HSLAObjectToRGBAString(hsla) {
  let { h, s, l, a } = hsla;
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
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export function invert(value, max) {
  // return value;
  return max - value;
}

export function RGBABrightness(r, g, b) {
  /*
    From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast
    Color brightness is determined by the following formula:
    ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000
    I know this could be more compact, but I think this is easier to read/explain.
  */
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 10;
  return brightness;
}
