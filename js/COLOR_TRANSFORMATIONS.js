import Color from './Color';

const HIGH_CONTRAST = [
  [0, 10, 0], // Move 0-10 to 0
  [10, 71, 10, 30, false], // For 10-71 (not inclusive) move towards 10 not more than 30
  [70, 90, 90, 70, false], // For 70-90 (not inclusive) move towards 90 not less than 70
  [90, 100, 100] // Move 90-100 to 100
];

const LOW_BRIGHTNESS = [
  [0, 100, 0, 80, true] // For 0-100 move towards 0-70
];

function brightnessTransform(colors, instructions) {
  let brightnesses = colors.map(c => c.l);
  const output = [];
  instructions.forEach(grouping => {
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
    brightnesses = brightnesses.filter(brightness => {
      if ((!isInclusive && (brightness <= includeFrom || brightness >= includeTo)) || (isInclusive && (brightness < includeFrom || brightness > includeTo))) return true;
      if (isToAbsolute) {
        output.push(moveTowards);
        return false;
      }
      const normalized = brightness - moveTowards;
      const ratio = Math.abs(moveRange / includeRange);
      const corrected = normalized * ratio;
      const final = corrected + moveTowards;
      output.push(final);
      return false;
    });
  });
  return output;
};

export function highContrast(colors) {
  return brightnessTransform(colors, HIGH_CONTRAST).map((l, index) => {
    const c = colors[index];
    return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
  });
}

export function invert(colors) {
  return colors.map(c => Color.parse(`hsla(${c.h},${c.s},${100 - c.l},${c.a})`));
}

export function lowBrightness(colors) {
  return brightnessTransform(colors, LOW_BRIGHTNESS).map((l, index) => {
    const c = colors[index];
    return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
  });
}

export function applyProfileFilters(colors, colorProfileId) {
  return colors.map(c => c.clone().applyFilter(colorProfileId));
}
