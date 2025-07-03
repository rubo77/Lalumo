/**
 * Native App Detector
 * Sets a global flag to identify native app environment
 */

// Dieses Skript wird beim App-Start ausgeführt und setzt die isNativeApp-Flag
(function() {
  // In der nativen App wird capacitorJs geladen
  // Dies ist ein zuverlässiger Indikator, dass wir in einer nativen App laufen
  window.isNativeApp = (typeof window.Capacitor !== 'undefined');
  
  console.log('Native app environment detected:', window.isNativeApp);
})();
