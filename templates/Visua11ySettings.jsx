import Adapt from 'core/js/adapt';
import React from 'react';

export default function Visua11ySettings(config) {
  const visua11y = Adapt.visua11y;

  function onReset() {
    visua11y.reset();
  }

  function onClose() {
    visua11y.settingsPrompt.closeNotify();
  }

  function onChange(event) {
    const { name, checked, value, type } = event.target;
    visua11y[name] = type === 'checkbox' ? checked : value;
  }

  return (
    <div className="visua11ysettings">
      {config._colorProfile._isEnabled && <div className="colorprofileid">
        <label><div className='icon'></div>{config._colorProfile.title}</label>
        <select name='colorProfileId' onChange={onChange} value={visua11y.colorProfileId}>
          {visua11y.colorProfiles.map(({ name, _id }) => <option key={_id} value={_id}>{name}</option>)}
        </select>
      </div>}
      {config._highContrast._isEnabled && <div className="highcontrast">
        <label><div className='icon'></div>{config._highContrast.title}</label>
        <input type='checkbox' name='highContrast' checked={visua11y.highContrast} onChange={onChange} />
      </div>}
      {config._noTransparency._isEnabled && <div className="notransparency">
        <label><div className='icon'></div>{config._noTransparency.title}</label>
        <input type='checkbox' name='noTransparency' checked={visua11y.noTransparency} onChange={onChange} />
      </div>}
      {config._lowBrightness._isEnabled && <div className="lowbrightness">
        <label><div className='icon'></div>{config._lowBrightness.title}</label>
        <input type='checkbox' name='lowBrightness' checked={visua11y.lowBrightness} onChange={onChange} />
      </div>}
      {config._invert._isEnabled && <div className="invert">
        <label><div className='icon'></div>{config._invert.title}</label>
        <input type='checkbox' name='invert' checked={visua11y.invert} onChange={onChange} />
      </div>}
      {config._noAnimations._isEnabled && <div className="noanimations">
        <label><div className='icon'></div>{config._noAnimations.title}</label>
        <input type='checkbox' name='noAnimations' checked={visua11y.noAnimations} onChange={onChange} />
      </div>}
      {config._noBackgroundImages._isEnabled && <div className="nobackgroundimages">
        <label><div className='icon'></div>{config._noBackgroundImages.title}</label>
        <input type='checkbox' name='noBackgroundImages' checked={visua11y.noBackgroundImages} onChange={onChange} />
      </div>}
      {config._fontSize._isEnabled && <div className="fontsize">
        <label><div className='icon'></div>{config._fontSize.title}</label>
        <label>{config._fontSize.smallLabel}</label>
        <input type='radio' value={config._fontSize._small} checked={visua11y.fontSize === config._fontSize._small} name='fontSize' onChange={onChange} />
        <label>{config._fontSize.mediumLabel}</label>
        <input type='radio' value={visua11y.originalFontSize} checked={visua11y.fontSize === visua11y.originalFontSize} name='fontSize' onChange={onChange} />
        <label>{config._fontSize.largeLabel}</label>
        <input type='radio' value={config._fontSize._large} checked={visua11y.fontSize === config._fontSize._large} name='fontSize' onChange={onChange} />
      </div>}
      {config._lineHeight._isEnabled && <div className="lineheight">
        <label><div className='icon'></div>{config._lineHeight.title}</label>
        <label>{config._lineHeight.smallLabel}</label>
        <input type='radio' value={config._lineHeight._small} checked={visua11y.lineHeight === config._lineHeight._small} name='lineHeight' onChange={onChange} />
        <label>{config._lineHeight.mediumLabel}</label>
        <input type='radio' value={config._lineHeight._medium} checked={visua11y.lineHeight === config._lineHeight._medium} name='lineHeight' onChange={onChange} />
        <label>{config._lineHeight.largeLabel}</label>
        <input type='radio' value={config._lineHeight._large} checked={visua11y.lineHeight === config._lineHeight._large} name='lineHeight' onChange={onChange} />
      </div>}
      {config._paragraphSpacing._isEnabled && <div className="paragraphspacing">
        <label><div className='icon'></div>{config._paragraphSpacing.title}</label>
        <label>{config._paragraphSpacing.smallLabel}</label>
        <input type='radio' value={config._paragraphSpacing._small} checked={visua11y.paragraphSpacing === config._paragraphSpacing._small} name='paragraphSpacing' onChange={onChange} />
        <label>{config._paragraphSpacing.mediumLabel}</label>
        <input type='radio' value={config._paragraphSpacing._medium} checked={visua11y.paragraphSpacing === config._paragraphSpacing._medium} name='paragraphSpacing' onChange={onChange} />
        <label>{config._paragraphSpacing.largeLabel}</label>
        <input type='radio' value={config._paragraphSpacing._large} checked={visua11y.paragraphSpacing === config._paragraphSpacing._large} name='paragraphSpacing' onChange={onChange} />
      </div>}
      {config._letterSpacing._isEnabled && <div className="letterspacing">
        <label><div className='icon'></div>{config._letterSpacing.title}</label>
        <label>{config._letterSpacing.smallLabel}</label>
        <input type='radio' value={config._letterSpacing._small} checked={visua11y.letterSpacing === config._letterSpacing._small} name='letterSpacing' onChange={onChange} />
        <label>{config._letterSpacing.mediumLabel}</label>
        <input type='radio' value={config._letterSpacing._medium} checked={visua11y.letterSpacing === config._letterSpacing._medium} name='letterSpacing' onChange={onChange} />
        <label>{config._letterSpacing.largeLabel}</label>
        <input type='radio' value={config._letterSpacing._large} checked={visua11y.letterSpacing === config._letterSpacing._large} name='letterSpacing' onChange={onChange} />
      </div>}
      {config._wordSpacing._isEnabled && <div className="wordspacing">
        <label><div className='icon'></div>{config._wordSpacing.title}</label>
        <label>{config._wordSpacing.smallLabel}</label>
        <input type='radio' value={config._wordSpacing._small} checked={visua11y.wordSpacing === config._wordSpacing._small} name='wordSpacing' onChange={onChange} />
        <label>{config._wordSpacing.mediumLabel}</label>
        <input type='radio' value={config._wordSpacing._medium} checked={visua11y.wordSpacing === config._wordSpacing._medium} name='wordSpacing' onChange={onChange} />
        <label>{config._wordSpacing.largeLabel}</label>
        <input type='radio' value={config._wordSpacing._large} checked={visua11y.wordSpacing === config._wordSpacing._large} name='wordSpacing' onChange={onChange} />
      </div>}
      <div className="buttons">
        <button className="btn-text" onClick={onReset}>{config._button.resetText}</button>
      </div>
      <div className="buttons">
        <button className="btn-text" onClick={onClose}>{config._button.closeText}</button>
      </div>
    </div>
  );
}
