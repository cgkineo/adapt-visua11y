import Color from './Color';
import FILTERS from './COLOR_FILTERS';

const HIGH_CONTRAST = ({ _highContrastLuminanceThreshold }) => {
  return [
    [0, 10, 0], // Move 0-10 to 0
    [10, _highContrastLuminanceThreshold + 1, 10, 30, false], // For 10-71 (not inclusive) move towards 10 not more than 30
    [_highContrastLuminanceThreshold, 90, 90, 70, false], // For 70-90 (not inclusive) move towards 90 not less than 70
    [90, 100, 100] // Move 90-100 to 100
  ];
};

const LOW_BRIGHTNESS = config => {
  return [
    [0, 100, 0, 80, true] // For 0-100 move towards 0-70
  ];
};

function brightnessTransform(colors, instructions) {
  const brightnesses = colors.map(c => c.l);
  const output = [];
  brightnesses.forEach(brightness => {
    instructions.find(grouping => {
      const isToAbsolute = (grouping.length === 3);
      const [
        includeFrom,
        includeTo,
        moveTowards,
        moveEnd,
        isInclusive = true
      ] = grouping;
      const includeRange = includeTo - includeFrom;
      const moveRange = moveEnd - moveTowards;
      if ((!isInclusive && (brightness <= includeFrom || brightness >= includeTo)) || (isInclusive && (brightness < includeFrom || brightness > includeTo))) {
        return false;
      }
      if (isToAbsolute) {
        output.push(moveTowards);
        return true;
      }
      const normalized = brightness - moveTowards;
      const ratio = Math.abs(moveRange / includeRange);
      const corrected = normalized * ratio;
      const final = corrected + moveTowards;
      output.push(final);
      return true;
    });
  });
  return output;
};

export function highContrast(colors, config) {
  return brightnessTransform(colors, HIGH_CONTRAST(config)).map((l, index) => {
    const c = colors[index];
    return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
  });
}

export function invert(colors, config) {
  return colors.map(c => Color.parse(`hsla(${c.h},${c.s},${100 - c.l},${c.a})`));
}

export function lowBrightness(colors, config) {
  return brightnessTransform(colors, LOW_BRIGHTNESS(config)).map((l, index) => {
    const c = colors[index];
    return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
  });
}

export function profileFilter(colors, colorProfileId) {
  return colors.map(c => {
    const filter = FILTERS[colorProfileId];
    if (!filter) return c.clone();
    const R = c.r;
    const G = c.g;
    const B = c.b;
    const A = c.a;
    const r = (filter[0][0] * R) + (filter[0][1] * G) + (filter[0][2] * B) + (filter[0][3] * A) + filter[0][4];
    const g = (filter[1][0] * R) + (filter[1][1] * G) + (filter[1][2] * B) + (filter[1][3] * A) + filter[1][4];
    const b = (filter[2][0] * R) + (filter[2][1] * G) + (filter[2][2] * B) + (filter[2][3] * A) + filter[2][4];
    const a = (filter[3][0] * R) + (filter[3][1] * G) + (filter[3][2] * B) + (filter[3][3] * A) + filter[3][4];
    return Color.parse(`rgba(${r},${g},${b},${a})`);
  });
}
