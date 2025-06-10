/**
 * UI-Effekte für die Lalumo App
 */

/**
 * Verwandelt Text in einen gebogenen SVG-Text mit textPath
 * @param {NodeListOf<Element>} elements - Die DOM-Elemente, deren Text gebogen werden soll
 */
export function createCurvedText(elements) {
  console.log(`UI-EFFECTS: createCurvedText aufgerufen mit ${elements.length} Elementen`);
  
  elements.forEach(element => {
    if (!element) {
      console.log('UI-EFFECTS: Element ist null oder undefined');
      return;
    }
    
    console.log(`UI-EFFECTS: Verarbeite Element mit Klassen: ${element.className}`);
    
    // Original-Text speichern
    const originalText = element.textContent;
    if (!originalText || originalText.trim() === '') {
      console.log('UI-EFFECTS: Element hat keinen Text');
      return;
    }
    
    console.log(`UI-EFFECTS: Text zum Biegen: "${originalText}"`);
    
    // Element-ID für SVG erzeugen
    const id = 'curve-' + Math.random().toString(36).substring(2, 9);
    
    // SVG mit gebogener Pfadkurve erstellen
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 500 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    
    // Pfad definieren: eine nach unten gebogene Kurve (Schüsselform)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', id);
    path.setAttribute('d', 'M20,50 Q250,80 480,50');
    path.style.fill = 'none';
    path.style.stroke = 'none'; // Pfad unsichtbar machen
    
    // Text auf Pfad
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.style.fill = 'currentColor'; // Textfarbe vom CSS erben
    text.style.fontWeight = 'inherit'; // Schriftstärke vom CSS erben
    text.style.fontSize = 'inherit'; // Schriftgröße vom CSS erben
    
    // Text auf Pfad setzen
    const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
    textPath.setAttribute('href', '#' + id);
    textPath.setAttribute('startOffset', '50%');
    textPath.textContent = originalText;
    
    // Alles zusammenfügen
    text.appendChild(textPath);
    svg.appendChild(path);
    svg.appendChild(text);
    
    // Original-Text löschen und SVG einfügen
    element.textContent = '';
    element.appendChild(svg);
    
    console.log('UI-EFFECTS: Created curved text for element:', element);
  });
}

/**
 * Initialisiert alle UI-Effekte
 */
export function initUIEffects() {
  console.log('UI-EFFECTS: Initialisiere UI-Effekte');
  
  // Gebogenen Text für Feedback-Nachrichten erstellen
  const observeTextElements = () => {
    console.log('UI-EFFECTS: Starte Beobachtung von Textelementen');
    
    // MutationObserver erstellen, um neue Textelemente zu beobachten
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          console.log('UI-EFFECTS: DOM-Änderung erkannt, suche nach Textelementen');
          const feedbackMessages = document.querySelectorAll('.feedback-message, .melody-name');
          console.log('UI-EFFECTS: Gefundene Textelemente:', feedbackMessages.length);
          createCurvedText(feedbackMessages);
        }
      });
    });
    
    // Observer starten
    const feedbackMessages = document.querySelectorAll('.feedback-message, .melody-name');
    createCurvedText(feedbackMessages); // Initial vorhandene Elemente umwandeln
    
    // Beobachte Änderungen an bestehenden Feedback-Elementen
    feedbackMessages.forEach(element => {
      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
    
    // Beobachte den Body für neue Feedback-Elemente
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };
  
  // Warten bis das DOM geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeTextElements);
  } else {
    observeTextElements();
  }
}
