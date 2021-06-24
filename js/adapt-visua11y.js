import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import modifications from './modifications';
import { COLORtoHSLAObject, HSLAObjectToRGBAObject, RGBAObjecttoHEX, HEXtoCOLOR } from './utils';
import PROFILES from './PROFILES';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
  }

  get colorProfileName() {
    return this.colorProfiles.find(prof => prof._id === this._colorProfileId)?.name;
  }

  get colorProfileId() {
    return this._colorProfileId;
  }

  set colorProfileId(value) {
    this._colorProfileId = value;
    this.apply();
  }

  get colorProfiles() {
    return Adapt.course.get('_visua11y')._profiles.map(profile => {
      const found = PROFILES.find(prof => prof._id === profile._id);
      const override = found
        ? {
          ...found,
          ...profile
        }
        : profile;
      if ($('html').is('.ie') && found._invert) {
        override._colors = override._colors.map(color => {
          const hsla = COLORtoHSLAObject(color);
          const rgba = HSLAObjectToRGBAObject(hsla);
          rgba.r = 255 - rgba.r;
          rgba.g = 255 - rgba.g;
          rgba.b = 255 - rgba.b;
          return RGBAObjecttoHEX(rgba);
        });
      }
      return override;
    });
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
    this._colorProfileId = '';
    this._documentFontSize = null;
    this._disableAnimations = false;
    this._increaseOpacity = false;
    this._removeBackgroundImages = false;
    this.rules = this.getCSSRules();
    this.apply();
  }

  printSortedProfiles() {
    this.colorProfiles.forEach(profile => {
      if (!profile._colors) return;
      console.log(profile._id);
      console.log(JSON.stringify(profile._colors.map(color => COLORtoHSLAObject(color)).sort((a, b) => {
        return a.b - b.b;
      }).map(HSLAObjectToRGBAObject).map(RGBAObjecttoHEX).map(HEXtoCOLOR), null, 2));
    });
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
    if (Adapt.course.get('_visua11y')?._isEnabled) {
      this.applyColorProfile();
      this.applyDocumentFontSize();
      this.applyDisableAnimations();
      this.applyModifications();
      this.applyRemoveBackgroundImages();
    } else {
      this.removeColorProfile();
      this.removeDocumentFontSize();
      this.removeDisableAnimations();
      this.removeRemoveBackgroundImages();
    }
    this.applyOutputRules();
    $(window).resize();
  }

  resetRules() {
    this.rules.forEach(rule => rule.colorPropertyNames.forEach(name => (rule.output[name] = rule.original[name])));
  }

  applyColorProfile() {
    const profileId = `${this.colorProfileId}${this.isMediaInverted ? '-inverted' : ''}`;
    const $html = $('html');
    $html.toggleClass('has-color-profile', Boolean(this.colorProfileId));
    profileId ? $html.attr('data-color-profile', profileId) : $html.removeAttr('data-color-profile');
  }

  removeColorProfile() {
    $('html')
      .removeClass('has-color-profile')
      .removeAttr('data-color-profile');
  }

  applyDocumentFontSize() {
    document.querySelector('html').style.fontSize = this.documentFontSize ?? this._originalDocumentFontSize;
  }

  removeDocumentFontSize() {
    document.querySelector('html').style.fontSize = this._originalDocumentFontSize;
  }

  applyDisableAnimations() {
    // Turn off jquery animations
    $.fx.off = this.disableAnimations;
    // Turn off velocity animations
    $.Velocity.mock = this.disableAnimations;
    // Turn off css transitions and animations
    $('html').toggleClass('a11y-disable-animations', this.disableAnimations);
  }

  removeDisableAnimations() {
    // Turn off jquery animations
    $.fx.off = false;
    // Turn off velocity animations
    $.Velocity.mock = false;
    // Turn off css transitions and animations
    $('html').removeClass('a11y-disable-animations');
  }

  applyRemoveBackgroundImages() {
    // Turn off background images
    $('html').toggleClass('a11y-remove-background-images', this.removeBackgroundImages);
  }

  removeRemoveBackgroundImages() {
    // Turn off background images
    $('html').removeClass('a11y-remove-background-images');
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
