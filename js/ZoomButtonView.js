import Adapt from 'core/js/adapt';

class ColorButtonView extends Backbone.View {

  tagName() {
    return 'button';
  }

  className() {
    return 'btn-icon nav__btn visua11y-btn';
  }

  events() {
    return {
      click: 'onClick'
    };
  }

  initialize() {
    this.render();
  }

  render() {
    const template = Handlebars.templates.visua11yButton;
    const data = {
      name: Adapt.visua11y.documentFontSize
    };
    this.$el.html(template(data));
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    Adapt.visua11y.documentFontSize = Adapt.visua11y.documentFontSize !== '18pt' ? '18pt' : null;
    this.render();
  }

}

export default ColorButtonView;
