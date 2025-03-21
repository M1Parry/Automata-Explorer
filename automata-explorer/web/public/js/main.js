document.getElementById('showSidebar').addEventListener('click', function () {
    document.getElementById('problemSidebar').classList.add('active');
});

document.getElementById('closeSidebar').addEventListener('click', function () {
    document.getElementById('problemSidebar').classList.remove('active');
});

function updateCanvas() {
    document.getElementById('automataEditor').style.display = 'block';
    const canvas = document.getElementById('graphContainer');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function loadProblem(problemId) {
    const problemHtml = `
        <div class="problem-view p-4" id="problem" data-id="${problemId}">
            <h3 id="problemTitle"></h3>
            <p id="problemDescription"></p>
            <div class="d-flex justify-content-between">
                <p><strong>Type:</strong> <span id="problemType"></span></p>
                <p><strong>Deadline:</strong> <span id="problemDeadline"></span></p>
                <p><strong>Difficulty:</strong> <span id="problemDifficulty"></span></p>
            </div>
        </div>
    `;

    document.getElementById('problemDesc').innerHTML = problemHtml;

    updateCanvas();

    fetch(`/main/problem/${problemId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const problem = data.problem;
            document.getElementById('problemTitle').innerText = problem.title;
            document.getElementById('problemDescription').innerText = problem.description;
            document.getElementById('problemType').innerText = problem.type;
            document.getElementById('problemType').dataset.type = problem.type;
            document.getElementById('problemDeadline').innerText = problem.deadline ? new Date(problem.deadline).toLocaleString() : 'None';
            document.getElementById('problemDifficulty').innerText = problem.difficulty;

            loadAutomata(data.answer);
        }
    });
}

function loadExistingAnswer(answer) {
    // Clear existing states and transitions
    states.length = 0;
    transitions.length = 0;
    stateCounter = 0;

    answer.states.forEach(stateData => {
        const state = new State(stateData.x, stateData.y, stateData.label);
        state.id = stateData.stateId;
        state.isInitial = stateData.isInitial;
        state.isFinal = stateData.isFinal;
        states.push(state);
    });

    stateCounter = states.length;

    answer.transitions.forEach(transData => {
        const fromState = states.find(s => s.id === transData.from);
        const toState = states.find(s => s.id === transData.to);
        if (fromState && toState) {
            transitions.push(new Transition(fromState, toState, transData.symbol));
        }
    });

    // Redraw canvas with loaded data
    drawCanvas();
}

function loadProblems() {
    fetch('/main/problems')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const problems = data.problems;
            const dfaProblems = problems.filter(problem => problem.type === 'DFA');
            const nfaProblems = problems.filter(problem => problem.type === 'NFA');

            let dfaHtml = dfaProblems.map(problem => `
                <span>
                <a href="/main/problem/${problem.id}" class="list-group-item list-group-item-action">${problem.title}
                <button type="button" class="btn btn-sm" onclick="loadProblemEditor('${problem.id}')"><i class="bi bi-pencil"></i></button>
                </a>
                </span>
            `).join('');

            let nfaHtml = nfaProblems.map(problem => `
                <a href="/main/problem/${problem.id}" class="list-group-item list-group-item-action">${problem.title}</a>
            `).join('');

            document.getElementById('dfaProblemList').innerHTML = dfaHtml;
            document.getElementById('nfaProblemList').innerHTML = nfaHtml;

            document.querySelectorAll('.list-group-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    let problemId = item.href.split('/').pop();
                    loadProblem(problemId);
                });
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load problems');
    })
}

function createWithAI() {
    const type = document.getElementById('problemType').value;
    // Show loading state
    const aiButton = document.querySelector('.modal-footer .btn-info');
    const originalText = aiButton.innerHTML;
    aiButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
    aiButton.disabled = true;

    fetch('/api/generate-problem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: type })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('problemTitle').value = data.title || '';
        document.getElementById('problemDescription').value = data.description || '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate problem with AI');
    })
    .finally(() => {
        // Restore button state
        aiButton.innerHTML = originalText;
        aiButton.disabled = false;
    });
}

function createProblem() {
    const form = document.getElementById('createProblemForm');
    if (form.checkValidity()) {
        // Get form data
        const title = document.getElementById('problemTitle').value;
        const description = document.getElementById('problemDescription').value;
        const type = document.getElementById('problemType').value;
        const regex = document.getElementById('problemRegex').value;

        fetch('/main/problem/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, regex, type })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadProblemEditor(data.problem.id);
                form.reset();
            } else {
                alert('Failed to create problem');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to create problem');
        });

        bootstrap.Modal.getInstance(document.getElementById('createProblemModal')).hide();
    } else {
        form.reportValidity();
    }
}

function loadProblemEditor(problemId) {
    const editorHtml = `
        <div class="problem-editor p-4">
            <h3>Edit Problem</h3>
            <form id="editProblemForm">
                <div class="mb-3">
                    <label for="editTitle" class="form-label">Problem Title</label>
                    <input type="text" class="form-control" id="editTitle" required>
                </div>

                <div class="mb-3">
                    <label for="editDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="editDescription" rows="4" required></textarea>
                </div>

                <div class="mb-3">
                    <label for="editRegex" class="form-label">Regular Expression</label>
                    <input type="text" class="form-control" id="editRegex">
                </div>

                <div class="mb-3">
                    <label for="editType" class="form-label">Problem Type</label>
                    <select class="form-control" id="editType" required>
                        <option value="DFA">DFA</option>
                        <option value="NFA">NFA</option>
                        <option value="RegEx">Regular Expression</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label for="editDeadline" class="form-label">Deadline</label>
                    <input type="datetime-local" class="form-control" id="editDeadline">
                </div>

                <div class="mb-3">
                    <label for="editDifficulty" class="form-label">Difficulty Level</label>
                    <select class="form-control" id="editDifficulty" required>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label for="editStatus" class="form-label">Enabled</label>
                    <select class="form-control" id="editStatus" required>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>

                <div class="d-flex justify-content-between">
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                    <button type="button" class="btn btn-danger" onclick="deleteProblem('${problemId}')">Delete Problem</button>
                </div>
            </form>
        </div>
    `;

    // Load existing problem data and populate form
    fetch(`/main/problem/update/${problemId}`)
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            alert('Failed to load problem data');
            return;
        }

        let problem = data.problem;
        document.getElementById('automataEditor').style.display = 'none';
        document.getElementById('editProblem').innerHTML = editorHtml;

        // Populate form with existing data
        document.getElementById('editTitle').value = problem.title;
        document.getElementById('editDescription').value = problem.description;
        document.getElementById('editRegex').value = problem.regex;
        document.getElementById('editType').value = problem.type;
        document.getElementById('editDeadline').value = problem.deadline ? new Date(problem.deadline).toISOString().slice(0, 16) : '';
        document.getElementById('editDifficulty').value = problem.difficulty;
        document.getElementById('editStatus').value = problem.enabled ? 'true' : 'false';

        // Add form submission handler
        document.getElementById('editProblemForm').addEventListener('submit', function(e) {
            e.preventDefault();
            updateProblem(problemId);
        });
    })
    .catch(error => {
        console.error('Error loading problem:', error);
        alert('Failed to load problem data');
    });
}

function updateProblem(problemId) {
    const problemData = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        regex: document.getElementById('editRegex').value,
        type: document.getElementById('editType').value,
        deadline: document.getElementById('editDeadline').value,
        difficulty: document.getElementById('editDifficulty').value,
        enabled: document.getElementById('editStatus').value === 'true'
    };

    fetch(`/main/problem/update/${problemId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(problemData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Problem updated successfully');
            loadProblems();
            loadProblem(problemId);
        } else {
            alert('Failed to update problem');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update problem');
    });
}

function deleteProblem(problemId) {
    if (confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
        fetch(`/main/problem/delete/${problemId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/main'; // Redirect to problems list
            } else {
                alert('Failed to delete problem');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete problem');
        });
    }
}

function updateUrl(urlPath) {
    let html = document.getElementById('editProblem').innerHTML;
    window.history.pushState({"html":html},"", urlPath);
}

// on page load event, load problems
document.addEventListener('DOMContentLoaded', function() {
    loadProblems();
});