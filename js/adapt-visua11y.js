import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import device from 'core/js/device';
import CSSRule from './CSSRule';
import Color from './Color';
import DEFAULTS from './DEFAULTS';
import { highContrast, invert, lowBrightness, profileFilter } from './ColorTransformations';
import Visua11yButtonView from './Visua11yButtonView';
import notify from 'core/js/notify';

/**
 * Utility function for applying deep defaults
 * @param {Object} original
 * @param  {...Object} defaultObjects
 * @returns {Object} Returns original
 */
export function _deepDefaults(original, ...defaultObjects) {
  if (!original) return original;
  defaultObjects.reverse();
  defaultObjects.filter(Boolean).forEach(defaults => {
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
    this.injectSVG();
    this.apply = _.debounce(this.apply.bind(this), 50);
    this.listenTo(Adapt, 'configModel:dataLoaded', this.onPreAdaptStart);
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
    this._adaptStarted = false;
  }

  async injectSVG() {
    const response = await fetch('assets/visua11y-filters.svg');
    const text = await response.text();
    $('body').append($(text));
  }

  get config () {
    return _deepDefaults((this._adaptStarted ? Adapt.course : Adapt.config).get('_visua11y') ?? {}, DEFAULTS);
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
      if (this.highContrast) outputColors = highContrast(outputColors, this);
      if (this.invert) outputColors = invert(outputColors, this);
      if (this.lowBrightness) outputColors = lowBrightness(outputColors, this);
      this._outputColors = profileFilter(outputColors, this.colorProfileId);
    }
    const output = this._outputColors.slice(0);
    return output;
  }

  onPreAdaptStart() {
    // Language picker support
    if (!this.config?._isEnabled) return;
    this.setupStyleTag();
    this.measure();
    this.restore();
    this.setupNavigationButton();
    this.rules = CSSRule.getAllModifiable(this);
    this.apply();
  }

  onAdaptStart() {
    this._adaptStarted = true;
    if (!this.config?._isEnabled) return;
    if (this.rules) {
      this.setupNavigationButton();
      return;
    }
    this.setupStyleTag();
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
      $(tag).remove();
      return measures;
    }, {});
  }

  get tagMeasurements() {
    return this._tagMeasurements;
  }

  save() {
    const boolToInt = bool => bool ? 1 : 0;
    const largeMediumSmallToInt = (config, value) => {
      const values = [ config._large, config._medium, config._small ];
      const index = values.findIndex(v => String(v) === String(value));
      return (index >= 0) ? index : values.findIndex(v => String(v) === String(config._default));
    };
    const data = [
      Object.keys(DEFAULTS._colorProfiles).findIndex(k => k === this._colorProfileId) ?? 0,
      boolToInt(this._invert),
      largeMediumSmallToInt(this.config._fontSize, this._fontSize),
      largeMediumSmallToInt(this.config._lineHeight, this._lineHeight),
      largeMediumSmallToInt(this.config._letterSpacing, this._letterSpacing),
      largeMediumSmallToInt(this.config._wordSpacing, this._wordSpacing),
      largeMediumSmallToInt(this.config._paragraphSpacing, this._paragraphSpacing),
      boolToInt(this._noAnimations),
      boolToInt(this._highContrast),
      boolToInt(this._noTransparency),
      boolToInt(this._lowBrightness),
      boolToInt(this._noBackgroundImages),
      parseInt(this._highContrastLuminanceThreshold)
    ];
    Adapt.offlineStorage.set('v', Adapt.offlineStorage.serialize(data));
  }

  restore() {
    const intToBool = (config, value) => {
      if (value === undefined) return config._default;
      return Boolean(value);
    };
    const intToLargeMediumSmall = (config, value) => {
      if (value === undefined) return config._default;
      value = (value ?? 1);
      return (value === 0)
        ? config._large
        : (value === 2)
          ? config._small
          : config._medium;
    };
    const serialized = (this.config._shouldSavePreferences === false)
      ? null
      : Adapt.offlineStorage.get('v');
    const data = serialized ? Adapt.offlineStorage.deserialize(serialized) : [];
    this._colorProfileId = Object.keys(DEFAULTS._colorProfiles)[data[0] ?? Object.keys(DEFAULTS._colorProfiles).findIndex(k => k === this.config._colorProfile._default)];
    this._invert = intToBool(this.config._invert, data[1]);
    this._fontSize = intToLargeMediumSmall(this.config._fontSize, data[2]);
    this._lineHeight = intToLargeMediumSmall(this.config._lineHeight, data[3]);
    this._letterSpacing = intToLargeMediumSmall(this.config._letterSpacing, data[4]);
    this._wordSpacing = intToLargeMediumSmall(this.config._wordSpacing, data[5]);
    this._paragraphSpacing = intToLargeMediumSmall(this.config._paragraphSpacing, data[6]);
    this._noAnimations = intToBool(this.config._noAnimations, data[7]);
    this._highContrast = intToBool(this.config._highContrast, data[8]);
    this._noTransparency = intToBool(this.config._noTransparency, data[9]);
    this._lowBrightness = intToBool(this.config._lowBrightness, data[10]);
    this._noBackgroundImages = intToBool(this.config._noBackgroundImages, data[11]);
    this._highContrastLuminanceThreshold = data[12] ?? this.config._highContrastLuminanceThreshold._default;
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
    documentStyle.setProperty('--visua11y-color-profile-url', `url(#adapt-visua11y-${this.colorProfileId})`);
    documentStyle.setProperty('--visua11y-invert', this.invert ? '100%' : '0%');
    documentStyle.setProperty('--visua11y-contrast', this.highContrast ? '108%' : '100%');
    documentStyle.setProperty('--visua11y-brightness', this.lowBrightness ? '80%' : '100%');
    $html[0].style.fontSize = this.fontSize ?? '';
    // Turn off jquery animations
    $.fx.off = this.noAnimations;
    // Turn off velocity animations
    $.Velocity.mock = this.noAnimations;
    // Turn off css transitions & animations and background images
    // Add high contrast html class
    $html
      .toggleClass('a11y-high-contrast', this.highContrast)
      .toggleClass('a11y-invert', this.invert)
      .toggleClass('a11y-no-animations', this.noAnimations)
      .toggleClass('a11y-no-background-images', this.noBackgroundImages);
    this.rules.forEach(rule => rule.modify(this));
    const stylesheet = this.rules.map(rule => rule.styleSheetPart).filter(Boolean).join('\n');
    this._tag.html(stylesheet);
    $(window).resize();
    this.triggerChanged();
  }

  setupStyleTag () {
    const tag = $('<style id="visua11y"><style>');
    tag.appendTo('body');
    this._tag = tag;
  }

  triggerChanged() {
    this.trigger('changed');
    Adapt.trigger('visua11y:changed');
    this.forceRerender();
  }

  forceRerender() {
    if (device.browser !== 'safari') return;
    $('body').hide().show(0);
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
    this._highContrastLuminanceThreshold = this.config._highContrastLuminanceThreshold._default;
    this._noTransparency = this.config._noTransparency._default;
    this._lowBrightness = this.config._lowBrightness._default;
    this._noBackgroundImages = this.config._noBackgroundImages._default;
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    const documentStyle = document.documentElement.style;
    documentStyle.setProperty('--visua11y-color-profile-url', 'url(#adapt-visua11y-default)');
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
      .removeClass('a11y-high-contrast')
      .removeClass('a11y-no-animations')
      .removeClass('a11y-no-background-images');
    const stylesheet = this.rules.map(rule => rule.styleSheetPart).filter(Boolean).join('\n');
    this._tag.html(stylesheet);
    $(window).resize();
    this.triggerChanged();
    if (Adapt.visua11y.config.resetAriaMessage) {
      notify.create({
        _type: 'a11y-push',
        body: Adapt.visua11y.config.resetAriaMessage
      });
    }
  }
}

export default (Adapt.visua11y = new Visua11y());
