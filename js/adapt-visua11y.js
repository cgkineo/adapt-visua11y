import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import modifications from './modifications';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
  }

  get colorProfile() {
    return 'highcontrast';
  }

  get isInverted() {
    return true;
  }

  get documentFontSize() {
    return '18pt';
  }

  get disableAnimations() {
    return true;
  }

  get increaseOpacity() {
    return true;
  }

  get removeBackgroundImages() {
    return true;
  }

  onAdaptStart() {
    this.rules = this.getCSSRules();
    this.originalDocumentFontSize = window.getComputedStyle(document.querySelector('html')).fontSize;
    this.applyDocumentFontSize();
    this.applyDisableAnimations();
    this.applyInvertedStyling();
    this.applyModifications();
    this.applyOutputRules();
  }

  getCSSRules() {
    // Collect all rules
    const stylesheets = Array.prototype.slice.call(document.styleSheets, 0);
    const allRules = stylesheets.reduce((allRules, stylesheet) => {
      const rules = Array.prototype.slice.call(stylesheet.rules, 0);
      allRules.push(...rules.map(rule => {
        if (!(rule instanceof CSSStyleRule)) return false;
        return {
          selectorText: rule.selectorText,
          style: rule.style,
          output: {},
          original: {},
          colorPropertyNames: null
        };
      }));
      allRules.push(..._.flatten(rules.map(rule => {
        if (!(rule instanceof CSSMediaRule)) return false;
        const rules = Array.prototype.slice.call(rule.cssRules, 0);
        return rules.map(rule => {
          return {
            selectorText: rule.selectorText,
            style: rule.style,
            output: {},
            original: {},
            colorPropertyNames: null
          };
        });
      })));
      return allRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText);

    if (!document.body.style.backgroundColor) {
      // Force a background color of white if none specified
      document.body.style.backgroundColor = 'white';
      allRules.unshift({
        selectorText: 'body',
        style: document.body.style,
        output: {},
        original: {},
        colorPropertyNames: null
      });
    }

    // Filter colour rules add their hsla values and lightnesses
    const rules = allRules.filter(rule => {
      rule.colorPropertyNames = Array.prototype.slice.call(rule.style)
        .filter(name => {
          return modifications.some(([matchName, validation]) => {
            if (typeof matchName === 'string' && matchName !== name) return false;
            if (typeof matchName === 'function' && !matchName(name)) return false;
            try {
              validation && validation.call(this, rule.style[name]);
              rule.original[name] = rule.style[name];
              rule.output[name] = rule.style[name];
              return true;
            } catch (err) {
              return false;
            }
          });
        });
      return rule.colorPropertyNames.length;
    });
    return rules;
  }

  applyDocumentFontSize() {
    document.querySelector('html').style.fontSize = this.documentFontSize ?? this.originalDocumentFontSize;
  }

  applyDisableAnimations() {
    // Turn off jquery animations
    $.fx.off = this.disableAnimations;
    // Turn off velocity animations
    $.Velocity.mock = this.disableAnimations;
    // Turn off css transitions and animations
    $('html').toggleClass('is-animation-disabled', this.disableAnimations);
  }

  applyInvertedStyling() {
    $('html').toggleClass('is-color-inverted', this.isInverted);
  }

  applyModifications() {
    this.rules.forEach(rule => {
      rule.colorPropertyNames.forEach(name => {
        modifications.forEach(([matchName, validation, modifier]) => {
          if (typeof matchName === 'string' && matchName !== name) return;
          if (typeof matchName === 'function' && !matchName(name)) return;
          rule.output[name] = modifier.call(this, rule.output[name], rule.original[name]);
        });
      });
    });
  }

  applyOutputRules() {
    this.rules.forEach(rule => rule.colorPropertyNames.forEach(name => (rule.style[name] = rule.output[name])));
  }

}

export default new Visua11y();
