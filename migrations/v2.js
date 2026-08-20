import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Visua11y - v2.2.2 to v2.2.3', async () => {
  // https://github.com/cgkineo/adapt-visua11y/compare/v2.2.2..v2.2.3

  let course, titleBefore;
  const originalTitle = 'No background images';
  const newTitle = 'Hide decorative images';

  whereFromPlugin('Visua11y - from v2.2.2', { name: 'adapt-visua11y', version: '<2.2.3' });

  whereContent('Visua11y - where course._visua11y exists', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    titleBefore = course?._visua11y?._noBackgroundImages?.title;
    return Boolean(course?._visua11y);
  });

  // Rendered as both the visible checkbox label and its aria-label by
  // templates/Visua11ySettings.jsx, so this is a content change rather than a cosmetic one.
  mutateContent('Visua11y - update _noBackgroundImages.title default text', async (content) => {
    if (course._visua11y._noBackgroundImages?.title !== originalTitle) return true;
    course._visua11y._noBackgroundImages.title = newTitle;
    return true;
  });

  checkContent('Visua11y - check _noBackgroundImages.title default text', async (content) => {
    const expected = titleBefore === originalTitle ? newTitle : titleBefore;
    if (course._visua11y._noBackgroundImages?.title !== expected) throw new Error('Visua11y - _noBackgroundImages.title not updated');
    return true;
  });

  updatePlugin('Visua11y - update to v2.2.3', { name: 'adapt-visua11y', version: '2.2.3', framework: '>=5.31.4' });

  testSuccessWhere('course with the old default title - gets renamed', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.2' }],
    content: [
      { _type: 'course', _visua11y: { _noBackgroundImages: { title: 'No background images' } } }
    ]
  });

  testSuccessWhere('course with a customised title - survives untouched', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.2' }],
    content: [
      { _type: 'course', _visua11y: { _noBackgroundImages: { title: 'My custom label' } } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }]
  });

  testStopWhere('no course._visua11y', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.2' }],
    content: [
      { _type: 'course' }
    ]
  });
});

describe('Visua11y - v2.2.3 to v2.2.4', async () => {
  // https://github.com/cgkineo/adapt-visua11y/compare/v2.2.3..v2.2.4
  // commit e7bd9ae "Fix: _globals schema nesting (fixes #75)"

  let course;
  let hadSourceBefore, sourceValueBefore, hadDestinationBefore, destinationValueBefore, legacySiblingsBefore;

  whereFromPlugin('Visua11y - from v2.2.3', { name: 'adapt-visua11y', version: '<2.2.4' });

  whereContent('Visua11y - where course exists', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    return Boolean(course);
  });

  // Safety net for courses authored against the buggy v2.1.2-v2.2.3 schema path. The legacy
  // `globals` block already mapped _navOrder correctly, so AT-authored courses are untouched.
  mutateContent('Visua11y - move _globals._visua11y._navOrder to _globals._extensions._visua11y._navOrder', async (content) => {
    hadSourceBefore = _.has(course, '_globals._visua11y._navOrder');
    sourceValueBefore = _.get(course, '_globals._visua11y._navOrder');
    hadDestinationBefore = _.has(course, '_globals._extensions._visua11y._navOrder');
    destinationValueBefore = _.get(course, '_globals._extensions._visua11y._navOrder');
    legacySiblingsBefore = hadSourceBefore ? Object.keys(course._globals._visua11y).filter(k => k !== '_navOrder') : [];
    if (!hadSourceBefore) return true;
    if (!hadDestinationBefore) _.set(course, '_globals._extensions._visua11y._navOrder', sourceValueBefore);
    _.unset(course, '_globals._visua11y._navOrder');
    // Only remove the now-empty legacy container - never delete sibling keys another author or
    // plugin may have put there.
    if (_.isEmpty(course._globals._visua11y)) _.unset(course, '_globals._visua11y');
    return true;
  });

  mutateContent('Visua11y - add course._globals._accessibility._ariaLabels.visua11y', async (content) => {
    if (!_.has(course, '_globals._accessibility._ariaLabels')) _.set(course, '_globals._accessibility._ariaLabels', {});
    course._globals._accessibility._ariaLabels.visua11y = 'Visual accessibility settings';
    return true;
  });

  checkContent('Visua11y - check _globals._extensions._visua11y._navOrder move', async (content) => {
    if (_.has(course, '_globals._visua11y._navOrder')) throw new Error('Visua11y - legacy _globals._visua11y._navOrder was not removed');
    const expected = hadDestinationBefore ? destinationValueBefore : (hadSourceBefore ? sourceValueBefore : undefined);
    if (_.get(course, '_globals._extensions._visua11y._navOrder') !== expected) throw new Error('Visua11y - _globals._extensions._visua11y._navOrder invalid');
    const siblingsSurvived = legacySiblingsBefore.every(k => _.has(course, `_globals._visua11y.${k}`));
    if (!siblingsSurvived) throw new Error('Visua11y - _globals._visua11y sibling keys were wrongly removed');
    return true;
  });

  checkContent('Visua11y - check course._globals._accessibility._ariaLabels.visua11y', async (content) => {
    if (course._globals._accessibility._ariaLabels.visua11y !== 'Visual accessibility settings') throw new Error('Visua11y - course._globals._accessibility._ariaLabels.visua11y invalid');
    return true;
  });

  updatePlugin('Visua11y - update to v2.2.4', { name: 'adapt-visua11y', version: '2.2.4', framework: '>=5.31.4' });

  testSuccessWhere('legacy source present, destination absent - value is moved', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }],
    content: [
      { _type: 'course', _globals: { _visua11y: { _navOrder: 5 } } }
    ]
  });

  testSuccessWhere('legacy source present, destination already set - destination wins, source still unset', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }],
    content: [
      { _type: 'course', _globals: { _visua11y: { _navOrder: 5 }, _extensions: { _visua11y: { _navOrder: 9 } } } }
    ]
  });

  testSuccessWhere('legacy source absent - no-op, destination already correct from the legacy globals mapping', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }],
    content: [
      { _type: 'course', _globals: { _extensions: { _visua11y: { _navOrder: 50 } } } }
    ]
  });

  testSuccessWhere('legacy container has sibling keys - only _navOrder is removed, siblings survive', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }],
    content: [
      { _type: 'course', _globals: { _visua11y: { _navOrder: 4, _customSetting: 'keep me' } } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.4' }]
  });

  testStopWhere('no course content', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.3' }],
    content: [
      { _type: 'config' }
    ]
  });
});

describe('Visua11y - v2.2.4 to v2.3.0', async () => {
  // https://github.com/cgkineo/adapt-visua11y/compare/v2.2.4..v2.3.0

  let course;

  whereFromPlugin('Visua11y - from v2.2.4', { name: 'adapt-visua11y', version: '<2.3.0' });

  whereContent('Visua11y - where course._visua11y exists', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    return Boolean(course?._visua11y);
  });

  mutateContent('Visua11y - add course._visua11y._location', async (content) => {
    course._visua11y._location = 'notify';
    return true;
  });

  checkContent('Visua11y - check course._visua11y._location', async (content) => {
    if (course._visua11y._location !== 'notify') throw new Error('Visua11y - course._visua11y._location invalid');
    return true;
  });

  updatePlugin('Visua11y - update to v2.3.0', { name: 'adapt-visua11y', version: '2.3.0', framework: '>=5.31.4' });

  testSuccessWhere('course with _visua11y - _location backfilled to notify', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.4' }],
    content: [
      { _type: 'course', _visua11y: {} }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.3.0' }]
  });

  testStopWhere('no course._visua11y', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.2.4' }],
    content: [
      { _type: 'course' }
    ]
  });
});

describe('Visua11y - v2.5.0 to v2.5.1', async () => {
  // https://github.com/cgkineo/adapt-visua11y/compare/v2.5.0..v2.5.1

  let course, visua11yGlobals;
  let hadSourceBefore, sourceValueBefore, hadDestinationBefore, destinationValueBefore;
  let ariaLabelSiblingsBefore, accessibilitySiblingsBefore;

  whereFromPlugin('Visua11y - from v2.5.0', { name: 'adapt-visua11y', version: '<2.5.1' });

  whereContent('Visua11y - where course exists', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    return Boolean(course);
  });

  // `_ariaLabels` stops being a keyed object under _accessibility and becomes a string leaf on
  // the extension. Other plugins own keys under _accessibility, so cleanup must preserve them.
  // _navOrder is not touched here - the v2.2.4 block above owns it.
  mutateContent('Visua11y - move _globals._accessibility._ariaLabels.visua11y to _globals._extensions._visua11y._ariaLabels', async (content) => {
    hadSourceBefore = _.has(course, '_globals._accessibility._ariaLabels.visua11y');
    sourceValueBefore = _.get(course, '_globals._accessibility._ariaLabels.visua11y');
    hadDestinationBefore = _.has(course, '_globals._extensions._visua11y._ariaLabels');
    destinationValueBefore = _.get(course, '_globals._extensions._visua11y._ariaLabels');
    const ariaLabelsContainer = course._globals?._accessibility?._ariaLabels;
    ariaLabelSiblingsBefore = ariaLabelsContainer ? Object.keys(ariaLabelsContainer).filter(k => k !== 'visua11y') : [];
    const accessibilityContainer = course._globals?._accessibility;
    accessibilitySiblingsBefore = accessibilityContainer ? Object.keys(accessibilityContainer).filter(k => k !== '_ariaLabels') : [];

    if (!hadSourceBefore) return true;
    if (!hadDestinationBefore) _.set(course, '_globals._extensions._visua11y._ariaLabels', sourceValueBefore);
    _.unset(course, '_globals._accessibility._ariaLabels.visua11y');
    if (_.isEmpty(course._globals._accessibility._ariaLabels)) _.unset(course, '_globals._accessibility._ariaLabels');
    if (_.isEmpty(course._globals._accessibility)) _.unset(course, '_globals._accessibility');
    return true;
  });

  mutateContent('Visua11y - add course._globals._extensions._visua11y._showLabel', async (content) => {
    if (!_.has(course, '_globals._extensions._visua11y')) _.set(course, '_globals._extensions._visua11y', {});
    visua11yGlobals = course._globals._extensions._visua11y;
    visua11yGlobals._showLabel = true;
    return true;
  });

  mutateContent('Visua11y - add course._globals._extensions._visua11y.navLabel', async (content) => {
    visua11yGlobals.navLabel = 'Accessibility';
    return true;
  });

  mutateContent('Visua11y - add course._globals._extensions._visua11y._navTooltip._isEnabled', async (content) => {
    if (!_.has(visua11yGlobals, '_navTooltip')) _.set(visua11yGlobals, '_navTooltip', {});
    visua11yGlobals._navTooltip._isEnabled = true;
    return true;
  });

  mutateContent('Visua11y - add course._globals._extensions._visua11y._navTooltip.text', async (content) => {
    visua11yGlobals._navTooltip.text = 'Visual accessibility settings';
    return true;
  });

  checkContent('Visua11y - check _globals._extensions._visua11y._ariaLabels move', async (content) => {
    if (_.has(course, '_globals._accessibility._ariaLabels.visua11y')) throw new Error('Visua11y - legacy _globals._accessibility._ariaLabels.visua11y was not removed');
    const expected = hadDestinationBefore ? destinationValueBefore : (hadSourceBefore ? sourceValueBefore : undefined);
    if (_.get(course, '_globals._extensions._visua11y._ariaLabels') !== expected) throw new Error('Visua11y - _globals._extensions._visua11y._ariaLabels invalid');
    const ariaLabelSiblingsSurvived = ariaLabelSiblingsBefore.every(k => _.has(course, `_globals._accessibility._ariaLabels.${k}`));
    if (!ariaLabelSiblingsSurvived) throw new Error('Visua11y - _globals._accessibility._ariaLabels sibling keys were wrongly removed');
    const accessibilitySiblingsSurvived = accessibilitySiblingsBefore.every(k => _.has(course, `_globals._accessibility.${k}`));
    if (!accessibilitySiblingsSurvived) throw new Error('Visua11y - _globals._accessibility sibling keys were wrongly removed');
    return true;
  });

  checkContent('Visua11y - check course._globals._extensions._visua11y._showLabel', async (content) => {
    if (course._globals._extensions._visua11y._showLabel !== true) throw new Error('Visua11y - course._globals._extensions._visua11y._showLabel invalid');
    return true;
  });

  checkContent('Visua11y - check course._globals._extensions._visua11y.navLabel', async (content) => {
    if (course._globals._extensions._visua11y.navLabel !== 'Accessibility') throw new Error('Visua11y - course._globals._extensions._visua11y.navLabel invalid');
    return true;
  });

  checkContent('Visua11y - check course._globals._extensions._visua11y._navTooltip._isEnabled', async (content) => {
    if (course._globals._extensions._visua11y._navTooltip._isEnabled !== true) throw new Error('Visua11y - course._globals._extensions._visua11y._navTooltip._isEnabled invalid');
    return true;
  });

  checkContent('Visua11y - check course._globals._extensions._visua11y._navTooltip.text', async (content) => {
    if (course._globals._extensions._visua11y._navTooltip.text !== 'Visual accessibility settings') throw new Error('Visua11y - course._globals._extensions._visua11y._navTooltip.text invalid');
    return true;
  });

  updatePlugin('Visua11y - update to v2.5.1', { name: 'adapt-visua11y', version: '2.5.1', framework: '>=5.31.4' });

  testSuccessWhere('bare course - ariaLabels source absent, four new properties backfilled', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      { _type: 'course' }
    ]
  });

  testSuccessWhere('ariaLabels source present, destination absent - value is moved', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      { _type: 'course', _globals: { _accessibility: { _ariaLabels: { visua11y: 'Visual accessibility settings' } } } }
    ]
  });

  testSuccessWhere('ariaLabels source present, destination already set - destination wins, source still unset', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      {
        _type: 'course',
        _globals: {
          _accessibility: { _ariaLabels: { visua11y: 'Old value' } },
          _extensions: { _visua11y: { _ariaLabels: 'Already customised value' } }
        }
      }
    ]
  });

  testSuccessWhere('ariaLabels source absent, sibling keys under _accessibility survive', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      {
        _type: 'course',
        _globals: {
          _accessibility: { _ariaLabels: { skipNavigation: 'Skip navigation' }, accessibilityToggleTextOn: 'Turn accessibility on?' }
        }
      }
    ]
  });

  // Source AND siblings together. Without this the cleanup branches never run (a source-less
  // course returns early) and the sibling-survival assertions above could not fail.
  testSuccessWhere('ariaLabels source present alongside siblings - only visua11y is removed', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      {
        _type: 'course',
        _globals: {
          _accessibility: {
            _ariaLabels: { visua11y: 'Visual accessibility settings', skipNavigation: 'Skip navigation' },
            accessibilityToggleTextOn: 'Turn accessibility on?'
          }
        }
      }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.1' }]
  });

  testStopWhere('no course content', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.5.0' }],
    content: [
      { _type: 'config' }
    ]
  });
});

describe('Visua11y - v2.8.0 to v2.8.1', async () => {
  // https://github.com/cgkineo/adapt-visua11y/compare/v2.8.0..v2.8.1
  // Fix: Title is required to set notify popup dialog label (fixes #107) (#108)

  let course, titleBefore;

  whereFromPlugin('Visua11y - from v2.8.0', { name: 'adapt-visua11y', version: '<2.8.1' });

  whereContent('Visua11y - where course._visua11y exists', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    titleBefore = course?._visua11y?.title;
    return Boolean(course?._visua11y);
  });

  // `title` becomes required, with no default change. It has no runtime fallback:
  // Visua11yNavigationButtonView reads Adapt.course.get('_visua11y') directly, bypassing the
  // _deepDefaults merge, so a missing title renders as undefined. Backfill only when falsy -
  // authored titles must survive.
  mutateContent('Visua11y - backfill required course._visua11y.title', async (content) => {
    if (course._visua11y.title) return true;
    course._visua11y.title = 'Accessibility Controls';
    return true;
  });

  checkContent('Visua11y - check course._visua11y.title', async (content) => {
    const expected = titleBefore || 'Accessibility Controls';
    if (course._visua11y.title !== expected) throw new Error('Visua11y - course._visua11y.title invalid');
    return true;
  });

  updatePlugin('Visua11y - update to v2.8.1', { name: 'adapt-visua11y', version: '2.8.1', framework: '>=5.31.4' });

  testSuccessWhere('title absent - backfilled to the default', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.0' }],
    content: [
      { _type: 'course', _visua11y: {} }
    ]
  });

  testSuccessWhere('title null - backfilled to the default', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.0' }],
    content: [
      { _type: 'course', _visua11y: { title: null } }
    ]
  });

  testSuccessWhere('title empty string - backfilled to the default', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.0' }],
    content: [
      { _type: 'course', _visua11y: { title: '' } }
    ]
  });

  testSuccessWhere('title already customised - survives untouched', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.0' }],
    content: [
      { _type: 'course', _visua11y: { title: 'My Custom Popup Title' } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.1' }]
  });

  testStopWhere('no course._visua11y', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.8.0' }],
    content: [
      { _type: 'course' }
    ]
  });
});

// A data repair, not a version transition: both schemas declare `resetAriaMessage` with
// `"default": "Small"` while the true default is "Accessibility controls reset" per js/DEFAULTS.js and example.json.
// Schema fix is tracked separately. Authored values win over DEFAULTS, so a course carrying "Small" makes
// screen readers announce "Small" on reset. The wrong default never changed, so there is no
// transition to key this to - hence the open version match and no updatePlugin, as in
// adapt-contrib-spoor/migrations/v3.js "fix invalid _spoor._messages".
describe('Visua11y - fix incorrect resetAriaMessage default', async () => {

  let course;
  const wrongDefault = 'Small';
  const trueDefault = 'Accessibility controls reset';

  whereFromPlugin('Visua11y - no minimum version', { name: 'adapt-visua11y' });

  // Gates on the value being exactly the known-bad ENGLISH default, so a deliberate author
  // customisation is never touched. "Small" is not a plausible reset announcement, so an exact
  // match is safe.
  //
  // TRANSLATIONS ARE NOT HANDLED HERE AND STILL NEED CONSIDERATION.
  // A possible future gate, deliberately not used yet: the bug is a copy/paste of
  // _fontSize.smallLabel, so in a translated course both fields may hold the same string.
  whereContent('Visua11y - where resetAriaMessage is the incorrect schema default', async (content) => {
    course = content.find(({ _type }) => _type === 'course');
    return course?._visua11y?.resetAriaMessage === wrongDefault;
  });

  mutateContent('Visua11y - replace incorrect resetAriaMessage default', async (content) => {
    course._visua11y.resetAriaMessage = trueDefault;
    return true;
  });

  checkContent('Visua11y - check resetAriaMessage', async (content) => {
    if (course._visua11y.resetAriaMessage !== trueDefault) throw new Error('Visua11y - course._visua11y.resetAriaMessage invalid');
    return true;
  });

  testSuccessWhere('course carrying the incorrect "Small" default - replaced', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.13.6' }],
    content: [
      { _type: 'course', _visua11y: { resetAriaMessage: 'Small' } }
    ]
  });

  testSuccessWhere('older course carrying the incorrect default - replaced regardless of version', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '1.0.0' }],
    content: [
      { _type: 'course', _visua11y: { resetAriaMessage: 'Small' } }
    ]
  });

  testStopWhere('course already holding the true default - untouched', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.13.6' }],
    content: [
      { _type: 'course', _visua11y: { resetAriaMessage: 'Accessibility controls reset' } }
    ]
  });

  testStopWhere('course with an authored customisation - untouched', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.13.6' }],
    content: [
      { _type: 'course', _visua11y: { resetAriaMessage: 'Settings have been reset' } }
    ]
  });

  testStopWhere('resetAriaMessage absent', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.13.6' }],
    content: [
      { _type: 'course', _visua11y: {} }
    ]
  });

  testStopWhere('no course._visua11y', {
    fromPlugins: [{ name: 'adapt-visua11y', version: '2.13.6' }],
    content: [
      { _type: 'course' }
    ]
  });
});
