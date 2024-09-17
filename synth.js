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

// Create a low-pass filter for cutoff and resonance control
const filter = audioContext.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 2000; // Initial cutoff frequency
filter.Q.value = 1; // Initial resonance

// Phi Oscillator Process
phiOscillator.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
        // Calculate base phase without distortion
        phase += (frequency / sampleRate) * 2 * Math.PI;

        // Apply phase distortion without altering frequency
        const distortedPhase = phase + Math.sin(phase * phaseDistortion) * phaseDistortion;

        // Generate the output sample with modified phase
        output[i] = Math.sin(distortedPhase * Math.pow(phi, fractalDepth)) * Math.pow(phi, -i % (5 * harmonicIntensity + 1));
    }
};

// Gain Node to control volume
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.2;

// Connect the oscillator to the filter, then to the gain and destination
phiOscillator.connect(filter).connect(gainNode).connect(audioContext.destination);

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
const phaseDistortionSlider = document.getElementById('phaseDistortionSlider');
phaseDistortionSlider.addEventListener('input', (event) => {
    phaseDistortion = parseFloat(event.target.value);
});

// Harmonic Intensity Control
const harmonicIntensitySlider = document.getElementById('harmonicIntensitySlider');
harmonicIntensitySlider.addEventListener('input', (event) => {
    harmonicIntensity = parseFloat(event.target.value);
});

// Fractal Depth Control
const fractalDepthSlider = document.getElementById('fractalDepthSlider');
fractalDepthSlider.addEventListener('input', (event) => {
    fractalDepth = parseInt(event.target.value);
});

// Cutoff Frequency Control
const cutoffSlider = document.getElementById('cutoffSlider');
cutoffSlider.addEventListener('input', (event) => {
    filter.frequency.value = parseFloat(event.target.value);
});

// Resonance Control
const resonanceSlider = document.getElementById('resonanceSlider');
resonanceSlider.addEventListener('input', (event) => {
    filter.Q.value = parseFloat(event.target.value);
});
