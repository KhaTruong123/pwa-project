document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const taskInput = document.getElementById('taskInput');
    const todoButton = document.getElementById('todoButton');
    const contentButton = document.getElementById('contentButton');
    const viewTasksButton = document.getElementById('viewTasksButton');
    const logoutButton = document.getElementById('logoutButton');


    // Event Listeners
    loginButton.addEventListener('click', () => window.location.href = '/login');
    todoButton.addEventListener('click', () => addTask('Todo'));
    contentButton.addEventListener('click', () => addTask('Content'));
    viewTasksButton.addEventListener('click', viewTasks);
    logoutButton.addEventListener('click', logOut);

    checkAuthStatus();
});

function checkAuthStatus() {
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (!data.isAuthenticated) {
                document.getElementById('loginButton').style.display = 'block';
                document.getElementById('taskForm').style.display = 'none';
                document.getElementById('viewTasksButton').style.display = 'none';
                document.getElementById('logoutButton').style.display = 'none';
            } else {
                document.getElementById('loginButton').style.display = 'none';
                document.getElementById('taskForm').style.display = 'block';
                document.getElementById('viewTasksButton').style.display = 'block';
                document.getElementById('logoutButton').style.display = 'block';
            }
        })
        .catch(error => console.error('Error checking auth:', error));
}

function addTask(taskType) {
    const taskDescription = taskInput.value.trim();

    if (taskDescription === '') {
        alert('Please enter a task description.');
        return;
    }

    fetch('/add-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskDescription, taskType })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);  // 'Task added successfully.'
        taskInput.value = ''; // Clear the input field after successful addition
    })
    .catch(error => {
        console.error('Error adding task:', error);
        alert('Error adding task, please try again.');
    });
}

function viewTasks() {
    fetch('/view-tasks')
        .then(response => {
            if (!response.ok) {
                // If response status is not OK, throw an error
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.url) {
                // Open the spreadsheet URL in a new tab
                window.open(data.url, '_blank');
                console.log("data.url: ",data.url);
            } else {
                alert(data.message); // 'No tasks created yet.'
            }
        })
        .catch(error => {
            console.error('Error creating/viewing spreadsheet:', error);
            alert('Error viewing tasks.');
        });
}

function logOut() {
    fetch('/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/'; // Redirect to login page after logout
        })
        .catch(error => console.error('Error logging out:', error));
}