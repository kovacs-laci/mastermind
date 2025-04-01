const board = document.getElementById("board");
const checkButton = document.getElementById("check-button");

let activeRow = 0; // Track the current row
let solution = []; // Store the correct solution
const colors = ["none", "red", "blue", "green", "yellow", "purple"]; // Add "none" as the default

// Generate the board with dropdowns
function createBoard(rows = 3) {
    board.innerHTML = "";
    for (let i = 0; i < rows; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 5; j++) { // 5 slots per row
            const slot = document.createElement("select");
            slot.classList.add("select-color");
            slot.disabled = i !== activeRow; // Disable slots in inactive rows
            colors.forEach(color => {
                const option = document.createElement("option");
                option.value = color;
                option.textContent = color === "none" ? "" : color; // Display blank for "none"
                option.style.backgroundColor = color === "none" ? "#ccc" : color; // Default gray for "none"
                slot.appendChild(option);
            });
            slot.addEventListener("change", () => updateSlotColor(slot));
            row.appendChild(slot);
        }
        board.appendChild(row);
    }
    generateSolution();
}

// Update the slot color based on the selected value
function updateSlotColor(slot) {
    const selectedColor = slot.value;
    if (selectedColor === "none") {
        slot.style.backgroundColor = "#ccc"; // Default gray if no color is selected
    } else {
        slot.style.backgroundColor = selectedColor; // Change background color to selected value
    }
    slot.style.color = "transparent"; // Hide the text
}

// Generate a random solution
function generateSolution() {
    solution = [];
    for (let i = 0; i < 5; i++) {
        const randomColor = colors.slice(1)[Math.floor(Math.random() * (colors.length - 1))];
        solution.push(randomColor);
    }
    console.log("Solution:", solution); // Debugging
}

// Check the player's guess
checkButton.addEventListener("click", () => {
    const currentRow = board.children[activeRow];
    const guess = Array.from(currentRow.children).map(slot => slot.value);

    if (guess.length !== solution.length || guess.includes("none")) {
        alert("Complete all slots before checking!");
        return;
    }

    // Check the guess against the solution
    guess.forEach((color, index) => {
        const slot = currentRow.children[index];
        if (color === solution[index]) {
            slot.style.borderColor = "green"; // Correct color and position
        } else if (solution.includes(color)) {
            slot.style.borderColor = "yellow"; // Correct color, wrong position
        } else {
            slot.style.borderColor = "red"; // Wrong color
        }
    });

    // Move to the next row if not solved
    if (guess.join() === solution.join()) {
        alert("You win!");
    } else {
        activeRow++;
        if (activeRow >= board.children.length) {
            alert("Game Over! The solution was: " + solution.join(", "));
        } else {
            // Enable the next row
            Array.from(board.children[activeRow].children).forEach(slot => slot.disabled = false);
        }
    }
});

// Initialize the game
createBoard(3); // Start with 3 rows
