import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import CSSRule from './CSSRule';
import Color from './Color';
import DEFAULTS from './DEFAULTS';
import { highContrast, invert, lowBrightness, profileFilter } from './ColorTransformations';
import Visua11yButtonView from './Visua11yButtonView';

/**
 * Utility function for applying deep defaults
 * @param {Object} original
 * @param  {...Object} defaultObjects
 * @returns {Object} Returns original
 */
export function _deepDefaults(original, ...defaultObjects) {
  defaultObjects.reverse();
  defaultObjects.forEach(defaults => {
    const keyValuePairs = Object.entries(defaults);
    keyValuePairs.forEach(([ key, defaultValue ]) => {
      const isRecursiveObject = (typeof defaultValue === 'object' && !Array.isArray(defaultValue) && defaultValue !== null);
      if (isRecursiveObject) {
        original[key] = _deepDefaults(original[key] || {}, defaultValue);
        return;
      }
      const isValueAlreadySet = Object.prototype.hasOwnProperty.call(original, key);
      if (isValueAlreadySet) return;
      original[key] = defaultValue;
    });
  });
  return original;
}

class Visua11y extends Backbone.Controller {

  initialize() {
    this.apply = _.debounce(this.apply.bind(this), 50);
    this.listenTo(Adapt, 'configModel:dataLoaded', this.onPreAdaptStart);
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
    this._adaptStarted = false;
  }

  get config () {
    return _deepDefaults((this._adaptStarted ? Adapt.course : Adapt.config).get('_visua11y'), DEFAULTS);
  }

  get colorProfiles() {
    return Object.entries(this.config._colorProfiles).map(([_id, name]) => ({ _id, name }));
  }

  get colorProfileId() {
    return this._colorProfileId;
  }

  set colorProfileId(value) {
    this._colorProfileId = value.toLowerCase();
    this._outputColors = null;
    this.apply();
  }

  get invert() {
    return this._invert;
  }

  set invert(value) {
    this._invert = value;
    this._outputColors = null;
    this.apply();
  }

  get originalFontSize() {
    return this._originalFontSize;
  }

  get fontSize() {
    return this._fontSize || this._originalFontSize;
  }

  set fontSize(value) {
    this._fontSize = value;
    this.apply();
  }

  get lineHeight() {
    return parseFloat(this._lineHeight);
  }

  set lineHeight(value) {
    this._lineHeight = value;
    this.apply();
  }

  get letterSpacing() {
    return parseFloat(this._letterSpacing);
  }

  set letterSpacing(value) {
    this._letterSpacing = value;
    this.apply();
  }

  get wordSpacing() {
    return parseFloat(this._wordSpacing);
  }

  set wordSpacing(value) {
    this._wordSpacing = value;
    this.apply();
  }

  get paragraphSpacing() {
    return parseFloat(this._paragraphSpacing);
  }

  set paragraphSpacing(value) {
    this._paragraphSpacing = value;
    this.apply();
  }

  get noAnimations() {
    return this._noAnimations;
  }

  set noAnimations(value) {
    this._noAnimations = value;
    this.apply();
  }

  get highContrast() {
    return this._highContrast;
  }

  set highContrast(value) {
    this._highContrast = value;
    this._outputColors = null;
    this.apply();
  }

  get noTransparency() {
    return this._noTransparency;
  }

  set noTransparency(value) {
    this._noTransparency = value;
    this.apply();
  }

  get lowBrightness() {
    return this._lowBrightness;
  }

  set lowBrightness(value) {
    this._lowBrightness = value;
    this._outputColors = null;
    this.apply();
  }

  get noBackgroundImages() {
    return this._noBackgroundImages;
  }

  set noBackgroundImages(value) {
    this._noBackgroundImages = value;
    this.apply();
  }

  get distinctColors() {
    if (this._distinctColors) return this._distinctColors;
    const allColors = _.uniq(_.flatten(this.rules.map(rule => rule.distinctColors)).map(Color.toRGBAString));
    const colors = allColors
      .map(Color.parse)
      .filter(color => !Color.isTransparent(color));
    this._distinctColors = [
      Color.BLACK,
      ...colors.sort((a, b) => a.luminance - b.luminance),
      Color.WHITE
    ];
    return this._distinctColors;
  }

  get outputColors() {
    if (!this._outputColors) {
      let outputColors = this.distinctColors;
      if (this.highContrast) outputColors = highContrast(outputColors);
      if (this.invert) outputColors = invert(outputColors);
      if (this.lowBrightness) outputColors = lowBrightness(outputColors);
      this._outputColors = profileFilter(outputColors, this.colorProfileId);
    }
    const output = this._outputColors.slice(0);
    return output;
  }

  onPreAdaptStart() {
    // Language picker support
    if (!this.config?._isEnabled) return;
    this.measure();
    this.restore();
    this.setupNavigationButton();
    this.rules = CSSRule.getAllModifiable(this);
    this.apply();
  }

  onAdaptStart() {
    this._adaptStarted = true;
    if (this.rules) {
      this.setupNavigationButton();
      return;
    }
    this.measure();
    this.restore();
    this.setupNavigationButton();
    this.rules = this.rules || CSSRule.getAllModifiable(this);
    this.apply();
  }

  measure() {
    const computedStyle = window.getComputedStyle(document.querySelector('html'));
    this._originalFontSize = computedStyle.fontSize;
    this._tagMeasurements = [
      'p'
    ].reduce((measures, tagName) => {
      const tag = document.createElement(tagName);
      document.body.appendChild(tag);
      const computedStyle = window.getComputedStyle(tag);
      measures[tagName] = {};
      for (const k in computedStyle) {
        try {
          measures[tagName][k] = computedStyle[k];
        } catch (err) {
        }
      }
      tag.remove();
      return measures;
    }, {});
  }

  get tagMeasurements() {
    return this._tagMeasurements;
  }

  save() {
    const cookies = document.cookie.split(';').map(a => a.trim());
    const index = cookies.findIndex(cookie => cookie.includes('visua11y='));
    if (index !== -1) cookies.splice(index, 1);
    const cookieValue = encodeURIComponent(JSON.stringify({
      id: this._colorProfileId,
      inv: this._invert,
      size: this._fontSize,
      lineh: this._lineHeight,
      letsp: this._letterSpacing,
      wordsp: this._wordSpacing,
      parasp: this._paragraphSpacing,
      anim: this._noAnimations,
      cont: this._highContrast,
      trans: this._noTransparency,
      brigh: this._lowBrightness,
      backimg: this._noBackgroundImages
    }));
    document.cookie = `visua11y=${cookieValue}; ${cookies.join('; ')};`;
  }

  restore() {
    const cookies = document.cookie.split(';');
    const index = cookies.findIndex(cookie => cookie.includes('visua11y='));
    const cookie = cookies[index];
    const value = cookie && JSON.parse(decodeURIComponent(cookie.replace('visua11y=', '')));
    this._colorProfileId = value?.id ?? this.config._colorProfile._default;
    this._invert = value?.inv ?? this.config._invert._default;
    this._fontSize = value?.size ?? this.config._fontSize._default;
    this._lineHeight = value?.lineh ?? this.config._lineHeight._default;
    this._letterSpacing = value?.letsp ?? this.config._letterSpacing._default;
    this._wordSpacing = value?.wordsp ?? this.config._wordSpacing._default;
    this._paragraphSpacing = value?.parasp ?? this.config._paragraphSpacing._default;
    this._noAnimations = value?.anim ?? this.config._noAnimations._default;
    this._highContrast = value?.cont ?? this.config._highContrast._default;
    this._noTransparency = value?.trans ?? this.config._noTransparency._default;
    this._lowBrightness = value?.brigh ?? this.config._lowBrightness._default;
    this._noBackgroundImages = value?.backimg ?? this.config._noBackgroundImages._default;
  }

  setupNavigationButton() {
    if (!this.config?._isEnabled) return;
    $('.nav__drawer-btn').after(new Visua11yButtonView().$el);
  }

  apply() {
    if (!this.config?._isEnabled) return;
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    this.colorProfileId ?
      $html.attr('data-color-profile', this.colorProfileId)
      : $html.removeAttr('data-color-profile');
    const documentStyle = document.documentElement.style;
    documentStyle.setProperty('--visua11y-color-profile-url', `url(assets/visua11y-filters.svg#${this.colorProfileId})`);
    documentStyle.setProperty('--visua11y-invert', this.invert ? '100%' : '0%');
    documentStyle.setProperty('--visua11y-contrast', this.highContrast ? '108%' : '100%');
    documentStyle.setProperty('--visua11y-brightness', this.lowBrightness ? '80%' : '100%');
    $html[0].style.fontSize = this.fontSize ?? '';
    // Turn off jquery animations
    $.fx.off = this.noAnimations;
    // Turn off velocity animations
    $.Velocity.mock = this.noAnimations;
    // Turn off css transitions & animations and background images
    $html
      .toggleClass('a11y-no-animations', this.noAnimations)
      .toggleClass('a11y-no-background-images', this.noBackgroundImages);
    this.rules.forEach(rule => rule.modify(this));
    this.rules.forEach(rule => rule.apply());
    $(window).resize();
    this.triggerChanged();
  }

  triggerChanged() {
    this.trigger('changed');
    Adapt.trigger('visua11y:changed');
  }

  reset() {
    this._colorProfileId = this.config._colorProfile._default;
    this._invert = this.config._invert._default;
    this._fontSize = this.config._fontSize._default;
    this._lineHeight = this.config._lineHeight._default;
    this._letterSpacing = this.config._letterSpacing._default;
    this._wordSpacing = this.config._wordSpacing._default;
    this._paragraphSpacing = this.config._paragraphSpacing._default;
    this._noAnimations = this.config._noAnimations._default;
    this._highContrast = this.config._highContrast._default;
    this._noTransparency = this.config._noTransparency._default;
    this._lowBrightness = this.config._lowBrightness._default;
    this._noBackgroundImages = this.config._noBackgroundImages._default;
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    const documentStyle = document.documentElement.style;
    documentStyle.setProperty('--visua11y-color-profile-url', 'url(assets/visua11y-filters.svg#default)');
    documentStyle.setProperty('--visua11y-invert', '0%');
    documentStyle.setProperty('--visua11y-contrast', '100%');
    documentStyle.setProperty('--visua11y-brightness', '100%');
    $html
      .removeAttr('data-color-profile')
      .removeAttr('data-color-inverted');
    $html[0].style.fontSize = '';
    // Turn off jquery animations
    $.fx.off = false;
    // Turn off velocity animations
    $.Velocity.mock = false;
    // Turn off css transitions & animations and background images
    $html
      .removeClass('a11y-no-animations')
      .removeClass('a11y-no-background-images');
    this.rules.forEach(rule => rule.apply());
    $(window).resize();
    this.triggerChanged();
  }
}

export default (Adapt.visua11y = new Visua11y());
