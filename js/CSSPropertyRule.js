import CSSRuleModifiers from './CSSRuleModifiers';
import Color from './Color';

const PROPERTY_NAME_TRANSLATION = {
  'initial-value': 'initialValue'
};

export default class CSSPropertyRule {

  constructor(rule) {
    this.rule = rule;
    this.isColor = (rule.syntax === '<color>');
    this.selectorText = this.isColor ? `@property ${rule.name}` : '';
    this.output = [];
    this.original = [];
    this.propertyNames = null;
  }

  initialize(context) {
    if (!this.isColor) return;
    this.propertyNames = ['initial-value', 'inherits', 'syntax'];
    this.propertyNames.filter(name => CSSRuleModifiers.some(([matchName, validation]) => {
      try {
        const original = this.rule[PROPERTY_NAME_TRANSLATION[name] ?? name];
        validation && validation.call(context, original);
        this.original.push(original);
        this.output.push(original);
        return true;
      } catch (err) {
        return true;
      }
    }));
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
      }).join(`\n${longSpace}`)}\n${shortSpace}}`;
    };
    return leafRule();
  }

  isMatch() {
    return Boolean(this.isColor && this.propertyNames.length);
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
