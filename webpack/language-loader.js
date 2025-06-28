const { parse } = require('node-html-parser');

module.exports = function(source) {
  const options = this.getOptions();
  const lang = options.language;
  
  // HTML parsen
  const root = parse(source);
  
  // 1. Elemente mit anderen Sprachen entfernen
  root.querySelectorAll(`[lang]:not([lang="${lang}"])`).forEach(el => {
    el.remove();
  });
  
  // 2. Lang-Attribute von den verbleibenden Elementen entfernen
  root.querySelectorAll(`[lang="${lang}"]`).forEach(el => {
    el.removeAttribute('lang');
  });
  
  return root.toString();
};
