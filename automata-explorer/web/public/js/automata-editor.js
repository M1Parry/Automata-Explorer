// State configuration
const STATE_RADIUS = 25;

const states = [];
let stateCounter = 0;
let isStateMode = false;

// Add transition variables
let transitionStart = null;
const transitions = [];
let isTransitionMode = false;

// flags
let isDeleteStateMode = false;
let isDeleteTransitionMode = false;

// WebAssembly functions
let simulateRegex;
let simulateNFA;
let regex_vs_dfa;
let regex_vs_nfa;


class State {
    constructor(x, y, label) {
        this.x = x;
        this.y = y;
        this.label = label;
        this.id = stateCounter++;
        this.isInitial = false;
        this.isFinal = false;
    }
}

class Transition {
    constructor(fromState, toState, symbol) {
        this.from = fromState;
        this.to = toState;
        this.symbol = symbol;
    }
}

// Initialize canvas and context
const canvas = document.getElementById('graphContainer');
const ctx = canvas.getContext('2d');

// Set canvas size to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Add a function to check if a click is within a state
function getStateAtPosition(x, y) {
    return states.find(state => {
        const dx = state.x - x;
        const dy = state.y - y;
        return (dx * dx + dy * dy) <= STATE_RADIUS * STATE_RADIUS;
    });
}

function getTransitionAtPosition(x, y) {
    return transitions.find(transition => {
        const from = transition.from;
        const to = transition.to;
        const control = transition.controlPoint;
        if (control) {
            // Check if the point is close to the curve
            const distance = Math.abs(
                (to.x - from.x) * (from.y - y) - (from.x - x) * (to.y - from.y)
            ) / Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
            return distance < 10;
        } else {
            // Check if the point is close to the line
            const distance = Math.abs(
                (to.y - from.y) * x - (to.x - from.x) * y + to.x * from.y - to.y * from.x
            ) / Math.sqrt(Math.pow(to.y - from.y, 2) + Math.pow(to.x - from.x, 2));
            return distance < 10;
        }
    });
}

// Handle double click
let lastClickTime = 0;

// Add dragging state variables
let isDragging = false;
let selectedState = null;
let dragOffset = { x: 0, y: 0 };

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedState = getStateAtPosition(x, y);
    const currentTime = new Date().getTime();

    if (isStateMode) {
        if (clickedState) {
            if (currentTime - lastClickTime < 300) { // Double click
                clickedState.isFinal = !clickedState.isFinal;
                drawCanvas();
            } else {
                selectedState = clickedState;
                isDragging = true;
                dragOffset.x = x - clickedState.x;
                dragOffset.y = y - clickedState.y;
            }
        } else {
            // Create new state only if we didn't click on an existing one
            const newState = new State(x, y, `q${states.length}`);
            states.push(newState);
            drawCanvas();
        }
        lastClickTime = currentTime;
    }

    // Adding transitions
    else if (isTransitionMode) {
        if (clickedState) {
            createTransition(clickedState);
        }
        return;
    }

    else if (isDeleteStateMode) {
        deleteState(clickedState);
        return;
    }

    else if (isDeleteTransitionMode) {
        const clickedTransition = getTransitionAtPosition(x, y);
        if (clickedTransition) {
            deleteTransition(clickedTransition);
        }
    }
}

// Add mouse move handler
function handleMouseMove(event) {
    if (isDragging && selectedState) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Update state position
        selectedState.x = x - dragOffset.x;
        selectedState.y = y - dragOffset.y;

        // Redraw canvas
        drawCanvas();
    }
}

// Add mouse up handler
function handleMouseUp() {
    isDragging = false;
    selectedState = null;
}

function createTransition(clickedState) {
    if (!transitionStart) {
        transitionStart = clickedState;
        drawState(transitionStart);
    } else {
        // Create transition
        const symbol = prompt('Enter transition symbol:', '0');
        if (symbol) {
            // check if transition already exists if it does remove the old one
            let oldTransition = transitions.find(t => t.from === transitionStart && t.to === clickedState);

            if (oldTransition) {
                deleteTransition(oldTransition);
            }

            let is_deterministic = document.getElementById('problemType').dataset.type === 'DFA';
            if (is_deterministic) {
               oldTransition = transitions.find(t => t.from === transitionStart && t.symbol === symbol);
                if (oldTransition) {
                    deleteTransition(oldTransition);
                }
            }

            transitions.push(new Transition(transitionStart, clickedState, symbol));
            transitionStart = null;
            isTransitionMode = false;
            document.getElementById('addTransitionBtn').classList.remove('active');
            drawCanvas();
        }
    }
}

// Draw a single state
function drawState(state) {
    // Draw the outer circle for final states first
    if (state.isFinal) {
        ctx.beginPath();
        ctx.arc(state.x, state.y, STATE_RADIUS + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw the main circle
    ctx.beginPath();
    ctx.arc(state.x, state.y, STATE_RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();

    // Draw state label
    ctx.font = '16px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.label, state.x, state.y);

    // Draw arrow for initial state
    if (state.isInitial) {
        ctx.beginPath();
        ctx.moveTo(state.x - STATE_RADIUS - 20, state.y);
        ctx.lineTo(state.x - STATE_RADIUS, state.y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(state.x - STATE_RADIUS, state.y);
        ctx.lineTo(state.x - STATE_RADIUS - 10, state.y - 5);
        ctx.lineTo(state.x - STATE_RADIUS - 10, state.y + 5);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
}

// Draw transition arrow
function getParallelTransitions(transition) {
    return transitions.filter(t =>
        (t.from === transition.from && t.to === transition.to) ||
        (t.from === transition.to && t.to === transition.from)
    );
}

function drawArrowHead(from, to, headLen = 10, headAngle = Math.PI / 6) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
        to.x - headLen * Math.cos(angle - headAngle),
        to.y - headLen * Math.sin(angle - headAngle)
    );
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
        to.x - headLen * Math.cos(angle + headAngle),
        to.y - headLen * Math.sin(angle + headAngle)
    );
    ctx.stroke();
}

function drawTransitionSymbol(symbol, x, y) {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);
}

function drawTransition(transition) {
    const from = transition.from;
    const to = transition.to;

    // Handle self-loop
    if (from === to) {
        const centerX = from.x;
        const centerY = from.y;
        const loopRadius = STATE_RADIUS

        // Draw the complete loop
        ctx.beginPath();
        ctx.arc(centerX, centerY - loopRadius, loopRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Calculate arrow head position
        const arrowAngle = 6.8;
        const arrowX = centerX + loopRadius * Math.cos(arrowAngle);
        const arrowY = (centerY - loopRadius) + loopRadius * Math.sin(arrowAngle);

        // Calculate a point slightly before the arrow head for proper tangent
        const fromX = centerX + loopRadius * Math.cos(arrowAngle - 0.1);
        const fromY = (centerY - loopRadius) + loopRadius * Math.sin(arrowAngle - 0.1);

        // Draw arrow head
        drawArrowHead({x: fromX, y: fromY}, {x: arrowX, y: arrowY});

        // Draw transition symbol
        drawTransitionSymbol(transition.symbol, centerX, centerY - loopRadius * 2.5);
        return;
    }

    // Rest of existing transition drawing code for non-self-loops
    const parallels = getParallelTransitions(transition);
    const transitionIndex = parallels.indexOf(transition);
    const isParallel = parallels.length > 1;

    // Calculate base points
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const startX = from.x + STATE_RADIUS * Math.cos(angle);
    const startY = from.y + STATE_RADIUS * Math.sin(angle);
    const endX = to.x - STATE_RADIUS * Math.cos(angle);
    const endY = to.y - STATE_RADIUS * Math.sin(angle);

    // Draw curved path for parallel transitions
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    if (isParallel) {
        // Calculate curve parameters
        const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
        const curveHeight = distance * 0.2; // Base curve height
        const offset = transitionIndex * 20 - ((parallels.length - 1) * 10); // Distribute curves

        // Calculate control points
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const normalX = -(to.y - from.y) / distance;
        const normalY = (to.x - from.x) / distance;

        const controlX = midX + normalX * (curveHeight + offset);
        const controlY = midY + normalY * (curveHeight + offset);

        // Draw curved path
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();

        // Draw arrow head
        drawArrowHead({ x: controlX, y: controlY }, { x: endX, y: endY });

        // Position text above the curve
        const textX = controlX;
        const textY = controlY;
        ctx.stroke();

        // Draw transition symbol
        drawTransitionSymbol(transition.symbol, controlX, controlY);
    }

    else {
        // Original straight line drawing code
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrow head
        drawArrowHead({ x: startX, y: startY }, { x: endX, y: endY });

        // Draw transition symbol
        const textX = (startX + endX) / 2;
        const textY = (startY + endY) / 2 - 10;
        drawTransitionSymbol(transition.symbol, textX, textY);
    }
}

function updateStateReferences() {
    states.forEach((state, index) => {
        state.id = index;
        state.label = `q${index}`;
    });

    stateCounter = states.length;

    transitions.forEach(transition => {
        if (!states.includes(transition.from) || !states.includes(transition.to)) {
            const index = transitions.indexOf(transition);
            if (index > -1) {
                transitions.splice(index, 1);
            }
        }
    });
}

function deleteState(state) {
    const index = states.indexOf(state);
    if (index > -1) {
        states.splice(index, 1);
        updateStateReferences();
        drawCanvas();
    }
}

function deleteTransition(transition) {
    const index = transitions.indexOf(transition);
    if (index > -1) {
        transitions.splice(index, 1);
    }
    drawCanvas();
}

// Draw all states and transitions
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw transitions first
    transitions.forEach(transition => drawTransition(transition));
    // Then draw states on top
    states.forEach(state => drawState(state));
}

// Initialize the canvas
function initCanvas() {
    resizeCanvas();
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // Stop dragging if mouse leaves canvas

    window.addEventListener('resize', () => {
        resizeCanvas();
        drawCanvas();
    });
}

function resetButtons() {
    isStateMode = false;
    isTransitionMode = false;
    isDeleteStateMode = false;
    isDeleteTransitionMode = false;
    document.getElementById('addStateBtn').classList.remove('active');
    document.getElementById('addTransitionBtn').classList.remove('active');
    document.getElementById('deleteStateBtn').classList.remove('active');
    document.getElementById('deleteTransitionBtn').classList.remove('active');
}

// Update canvas style to prevent text selection during drag
canvas.style.userSelect = 'none';
canvas.style.mozUserSelect = 'none';

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    document.getElementById('checkAutomataBtn').addEventListener('click', checkAutomata);
    document.getElementById('saveAutomataBtn').addEventListener('click', saveAutomata);
});

// Handle button events
const addStateBtn = document.getElementById('addStateBtn');
const addTransitionBtn = document.getElementById('addTransitionBtn');
const deleteBtn = document.getElementById('deleteStateBtn');
const deleteTransitionBtn = document.getElementById('deleteTransitionBtn');

document.getElementById('setInitialBtn').addEventListener('click', () => {
    // TODO: Implement state selection and setting initial state
});

addStateBtn.addEventListener('click', () => {
    resetButtons();
    isStateMode = !isStateMode;
    if (isStateMode) {
        addStateBtn.classList.add('active');
    } else {
        addStateBtn.classList.remove('active');
    }
});

// Add transition button handler
addTransitionBtn.addEventListener('click', () => {
    resetButtons();
    isTransitionMode = !isTransitionMode;
    transitionStart = null;
    if (isTransitionMode) {
        addTransitionBtn.classList.add('active');
    } else {
        addTransitionBtn.classList.remove('active');
    }
    drawCanvas();
});

// Delete state
deleteBtn.addEventListener('click', () => {
    resetButtons();
    isDeleteStateMode = !isDeleteStateMode;
    if (isDeleteStateMode) {
        deleteBtn.classList.add('active');
    } else {
        deleteBtn.classList.remove('active');
    }
});

// Delete transition
deleteTransitionBtn.addEventListener('click', () => {
    resetButtons();
    isDeleteTransitionMode = !isDeleteTransitionMode;
    if (isDeleteTransitionMode) {
        deleteTransitionBtn.classList.add('active');
    } else {
        deleteTransitionBtn.classList.remove('active');
    }
});

document.getElementById('clearAutomataBtn').addEventListener('click', () => {
    states.length = 0;
    stateCounter = 0;
    transitions.length = 0;
    drawCanvas();
});

function serializeAutomata() {
    let states_array = [];
    states_array = states.map(state => ({
        stateId: state.id,
        label: state.label,
        x: state.x,
        y: state.y,
        isInitial: state.isInitial,
        isFinal: state.isFinal
    }));

    let transitions_array = [];
    for (let i = 0; i < transitions.length; i++) {
        const transition = transitions[i];
        const symbols = transition.symbol.split(',');
        for (let j = 0; j < symbols.length; j++) {
            transitions_array.push({
                from: transition.from.id,
                to: transition.to.id,
                symbol: symbols[j]
            });
        }
    }

    return { states: states_array, transitions: transitions_array };
}

async function saveAutomata() {
    try {
        const data = serializeAutomata();
        const problemId = document.getElementById('problem').dataset.id;

        const response = await fetch(`/main/answer/save/${problemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save automata');
        }
        alert('Your answer has been saved successfully!');
    } catch (error) {
        alert('Failed to save your answer. Please try again.');
    }
}

function checkAutomata() {
    const problemType = document.getElementById('problemType').dataset.type;
    if (problemType === 'DFA') {
        checkDFA();
    }
    else if (problemType === 'NFA') {
        checkNFA();
    }
}

function checkDFA() {
    const automata = serializeAutomata();

    let symbols = new Set();
    automata.transitions.forEach(transition => {
        symbols.add(transition.symbol);
    });

    const regex = document.getElementById('problemRegex').innerText;
    const statesArray = new Int32Array(automata.states.map(state => state.stateId));
    const alphabetArray = new Uint8Array([...symbols].map(c => c.charCodeAt(0)));

    const startState = automata.states.find(state => state.isInitial);
    const acceptStates = automata.states.filter(state => state.isFinal);
    const acceptArray = new Int32Array(acceptStates.map(state => state.stateId));

    const transFromArray = new Int32Array(automata.transitions.map(transition => transition.from));
    const transSymbolArray = new Uint8Array(automata.transitions.map(transition => transition.symbol.charCodeAt(0)));
    const transToArray = new Int32Array(automata.transitions.map(transition => transition.to));

    // Allocate memory for all arrays
    const statesPtr = Module._malloc(statesArray.length * statesArray.BYTES_PER_ELEMENT);
    const alphabetPtr = Module._malloc(alphabetArray.length * alphabetArray.BYTES_PER_ELEMENT);
    const acceptPtr = Module._malloc(acceptArray.length * acceptArray.BYTES_PER_ELEMENT);
    const transFromPtr = Module._malloc(transFromArray.length * transFromArray.BYTES_PER_ELEMENT);
    const transSymbolPtr = Module._malloc(transSymbolArray.length * transSymbolArray.BYTES_PER_ELEMENT);
    const transToPtr = Module._malloc(transToArray.length * transToArray.BYTES_PER_ELEMENT);

    // Copy data to the Emscripten heap
    Module.HEAP32.set(statesArray, statesPtr >> 2);
    Module.HEAPU8.set(alphabetArray, alphabetPtr);
    Module.HEAP32.set(acceptArray, acceptPtr >> 2);
    Module.HEAP32.set(transFromArray, transFromPtr >> 2);
    Module.HEAPU8.set(transSymbolArray, transSymbolPtr);
    Module.HEAP32.set(transToArray, transToPtr >> 2);

    const result = regex_vs_dfa(
        regex, statesPtr, statesArray.length, alphabetPtr, alphabetArray.length,
        0, acceptPtr, acceptArray.length, transFromPtr, transSymbolPtr, transToPtr, transFromArray.length);

    Module._free(statesPtr);
    Module._free(alphabetPtr);
    Module._free(acceptPtr);
    Module._free(transFromPtr);
    Module._free(transSymbolPtr);
    Module._free(transToPtr);

    if (result) {
        alert('The automata is correct!');
    } else {
        alert('The automata is incorrect!');
    }
}

function checkNFA() {
    const automata = serializeAutomata();

    let symbols = new Set();
    automata.transitions.forEach(transition => {
        symbols.add(transition.symbol);
    });

    const regex = document.getElementById('problemRegex').innerText;
    const statesArray = new Int32Array(automata.states.map(state => state.stateId));
    const alphabetArray = new Uint8Array([...symbols].map(c => c.charCodeAt(0)));

    const startState = automata.states.find(state => state.isInitial);
    const acceptStates = automata.states.filter(state => state.isFinal);
    const acceptArray = new Int32Array(acceptStates.map(state => state.stateId));

    const transFromArray = new Int32Array(automata.transitions.map(transition => transition.from));
    const transSymbolArray = new Uint8Array(automata.transitions.map(transition => transition.symbol.charCodeAt(0)));
    const transToArray = new Int32Array(automata.transitions.map(transition => transition.to));

    const epsilonFrom = new Int32Array([]);
    const epsilonTo = new Int32Array([]);

    // Allocate memory for all arrays
    const statesPtr = Module._malloc(statesArray.length * statesArray.BYTES_PER_ELEMENT);
    const alphabetPtr = Module._malloc(alphabetArray.length * alphabetArray.BYTES_PER_ELEMENT);
    const acceptPtr = Module._malloc(acceptArray.length * acceptArray.BYTES_PER_ELEMENT);
    const transFromPtr = Module._malloc(transFromArray.length * transFromArray.BYTES_PER_ELEMENT);
    const transSymbolPtr = Module._malloc(transSymbolArray.length * transSymbolArray.BYTES_PER_ELEMENT);
    const transToPtr = Module._malloc(transToArray.length * transToArray.BYTES_PER_ELEMENT);
    const epsilonFromPtr = Module._malloc(1 * Int32Array.BYTES_PER_ELEMENT);
    const epsilonToPtr = Module._malloc(1 * Int32Array.BYTES_PER_ELEMENT);

    // Copy
    Module.HEAP32.set(statesArray, statesPtr >> 2);
    Module.HEAPU8.set(alphabetArray, alphabetPtr);
    Module.HEAP32.set(acceptArray, acceptPtr >> 2);
    Module.HEAP32.set(transFromArray, transFromPtr >> 2);
    Module.HEAPU8.set(transSymbolArray, transSymbolPtr);
    Module.HEAP32.set(transToArray, transToPtr >> 2);

    if (epsilonFrom.length === 0) {
        Module.HEAP32[epsilonFromPtr >> 2] = 0;
    } else {
        Module.HEAP32.set(epsilonFrom, epsilonFromPtr >> 2);
    }

    if (epsilonTo.length === 0) {
        Module.HEAP32[epsilonToPtr >> 2] = 0;
    } else {
        Module.HEAP32.set(epsilonTo, epsilonToPtr >> 2);
    }

    const result = regex_vs_nfa(
        regex, statesPtr, statesArray.length, alphabetPtr, alphabetArray.length, 0, acceptPtr,
        acceptArray.length, transFromPtr, transSymbolPtr, transToPtr, transFromArray.length,
        epsilonFromPtr, epsilonToPtr, epsilonFrom.length);

    Module._free(statesPtr);
    Module._free(alphabetPtr);
    Module._free(acceptPtr);
    Module._free(transFromPtr);
    Module._free(transSymbolPtr);
    Module._free(transToPtr);
    Module._free(epsilonFromPtr);
    Module._free(epsilonToPtr);

    if (result) {
        alert('The automata is correct!');
    }
    else {
        alert('The automata is incorrect!');
    }
}

function loadAutomata(automata) {
    states.length = 0;
    transitions.length = 0;

    if (automata) {
        automata.states.forEach(state => {
            const newState = new State(state.x, state.y, state.label);
            newState.id = state.stateId;
            newState.isInitial = state.isInitial;
            newState.isFinal = state.isFinal;
            states.push(newState);
        });

        automata.transitions.forEach(transition => {
            const fromState = states.find(state => state.id === transition.from);
            const toState = states.find(state => state.id === transition.to);
            transitions.push(new Transition(fromState, toState, transition.symbol));
        });
    }

    drawCanvas();
}

// Make drawCanvas available to other scripts
window.drawCanvas = drawCanvas;
window.states = states;
window.transitions = transitions;
window.stateCounter = stateCounter;
window.State = State;
window.Transition = Transition;

Module.onRuntimeInitialized = function() {
    console.log("WebAssembly module initialized");
    simulateRegex = Module.cwrap('simulate_regex', 'number', ['string', 'string']);
    simulateNFA = Module.cwrap('simulate_nfa', 'number',
        ['number', 'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number', 'number', 'number',
         'number', 'number', 'number',
         'string']);
    regex_vs_dfa = Module.cwrap('regex_vs_dfa', 'number',
        ['string',
         'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number']);
    regex_vs_nfa = Module.cwrap('regex_vs_nfa', 'number',
        ['string',
         'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number', 'number',
         'number', 'number']);

    // Test the function
    try {
        const result = simulateRegex('(a|b)*a(a|b)(a|b)(a|b)', 'aaaaaaabaaab');
        console.log("Test regex result:", result);
    } catch (error) {
        console.error("Error testing WebAssembly function:", error);
    }
};

function testRegexAcceptance(regex, input) {
    if (!simulateRegex) {
        console.error("WebAssembly module not initialized");
        return false;
    }

    try {
        return !!simulateRegex(regex, input);
    } catch (error) { console.error("Error in regex simulation:", error);
        return false;
    }
}
