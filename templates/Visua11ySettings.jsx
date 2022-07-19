import Adapt from 'core/js/adapt';
import { templates } from 'core/js/reactHelpers';
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
    <div className='visua11ysettings__inner'>

      {(config._colorProfile._isEnabled ||
        config._highContrast._isEnabled ||
        config._noTransparency._isEnabled ||
        config._lowBrightness._isEnabled ||
        config._invert._isEnabled) &&

        <div className='visua11ysettings__group visua11ysettings__group-visualdisplay' role='group' aria-labelledby='visualdisplay'>
          {/* Should 'visua11ysettings__group-title' read as a title or is the lablled list enough? */}
          {config._groups.visualDisplay &&
          <div className='visua11ysettings__group-title' id='visualdisplay' role="heading" aria-level="2">
            {config._groups.visualDisplay}
          </div>
          }

          <div className='visua11ysettings__group-profiles'>
            <div className='colorprofiles'>
              {config._colorProfile._isEnabled &&
              <div className='colorprofileid'>
                <templates.Visua11yPreview {...config}/>
                <label className='visua11ysettings__item-label' htmlFor='colorProfileId'>
                  <div className='icon' aria-hidden='true'></div>
                  {config._colorProfile.title}
                </label>
                <select id='colorProfileId' name='colorProfileId' onChange={onChange} value={visua11y.colorProfileId}>
                  {visua11y.colorProfiles.map(({ name, _id }) => <option key={_id} value={_id}>{name}</option>)}
                </select>
              </div>
              }
            </div>

            <div className='otherprofiles'>
              {config._highContrast._isEnabled &&
              <div className='visua11ysettings__item highcontrast'>
                <label className='visua11ysettings__item-label' htmlFor='highContrast' aria-hidden='true'>
                  <div className='icon' aria-hidden='true'></div>
                  {config._highContrast.title}
                </label>
                <input type='checkbox' id='highContrast' name='highContrast' checked={visua11y.highContrast} onChange={onChange} aria-label={config._highContrast.title}/>
              </div>
              }

              {config._noTransparency._isEnabled &&
              <div className='visua11ysettings__item notransparency'>
                <label className='visua11ysettings__item-label' htmlFor='notransparency' aria-hidden='true'>
                  <div className='icon' aria-hidden='true'></div>
                  {config._noTransparency.title}
                </label>
                <input type='checkbox' id='noTransparency' name='noTransparency' checked={visua11y.noTransparency} onChange={onChange} aria-label={config._noTransparency.title}/>
              </div>
              }

              {config._lowBrightness._isEnabled &&
              <div className='visua11ysettings__item lowbrightness'>
                <label className='visua11ysettings__item-label' htmlFor='lowbrightness' aria-hidden='true'>
                  <div className='icon' aria-hidden='true'></div>
                  {config._lowBrightness.title}
                </label>
                <input type='checkbox' id='lowBrightness' name='lowBrightness' checked={visua11y.lowBrightness} onChange={onChange} aria-label={config._lowBrightness.title}/>
              </div>
              }

              {config._invert._isEnabled &&
              <div className='visua11ysettings__item invert'>
                <label className='visua11ysettings__item-label' htmlFor='invert' aria-hidden='true'>
                  <div className='icon' aria-hidden='true'></div>
                  {config._invert.title}
                </label>
                <input type='checkbox' id='invert' name='invert' checked={visua11y.invert} onChange={onChange} aria-label={config._invert.title}/>
              </div>
              }
            </div>
          </div>
        </div>
      }

      {(config._noAnimations._isEnabled ||
        config._noBackgroundImages._isEnabled) &&

        <div className='visua11ysettings__group visua11ysettings__group-distractions' role='group' aria-labelledby='distractions'>
          {config._groups.distractions &&
          <div className='visua11ysettings__group-title' id='distractions' role="heading" aria-level="2">
            {config._groups.distractions}
          </div>
          }

          {config._noAnimations._isEnabled &&
          <div className='visua11ysettings__item noanimations'>
            <label className='visua11ysettings__item-label' htmlFor='noanimations' aria-hidden='true'>
              <div className='icon' aria-hidden='true'></div>
              {config._noAnimations.title}
            </label>
            <input type='checkbox' id='noAnimations' name='noAnimations' checked={visua11y.noAnimations} onChange={onChange} aria-label={config._noAnimations.title}/>
          </div>
          }

          {config._noBackgroundImages._isEnabled &&
          <div className='visua11ysettings__item nobackgroundimages'>
            <label className='visua11ysettings__item-label' htmlFor='nobackgroundimages' aria-hidden='true'>
              <div className='icon' aria-hidden='true'></div>
              {config._noBackgroundImages.title}
            </label>
            <input type='checkbox' id='noBackgroundImages' name='noBackgroundImages' checked={visua11y.noBackgroundImages} onChange={onChange} aria-label={config._noBackgroundImages.title}/>
          </div>
          }
        </div>
      }

      {(config._fontSize._isEnabled ||
      config._lineHeight._isEnabled ||
      config._paragraphSpacing._isEnabled ||
      config._letterSpacing._isEnabled ||
      config._wordSpacing._isEnabled) &&

        <div className='visua11ysettings__group visua11ysettings__group-readability' role='group' aria-labelledby='readability'>
          {config._groups.readability &&
          <div className='visua11ysettings__group-title' id='readability' role="heading" aria-level="2">
            {config._groups.readability}
          </div>
          }

          {config._fontSize._isEnabled &&
          <div className='visua11ysettings__item fontsize'>
            <div className="visua11ysettings__item-title" id='fontsize'>
              {/* TODO wrap 'title' in separate <div> so title wraps separate to icon */}
              <div className='icon' aria-hidden='true'></div>{config._fontSize.title}
            </div>

            <div className="visua11ysettings__item-option-container" role='radiogroup' aria-labelledby='fontsize'>

              <div className='visua11ysettings__item-option'>
                <input type='radio' value={config._fontSize._small} checked={visua11y.fontSize === config._fontSize._small} id='fontSize-small' name='fontSize' onChange={onChange} />
                <label htmlFor='fontSize-small'>
                  <div className='item-text'>{config._fontSize.smallLabel}</div>
                </label>
              </div>

              <div className='visua11ysettings__item-option'>
                <input type='radio' value={visua11y.originalFontSize} checked={visua11y.fontSize === visua11y.originalFontSize} id='fontsize-medium' name='fontSize' onChange={onChange} />
                <label htmlFor='fontsize-medium'>
                  <div className='item-text'>{config._fontSize.mediumLabel}</div>
                </label>
              </div>

              <div className='visua11ysettings__item-option'>
                <input type='radio' value={config._fontSize._large} checked={visua11y.fontSize === config._fontSize._large} id='fontsize-large' name='fontSize' onChange={onChange} />
                <label htmlFor='fontsize-large'>
                  <div className='item-text'>{config._fontSize.largeLabel}</div>
                </label>
              </div>

            </div>
          </div>
          }

          {config._lineHeight._isEnabled &&
          <div className='visua11ysettings__item lineheight'>
            <div className="visua11ysettings__item-title" id='lineheight'>
              <div className='icon' aria-hidden='true'></div>{config._lineHeight.title}
            </div>

            <div className="visua11ysettings__item-option-container" role='radiogroup' aria-labelledby='lineheight'>

              <div className='visua11ysettings__item-option'>
                <input type='radio' value={config._lineHeight._small} checked={visua11y.lineHeight === config._lineHeight._small} id='lineheight-small' name='lineHeight' onChange={onChange} />
                <label htmlFor='lineheight-small'>
                  <div className='item-text'>{config._lineHeight.smallLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._lineHeight._medium} checked={visua11y.lineHeight === config._lineHeight._medium} id='lineheight-medium' name='lineHeight' onChange={onChange} />
                <label htmlFor='lineheight-medium'>
                  <div className="item-text">{config._lineHeight.mediumLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._lineHeight._large} checked={visua11y.lineHeight === config._lineHeight._large} id='lineheight-large' name='lineHeight' onChange={onChange} />
                <label htmlFor='lineheight-large'>
                  <div className='item-text'>{config._lineHeight.largeLabel}</div>
                </label>
              </div>

            </div>
          </div>
          }

          {config._paragraphSpacing._isEnabled &&
          <div className='visua11ysettings__item paragraphspacing'>
            <div className="visua11ysettings__item-title" id='paragraphspacing'>
              <div className='icon' aria-hidden='true'></div>{config._paragraphSpacing.title}
            </div>

            <div className="visua11ysettings__item-option-container" role='radiogroup' aria-labelledby='paragraphspacing'>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._paragraphSpacing._small} checked={visua11y.paragraphSpacing === config._paragraphSpacing._small} id='paragraphSpacing-small' name='paragraphSpacing' onChange={onChange} />
                <label htmlFor='paragraphSpacing-small'>
                  <div className='item-text'>{config._paragraphSpacing.smallLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._paragraphSpacing._medium} checked={visua11y.paragraphSpacing === config._paragraphSpacing._medium} id='paragraphSpacing-medium' name='paragraphSpacing' onChange={onChange} />
                <label htmlFor='paragraphSpacing-medium'>
                  <div className="item-text">{config._paragraphSpacing.mediumLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._paragraphSpacing._large} checked={visua11y.paragraphSpacing === config._paragraphSpacing._large} id='paragraphSpacing-large' name='paragraphSpacing' onChange={onChange} />
                <label htmlFor='paragraphSpacing-large'>
                  <div className="item-text">{config._paragraphSpacing.largeLabel}</div>
                </label>
              </div>

            </div>
          </div>
          }

          {config._letterSpacing._isEnabled &&
          <div className='visua11ysettings__item letterspacing'>
            <div className="visua11ysettings__item-title" id='letterspacing'>
              <div className='icon' aria-hidden='true'></div>{config._letterSpacing.title}
            </div>

            <div className="visua11ysettings__item-option-container" role='radiogroup' aria-labelledby='letterspacing'>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._letterSpacing._small} checked={visua11y.letterSpacing === config._letterSpacing._small} id='letterSpacing-small' name='letterSpacing' onChange={onChange} />
                <label htmlFor='letterSpacing-small'>
                  <div className="item-text">{config._letterSpacing.smallLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._letterSpacing._medium} checked={visua11y.letterSpacing === config._letterSpacing._medium} id='letterSpacing-medium' name='letterSpacing' onChange={onChange} />
                <label htmlFor='letterSpacing-medium'>
                  <div className="item-text">{config._letterSpacing.mediumLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._letterSpacing._large} checked={visua11y.letterSpacing === config._letterSpacing._large} id='letterSpacing-large' name='letterSpacing' onChange={onChange} />
                <label htmlFor='letterSpacing-large'>
                  <div className="item-text">{config._letterSpacing.largeLabel}</div>
                </label>
              </div>

            </div>
          </div>
          }

          {config._wordSpacing._isEnabled &&
          <div className='visua11ysettings__item wordspacing'>
            <div className="visua11ysettings__item-title" id='wordspacing'>
              <div className='icon' aria-hidden='true'></div>{config._wordSpacing.title}
            </div>

            <div className="visua11ysettings__item-option-container" role='radiogroup' aria-labelledby='wordspacing'>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._wordSpacing._small} checked={visua11y.wordSpacing === config._wordSpacing._small} id='wordSpacing-small' name='wordSpacing' onChange={onChange} />
                <label htmlFor='wordSpacing-small'>
                  <div className="item-text">{config._wordSpacing.smallLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._wordSpacing._medium} checked={visua11y.wordSpacing === config._wordSpacing._medium} id='wordSpacing-medium' name='wordSpacing' onChange={onChange} />
                <label htmlFor='wordSpacing-medium'>
                  <div className="item-text">{config._wordSpacing.mediumLabel}</div>
                </label>
              </div>

              <div className="visua11ysettings__item-option">
                <input type='radio' value={config._wordSpacing._large} checked={visua11y.wordSpacing === config._wordSpacing._large} id='wordSpacing-large' name='wordSpacing' onChange={onChange} />
                <label htmlFor='wordSpacing-large'>
                  <div className="item-text">{config._wordSpacing.largeLabel}</div>
                </label>
              </div>

            </div>
          </div>
          }

        </div>
      }

      <div className='btn__container'>

        <div className='btn__responsive-container is-reset'>
          <button className='btn-text btn-reset' onClick={onReset} aria-label={config._button.resetText}>
            {config._button.resetText}
          </button>
        </div>

        <div className='btn__response-container is-close'>
          <button className='btn-text btn-close' onClick={onClose} aria-label={config._button.closeText}>
            {config._button.closeText}
          </button>
        </div>

      </div>

    </div>
  );
}
