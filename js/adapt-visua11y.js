import Adapt from 'core/js/adapt';
import {
  COLORtoHSLAObject,
  HSLAObjectToRGBAString,
  HSLAObjectContrast
} from './utils';

Adapt.on('adapt:start', () => {
  // Turn off jquery animations
  $.fx.off = true;

  // Turn off velocity animations
  $.Velocity.mock = true;

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
    allRules.push({
      selectorText: 'body',
      style: document.body.style,
      hsla: {},
      colorPropertyNames: null
    });
  }

  // Filter colour rules add their hsla values and lightnesses
  const colorRules = allRules.filter(rule => {
    rule.colorPropertyNames = Array.prototype.slice.call(rule.style)
      .filter(name => /color/i.test(name))
      .filter(name => {
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
      const hsla = HSLAObjectContrast(rule.hsla[name]);
      const newColor = HSLAObjectToRGBAString(hsla);
      rule.style[name] = newColor;
    });
  });

});
