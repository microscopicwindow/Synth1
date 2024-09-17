// Web Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create a custom oscillator node
const phiOscillator = audioContext.createScriptProcessor(256, 1, 1);
let phase = 0;
let frequency = 440; // Default frequency set by slider
const sampleRate = audioContext.sampleRate;
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Phi Oscillator Process
phiOscillator.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        // Generate a custom waveform using Phi-modulated sine wave
        phase += (frequency * Math.pow(phi, i % 2)) / sampleRate;
        output[i] = Math.sin(phase * 2 * Math.PI) * Math.pow(phi, -i % 5);
    }
};

// Gain Node to control volume
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.2;

// Connect the oscillator to the gain and destination
phiOscillator.connect(gainNode).connect(audioContext.destination);

// Start Button
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    audioContext.resume();
    phiOscillator.connect(audioContext.destination);
});

// Stop Button
const stopButton = document.getElementById('stopButton');
stopButton.addEventListener('click', () => {
    phiOscillator.disconnect(audioContext.destination);
});

// Frequency Slider
const frequencySlider = document.getElementById('frequencySlider');
frequencySlider.addEventListener('input', (event) => {
    frequency = parseFloat(event.target.value);
});
