// Web Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let oscillators = [null, null, null];
let isRunning = [false, false, false];

const params = [
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
];

const sampleRate = audioContext.sampleRate;
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Create a master gain node for all oscillators
const masterGain = audioContext.createGain();
masterGain.gain.value = 0.8;
masterGain.connect(audioContext.destination);

// Reverb setup
const convolver = audioContext.createConvolver();
const reverbGain = audioContext.createGain();
reverbGain.gain.value = 0.5; // Initial mix value

// Load an impulse response for the reverb
fetch('https://example.com/impulse-response.wav')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data, buffer => {
        convolver.buffer = buffer;
    }));

// Connect reverb to master output
masterGain.connect(convolver);
convolver.connect(reverbGain).connect(audioContext.destination);

// Function to create filters and gains for each oscillator
function setupAudioNodes(index) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    const gain = audioContext.createGain();
    gain.gain.value = 0.2;

    params[index].filter = filter;
    params[index].gain = gain;

    filter.connect(gain).connect(masterGain);
}

// Function to start an oscillator
function startOscillator(index) {
    if (isRunning[index]) return;

    oscillators[index] = audioContext.createScriptProcessor(256, 1, 1);
    oscillators[index].onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        const { phase, frequency, phaseDistortion, harmonicIntensity, fractalDepth } = params[index];
        for (let i = 0; i < output.length; i++) {
            params[index].phase += (frequency / sampleRate) * 2 * Math.PI;
            const distortedPhase = params[index].phase + Math.sin(params[index].phase * phaseDistortion) * phaseDistortion;
            output[i] = Math.sin(distortedPhase * Math.pow(phi, fractalDepth)) * Math.pow(phi, -i % (5 * harmonicIntensity + 1));
        }
    };

    oscillators[index].connect(params[index].filter);
    isRunning[index] = true;
}

// Function to stop an oscillator
function stopOscillator(index) {
    if (!isRunning[index]) return;
    oscillators[index].disconnect();
    oscillators[index] = null;
    isRunning[index] = false;
}

// Setup and bind controls for each oscillator
function setupControls(index, prefix) {
    setupAudioNodes(index);

    document.getElementById(`startButton${prefix}`).addEventListener('click', () => {
        audioContext.resume().then(() => {
            startOscillator(index);
        });
    });

    document.getElementById(`stopButton${prefix}`).addEventListener('click', () => {
        stopOscillator(index);
    });

    document.getElementById(`frequencySlider${prefix}`).addEventListener('input', (event) => {
        params[index].frequency = parseFloat(event.target.value);
    });

    document.getElementById(`phaseDistortionSlider${prefix}`).addEventListener('input', (event) => {
        params[index].phaseDistortion = parseFloat(event.target.value);
    });

    document.getElementById(`harmonicIntensitySlider${prefix}`).addEventListener('input', (event) => {
        params[index].harmonicIntensity = parseFloat(event.target.value);
    });

    document.getElementById(`fractalDepthSlider${prefix}`).addEventListener('input', (event) => {
        params[index].fractalDepth = parseInt(event.target.value);
    });

    document.getElementById(`cutoffSlider${prefix}`).addEventListener('input', (event) => {
        params[index].filter.frequency.value = parseFloat(event.target.value);
    });

    document.getElementById(`resonanceSlider${prefix}`).addEventListener('input', (event) => {
        params[index].filter.Q.value = parseFloat(event.target.value);
    });
}

// Setup reverb controls
document.getElementById('reverbMixSlider').addEventListener('input', (event) => {
    reverbGain.gain.value = parseFloat(event.target.value);
});

document.getElementById('toggleReverbButton').addEventListener('click', () => {
    if (masterGain.connect(convolver)) {
        convolver.disconnect();
    } else {
        masterGain.connect(convolver);
    }
});

// Setup controls for each oscillator
setupControls(0, '1');
setupControls(1, '2');
setupControls(2, '3');
