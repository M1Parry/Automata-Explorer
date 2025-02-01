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
        console
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
        drawState(transitionStart, true);
    } else {
        // Create transition
        const symbol = prompt('Enter transition symbol:', '0');
        if (symbol) {
            // check if transition already exists if it does remove the old one
            const oldTransition = transitions.find(t => t.from === transitionStart && t.to === clickedState);

            if (oldTransition) {
                deleteTransition(oldTransition);
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

function drawArrowHead(from, to) {
    const headLen = 10;
    const headAngle = Math.PI / 6;
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

function drawTransition(transition) {
    const from = transition.from;
    const to = transition.to;

    // Handle self-loop
    if (from === to) {
        const radius = STATE_RADIUS;
        const centerX = from.x;
        const centerY = from.y;

        ctx.beginPath();
        ctx.arc(centerX, centerY - radius * 1.5, radius, 0.5 * Math.PI, 2.2 * Math.PI);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw arrow head
        // TODO: Fix arrow head
        const arrowX = centerX - radius * Math.cos(0.5 * Math.PI);
        const arrowY = centerY - radius * Math.sin(0.5 * Math.PI);
        drawArrowHead({ x: centerX, y: centerY - radius }, { x: arrowX, y: arrowY });

        // Draw transition symbol
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transition.symbol, centerX, centerY - radius * 2);

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

        // Store control point for arrow and text positioning
        transition.controlPoint = { x: controlX, y: controlY };

        // Calculate arrow angle at the end of the curve
        const dx = endX - controlX;
        const dy = endY - controlY;
        const arrowAngle = Math.atan2(dy, dx);

        // Draw arrow head
        drawArrowHead({ x: controlX, y: controlY }, { x: endX, y: endY });

        // Position text above the curve
        const textX = controlX;
        const textY = controlY - 15;
        ctx.stroke();

        // Draw transition symbol
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transition.symbol, textX, textY);
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
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transition.symbol, textX, textY);
    }
}

function deleteState(state) {
    const index = states.indexOf(state);
    if (index > -1) {
        states.splice(index, 1);
    }
    drawCanvas();
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
canvas.style.webkitUserSelect = 'none';
canvas.style.mozUserSelect = 'none';

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
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
    return {
        states: states.map(state => ({
            _id: state.id,
            label: state.label,
            x: state.x,
            y: state.y,
            isInitial: state.isInitial,
            isFinal: state.isFinal
        })),
        transitions: transitions.map(transition => ({
            from: transition.from.id,
            to: transition.to.id,
            symbol: transition.symbol
        }))
    };
}

async function saveAutomata() {
    try {
        const data = serializeAutomata();
        const response = await fetch('/api/automata/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save automata');
        }
        
        const result = await response.json();
        console.log('Automata saved successfully:', result);
    } catch (error) {
        console.error('Error saving automata:', error);
    }
}
