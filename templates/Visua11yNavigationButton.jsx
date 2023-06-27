import React from 'react';
import { classes, compile } from 'core/js/reactHelpers';

export default function Visua11yNavigationButton(props) {
  const {
    text,
    _iconClasses
  } = props;
  return (
    <React.Fragment>
      <span
        className={classes([
          'icon',
          _iconClasses
        ])}
        aria-hidden="true"
      />
      <span className="nav__btn-label" aria-hidden="true">{compile(text, props)}</span>
    </React.Fragment>
  );
}
