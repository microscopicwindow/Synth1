// Web Audio Context and Audio Worklet Setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Initialize state for oscillators
let oscillators = [null, null, null];
let isRunning = [false, false, false];

const params = [
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
    { phase: 0, frequency: 440, phaseDistortion: 0.5, harmonicIntensity: 0.5, fractalDepth: 3, filter: null, gain: null },
];

const sampleRate = audioContext.sampleRate;
const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

// Create master gain node for all oscillators
const masterGain = audioContext.createGain();
masterGain.gain.value = 0.8;

// Separate dry and wet gain nodes for reverb mix
const dryGain = audioContext.createGain();
const wetGain = audioContext.createGain();
dryGain.gain.value = 1; // Full dry by default
wetGain.gain.value = 0.5; // Initial wet value

// Reverb setup with convolver
const convolver = audioContext.createConvolver();
let reverbEnabled = false;

// Function to create an impulse response based on length
function createImpulseResponse(length) {
    const lengthInSamples = audioContext.sampleRate * length;
    const impulse = audioContext.createBuffer(2, lengthInSamples, audioContext.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < lengthInSamples; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / lengthInSamples, 2);
        }
    }
    convolver.buffer = impulse;
}

// Set initial impulse response length
createImpulseResponse(2); // 2 seconds default

// Correct reverb routing to prevent feedback
masterGain.connect(dryGain).connect(audioContext.destination);
masterGain.connect(wetGain).connect(convolver).connect(audioContext.destination);

// Load worklet modules and initialize nodes after loading
async function setupAudioWorklets() {
    try {
        // Load the granular and pitch shifter processors as audio worklets
        await audioContext.audioWorklet.addModule('granular-processor.js');
        await audioContext.audioWorklet.addModule('pitch-shifter-processor.js');

        // Setup Granular Effect with AudioWorkletNode
        const granularNode = new AudioWorkletNode(audioContext, 'granular-processor');
        granularNode.parameters.get('grainSize').value = 0.1;
        granularNode.parameters.get('grainDensity').value = 0.5;
        granularNode.parameters.get('grainRandomization').value = 0.5;

        // Setup Pitch Shifter with AudioWorkletNode
        const pitchShifterNode = new AudioWorkletNode(audioContext, 'pitch-shifter-processor');
        pitchShifterNode.parameters.get('pitchShiftAmount').value = 0;
        pitchShifterNode.parameters.get('pitchShiftFeedback').value = 0.5;

        // Connect granular and pitch shifter after reverb
        convolver.connect(granularNode).connect(pitchShifterNode).connect(audioContext.destination);

        // Attach event listeners for the granular effect and pitch shifter controls
        setupEffectControls(granularNode, pitchShifterNode);
    } catch (error) {
        console.error('Error loading audio worklet modules:', error);
    }
}

setupAudioWorklets();

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

    // Connect each oscillator to the master gain
    filter.connect(gain).connect(masterGain);
}

// Function to start an oscillator
function startOscillator(index) {
    if (isRunning[index]) return;

    // Create an AudioWorkletNode for each oscillator (using a simple wave generator processor)
    oscillators[index] = new AudioWorkletNode(audioContext, 'oscillator-processor', { outputChannelCount: [1] });

    oscillators[index].port.postMessage({
        frequency: params[index].frequency,
        phaseDistortion: params[index].phaseDistortion,
        harmonicIntensity: params[index].harmonicIntensity,
        fractalDepth: params[index].fractalDepth,
    });

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
        if (isRunning[index]) {
            oscillators[index].port.postMessage({ frequency: params[index].frequency });
        }
    });

    document.getElementById(`phaseDistortionSlider${prefix}`).addEventListener('input', (event) => {
        params[index].phaseDistortion = parseFloat(event.target.value);
        if (isRunning[index]) {
            oscillators[index].port.postMessage({ phaseDistortion: params[index].phaseDistortion });
        }
    });

    document.getElementById(`harmonicIntensitySlider${prefix}`).addEventListener('input', (event) => {
        params[index].harmonicIntensity = parseFloat(event.target.value);
        if (isRunning[index]) {
            oscillators[index].port.postMessage({ harmonicIntensity: params[index].harmonicIntensity });
        }
    });

    document.getElementById(`fractalDepthSlider${prefix}`).addEventListener('input', (event) => {
        params[index].fractalDepth = parseInt(event.target.value);
        if (isRunning[index]) {
            oscillators[index].port.postMessage({ fractalDepth: params[index].fractalDepth });
        }
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
    wetGain.gain.value = parseFloat(event.target.value); // Adjust wet level
    dryGain.gain.value = 1 - wetGain.gain.value; // Adjust dry level to complement
});

document.getElementById('reverbLengthSlider').addEventListener('input', (event) => {
    createImpulseResponse(parseFloat(event.target.value));
});

document.getElementById('toggleReverbButton').addEventListener('click', () => {
    reverbEnabled = !reverbEnabled;
    wetGain.gain.value = reverbEnabled ? 0.5 : 0; // Toggle reverb effect by adjusting the wet gain
});

// Setup granular effect and pitch shifter controls
function setupEffectControls(granularNode, pitchShifterNode) {
    document.getElementById('grainSizeSlider').addEventListener('input', (event) => {
        granularNode.parameters.get('grainSize').value = parseFloat(event.target.value);
    });

    document.getElementById('grainDensitySlider').addEventListener('input', (event) => {
        granularNode.parameters.get('grainDensity').value = parseFloat(event.target.value);
    });

    document.getElementById('grainRandomizationSlider').addEventListener('input', (event) => {
        granularNode.parameters.get('grainRandomization').value = parseFloat(event.target.value);
    });

    document.getElementById('pitchShiftAmountSlider').addEventListener('input', (event) => {
        pitchShifterNode.parameters.get('pitchShiftAmount').value = parseFloat(event.target.value);
    });

    document.getElementById('pitchShiftFeedbackSlider').addEventListener('input', (event) => {
        pitchShifterNode.parameters.get('pitchShiftFeedback').value = parseFloat(event.target.value);
    });
}

// Setup controls for each oscillator
setupControls(0, '1');
setupControls(1, '2');
setupControls(2, '3');
