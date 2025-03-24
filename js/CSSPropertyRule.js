import CSSRuleModifiers from './CSSRuleModifiers';
import Color from './Color';

export default class CSSPropertyRule {

  constructor(rule) {
    this.rule = rule;
    this.syntax = rule.syntax;
    this.name = rule.name;
    this.initialValue = rule.initialValue;
    this.inherits = rule.inherits;
    this.selectorText = `@property ${rule.name}`;
    this.output = [];
    this.original = [];
    this.propertyNames = null;
  }

  initialize(context) {
    this.propertyNames = ['initial-value'];
    this.original.push(this.initialValue);
    this.output.push(this.initialValue);
    return this;
  }

  reset() {
    this.propertyNames.forEach((name, index) => (this.output[index] = this.original[index]));
  }

  modify(context) {
    this.propertyNames.forEach((name, index) => {
      CSSRuleModifiers.forEach(([matchName, validation, modifier]) => {
        if (typeof matchName === 'string' && matchName !== name) return;
        if (typeof matchName === 'function' && !matchName.call(context, name, '')) return;
        const value = modifier.call(context, this.output[index], this.original[index], this.rule, this.selectorText, this.propertyNames[index]);
        if (value === undefined) return;
        this.output[index] = value;
      });
    });
  }

  get styleSheetPart() {
    const leafRule = (spaces = 2) => {
      const shortSpace = ''.padStart(spaces - 2, ' ');
      const longSpace = ''.padStart(spaces, ' ');
      return `${shortSpace}${this.selectorText} {\n${longSpace}${this.propertyNames.map((name, index) => {
        return (`${name}: ${name === 'syntax' ? `'${this.output[index]}'` : `${this.output[index]}`};`);
      }).join(`\n${longSpace}`)}\n${longSpace}inherits: ${this.inherits};\n${longSpace}syntax: '${this.syntax}';\n${shortSpace}}`;
    };
    return leafRule();
  }

  isMatch() {
    return Boolean(this.syntax === '<color>' && this.propertyNames.length);
  }

  get distinctColors() {
    const colors = _.uniq(this.propertyNames.map((name, index) => {
      try {
        return Color.parse(this.original[index]);
      } catch (err) {
        return false;
      }
    }).filter(Boolean));
    return colors;
  }
}
