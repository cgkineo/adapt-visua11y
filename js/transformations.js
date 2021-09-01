export const highContrast = [
  [0, 10, 0], // Move 0-10 to 0
  [10, 71, 10, 30, false], // For 10-71 (not inclusive) move towards 10 not more than 30
  [70, 90, 90, 70, false], // For 70-90 (not inclusive) move towards 90 not less than 70
  [90, 100, 100] // Move 90-100 to 100
];

export const lowBrightness = [
  [0, 100, 0, 80, true] // For 0-100 move towards 0-70
];

export function transform(brightnesses, instructions) {
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

export const filters = {
  '': [
    [ 1, 0, 0, 0, 0 ],
    [ 0, 1, 0, 0, 0 ],
    [ 0, 0, 1, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  achromatopsia: [
    [ 0.299, 0.587, 0.114, 0, 0 ],
    [ 0.299, 0.587, 0.114, 0, 0 ],
    [ 0.299, 0.587, 0.114, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  protanopia: [
    [ 0.567, 0.433, 0, 0, 0 ],
    [ 0.558, 0.442, 0, 0, 0 ],
    [ 0, 0.242, 0.758, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  deuteranopia: [
    [ 0.625, 0.375, 0, 0, 0 ],
    [ 0.7, 0.3, 0, 0, 0 ],
    [ 0, 0.3, 0.7, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  tritanopia: [
    [ 0.95, 0.05, 0, 0, 0 ],
    [ 0, 0.433, 0.567, 0, 0 ],
    [ 0, 0.475, 0.525, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  dyslexia: [
    [ 0.9, 0.1, 0, 0, 0 ],
    [ 0.1, 0.9, 0, 0, 0 ],
    [ 0, 0, 0.7, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  achromatomaly: [
    [ 0.618, 0.320, 0.062, 0, 0 ],
    [ 0.163, 0.775, 0.062, 0, 0 ],
    [ 0.163, 0.320, 0.516, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  deuteranomaly: [
    [ 0.8, 0.2, 0, 0, 0 ],
    [ 0.258, 0.742, 0, 0, 0 ],
    [ 0, 0.142, 0.858, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  tritanomaly: [
    [ 0.967, 0.033, 0, 0, 0 ],
    [ 0, 0.733, 0.267, 0, 0 ],
    [ 0, 0.183, 0.817, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ],
  protanomaly: [
    [ 0.817, 0.183, 0, 0, 0 ],
    [ 0.333, 0.667, 0, 0, 0 ],
    [ 0, 0.125, 0.875, 0, 0 ],
    [ 0, 0, 0, 1, 0 ]
  ]
};
