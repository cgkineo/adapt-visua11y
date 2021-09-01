import modifications from './modifications';
import Color from './Color';

export default class Rule {

  constructor({
    selectorText = '',
    style = null
  } = {}) {
    this.selectorText = selectorText;
    this.style = style;
    this.output = [];
    this.original = [];
    this.propertyNames = null;
  }

  initialize(context) {
    this.propertyNames = Array.prototype.slice.call(this.style)
      .filter(name => modifications.some(([matchName, validation]) => {
        if (typeof matchName === 'string' && matchName !== name) return false;
        if (typeof matchName === 'function' && !matchName.call(context, name)) return false;
        try {
          const original = this.style[name];
          validation && validation.call(context, original);
          this.original.push(original);
          this.output.push(original);
          return true;
        } catch (err) {
          return false;
        }
      }));
    return this;
  }

  reset() {
    this.propertyNames.forEach((name, index) => (this.output[index] = this.original[index]));
  }

  modify(context) {
    this.propertyNames.forEach((name, index) => {
      modifications.forEach(([matchName, validation, modifier]) => {
        if (typeof matchName === 'string' && matchName !== name) return;
        if (typeof matchName === 'function' && !matchName.call(context, name)) return;
        const value = modifier.call(context, this.output[index], this.original[index], this.style, this.selectorText);
        if (value === undefined) return;
        this.output[index] = value;
      });
    });
  }

  apply() {
    this.propertyNames.forEach((name, index) => (this.style[name] = this.output[index]));
  }

  isMatch() {
    return Boolean(this.propertyNames.length);
  }

  get distinctColors() {
    const colors = _.uniq(this.propertyNames.map((name, index) => {

      console.log(this.original[index]);
      try {
        return Color.parse(this.original[index]);
      } catch (err) {
        console.log('error', this.original[index]);
        return false;
      }
    }).filter(Boolean));
    return colors;
  }

  static getAllModifiable(context) {
    const stylesheets = Array.prototype.slice.call(document.styleSheets, 0);
    const allRules = stylesheets.reduce((allRules, stylesheet) => {
      const rules = Array.prototype.slice.call(stylesheet.rules, 0);
      allRules.push(...rules.map(rule => {
        if (!(rule instanceof CSSStyleRule)) return false;
        return new Rule(rule);
      }));
      allRules.push(..._.flatten(rules.map(rule => {
        if (!(rule instanceof CSSMediaRule)) return false;
        const rules = Array.prototype.slice.call(rule.cssRules, 0);
        return rules.map(rule => new Rule(rule));
      })));
      return allRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText);
    // Filter rules with valid modifier matches
    const rules = allRules.map(rule => rule.initialize(context)).filter(rule => rule.isMatch());
    return rules;
  }

}
