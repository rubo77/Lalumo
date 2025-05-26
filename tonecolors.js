Alpine.data('tonecolors', () => ({
  pick(sound) {
    const audio = new Audio(`sounds/${sound}.mp3`);
    audio.play();
  }
}));
