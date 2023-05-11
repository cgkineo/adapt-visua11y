import Adapt from 'core/js/adapt';
import Backbone from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

export default class Visua11ySettingsView extends Backbone.View {

  className() {
    return 'visua11ysettings';
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
    this.listenTo(Adapt, 'visua11y:opened', this.setRadioAttributes);
  }

  render() {
    const data = {
      ...this
    };
    ReactDOM.render(<templates.Visua11ySettings {...data} />, this.el);
  }

  setRadioAttributes() {
    const checkedRadioButtons = document.querySelectorAll('[type="radio"][checked=""]');
    checkedRadioButtons.forEach(el => {
      el.setAttribute('aria-checked', true);
      el.setAttribute('tabindex', 0);
    });
  }

  onChange(event) {
    const { name, checked, value, type } = event.target;
    this._visua11y[name] = type === 'checkbox' ? checked : value;
    this.sendTrigger(name, checked, value, type);

    if (type !== 'radio') return;

    const targetName = event.currentTarget.getAttribute('name');
    const radioGroupSibilings = document.querySelectorAll('[name="' + targetName + '"]');
    radioGroupSibilings.forEach(el => {
      el.setAttribute('aria-checked', false);
      el.setAttribute('tabindex', -1);
    });

    event.currentTarget.setAttribute('aria-checked', true);
    event.currentTarget.setAttribute('tabindex', 0);
    event.currentTarget.focus();
  }

  onKeyPress(event) {
    if (event.which !== 13) return;
    // <ENTER> keypress
    this.onChange(event);
  }

  onItemFocus(event) {
    event.currentTarget.classList.add('focus');
  }

  onItemBlur(event) {
    event.currentTarget.classList.remove('focus');
  }

  onReset() {
    this._visua11y.reset();
  }

  onClose() {
    this._visua11y.settingsPrompt.closeNotify();
  }

  sendTrigger(name, checked, value, type) {
    let state;
    if (type === 'checkbox') { state = checked; }
    if (type === 'radio' || type === 'select-one') { state = value; }
    Adapt.trigger('visua11y:toggle', name, state);
  }
}
