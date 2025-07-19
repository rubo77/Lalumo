const { parse } = require('node-html-parser');

// Build-time debug logging utility (webpack loader)
// Uses console.log directly since this is build-time logging where console output is expected
const debugLog = (module, message, ...args) => {
  // For build tools, always log since it's development/build time
  if (args.length > 0) {
    console.log(`[${module}] ${message}`, ...args);
  } else {
    console.log(`[${module}] ${message}`);
  }
};

const debugWarn = (module, message, ...args) => {
  if (args.length > 0) {
    console.warn(`[${module}] ${message}`, ...args);
  } else {
    console.warn(`[${module}] ${message}`);
  }
};

module.exports = function(source) {
  debugLog('LANGUAGE_LOADER', 'Language Loader called for resource:', this.resource);
  
  // Versuche die Sprachparameter aus verschiedenen Quellen zu erhalten
  const options = this.getOptions();
  debugLog('LANGUAGE_LOADER', 'Options received:', JSON.stringify(options));
  let lang = options.language;
  
  // Wenn keine Sprache in den Optionen definiert ist, versuche sie aus den Query-Parametern zu bekommen
  if (!lang && this.resourceQuery) {
    debugLog('LANGUAGE_LOADER', 'Resource query:', this.resourceQuery);
    const queryString = this.resourceQuery.substring(1); // Entferne das '?' am Anfang
    const queryParams = new URLSearchParams(queryString);
    lang = queryParams.get('language');
    debugLog('LANGUAGE_LOADER', 'Language from query params:', lang);
  }
  
  // Wenn immer noch keine Sprache, versuche sie aus den Template-Parametern zu bekommen
  if (!lang) {
    debugLog('LANGUAGE_LOADER', 'Checking for templateParameters...');
    
    // Versuche es direkt aus den Template-Parametern zu bekommen
    if (this._compilation && this._compilation.options && this._compilation.options.plugins) {
      debugLog('LANGUAGE_LOADER', 'Plugins gefunden:', this._compilation.options.plugins.length);
      
      const htmlPlugins = this._compilation.options.plugins
        .filter(plugin => plugin.constructor && plugin.constructor.name === 'HtmlWebpackPlugin');
      debugLog('LANGUAGE_LOADER', 'HTML Plugins gefunden:', htmlPlugins.length);
      
      // Finde das richtige Plugin anhand des aktuellen Templates
      if (this.resource) {
        const targetPlugin = htmlPlugins.find(plugin => {
          const pluginTemplate = plugin.userOptions && plugin.userOptions.template;
          return pluginTemplate && this.resource.includes(pluginTemplate);
        });
        
        if (targetPlugin && targetPlugin.userOptions && targetPlugin.userOptions.templateParameters) {
          debugLog('LANGUAGE_LOADER', 'HTML Plugin für das aktuelle Template gefunden:', targetPlugin.userOptions.template);
          debugLog('LANGUAGE_LOADER', 'Template Parameters:', JSON.stringify(targetPlugin.userOptions.templateParameters));
          lang = targetPlugin.userOptions.templateParameters.language;
          debugLog('LANGUAGE_LOADER', 'Language from template parameters:', lang);
        } else {
          debugLog('LANGUAGE_LOADER', 'Kein passendes HTML Plugin gefunden für:', this.resource);
        }
      }
    } else {
      debugLog('LANGUAGE_LOADER', 'Keine _compilation oder plugins vorhanden');
    }
  }
  
  // Fallback zu 'en', falls immer noch keine Sprache definiert ist
  lang = lang || 'en';
  
  debugLog('LANGUAGE_LOADER', 'Language Loader using language:', lang);
  
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
    debugLog('LANGUAGE_LOADER', `Setting <html> lang attribute to: ${lang}`);
    htmlElement.setAttribute('lang', lang);
  } else {
    debugWarn('LANGUAGE_LOADER', 'No <html> element found in template');
  }
  
  return root.toString();
};
