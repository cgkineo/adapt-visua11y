import CSSRuleModifiers from './CSSRuleModifiers';
import Color from './Color';

export default class CSSRule {

  constructor(rule) {
    this.rule = rule;
    this.selectorText = rule.selectorText ?? null;
    this.keyText = rule.keyText;
    this.style = rule.style;
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

  get styleSheetPart() {
    const parentRule = this.rule.parentRule;
    const leafRule = (spaces = 2) => {
      const shortSpace = ''.padStart(spaces - 2, ' ');
      const longSpace = ''.padStart(spaces, ' ');
      return `${shortSpace}${this.selectorText || this.keyText} {\n${longSpace}${this.propertyNames.map((name, index) => {
        const isImportant = (this.style.getPropertyPriority(name) === 'important');
        return (`${name}: ${this.output[index]}${isImportant ? ' !important' : ''};`);
      }).join(`\n${longSpace}`)}\n${shortSpace}}`;
    };
    if (parentRule) {
      if (parentRule instanceof CSSMediaRule) return `@media ${this.rule.parentRule.conditionText} {\n${leafRule(4)}\n}\n`;
      if (parentRule instanceof CSSKeyframesRule) {
        return `@keyframes ${this.rule.parentRule.name} {\n${leafRule(4)}\n}\n`;
      }
      throw new Error('parentRule type not supported:', parentRule);
    }
    return leafRule();
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
      allCSSRules.push(..._.flatten(rules.map(rule => {
        if (!(rule instanceof CSSKeyframesRule)) return false;
        const rules = Array.prototype.slice.call(rule.cssRules, 0);
        return rules.map(rule => new CSSRule(rule));
      })));
      return allCSSRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText || rule.keyText);
    // Filter rules with valid modifier matches
    const rules = allCSSRules.map(rule => rule.initialize(context)).filter(rule => rule.isMatch());
    return rules;
  }

}
