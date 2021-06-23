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

    if (this.isInverted) {
      $('html').addClass('is-color-inverted');
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
      allRules.push(...rules.map(rule => {
        if (!(rule instanceof CSSStyleRule)) return false;
        return {
          selectorText: rule.selectorText,
          style: rule.style,
          hsla: {},
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
            hsla: {},
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
        hsla: {},
        colorPropertyNames: null
      });
    }

    // Filter colour rules add their hsla values and lightnesses
    const colorRules = allRules.filter(rule => {
      rule.colorPropertyNames = Array.prototype.slice.call(rule.style)
        .filter(name => /color|background-image|opacity/i.test(name))
        .filter(name => {
          if (name === 'background-image') return true;
          if (name === 'opacity') return true;
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
          // Turn off background images
          rule.style[name] = 'none';
          return;
        }
        if (name === 'opacity') {
          // No opacity less than 0.4
          rule.style[name] = rule.style[name] <= 0.4 ? 0 : 1;
          return;
        }
        const color = rule.hsla[name];
        const isTransparent = (color.a <= 0.4);
        if (isTransparent) {
          // No color opacity less than 0.4
          const newColor = { ...color, a: 0 };
          rule.style[name] = HSLAObjectToRGBAString(newColor);
          return;
        }
        const isSemiTransparent = (color.a > 0.4 && color.a <= 0.99999);
        if (isSemiTransparent) {
          // Clip opacity between 0.4 and 0.99999
          const newColor = { ...color, a: 1 };
          rule.style[name] = HSLAObjectToRGBAString(newColor);
          return;
        }
        if (name === 'color') {
          // Text: black or white
          const bottomColor = COLORS[1];
          if (color.l <= 80) {
            // Force black if lightness is less than 80%
            const newColor = { ...bottomColor };
            newColor.l = this.isInverted ? invert(newColor.l, 100) : newColor.l;
            rule.style[name] = HSLAObjectToRGBAString(newColor);
            return;
          }
          // Choose between black and white
          const topColor = COLORS[COLORS.length - 1];
          this.calculate(rule, name, color, bottomColor, topColor, 100);
          return;
        }
        for (let i = 1, l = COLORS.length; i < l - 1; i++) {
          // All other colors picked from color set
          const bottomColor = COLORS[i];
          const topColor = COLORS[i + 1];
          if (this.calculate(rule, name, color, bottomColor, topColor)) return;
        }
      });
    });
  }

  /**
   * Given bottomColor and topColor, is color in range and return closest match.
   * @param {*} rule
   * @param {*} name
   * @param {*} color
   * @param {*} bottomColor
   * @param {*} topColor
   * @param {*} threshold
   * @returns
   */
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
    // Invert the color lightness if required (change to bright on black)
    newColor.l = this.isInverted ? invert(newColor.l, 100) : newColor.l;
    // Invert the color saturation if required (change to pastiles on white)
    newColor.s = this.isInverted ? newColor.s : newColor.s * 0.20;
    rule.style[name] = HSLAObjectToRGBAString(newColor);
    return true;
  }

}

export default new Visua11y();
