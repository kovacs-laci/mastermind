// Get the board and button elements
const board = document.getElementById("board");
const checkButton = document.getElementById("check-button");

// Game variables
let activeRow = 0; // Keep track of which row the player is guessing
let solution = []; // Store the correct color combination
const colors = ["none", "red", "blue", "green", "yellow", "purple"]; // Available colors

// Create the game board
function createBoard(rows = 3) {
    // Clear the board before creating rows
    board.innerHTML = "";

    for (let i = 0; i < rows; i++) {
        const row = document.createElement("div");
        row.className = "row"; // Set class name for styling

        for (let j = 0; j < 5; j++) { // Each row has 5 slots
            const slot = document.createElement("select"); // Dropdown for each slot
            slot.className = "select-color"; // Set class name for styling
            slot.disabled = i !== activeRow; // Disable slots that are not in the active row

            // Add color options to the dropdown
            colors.forEach(color => {
                const option = document.createElement("option");
                option.value = color; // Value for checking
                option.textContent = color === "none" ? "" : color; // No text for "none"
                slot.appendChild(option);
            });

            row.appendChild(slot); // Add slot to row
        }

        board.appendChild(row); // Add row to the board
    }

    generateSolution(); // Generate the correct color combination
}

// Generate a random color combination for the solution
function generateSolution() {
    solution = []; // Clear the solution array

    for (let i = 0; i < 5; i++) {
        const randomColor = colors[Math.floor(Math.random() * (colors.length - 1)) + 1]; // Skip "none"
        solution.push(randomColor); // Add random color to the solution
    }

    console.log("Solution:", solution); // Print solution for debugging
}

// Check the player's guess
checkButton.addEventListener("click", () => {
    const currentRow = board.children[activeRow]; // Get the active row
    const guess = Array.from(currentRow.children).map(slot => slot.value); // Get the guessed colors

    if (guess.includes("none")) {
        alert("Please select a color for all slots before checking!");
        return;
    }

    // Check each slot against the solution
    guess.forEach((color, index) => {
        const slot = currentRow.children[index];

        if (color === solution[index]) {
            slot.style.border = "3px solid green"; // Correct color and position
        } else if (solution.includes(color)) {
            slot.style.border = "3px solid yellow"; // Correct color, wrong position
        } else {
            slot.style.border = "3px solid red"; // Incorrect color
        }
    });

    // Check if the guess is correct
    if (guess.join() === solution.join()) {
        alert("Congratulations, you guessed the correct combination!");
    } else {
        activeRow++;

        if (activeRow >= board.children.length) {
            alert("Game over! The correct combination was: " + solution.join(", "));
        } else {
            // Enable the next row for guessing
            Array.from(board.children[activeRow].children).forEach(slot => slot.disabled = false);
        }
    }
});

// Start the game with 3 rows
createBoard(10);
