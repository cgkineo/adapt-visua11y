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
      name: Adapt.visua11y.colorProfileName
    };
    this.$el.html(template(data));
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    const currentProfileId = Adapt.visua11y.colorProfileId;
    const profiles = Adapt.visua11y.colorProfiles;
    let index = profiles.findIndex(prof => prof._id === currentProfileId);
    index++;
    if (index >= profiles.length) index = 0;
    Adapt.visua11y.colorProfileId = profiles[index]._id;
    this.render();
  }

}

export default ColorButtonView;
