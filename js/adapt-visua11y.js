import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import modifications from './modifications';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
  }

  get colorProfile() {
    return this._colorProfile;
  }

  set colorProfile(value) {
    this._colorProfile = value;
    this.apply();
  }

  get isInverted() {
    return this._isInverted;
  }

  set isInverted(value) {
    this._isInverted = value;
    this.apply();
  }

  get documentFontSize() {
    return this._documentFontSize;
  }

  set documentFontSize(value) {
    this._documentFontSize = value;
    this.apply();
  }

  get disableAnimations() {
    return this._disableAnimations;
  }

  set disableAnimations(value) {
    this._disableAnimations = value;
    this.apply();
  }

  get increaseOpacity() {
    return this._increaseOpacity;
  }

  set increaseOpacity(value) {
    this._increaseOpacity = value;
    this.apply();
  }

  get removeBackgroundImages() {
    return this._removeBackgroundImages;
  }

  set removeBackgroundImages(value) {
    this._removeBackgroundImages = value;
    this.apply();
  }

  onAdaptStart() {
    this._originalDocumentFontSize = window.getComputedStyle(document.querySelector('html')).fontSize;
    this._colorProfile = 'highcontrast';
    this._isInverted = true;
    this._documentFontSize = '18pt';
    this._disableAnimations = true;
    this._increaseOpacity = true;
    this._removeBackgoundImages = true;
    this.rules = this.getCSSRules();
    this.apply();
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
        return rules.map(rule => ({
          selectorText: rule.selectorText,
          style: rule.style,
          output: {},
          original: {},
          colorPropertyNames: null
        }));
      })));
      return allRules.filter(Boolean);
    }, []).filter(rule => rule.selectorText);
    // Force a background color of white if none specified
    if (!document.body.style.backgroundColor) {
      document.body.style.backgroundColor = 'white';
      allRules.unshift({
        selectorText: 'body',
        style: document.body.style,
        output: {},
        original: {},
        colorPropertyNames: null
      });
    }
    // Filter rules with valid modifications, capture their original values
    const rules = allRules.filter(rule => {
      rule.colorPropertyNames = Array.prototype.slice.call(rule.style)
        .filter(name => modifications.some(([matchName, validation]) => {
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
        }));
      return rule.colorPropertyNames.length;
    });
    return rules;
  }

  apply() {
    this.resetRules();
    this.applyColorProfile();
    this.applyDocumentFontSize();
    this.applyDisableAnimations();
    this.applyInvertedStyling();
    this.applyModifications();
    this.applyOutputRules();
    $(window).resize();
  }

  resetRules() {
    this.rules.forEach(rule => rule.colorPropertyNames.forEach(name => (rule.output[name] = rule.original[name])));
  }

  applyColorProfile() {
    $('html').toggleClass('has-color-profile', Boolean(this.colorProfile));
    $('html').attr('data-color-profile', `${this.colorProfile}${this.isInverted ? '-inverted' : ''}`);
  }

  applyDocumentFontSize() {
    document.querySelector('html').style.fontSize = this.documentFontSize ?? this._originalDocumentFontSize;
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
    $('html').toggleClass('is-color-inverted', Boolean(this.colorProfile && this.isInverted));
  }

  applyModifications() {
    this.rules.forEach(rule => rule.colorPropertyNames.forEach(name => {
      modifications.forEach(([matchName, validation, modifier]) => {
        if (typeof matchName === 'string' && matchName !== name) return;
        if (typeof matchName === 'function' && !matchName(name)) return;
        const value = modifier.call(this, rule.output[name], rule.original[name], rule.style);
        if (value === undefined) return;
        rule.output[name] = value;
      });
    }));
  }

  applyOutputRules() {
    this.rules.forEach(rule => rule.colorPropertyNames.forEach(name => (rule.style[name] = rule.output[name])));
  }

}

export default (Adapt.visua11y = new Visua11y());
