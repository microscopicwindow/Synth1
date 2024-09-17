// Web Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create a custom oscillator node
const phiOscillator = audioContext.createScriptProcessor(256, 1, 1);
let phase = 0;
let frequency = 440; // Default frequency set by slider
let phaseDistortion = 0.5;
let harmonicIntensity = 0.5;
let fractalDepth = 3;
const sampleRate = audioContext.sampleRate;
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Phi Oscillator Process
phiOscillator.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        // Generate a custom waveform using Phi-modulated sine wave
        let localPhase = phase * Math.pow(phi, fractalDepth); // Fractal depth influence
        output[i] = Math.sin(localPhase * 2 * Math.PI * phaseDistortion) * Math.pow(phi, -i % (5 * harmonicIntensity + 1));
        phase += (frequency * Math.pow(phi, i % 2)) / sampleRate;
    }
};

// Gain Node to control volume
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.2;

// Connect the oscillator to the gain and destination
phiOscillator.connect(gainNode).connect(audioContext.destination);

// Start and Stop Buttons
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

startButton.addEventListener('click', () => {
    audioContext.resume();
    phiOscillator.connect(audioContext.destination);
});

stopButton.addEventListener('click', () => {
    phiOscillator.disconnect(audioContext.destination);
});

// Frequency Control
const frequencySlider = document.getElementById('frequencySlider');
frequencySlider.addEventListener('input', (event) => {
    frequency = parseFloat(event.target.value);
});

// Phase Distortion Control
const phaseDistortionSlider = document.createElement('input');
phaseDistortionSlider.type = 'range';
phaseDistortionSlider.min = '0';
phaseDistortionSlider.max = '2';
phaseDistortionSlider.step = '0.01';
phaseDistortionSlider.value = phaseDistortion;
document.body.appendChild(phaseDistortionSlider);
phaseDistortionSlider.addEventListener('input', (event) => {
    phaseDistortion = parseFloat(event.target.value);
});

// Harmonic Intensity Control
const harmonicIntensitySlider = document.createElement('input');
harmonicIntensitySlider.type = 'range';
harmonicIntensitySlider.min = '0';
harmonicIntensitySlider.max = '1';
harmonicIntensitySlider.step = '0.01';
harmonicIntensitySlider.value = harmonicIntensity;
document.body.appendChild(harmonicIntensitySlider);
harmonicIntensitySlider.addEventListener('input', (event) => {
    harmonicIntensity = parseFloat(event.target.value);
});

// Fractal Depth Control
const fractalDepthSlider = document.createElement('input');
fractalDepthSlider.type = 'range';
fractalDepthSlider.min = '1';
fractalDepthSlider.max = '5';
fractalDepthSlider.step = '1';
fractalDepthSlider.value = fractalDepth;
document.body.appendChild(fractalDepthSlider);
fractalDepthSlider.addEventListener('input', (event) => {
    fractalDepth = parseInt(event.target.value);
});

