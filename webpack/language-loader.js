const { parse } = require('node-html-parser');

module.exports = function(source) {
  console.log('Language Loader called for resource:', this.resource);
  
  // Versuche die Sprachparameter aus verschiedenen Quellen zu erhalten
  const options = this.getOptions();
  console.log('Options received:', JSON.stringify(options));
  let lang = options.language;
  
  // Wenn keine Sprache in den Optionen definiert ist, versuche sie aus den Query-Parametern zu bekommen
  if (!lang && this.resourceQuery) {
    console.log('Resource query:', this.resourceQuery);
    const queryString = this.resourceQuery.substring(1); // Entferne das '?' am Anfang
    const queryParams = new URLSearchParams(queryString);
    lang = queryParams.get('language');
    console.log('Language from query params:', lang);
  }
  
  // Wenn immer noch keine Sprache, versuche sie aus den Template-Parametern zu bekommen
  if (!lang) {
    console.log('Checking for templateParameters...');
    
    // Versuche es direkt aus den Template-Parametern zu bekommen
    if (this._compilation && this._compilation.options && this._compilation.options.plugins) {
      console.log('Plugins gefunden:', this._compilation.options.plugins.length);
      
      const htmlPlugins = this._compilation.options.plugins
        .filter(plugin => plugin.constructor && plugin.constructor.name === 'HtmlWebpackPlugin');
      console.log('HTML Plugins gefunden:', htmlPlugins.length);
      
      // Finde das richtige Plugin anhand des aktuellen Templates
      if (this.resource) {
        const targetPlugin = htmlPlugins.find(plugin => {
          const pluginTemplate = plugin.userOptions && plugin.userOptions.template;
          return pluginTemplate && this.resource.includes(pluginTemplate);
        });
        
        if (targetPlugin && targetPlugin.userOptions && targetPlugin.userOptions.templateParameters) {
          console.log('HTML Plugin für das aktuelle Template gefunden:', targetPlugin.userOptions.template);
          console.log('Template Parameters:', JSON.stringify(targetPlugin.userOptions.templateParameters));
          lang = targetPlugin.userOptions.templateParameters.language;
          console.log('Language from template parameters:', lang);
        } else {
          console.log('Kein passendes HTML Plugin gefunden für:', this.resource);
        }
      }
    } else {
      console.log('Keine _compilation oder plugins vorhanden');
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
  
  // 3. Sonderfall: Bei <html> Element das lang-Attribut immer auf die aktuelle Sprache setzen - stellt sicher, dass das lang-Attribut korrekt ist
  const htmlElement = root.querySelector('html');
  if (htmlElement) {
    console.log(`Setting <html> lang attribute to: ${lang}`);
    htmlElement.setAttribute('lang', lang);
  } else {
    console.warn('No <html> element found in template');
  }
  
  return root.toString();
};
