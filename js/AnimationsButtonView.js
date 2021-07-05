import Adapt from 'core/js/adapt';

class AnimationsButtonView extends Backbone.View {

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
      name: `Animations ${!Adapt.visua11y.disableAnimations ? 'on' : 'off'}`
    };
    this.$el.html(template(data));
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    Adapt.visua11y.disableAnimations = !Adapt.visua11y.disableAnimations;
    this.render();
  }

}

export default AnimationsButtonView;
