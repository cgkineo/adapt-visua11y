import Adapt from 'core/js/adapt';

class BackgroundImagesButtonView extends Backbone.View {

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
      name: `Background images ${!Adapt.visua11y.removeBackgroundImages ? 'on' : 'off'}`
    };
    this.$el.html(template(data));
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    Adapt.visua11y.removeBackgroundImages = !Adapt.visua11y.removeBackgroundImages;
    this.render();
  }

}

export default BackgroundImagesButtonView;
