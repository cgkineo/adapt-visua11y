import Adapt from 'core/js/adapt';
import Visua11ySettings from './Visua11ySettings';
import notify from 'core/js/notify';

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
    const data = {};
    this.$el.html(template(data));
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    Adapt.visua11y.settingsPrompt = notify.prompt({
      _view: new Visua11ySettings(),
      _showCloseButton: false
    });
    this.render();
  }

}

export default AnimationsButtonView;
