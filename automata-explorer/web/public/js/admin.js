// Load universities into select dropdown
function loadUniversities() {
    fetch('/admin/universities')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('userUniversity');
                select.innerHTML = '';
                data.universities.forEach(uni => {
                    const option = document.createElement('option');
                    option.value = uni._id;
                    option.textContent = uni.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading universities:', error));
}

// Handle university creation
document.getElementById('universityForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('universityName').value;
    const country = document.getElementById('universityCountry').value;

    fetch('/admin/university/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('University created successfully');
            this.reset();
            loadUniversities();
        } else {
            alert('Failed to create university: ' + data.message);
        }
    })
    .catch(error => alert('Error creating university'));
});

// Handle user creation
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        user_type: document.getElementById('user_type').value,
        university: document.getElementById('userUniversity').value
    };

    fetch('/admin/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('User created successfully');
            this.reset();
        } else {
            alert('Failed to create user: ' + data.message);
        }
    })
    .catch(error => alert('Error creating user'));
});

// Load universities when page loads
document.addEventListener('DOMContentLoaded', loadUniversities);
