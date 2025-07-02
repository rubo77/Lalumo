const { parse } = require('node-html-parser');

module.exports = function(source) {
  // Versuche die Sprachparameter aus verschiedenen Quellen zu erhalten
  const options = this.getOptions();
  let lang = options.language;
  
  // Wenn keine Sprache in den Optionen definiert ist, versuche sie aus den Query-Parametern zu bekommen
  if (!lang && this.resourceQuery) {
    const queryString = this.resourceQuery.substring(1); // Entferne das '?' am Anfang
    const queryParams = new URLSearchParams(queryString);
    lang = queryParams.get('language');
  }
  
  // Wenn immer noch keine Sprache, versuche sie aus den Template-Parametern zu bekommen
  if (!lang && this.loaders && this.loaders.length > 0) {
    const remainingRequest = this.remainingRequest;
    const loaderContext = this.loaderContext;
    if (loaderContext && loaderContext.rootContext && loaderContext._compilation) {
      const templateParams = loaderContext._compilation.options.plugins
        .find(plugin => plugin.constructor && plugin.constructor.name === 'HtmlWebpackPlugin')
        ?.options?.templateParameters;
      if (templateParams && templateParams.language) {
        lang = templateParams.language;
      }
    }
  }
  
  // Fallback zu 'en', falls immer noch keine Sprache definiert ist
  lang = lang || 'en';
  
  console.log('Language Loader using language:', lang);
  
  // HTML parsen
  const root = parse(source);
  
  // 1. Elemente mit anderen Sprachen entfernen (außer html Element)
  root.querySelectorAll(`[lang]:not([lang="${lang}"]):not(html)`).forEach(el => {
    el.remove();
  });
  
  // 2. Lang-Attribute von den verbleibenden Elementen entfernen
  root.querySelectorAll(`[lang="${lang}"]`).forEach(el => {
    el.removeAttribute('lang');
  });
  
  // 3. Sonderfall: Bei <html> Element das lang-Attribut immer auf die aktuelle Sprache setzen
  const htmlElement = root.querySelector('html');
  if (htmlElement) {
    htmlElement.setAttribute('lang', lang);
  }
  
  return root.toString();
};
