# adapt-visua11y

**Visua11y** is an *extension* for the [Adapt framework](https://github.com/adaptlearning/adapt_framework).
It provides visual accessibility improvements.

* Color profiles (achromatopsia, protanopia, deuteranopia, tritanopia, dyslexia)
* High contrast
* No transparency
* Low brightness
* Invert
* No animations
* Hide decorative images
* Font size (small, medium, large)
* Line height (small, medium, large)
* Paragraph spacing (small, medium, large)
* Letter spacing (small, medium, large)
* Word spacing (small, medium, large)

### Note
* IE11 cannot apply filters. This means that images and videos will not be transformed in IE11.
* Invert only inverts brightness, not colour.
* Line height, paragraph spacing, letter spacing and word spacing are all ratio based. 1 is the current value, 1.2 is and uplift by 20%, 0.9 would be a shift downwards by 10%.
* In order to support paragraph spacing, all body text needs to be wrapped in [paragraph tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p).
* Font size medium is the default font size (16px usually), large is 18pt, small is 9pt.
* Hide decorative images is contingent on alt text.
* No transparency removes `box-shadow` (where transparency is used), `text-shadow` and `opacity` styles.

### Theme considerations
* All colour transformations are applied by mathematical shifts. It is therefore important that the course start from AA colour contrast for the algorithms to be applicable.
* Any custom CSS `background-image` will need to explicitly define support for colour profiles. For example:
<pre>
html:not([data-color-profile=default]) {
  .selector-with-css-bg-image {
    .visua11y-filters;
  }
}
</pre>
* For any text that overlays a background image, ensure an appropriate `background-color` is set to provide sufficient contrast in the instance decorative images are hidden (`"_noBackgroundImages": false`).

----------------------------
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/cgkineo/adapt-visua11y/graphs/contributors)<br/>
**Accessibility support:** WAI AA<br/>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, IE11, Safari 12+13 for macOS/iOS/iPadOS, Opera<br/>
