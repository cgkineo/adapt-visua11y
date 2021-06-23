import Backbone from 'backbone';
import Adapt from 'core/js/adapt';
import {
  COLORtoHSLAObject,
  HSLAObjectToRGBAString,
  invert
} from './utils';

class Visua11y extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'adapt:start', this.onAdaptStart);
  }

  get isInverted() {
    return true;
  }

  get fontSize() {
    return '18pt';
  }

  get disableAnimations() {
    return true;
  }

  get COLORS() {
    return [
      'transparent',
      'black',
      ...[
        // Translating a non AA course with very similar colors will fail
        // Find a better way to map existing colour ranges to a list of colours
        '#cc0000',
        '#ee00ee',
        '#ff5e00',
        '#00ee00',
        '#11dddd',
        '#ffbb11',
        '#ffbbaa'
      ],
      'white'
    ].map(color => COLORtoHSLAObject(color)).sort((a, b) => {
      return a.b - b.b;
    });
  }

  onAdaptStart() {

    if (this.fontSize) {
      document.querySelector('html').style.fontSize = this.fontSize;
    }

    if (this.disableAnimations) {
      // Turn off jquery animations
      $.fx.off = true;
      // Turn off velocity animations
      $.Velocity.mock = true;
      $('html').addClass('is-animation-disabled');
    }

    const COLORS = this.COLORS;

    // Collect all rules
    const stylesheets = Array.prototype.slice.call(document.styleSheets, 0);
    const allRules = stylesheets.reduce((allRules, stylesheet) => {
      const rules = Array.prototype.slice.call(stylesheet.rules, 0);
      allRules.push(...rules.map(rule => ({
        selectorText: rule.selectorText,
        style: rule.style,
        hsla: {},
        colorPropertyNames: null
      })));
      return allRules;
    }, []).filter(rule => rule.selectorText);

    if (!document.body.style.backgroundColor) {
      // Force a background color of white if none specified
      document.body.style.backgroundColor = 'white';
      allRules.unshift({
        selectorText: 'body',
        style: document.body.style,
        hsla: {},
        colorPropertyNames: null
      });
    }

    // Filter colour rules add their hsla values and lightnesses
    const colorRules = allRules.filter(rule => {
      rule.colorPropertyNames = Array.prototype.slice.call(rule.style)
        .filter(name => /color|background-image/i.test(name))
        .filter(name => {
          if (name === 'background-image') return true;
          try {
            const hsla = COLORtoHSLAObject(rule.style[name]);
            rule.hsla[name] = hsla;
            return true;
          } catch (err) {
            return false;
          }
        });
      return rule.colorPropertyNames.length;
    });

    // Recalculate each color
    colorRules.forEach(rule => {
      rule.colorPropertyNames.forEach(name => {
        if (name === 'background-image') {
          rule.style[name] = 'none';
          return;
        }
        const color = rule.hsla[name];
        const isTransparent = (color.a !== 1);
        if (isTransparent) {
          const newColor = { ...color, a: 0 };
          rule.style[name] = HSLAObjectToRGBAString(newColor);
          console.log(`${rule.selectorText} ${name}: ${HSLAObjectToRGBAString(color)} to ${HSLAObjectToRGBAString(newColor)}`);
          return;
        }
        if (name === 'color') {
          const bottomColor = COLORS[1];
          if (color.l <= 80) {
            const newColor = { ...bottomColor };
            newColor.l = this.isInverted ? invert(newColor.l, 100) : newColor.l;
            rule.style[name] = HSLAObjectToRGBAString(newColor);
            return;
          }
          const topColor = COLORS[COLORS.length - 1];
          this.calculate(rule, name, color, bottomColor, topColor, 100);
          return;
        }
        for (let i = 1, l = COLORS.length; i < l - 1; i++) {
          const bottomColor = COLORS[i];
          const topColor = COLORS[i + 1];
          if (this.calculate(rule, name, color, bottomColor, topColor)) return;
        }
      });
    });
  }

  calculate(rule, name, color, bottomColor, topColor, threshold = null) {
    const rangeBottom = bottomColor.b;
    const rangeTop = topColor.b;
    const bottomDistance = Math.abs(color.b - rangeBottom);
    const topDistance = Math.abs(color.b - rangeTop);
    threshold = threshold ?? Math.abs(rangeTop - rangeBottom);
    if (bottomDistance > threshold || topDistance > threshold) return false;
    const newColor = {
      ...(bottomDistance <= topDistance)
        ? bottomColor
        : topColor
    };
    newColor.l = this.isInverted ? invert(newColor.l, 100) : newColor.l;
    rule.style[name] = HSLAObjectToRGBAString(newColor);
    return true;
  }

}

export default new Visua11y();
