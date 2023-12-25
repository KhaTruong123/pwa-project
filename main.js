document.getElementById('saveToDo').addEventListener('click', function() {
    saveData('ToDo');
});

document.getElementById('saveContent').addEventListener('click', function() {
    saveData('Content');
});

document.getElementById('goToSheet').addEventListener('click', function() {
    // Logic to view the sheet
});

function saveData(column) {
    var inputVal = document.getElementById('inputField').value;
    console.log('Saving', inputVal, 'to', column);

    // Here you will add the logic to save data to your sheet

    document.getElementById('inputField').value = ''; // Clear the input field
}

//add a few line