# adapt-visua11y

**Visua11y** is an *extension* for the [Adapt framework](https://github.com/adaptlearning/adapt_framework).
It provides visual accessibility improvements.

* Color profiles (achromatopsia, protanopia, deuteranopia, tritanopia, dyslexia)
* High contrast
* No transparency
* Low brightness
* Invert
* No animations
* No background images
* Font size (small, medium, large)
* Line height (small, medium, large)
* Paragraph spacing (small, medium, large)
* Letter spacing (small, medium, large)
* Word spacing (small, medium, large)

### Note
* IE11 cannot apply filters. This means that images and videos will not be transformed in IE11.
* All colour transformations are applied by mathematical shifts. It is therefore important that the course start from AA colour contrast for the algorithms to be applicable.
* Line height, paragraph spacing, letter spacing and word spacing are all ratio based. 1 is the current value, 1.2 is and uplift by 20%, 0.9 would be a shift downwards by 10%.
* Font size medium is the default font size (16px usually), large is 18pt, small is 9pt.
* Invert only inverts brightness, not colour.
* No background images is contingent on alt text.

----------------------------
**Version number:**  1.0.1   <a href="https://community.adaptlearning.org/" target="_blank"><img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/adapt-logo-mrgn-lft.jpg" alt="adapt learning logo" align="right"></a><br/>
**Framework versions:**  5.15+<br/>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-tutor/graphs/contributors)<br/>
**Accessibility support:** WAI AA<br/>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, IE11, Safari 12+13 for macOS/iOS/iPadOS, Opera<br/>
