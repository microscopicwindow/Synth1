// Web Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create oscillators for blending
const osc1 = audioContext.createOscillator();
const osc2 = audioContext.createOscillator();
const gain1 = audioContext.createGain();
const gain2 = audioContext.createGain();

// Set up oscillators
osc1.type = 'sine'; // Basic sine wave
osc2.type = 'sawtooth'; // Sawtooth wave for contrast

// Connect oscillators to gain nodes
osc1.connect(gain1).connect(audioContext.destination);
osc2.connect(gain2).connect(audioContext.destination);

// Function to handle blending
function updateBlend(value) {
    gain1.gain.value = 1 - value; // Osc1 is stronger when slider is low
    gain2.gain.value = value; // Osc2 is stronger when slider is high
}

// Start and Stop Buttons
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

startButton.addEventListener('click', () => {
    osc1.start();
    osc2.start();
});

stopButton.addEventListener('click', () => {
    osc1.stop();
    osc2.stop();
});

// Slider Control
const blendSlider = document.getElementById('blendSlider');
blendSlider.addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    updateBlend(value);
});

// Initial blend
updateBlend(0.5); // Start in the middle
