import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import Rule from './Rule';
import Color from './Color';
import PROFILES from './PROFILES';
import { transform, highContrast, lowBrightness } from './transformations';
import Visua11yButtonView from './Visua11yButtonView';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.triggerChanged = _.debounce(this.triggerChanged.bind(this), 50);
    this.apply = _.debounce(this.apply.bind(this), 50);
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
  }

  get colorProfiles() {
    const profiles = Adapt.course.get('_visua11y')._profiles || PROFILES;
    return profiles.map(profile => {
      const found = PROFILES.find(prof => prof._id === profile._id);
      const override = found
        ? {
          ...found,
          ...profile
        }
        : profile;
      return override;
    });
  }

  get colorProfileId() {
    return this._colorProfileId;
  }

  set colorProfileId(value) {
    this._colorProfileId = value;
    this._outputColors = null;
    this.apply();
  }

  get colorProfile() {
    return this.colorProfiles.find(profile => profile._id === this.colorProfileId);
  }

  get colorProfileName() {
    return this.colorProfile?.name;
  }

  get isInverted() {
    return this._isInverted;
  }

  set isInverted(value) {
    this._isInverted = value;
    this._outputColors = null;
    this.apply();
  }

  get originalDocumentFontSize() {
    return this._originalDocumentFontSize;
  }

  get documentFontSize() {
    return this._documentFontSize || this._originalDocumentFontSize;
  }

  set documentFontSize(value) {
    this._documentFontSize = value;
    this.apply();
  }

  get lineHeightMultiplier() {
    return parseFloat(this._lineHeightMultiplier);
  }

  set lineHeightMultiplier(value) {
    this._lineHeightMultiplier = value;
    this.apply();
  }

  get letterSpacingMultiplier() {
    return parseFloat(this._letterSpacingMultiplier);
  }

  set letterSpacingMultiplier(value) {
    this._letterSpacingMultiplier = value;
    this.apply();
  }

  get wordSpacingMultiplier() {
    return parseFloat(this._wordSpacingMultiplier);
  }

  set wordSpacingMultiplier(value) {
    this._wordSpacingMultiplier = value;
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

  get increaseContrast() {
    return this._increaseContrast;
  }

  set increaseContrast(value) {
    this._increaseContrast = value;
    this._outputColors = null;
    this.apply();
  }

  get decreaseBrightness() {
    return this._decreaseBrightness;
  }

  set decreaseBrightness(value) {
    this._decreaseBrightness = value;
    this._outputColors = null;
    this.apply();
  }

  get removeBackgroundImages() {
    return this._removeBackgroundImages;
  }

  set removeBackgroundImages(value) {
    this._removeBackgroundImages = value;
    this.apply();
  }

  get distinctColors() {
    if (this._distinctColors) return this._distinctColors;

    const allColors = _.uniq(_.flatten(this.rules.map(rule => rule.distinctColors)).map(Color.toColorString));
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
      const distinctColors = this.distinctColors;
      let outputColors = distinctColors;
      if (this.increaseContrast) {
        const brightnesses = outputColors.map(c => c.l);
        outputColors = transform(brightnesses, highContrast).map((l, index) => {
          const c = outputColors[index];
          return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
        });
      }
      if (this.isInverted) {
        outputColors = outputColors.map(c => this.isInverted ? Color.parse(`hsla(${c.h},${c.s},${100 - c.l},${c.a})`) : c);
      }
      if (this.decreaseBrightness) {
        const brightnesses = outputColors.map(c => c.l);
        outputColors = transform(brightnesses, lowBrightness).map((l, index) => {
          const c = outputColors[index];
          return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
        });
      }
      this._outputColors = outputColors.map(c => c.clone().applyFilter(this.colorProfileId));
    }
    const output = this._outputColors.slice(0);
    return output;
  }

  onAdaptStart() {
    const computedStyle = window.getComputedStyle(document.querySelector('html'));
    this._originalDocumentFontSize = computedStyle.fontSize;
    this.restore();
    this.setupUI();
    this.rules = Rule.getAllModifiable(this);
    this.apply();
  }

  save() {
    const cookies = document.cookie.split(';').map(a => a.trim());
    const index = cookies.findIndex(cookie => cookie.includes('visua11y='));
    if (index !== -1) {
      cookies.splice(index, 1);
    }
    const value = encodeURIComponent(JSON.stringify({
      id: this._colorProfileId,
      inv: this._isInverted,
      size: this._documentFontSize,
      letsp: this._letterSpacingMultiplier,
      lineh: this._lineHeightMultiplier,
      wordsp: this._wordSpacingMultiplier,
      anim: this._disableAnimations,
      opac: this._increaseOpacity,
      cont: this._increaseContrast,
      brigh: this._decreaseBrightness,
      backimg: this._removeBackgroundImages
    }));
    document.cookie = `visua11y=${value}; ${cookies.join('; ')};`;
  }

  restore() {
    const cookies = document.cookie.split(';');
    const index = cookies.findIndex(cookie => cookie.includes('visua11y='));
    const cookie = cookies[index];
    const value = cookie && JSON.parse(decodeURIComponent(cookie.replace('visua11y=', '')));
    this._colorProfileId = value?.id ?? 'default';
    this._isInverted = value?.inv ?? false;
    this._documentFontSize = value?.size ?? null;
    this._letterSpacingMultiplier = value?.letsp ?? 1;
    this._lineHeightMultiplier = value?.lineh ?? 1;
    this._wordSpacingMultiplier = value?.wordsp ?? 1;
    this._disableAnimations = value?.anim ?? false;
    this._increaseOpacity = value?.opac ?? false;
    this._increaseContrast = value?.cont ?? false;
    this._decreaseBrightness = value?.brigh ?? false;
    this._removeBackgroundImages = value?.backimg ?? false;
  }

  setupUI() {
    if (!Adapt.course.get('_visua11y')?._isEnabled) return;
    $('.nav__drawer-btn').after(new Visua11yButtonView().$el);
  }

  apply() {
    if (!Adapt.course.get('_visua11y')?._isEnabled) return this.reset();
    this.triggerChanged();
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    this.colorProfileId ?
      $html.attr('data-color-profile', this.colorProfileId)
      : $html.removeAttr('data-color-profile');
    const documentStyle = document.documentElement.style;
    documentStyle.setProperty('--visua11y-color-profile-url', `url(assets/visua11y-filters.svg#${this.colorProfileId})`);
    documentStyle.setProperty('--visua11y-invert', this.isInverted ? '100%' : '0%');
    documentStyle.setProperty('--visua11y-contrast', this.increaseContrast ? '108%' : '100%');
    documentStyle.setProperty('--visua11y-brightness', this.decreaseBrightness ? '80%' : '100%');
    $html[0].style.fontSize = this.documentFontSize ?? '';
    // Turn off jquery animations
    $.fx.off = this.disableAnimations;
    // Turn off velocity animations
    $.Velocity.mock = this.disableAnimations;
    // Turn off css transitions and animations
    $html
      .toggleClass('a11y-inverted', this.isInverted)
      .toggleClass('a11y-disable-animations', this.disableAnimations)
      .toggleClass('a11y-increase-opacity', this.increaseOpacity)
      .toggleClass('a11y-increase-contrast', this.increaseContrast)
      .toggleClass('a11y-decrease-brightness', this.decreaseBrightness)
      .toggleClass('a11y-remove-background-images', this.removeBackgroundImages);
    this.rules.forEach(rule => rule.modify(this));
    this.rules.forEach(rule => rule.apply());
    $(window).resize();
  }

  triggerChanged() {
    this.trigger('changed');
  }

  reset() {
    this._colorProfileId = 'default';
    this._isInverted = false;
    this._documentFontSize = null;
    this._letterSpacingMultiplier = 1;
    this._lineHeightMultiplier = 1;
    this._wordSpacingMultiplier = 1;
    this._disableAnimations = false;
    this._increaseOpacity = false;
    this._increaseContrast = false;
    this._decreaseBrightness = false;
    this._removeBackgroundImages = false;
    this.triggerChanged();
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    $html
      .removeAttr('data-color-profile')
      .removeAttr('data-color-inverted');
    $html[0].style.fontSize = '';
    // Turn off jquery animations
    $.fx.off = false;
    // Turn off velocity animations
    $.Velocity.mock = false;
    // Turn off css transitions and animations
    $html
      .removeClass('a11y-inverted')
      .removeClass('a11y-disable-animations')
      .removeClass('a11y-increase-opacity')
      .removeClass('a11y-increase-contrast')
      .removeClass('a11y-decrease-brightness')
      .removeClass('a11y-remove-background-images');
    this.rules.forEach(rule => rule.apply());
    $(window).resize();
  }
}

export default (Adapt.visua11y = new Visua11y());
