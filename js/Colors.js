import Color from './Color';
import COLOR_NAMES from './COLOR_NAMES';

const SPECIFIC_NAMES = Object.entries(COLOR_NAMES)
  .filter(([name, value]) => name !== value)
  .map(([name]) => name);
const COLOR_MATCH = new RegExp(`(?:rgb|hsl)\\([^)]+\\)|(?:rgba|hsla)\\([^)]+\\)|#[\\da-f]{3,8}|${SPECIFIC_NAMES.join('|')}`, 'gmi');

export default class Colors {
  constructor(source) {
    this.source = source;
    const matches = String(source).matchAll(COLOR_MATCH);
    this.parts = matches.toArray();
  }

  get distinctColors() {
    const allColors = this.parts.map(part => Color.parse(part[0]).toRGBAString());
    const distinctColors = _.uniq(allColors).map(Color.parse);
    return distinctColors;
  }

  applyTransparency(context) {
    if (!this.length) return this.source;
    let output = '';
    const pair = [{ index: 0, 0: '' }];
    const finalLength = this.length;
    for (let i = 0, l = finalLength + 1; i < l; i++) {
      if (i === finalLength) {
        pair.push({
          index: this.source.length - 1,
          0: ''
        });
      } else {
        pair.push(this.parts[i]);
      }
      const [ firstPart, nextPart ] = pair;
      output += String(this.source).slice(firstPart.index + firstPart[0].length, nextPart.index);
      if (nextPart[0]) {
        const color = Color.parse(nextPart[0]);
        output += color.applyTransparency(context);
      } else {
        output += String(this.source).slice(nextPart.index, this.source.length);
      }
      pair.shift();
    }
    return output;
  }

  applyColorProfile(context) {
    if (!this.length) return this.source;
    let output = '';
    const pair = [{ index: 0, 0: '' }];
    const finalLength = this.length;
    for (let i = 0, l = finalLength + 1; i < l; i++) {
      if (i === finalLength) {
        pair.push({
          index: this.source.length - 1,
          0: ''
        });
      } else {
        pair.push(this.parts[i]);
      }
      const [ firstPart, nextPart ] = pair;
      output += String(this.source).slice(firstPart.index + firstPart[0].length, nextPart.index);
      if (nextPart[0]) {
        const color = Color.parse(nextPart[0]);
        output += color.applyColorProfile(context);
      } else {
        output += String(this.source).slice(nextPart.index, this.source.length);
      }
      pair.shift();
    }
    return output;
  }

  get length() {
    return this.parts.length;
  }

  static parse(colors) {
    return new Colors(colors);
  }

  static has(colors) {
    return Colors.parse(colors).length;
  }
}
