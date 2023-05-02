import Adapt from 'core/js/adapt';
import documentModifications from 'core/js/DOMElementModifications';

class BionicRead extends Backbone.Controller {

  initialize() {
    this.listenTo(Adapt, 'visua11y:changed', this.onLoaded);
    this._isWatching = false;
  }

  onLoaded() {
    if (Adapt.visua11y.bionicRead) {
      this.processDocument();
      this.startWatching();
      return;
    }
    this.stopWatching();
    this.unprocessDocument();
  }

  startWatching () {
    if (this._isWatching) return;
    this._isWatching = true;
    this.listenTo(documentModifications, 'added', this.onMutation);
  }

  stopWatching () {
    if (!this._isWatching) return;
    this._isWatching = false;
    this.stopListening(documentModifications, 'added', this.onMutation);
  }

  onMutation(event) {
    setTimeout(() => {
      this.processNode(event.target);
    });
  }

  processDocument() {
    const nodes = [...document.querySelectorAll('body *:not(script, style, svg)')];
    nodes.forEach(this.processNode);
  }

  unprocessDocument() {
    const nodes = [...document.querySelectorAll('body *:not(script, style, svg)')];
    nodes.forEach(this.unprocessNode);
  }

  unprocessNode(node) {
    if (!node._isBionic) return;
    const parentElement = node.parentNode;
    if (!parentElement) return;
    parentElement._bionics?.forEach(config => {
      try {
        const { originalNode, children } = config;
        parentElement.insertBefore(originalNode, children[0]);
        children.forEach(node => parentElement.removeChild(node));
      } catch (er) {
      }
    });
    delete node._isBionic;
    delete parentElement._bionics;
  }

  processNode(node) {
    if (node._isBionic) return;
    const textNodes = [...node.childNodes]
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .filter(node => node.nodeValue.trim());
    if (!textNodes.length) return;
    textNodes.forEach(function apply(node) {
      const parentElement = node.parentNode;
      parentElement._isBionic = true;
      const value = String(node.nodeValue);
      const whiteSpaces = [...value.matchAll(/\s/g)];
      let last = 0;
      const embolden = whiteSpaces.reduce((parts, entry) => {
        const next = entry.index;
        parts.push(value.substring(last, next + 1));
        last = next + 1;
        return parts;
      }, []);
      const end = value.substring(last, value.length);
      if (end) embolden.push(end);
      const children = [];
      embolden.map(text => {
        const length = text.trim().length;
        if (!length) return [document.createTextNode(text)];
        const emboldenLength = Math.min(Math.ceil(length / 2), 5);
        const span = document.createElement('b');
        span.innerText = text.substring(0, emboldenLength);
        text = text.substring(emboldenLength);
        return [
          span,
          document.createTextNode(text)
        ];
      }).forEach(rw => {
        rw.forEach(wi => {
          wi._isBionic = true;
          children.push(wi);
          parentElement.insertBefore(wi, node);
        });
      });
      parentElement._bionics = parentElement._bionics ?? [];
      parentElement._bionics.push({
        originalNode: node,
        children
      });
      parentElement.removeChild(node);
    });
  }

}

export default new BionicRead();
