import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import Rule from './Rule';
import Color from './Color';
import PROFILES from './PROFILES';
import ColorButtonView from './ColorButtonView';
import ZoomButtonView from './ZoomButtonView';
import ContrastButtonView from './ContrastButtonView';
import InvertButtonView from './InvertButtonView';
import { polarize } from './transformations';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
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

  get documentFontSize() {
    return this._documentFontSize || this._originalDocumentFontSize;
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

  get increaseContrast() {
    return this._increaseContrast;
  }

  set increaseContrast(value) {
    this._increaseContrast = value;
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
    const isInverted = this.isInverted;
    const increaseContrast = this.increaseContrast;
    if (!this._outputColors) {
      const distinctColors = this.distinctColors;
      let outputColors = distinctColors;
      if (increaseContrast) {
        const brightnesses = distinctColors.map(c => c.l);
        outputColors = polarize(brightnesses).map(c => isInverted ? 100 - c : c).map((l, index) => {
          const c = distinctColors[index];
          return Color.parse(`hsla(${c.h},${c.s},${l},${c.a})`);
        });
      } else if (isInverted) {
        outputColors = outputColors.map(c => isInverted ? Color.parse(`hsla(${c.h},${c.s},${100 - c.l},${c.a})`) : c);
      }
      this._outputColors = outputColors.map(c => c.clone().applyFilter(this.colorProfileId));
    }
    const output = this._outputColors.slice(0);
    return output;
  }

  onAdaptStart() {
    this._originalDocumentFontSize = window.getComputedStyle(document.querySelector('html')).fontSize;
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
      anim: this._disableAnimations,
      opac: this._increaseOpacity,
      cont: this._increaseContrast,
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
    this._disableAnimations = value?.anim ?? false;
    this._increaseOpacity = value?.opac ?? false;
    this._increaseContrast = value?.cont ?? false;
    this._removeBackgroundImages = value?.backimg ?? false;
  }

  setupUI() {
    if (!Adapt.course.get('_visua11y')?._isEnabled) return;
    $('.nav__drawer-btn').after(new InvertButtonView().$el);
    $('.nav__drawer-btn').after(new ContrastButtonView().$el);
    $('.nav__drawer-btn').after(new ColorButtonView().$el);
    $('.nav__drawer-btn').after(new ZoomButtonView().$el);
  }

  apply() {
    this.save();
    this.rules.forEach(rule => rule.reset());
    const $html = $('html');
    if (Adapt.course.get('_visua11y')?._isEnabled) {
      this.colorProfileId ? $html.attr('data-color-profile', this.colorProfileId) : $html.removeAttr('data-color-profile');
      $html[0].style.fontSize = this.documentFontSize ?? this._originalDocumentFontSize;
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
        .toggleClass('a11y-remove-background-images', this.removeBackgroundImages);
      this.rules.forEach(rule => rule.modify(this));
    } else {
      $html
        .removeAttr('data-color-profile')
        .removeAttr('data-color-inverted');
      $html[0].style.fontSize = this._originalDocumentFontSize;
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
        .removeClass('a11y-remove-background-images');
    }
    this.rules.forEach(rule => rule.apply());
    $(window).resize();
  }
}

export default (Adapt.visua11y = new Visua11y());
