import Adapt from 'core/js/adapt';
import Backbone from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

export default class Visua11ySettingsView extends Backbone.View {

  className() {
    return [
      'visua11ysettings',
      Adapt.visua11y.config._location === 'drawer'
        ? 'visua11ysettings-drawer'
        : 'visua11ysettings-notify'
    ].filter(Boolean).join(' ');
  }

  initialize() {
    this._visua11y = Adapt.visua11y;
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onItemFocus = this.onItemFocus.bind(this);
    this.onItemBlur = this.onItemBlur.bind(this);
    this.onReset = this.onReset.bind(this);
    this.onClose = this.onClose.bind(this);

    this.render();
    this.listenTo(Adapt.visua11y, 'changed', this.render);
  }

  render() {
    const data = {
      ...this
    };
    ReactDOM.render(<templates.Visua11ySettings {...data} />, this.el);
  }

  onChange(event) {
    const { name, checked, value, type } = event.target;
    this._visua11y[name] = type === 'checkbox' ? checked : value;
    this.sendTrigger(name, checked, value, type);
  }

  onKeyPress(event) {
    if (event.which !== 13) return;
    // <ENTER> keypress
    this.onChange(event);
  }

  onItemFocus(event) {
    this.onChange(event);
  }

  onItemBlur(event) {
    // Nothing happens
  }

  onReset() {
    this._visua11y.reset();
  }

  onClose() {
    this._visua11y.close();
  }

  sendTrigger(name, checked, value, type) {
    let state;
    if (type === 'checkbox') { state = checked; }
    if (type === 'radio' || type === 'select-one') { state = value; }
    Adapt.trigger('visua11y:toggle', name, state);
  }
}
