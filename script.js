document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const checkButton = document.getElementById("check-button");
    const colorPoll = document.getElementById("color-poll");
    const resetButton = document.getElementById("reset-button");

    let activeRow = 0; // Track the current active row
    let solution = []; // Store the correct solution
    const colors = ["red", "blue", "green", "yellow", "purple"]; // Available colors
    let currentGuess = [null, null, null, null, null]; // Track the player's current guess
    let selectedSlotIndex = null; // Track the currently selected slot in the active row

    // Create the color-poll
    function createColorPoll(difficulty = 5) {
        colorPoll.innerHTML = ""; // Clear the poll
        const pollRow = document.createElement("div");
        pollRow.classList.add("color-row");

        colors.slice(0, difficulty).forEach(color => {
            const colorSlot = document.createElement("div");
            colorSlot.classList.add("color-slot");
            colorSlot.style.backgroundColor = color;

            // Assign the clicked color to the selected slot
            colorSlot.addEventListener("click", () => assignColor(color));
            pollRow.appendChild(colorSlot);
        });

        colorPoll.appendChild(pollRow);
    }

    // Create the game board
    function createBoard(rows = 10) {
        board.innerHTML = ""; // Clear the board
        for (let i = 0; i < rows; i++) {
            const row = document.createElement("div");
            row.classList.add("row");

            for (let j = 0; j < 5; j++) {
                const slot = document.createElement("div");
                slot.classList.add("slot-container");
                slot.dataset.index = j; // Save the slot index
                slot.style.borderColor = "#ccc"; // Default border

                // Enable slot selection only for the active row
                if (i === activeRow) {
                    slot.addEventListener("click", () => selectSlot(j)); // Enable interaction for active row
                } else {
                    slot.style.cursor = "not-allowed"; // Prevent interaction for inactive rows
                }

                row.appendChild(slot);
            }

            board.appendChild(row);
        }

        generateSolution(); // Generate a random solution
    }

    // Select a slot in the active row
    function selectSlot(index) {
        if (activeRow === null) {
            alert("No active row!");
            return;
        }

        // Update the currently selected slot
        selectedSlotIndex = index;

        const currentRow = board.children[activeRow];

        // Highlight the selected slot
        Array.from(currentRow.children).forEach((slot, idx) => {
            slot.style.borderColor = idx === index ? "black" : "#ccc"; // Highlight selected slot
        });
    }

    // Assign a color to the selected slot
    function assignColor(color) {
        if (selectedSlotIndex === null) {
            alert("Please select a slot first!");
            return;
        }

        // Update the current guess and the board
        currentGuess[selectedSlotIndex] = color;

        const currentRow = board.children[activeRow];
        const slot = currentRow.children[selectedSlotIndex];
        slot.style.backgroundColor = color; // Apply the selected color to the slot
    }

    // Generate a random solution
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
        if (currentGuess.includes(null)) {
            alert("Complete your guess before checking!");
            return;
        }

        const currentRow = board.children[activeRow];
        currentGuess.forEach((color, index) => {
            const slot = currentRow.children[index];
            const isCorrectColorAndPosition = color === solution[index];
            const isCorrectColorWrongPosition = solution.includes(color) && !isCorrectColorAndPosition;

            // Handle correct guesses
            if (isCorrectColorAndPosition) {
                const checkmark = document.createElement("span");
                checkmark.textContent = "✓"; // Add the checkmark
                checkmark.style.color = "white"; // White checkmark
                checkmark.style.fontSize = "24px"; // Size for visibility
                checkmark.style.fontWeight = "bold"; // Bold font
                checkmark.style.position = "absolute"; // Place it in the middle
                checkmark.style.top = "50%";
                checkmark.style.left = "50%";
                checkmark.style.transform = "translate(-50%, -50%)"; // Center the checkmark
                slot.appendChild(checkmark); // Add the checkmark to the slot
            }
            // Handle wrong position
            else if (isCorrectColorWrongPosition) {
                const dot = document.createElement("span");
                dot.textContent = "⚪"; // Add a yellow dot
                dot.style.color = "yellow"; // Yellow color for the dot
                dot.style.fontSize = "12px"; // Smaller size for subtlety
                dot.style.position = "absolute"; // Place it in the corner
                dot.style.bottom = "5px";
                dot.style.right = "5px";
                slot.appendChild(dot); // Add the dot to the slot
            }
            // Handle incorrect guesses
            else {
                const cross = document.createElement("span");
                cross.textContent = "X"; // Add the X mark
                cross.style.color = "white"; // White X
                cross.style.fontSize = "24px"; // Size for visibility
                cross.style.fontWeight = "bold"; // Bold font
                cross.style.position = "absolute"; // Place it in the middle
                cross.style.top = "50%";
                cross.style.left = "50%";
                cross.style.transform = "translate(-50%, -50%)"; // Center the X
                slot.appendChild(cross); // Add the X to the slot
            }
        });

        if (currentGuess.join() === solution.join()) {
            alert("You win!");
        } else {
            activeRow++;
            if (activeRow >= board.children.length) {
                alert("Game Over! The solution was: " + solution.join(", "));
            } else {
                currentGuess = [null, null, null, null, null]; // Reset guess
                selectedSlotIndex = null; // Reset selected slot
                updateBoard(); // Enable the next row
            }
        }
    });





    // Update the board to activate the next row and disable previous rows
    function updateBoard() {
        Array.from(board.children).forEach((row, rowIndex) => {
            Array.from(row.children).forEach(slot => {
                if (rowIndex === activeRow) {
                    slot.style.cursor = "pointer"; // Activate current row
                    slot.addEventListener("click", () => selectSlot(parseInt(slot.dataset.index))); // Enable clicking
                } else {
                    slot.style.cursor = "not-allowed"; // Disable previous/inactive rows
                    slot.removeEventListener("click", () => selectSlot(parseInt(slot.dataset.index))); // Remove event listeners
                }
            });
        });
    }

    // Reset the game
    resetButton.addEventListener("click", () => {
        activeRow = 0; // Reset the active row
        currentGuess = [null, null, null, null, null]; // Clear the current guess
        selectedSlotIndex = null; // Clear the selected slot
        generateSolution(); // Generate a new solution
        createBoard(10); // Recreate the board
        updateBoard(); // Set the first row as active
    });

    // Initialize the game
    createColorPoll(colors.length); // Create the color-poll
    createBoard(10); // Create the board with 10 rows
});
