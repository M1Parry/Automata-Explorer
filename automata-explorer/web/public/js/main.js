
document.getElementById('showSidebar').addEventListener('click', function () {
    document.getElementById('problemSidebar').classList.add('active');
});

document.getElementById('closeSidebar').addEventListener('click', function () {
    document.getElementById('problemSidebar').classList.remove('active');
});

function sendPostRequest(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
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

        fetch('/main/problem/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description, type })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("data: ", data);
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

function 