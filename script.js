const board = document.getElementById("board");
const checkButton = document.getElementById("check-button");
const popup = document.getElementById("color-popup");
const colorOptions = document.getElementById("color-options");

let activeRow = 0; // Track the current row
let solution = []; // Store the correct solution
const colors = ["red", "blue", "green", "yellow", "purple"]; // Available colors

// Generate the board with slots
function createBoard(rows = 3) {
    board.innerHTML = ""; // Clear board
    for (let i = 0; i < rows; i++) {
        const row = document.createElement("div");
        row.className = "row";

        for (let j = 0; j < 5; j++) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.style.backgroundColor = "#ccc"; // Default slot color
            slot.dataset.row = i; // Track row
            slot.dataset.index = j; // Track slot index
            slot.addEventListener("click", showPopup); // Show popup on click
            row.appendChild(slot);
        }

        board.appendChild(row);
    }

    generateSolution(); // Generate solution
}

// Show the color selection popup
function showPopup(event) {
    const slot = event.target;
    const rect = slot.getBoundingClientRect();

    if (slot.dataset.row != activeRow) return; // Only allow selection in the active row

    // Position the popup near the slot
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.display = "flex";

    // Populate color options
    colorOptions.innerHTML = ""; // Clear old options
    colors.forEach(color => {
        const colorOption = document.createElement("div");
        colorOption.className = "color-option";
        colorOption.style.backgroundColor = color; // Display color
        colorOption.addEventListener("click", () => selectColor(slot, color));
        colorOptions.appendChild(colorOption);
    });
}

// Select a color and apply it to the slot
function selectColor(slot, color) {
    slot.style.backgroundColor = color; // Update slot color
    slot.dataset.color = color; // Store selected color
    popup.style.display = "none"; // Hide popup
}

// Generate the random solution
function generateSolution() {
    solution = [];
    for (let i = 0; i < 5; i++) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        solution.push(randomColor);
    }
    console.log("Solution:", solution); // Debugging
}

// Check the player's guess
checkButton.addEventListener("click", () => {
    const currentRow = board.children[activeRow];
    const guess = Array.from(currentRow.children).map(slot => slot.dataset.color);

    if (guess.includes(undefined)) {
        alert("Please select a color for all slots before checking!");
        return;
    }

    // Check the guess against the solution
    guess.forEach((color, index) => {
        const slot = currentRow.children[index];
        if (color === solution[index]) {
            slot.style.border = "3px solid green"; // Correct color and position
        } else if (solution.includes(color)) {
            slot.style.border = "3px solid yellow"; // Correct color, wrong position
        } else {
            slot.style.border = "3px solid red"; // Wrong color
        }
    });

    // Progress the game
    if (guess.join() === solution.join()) {
        alert("Congratulations, you guessed correctly!");
    } else {
        activeRow++;
        if (activeRow >= board.children.length) {
            alert("Game Over! The correct combination was: " + solution.join(", "));
        }
    }
});

// Initialize the game
createBoard(3);
