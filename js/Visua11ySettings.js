import Adapt from 'core/js/adapt';
import Backbone from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

export default class Visua11ySettings extends Backbone.View {

  initialize() {
    this.render();
    this.listenTo(Adapt.visua11y, 'changed', this.render);
  }

  render() {
    ReactDOM.render(<templates.Visua11ySettings {...Adapt.visua11y.config} />, this.el);
  }

}
