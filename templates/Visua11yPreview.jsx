import React from 'react';
export default function Visua11yPreview(config) {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview__nav"></div>
      <div className="preview__header">
        {config._preview.title}
      </div>
      <div className="preview__content">
        <div className="preview__text">
          <div className="top">
            <div className="letter">{config._preview.character}</div>
            <div className="lines">
              <div className="line"></div>
              <div className="line"></div>
              <div className="line"></div>
            </div>
          </div>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        <div className="preview__comp">
          <div className="item"></div>
          <div className="item"></div>
          <div className="item"></div>
          <div className="btn"></div>
        </div>
      </div>
    </div>
  );
}
