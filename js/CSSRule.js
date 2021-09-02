import CSSRuleModifiers from './CSSRuleModifiers';
import Color from './Color';

export default class CSSRule {

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
    this.propertyNames = Array.prototype.slice.call(this.style).concat(['margin-top', 'margin-bottom'])
      .filter(name => CSSRuleModifiers.some(([matchName, validation]) => {
        if (typeof matchName === 'string' && matchName !== name) return false;
        if (typeof matchName === 'function' && !matchName.call(context, name, this.selectorText)) return false;
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
      CSSRuleModifiers.forEach(([matchName, validation, modifier]) => {
        if (typeof matchName === 'string' && matchName !== name) return;
        if (typeof matchName === 'function' && !matchName.call(context, name, this.selectorText)) return;
        const value = modifier.call(context, this.output[index], this.original[index], this.style, this.selectorText, this.propertyNames[index]);
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
      try {
        return Color.parse(this.original[index]);
      } catch (err) {
        return false;
      }
    }).filter(Boolean));
    return colors;
  }

  static getAllModifiable(context) {
    const stylesheets = Array.prototype.slice.call(document.styleSheets, 0);
    const allCSSRules = stylesheets.reduce((allCSSRules, stylesheet) => {
      const rules = Array.prototype.slice.call(stylesheet.rules, 0);
      allCSSRules.push(...rules.map(rule => {
        if (!(rule instanceof CSSStyleRule)) return false;
        return new CSSRule(rule);
      }));
      allCSSRules.push(..._.flatten(rules.map(rule => {
        if (!(rule instanceof CSSMediaRule)) return false;
        const rules = Array.prototype.slice.call(rule.cssRules, 0);
        return rules.map(rule => new CSSRule(rule));
      })));
      return allCSSRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText);
    // Filter rules with valid modifier matches
    const rules = allCSSRules.map(rule => rule.initialize(context)).filter(rule => rule.isMatch());
    return rules;
  }

}
