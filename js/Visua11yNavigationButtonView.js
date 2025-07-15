import Adapt from 'core/js/adapt';
import Visua11ySettingsView from './Visua11ySettingsView';
import NavigationButtonView from 'core/js/views/NavigationButtonView';
import notify from 'core/js/notify';
import drawer from 'core/js/drawer';
import tooltips from 'core/js/tooltips';

class Visua11yNavigationButtonView extends NavigationButtonView {

  attributes() {
    const attributes = this.model.toJSON();

    return {
      name: attributes._id,
      role: attributes._role === 'button' ? undefined : attributes._role,
      'data-order': attributes._order,
      'aria-label': Adapt.visua11y.config._button.navigationAriaLabel,
      'data-tooltip-id': 'visua11y',
      'aria-haspopup': 'dialog'
    };
  }

  events() {
    return {
      click: 'onClick'
    };
  }

  initialize(options) {
    super.initialize(options);
    this.setupEventListeners();
    this.render();

    tooltips.register({
      _id: 'visua11y',
      ...Adapt.course.get('_globals')?._extensions?._visua11y?._navTooltip || {}
    });
  }

  static get template() {
    return 'Visua11yNavigationButton.jsx';
  }

  setupEventListeners() {
    const config = Adapt.course.get('_visua11y');
    if (config._location === 'drawer') return;
    
    this.onNotifyClosed = this.onNotifyClosed.bind(this);
    this.onNotifyClicked = this.onNotifyClicked.bind(this);
  }

  onClick(event) {
    if (event && event.preventDefault) event.preventDefault();
    const config = Adapt.course.get('_visua11y');
    if (config._location === 'drawer') {
      drawer.openCustomView(new Visua11ySettingsView().$el, false, 'auto');
    } else {
      Adapt.visua11y.settingsPrompt = notify.popup({
        title: config.title,
        body: config.body,
        _view: new Visua11ySettingsView(),
        _classes: 'visua11ysettings-notify',
        _showCloseButton: config._showCloseButton || false
      });
      Adapt.visua11y.settingsPrompt.$el.on('click', this.onNotifyClicked);
      this.listenTo(Adapt, 'notify:closed', this.onNotifyClosed);
    }
    this.render();
    Adapt.trigger('visua11y:opened');
  }

  onNotifyClicked(event) {
    const $target = $(event.target);
    const isChild = ($target.parents('.notify__popup-inner').length !== 0);
    if (isChild) return;

    Adapt.visua11y.settingsPrompt.closeNotify();
  }

  onNotifyClosed(notify) {
    if (notify !== Adapt.visua11y.settingsPrompt) return;
    Adapt.visua11y.settingsPrompt.$el.off('click', this.onNotifyClicked);
    Adapt.visua11y.settingsPrompt = null;
    this.stopListening(Adapt, 'notify:closed', this.onNotifyClosed);
  }

}

export default Visua11yNavigationButtonView;
