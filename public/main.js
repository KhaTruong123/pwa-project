document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('taskInput');
    const todoButton = document.getElementById('todoButton');
    const contentButton = document.getElementById('contentButton');
    const viewTasksButton = document.getElementById('viewTasksButton');

    todoButton.addEventListener('click', () => addTask('Todo'));
    contentButton.addEventListener('click', () => addTask('Content'));
    viewTasksButton.addEventListener('click', viewTasks);
});

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
            } else {
                alert(data.message); // 'No tasks created yet.'
            }
        })
        .catch(error => {
            console.error('Error creating/viewing spreadsheet:', error);
            alert('Error viewing tasks.');
        });
}
