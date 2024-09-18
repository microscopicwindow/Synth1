// Web Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Array to hold each oscillator's state
let oscillators = [null, null, null];
let isRunning = [false, false, false];

// Parameters for each oscillator
const params = [
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
];

const sampleRate = audioContext.sampleRate;
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

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

    filter.connect(gain).connect(audioContext.destination);
}

// Function to start an oscillator
function startOscillator(index) {
    if (isRunning[index]) return;

    // Create the oscillator node
    oscillators[index] = audioContext.createScriptProcessor(256, 1, 1);
    oscillators[index].onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        const { phase, frequency, phaseDistortion, harmonicIntensity, fractalDepth } = params[index];
        for (let i = 0; i < output.length; i++) {
            // Calculate phase and apply phase distortion
            params[index].phase += (frequency / sampleRate) * 2 * Math.PI;
            const distortedPhase = params[index].phase + Math.sin(params[index].phase * phaseDistortion) * phaseDistortion;
            
            // Generate output with Phi-modulated wave
            output[i] = Math.sin(distortedPhase * Math.pow(phi, fractalDepth)) * Math.pow(phi, -i % (5 * harmonicIntensity + 1));
        }
    };

    // Connect the oscillator to the filter
    oscillators[index].connect(params[index].filter);
    isRunning[index] = true;
}

// Function to stop an oscillator
function stopOscillator(index) {
    if (!isRunning[index]) return;
    // Disconnect and nullify the oscillator
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

// Setup controls for each oscillator
setupControls(0, '1');
setupControls(1, '2');
setupControls(2, '3');
