function app() {
  return {
    active: 'tonecolors',
    // globale Methoden, z. B.:
    playSound(name) {
      const audio = new Audio(`sounds/${name}.mp3`);
      audio.play();
    }
  };
}

// Beispiel-Komponente
document.addEventListener('alpine:init', () => {
  Alpine.data('tonecolors', () => ({
    selected: null,
    pick(sound) {
      this.selected = sound;
      this.$root.playSound(sound);
    }
  }));

  Alpine.data('pitches', () => ({
    // …
  }));
});
