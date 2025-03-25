import CSSRuleModifiers from './CSSRuleModifiers';
import CSSPropertyRule from './CSSPropertyRule';
import Color from './Color';
import Colors from './Colors';

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
    const definedPropertyNames = Array.from(this.style);
    const calculatedPropertyNames = _.uniq(definedPropertyNames.map(name => {
      if (!/background/.test(name)) return name;
      // drop down from background-image to background if defined there instead
      // sometimes background-image is declared changed but background is set instead
      const prefixName = name.split('-')[0];
      const shouldCorrect = (this.style[prefixName] && !this.style[name]);
      if (shouldCorrect) return prefixName;
      return name;
    }));
    this.propertyNames = calculatedPropertyNames.concat(['margin-top', 'margin-bottom'])
      .filter(name => CSSRuleModifiers.some(([matchName, validation]) => {
        if (typeof matchName === 'string' && matchName !== name) return false;
        if (typeof matchName === 'function' && !matchName.call(context, name, this.selectorText)) return false;
        try {
          const original = (name.startsWith('--'))
            ? this.style.getPropertyValue(name)
            : this.style[name];
          if (validation && !validation.call(context, original)) return false;
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
    const colors = _.uniq(_.flatten(this.propertyNames.map((name, index) => {
      try {
        return Colors.parse(this.original[index]).distinctColors;
      } catch (err) {
        return false;
      }
    })).filter(Boolean).map(Color.toRGBAString)).map(Color.parse);
    return colors;
  }

  static getAllDefinedColorProperties(context) {
    const stylesheets = Array.prototype.slice.call(document.styleSheets, 0);
    const allCSSRules = stylesheets.reduce((allCSSRules, stylesheet) => {
      const rules = Array.prototype.slice.call(stylesheet.rules, 0);
      if (window.CSSPropertyRule) {
        allCSSRules.push(..._.flatten(rules.map(rule => {
          if (!(rule instanceof window.CSSPropertyRule)) return false;
          return new CSSPropertyRule(rule);
        })));
      }
      return allCSSRules.filter(Boolean);
    }, []);
    // Filter rules with valid modifier matches
    const rules = allCSSRules.map(rule => rule.initialize(context)).filter(rule => rule.isMatch());
    return rules;
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
      if (window.CSSPropertyRule) {
        allCSSRules.push(..._.flatten(rules.map(rule => {
          if (!(rule instanceof window.CSSPropertyRule)) return false;
          return new CSSPropertyRule(rule);
        })));
      }
      return allCSSRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText || rule.keyText);
    // Filter rules with valid modifier matches
    const rules = allCSSRules.map(rule => rule.initialize(context)).filter(rule => rule.isMatch());
    return rules;
  }

}
