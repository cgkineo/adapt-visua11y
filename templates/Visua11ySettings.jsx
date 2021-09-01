import Adapt from 'core/js/adapt';
import React, { useState } from 'react';

export default function Visua11ySettings() {
  const visua11y = Adapt.visua11y;
  const _globals = Adapt.course.get('_globals');
  const [state, setState] = useState({});
  function onReset() {
    visua11y.reset();
  }
  function onApply() {
    visua11y.settingsPrompt.closeNotify();
  }
  function onChange(event) {
    const { name, checked, value, type } = event.target;
    state[name] = state[name] ?? Adapt.visua11y[name];
    setState(state);
    visua11y[name] = type === 'checkbox' ? checked : value;
  }
  return (
    <div className="visua11ysettings">
      <div className="colorprofileid">
        <label><div className='icon'></div>Colour profile</label>
        <select name='colorProfileId' onChange={onChange} value={visua11y.colorProfileId}>
          {visua11y.colorProfiles.map(({ name, _id }) => <option key={_id} value={_id}>{name}</option>)}
        </select>
      </div>
      <div className="increasecontrast">
        <label><div className='icon'></div>High contrast</label>
        <input type='checkbox' name='increaseContrast' checked={visua11y.increaseContrast} onChange={onChange} />
      </div>
      <div className="decreasebrightness">
        <label><div className='icon'></div>Low brightness</label>
        <input type='checkbox' name='decreaseBrightness' checked={visua11y.decreaseBrightness} onChange={onChange} />
      </div>
      <div className="isinverted">
        <label><div className='icon'></div>Invert</label>
        <input type='checkbox' name='isInverted' checked={visua11y.isInverted} onChange={onChange} />
      </div>
      <div className="disableanimation">
        <label><div className='icon'></div>No animations</label>
        <input type='checkbox' name='disableAnimations' checked={visua11y.disableAnimations} onChange={onChange} />
      </div>
      <div className="removebackgroundimages">
        <label><div className='icon'></div>No background images</label>
        <input type='checkbox' name='removeBackgroundImages' checked={visua11y.removeBackgroundImages} onChange={onChange} />
      </div>
      <div className="fontsize">
        <label><div className='icon'></div>Font size</label>
        <label>Small</label>
        <input type='radio' value='9pt' checked={visua11y.documentFontSize === '9pt'} name='documentFontSize' onChange={onChange} />
        <label>Default</label>
        <input type='radio' value={visua11y.originalDocumentFontSize} checked={visua11y.documentFontSize === visua11y.originalDocumentFontSize} name='documentFontSize' onChange={onChange} />
        <label>Large</label>
        <input type='radio' value='18pt' checked={visua11y.documentFontSize === '18pt'} name='documentFontSize' onChange={onChange} />
      </div>
      <div className="lineheight">
        <label><div className='icon'></div>Line height</label>
        <label>Small</label>
        <input type='radio' value='0.9' checked={visua11y.lineHeightMultiplier === 0.9} name='lineHeightMultiplier' onChange={onChange} />
        <label>Default</label>
        <input type='radio' value='1' checked={visua11y.lineHeightMultiplier === 1} name='lineHeightMultiplier' onChange={onChange} />
        <label>Large</label>
        <input type='radio' value='1.2' checked={visua11y.lineHeightMultiplier === 1.2} name='lineHeightMultiplier' onChange={onChange} />
      </div>
      <div className="letterspacing">
        <label><div className='icon'></div>Letter spacing</label>
        <label>Small</label>
        <input type='radio' value='0.97' checked={visua11y.letterSpacingMultiplier === 0.97} name='letterSpacingMultiplier' onChange={onChange} />
        <label>Default</label>
        <input type='radio' value='1' checked={visua11y.letterSpacingMultiplier === 1} name='letterSpacingMultiplier' onChange={onChange} />
        <label>Large</label>
        <input type='radio' value='1.2' checked={visua11y.letterSpacingMultiplier === 1.2} name='letterSpacingMultiplier' onChange={onChange} />
      </div>
      <div className="buttons">
        <button className="btn-text" onClick={onReset}>Reset</button>
      </div>
      <div className="buttons">
        <button className="btn-text" onClick={onApply}>Ok</button>
      </div>
    </div>
  );
}
