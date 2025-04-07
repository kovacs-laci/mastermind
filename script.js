document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const colorPoll = document.getElementById("color-poll");
    const checkButton = document.getElementById("check-button");
    const newGameButton = document.getElementById("new-game-button");
    const settingsButton  = document.getElementById("settings-button");
    const saveSettingsButton = document.getElementById("save-settings-button");

    const maxRows = 10;
    const maxColors = 10;

    let activeRow = 0; // Track the current active row
    let solution = []; // Store the correct solution
    let currentGuess = [null, null, null, null, null]; // Track the player's current guess
    let selectedSlotIndex = null; // Track the currently selected slot in the active row
    let stopwatchInterval;
    let elapsedTime = 0;

    // Declare setup and settings globally
    let settings;
    let setup;

    function toggleStopwatchMode(isStopwatchMode) {
        const stopwatch = document.getElementById('stopwatch');
        if (isStopwatchMode) {
            stopwatch.style.display = 'inline'; // Show the stopwatch
            resetStopwatch(); // Ensure it starts from zero
        } else {
            stopwatch.style.display = 'none'; // Hide the stopwatch
            clearInterval(stopwatchInterval); // Stop updating
        }
    }

    function startStopwatch() {
        const stopwatch = document.getElementById('stopwatch');
        clearInterval(stopwatchInterval);
        stopwatchInterval = setInterval(() => {
            elapsedTime += 1;
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            stopwatch.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function stopStopwatch() {
        clearInterval(stopwatchInterval); // Stop the timer
    }

    function resetStopwatch() {
        elapsedTime = 0;
        document.getElementById('stopwatch').textContent = '00:00'; // Reset display
    }

    function displayColorPoll(pollColors) {
        colorPoll.innerHTML = ""; 

        // Create the first row
        const firstRow = document.createElement("div");
        firstRow.classList.add("color-row");

        // Create the second row (if needed)
        const secondRow = document.createElement("div");
        secondRow.classList.add("color-row");

        // Add colors to the rows
        pollColors.forEach((color, index) => {
            const colorSlot = document.createElement("div");
            colorSlot.classList.add("color-slot");
            colorSlot.style.backgroundColor = color;

            // Assign the clicked color to the selected slot
            colorSlot.addEventListener("click", () => assignColor(color));

            // Append to the appropriate row
            if (index < 5) {
                firstRow.appendChild(colorSlot);
            } else {
                secondRow.appendChild(colorSlot);
            }
        });

        // Append rows to the color poll
        colorPoll.appendChild(firstRow);
        if (pollColors.length > 5) {
            colorPoll.appendChild(secondRow);
        }
    }


    // Create the game board
    function displayBoard(rows = maxRows) {
        const board = document.getElementById("board"); // Get the board element
        // Update the grid-template-rows property
        board.style.gridTemplateRows = `repeat(${rows}, 50px)`;
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
    }

    function getSettings() {
        const defaultSettings = {
            rows: maxRows,
            colorPollLength: maxColors,
            allowDuplicates: true,
            mode: "relax",
            helper: false,
        };

        const savedSettings = JSON.parse(localStorage.getItem("settings"));
        if (savedSettings) {
            return {
                rows: parseInt(savedSettings.rows, maxRows) || defaultSettings.rows,
                colorPollLength: parseInt(savedSettings.colorPollLength, maxColors) || defaultSettings.colorPollLength,
                allowDuplicates: typeof savedSettings.allowDuplicates === "boolean"
                    ? savedSettings.allowDuplicates
                    : defaultSettings.allowDuplicates,
                mode: savedSettings.mode,
                helper: savedSettings.helper    
            };
        }

        return defaultSettings; // Return default settings if no saved settings exist
    }

    // Select a slot in the active row
    function selectSlot(index) {
        if (activeRow === null) {
            alert("Nincs kiválasztott sor!");
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
            alert("Kérlek előbb válassz egy mezőt!");
            return;
        }

        // Update the current guess and the board
        currentGuess[selectedSlotIndex] = color;

        const currentRow = board.children[activeRow];
        const slot = currentRow.children[selectedSlotIndex];
        slot.style.backgroundColor = color; // Apply the selected color to the slot
    }

    // Check the player's guess
    checkButton.addEventListener("click", () => {
        if (currentGuess.includes(null)) {
            alert("Fejezd be a tippelést az ellenőrzés előtt!");
            return;
        }

        const currentRow = board.children[activeRow];
        const feedback = checkGuess([...currentGuess], [...setup.solution]); // Call checkGuess with the current guess and solution

        currentGuess.forEach((color, index) => {
            const slot = currentRow.children[index];

            const marker = document.createElement("span");
            marker.style.color = "white";
            marker.style.fontSize = "18px";
            marker.style.fontWeight = "bold";
            marker.style.position = "absolute";
            marker.style.top = "50%";
            marker.style.left = "50%";
            marker.style.transform = "translate(-50%, -50%)";
            // Apply feedback to the current guess
            switch (feedback[index]) {
                case "correct":
                    // Correct position marker
                    marker.textContent = "✓";
                    break;
                case "wrong position":
                    // Wrong position marker
                    marker.textContent = "⚪";
                    break;
                default:
                    // Incorrect marker
                    marker.textContent = "X";
                    break;
            }
            slot.appendChild(marker);
        });

        if (currentGuess.join() !== solution.join()) {
            activeRow++;
            if (activeRow >= board.children.length) {
                if (settings.mode == "stopwatch") {
                    stopStopwatch();                    
                }                
                // alert("Játék vége! A megoldás: " + solution.join(", "));    
                alert("Játék vége! A megoldás: " + translateSolution(solution).join(", "));            
            } else {
                currentGuess = [null, null, null, null, null]; // Reset guess
                selectedSlotIndex = null; // Reset selected slot
                updateBoard(); // Enable the next row
            }
        }
    });

    function checkGuess(guess, solution) {
        const feedback = new Array(guess.length).fill("wrong color"); // Default to "wrong color"
        const colorCount = {}; // Track occurrences of each color in the solution

        // Count occurrences of each color in the solution
        solution.forEach(color => {
            colorCount[color] = (colorCount[color] || 0) + 1;
        });

        // Step 1: Check for exact matches (correct color and position)
        guess.forEach((color, index) => {
            if (color === solution[index]) {
                feedback[index] = "correct"; // Correct position
                colorCount[color]--; // Decrease availability
                guess[index] = null; // Mark as processed
            }
        });

        // Step 2: Check for correct color but wrong position
        guess.forEach((color, index) => {
            if (color && feedback[index] !== "correct" && colorCount[color] > 0) {
                feedback[index] = "wrong position"; // Wrong position
                colorCount[color]--; // Decrease availability
            }
        });

        return feedback;
    }

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

    newGameButton.addEventListener("click", () => {
        settings = getSettings();
        setup = setupGame(getSettings());
        newGame(settings, setup);
    });

    function newGame(settings, setup)
    {
        activeRow = 0;
        currentGuess = [null, null, null, null, null];
        selectedSlotIndex = null;
        displayColorPoll(setup.pollColors);
        displayBoard(settings.rows);
        if (settings.mode == "stopwatch") {            
            const stopwatch = document.getElementById("stopwatch");
            if (stopwatch.classList.contains("hidden")) {
                stopwatch.classList.remove("hidden");
                stopwatch.classList.add("show");
            }
            resetStopwatch();            
            startStopwatch();
        }
        else {            
            const stopwatch = document.getElementById("stopwatch");
            if (stopwatch.classList.contains("show")) {
                stopwatch.classList.remove("show");
                stopwatch.classList.add("hidden");
            } 
            stopStopwatch();   
        }
    }

    settingsButton.addEventListener("click", () => {
        const settingsPanel = document.getElementById("settings");
        if (settingsPanel.classList.contains("hidden")) {
            loadSettings();
            settingsPanel.classList.remove("hidden");
            settingsPanel.classList.add("show");
        } else {
            settingsPanel.classList.remove("show");
            settingsPanel.classList.add("hidden");
        }
    });

    saveSettingsButton.addEventListener("click", () => {
        const rows = document.getElementById("rows").value;
        const colorPollLength = document.getElementById("color-poll-length").value;
        const allowDuplicates = document.getElementById("allow-duplicates").checked;
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const helper = document.getElementById("helper").checked;

        // Create the updated settings object
        settings = {
            rows: rows,
            colorPollLength: colorPollLength,
            allowDuplicates: allowDuplicates,
            mode: mode,
            helper: helper,
        };

        // Save the updated settings to localStorage
        localStorage.setItem("settings", JSON.stringify(settings));

        const settingsPanel = document.getElementById("settings");
        settingsPanel.classList.remove("show");
        settingsPanel.classList.add("hidden");        
    });

    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem("settings"));

        if (savedSettings) {
            document.getElementById("rows").value = savedSettings.rows;
            document.getElementById("color-poll-length").value = savedSettings.colorPollLength;
            document.getElementById("allow-duplicates").checked = savedSettings.allowDuplicates;            
            document.getElementById("helper").checked = savedSettings.helper;

            // Set the saved radio group value
            if (savedSettings.mode && document.querySelector(`input[name="mode"][value="${savedSettings.mode}"]`)) {
                document.querySelector(`input[name="mode"][value="${savedSettings.mode}"]`).checked = true;
            }

        } else {
            console.log("Nincsenek mentett beállí­tások!");
        }
    }

    function generateSolution(settings, availableColors) {

        const { colorPollLength, allowDuplicates } = settings;

        // Step 1: Limit the color poll based on settings.colorPollLength
        const pollColors = availableColors.slice(0, Math.min(colorPollLength, availableColors.length));

        // Step 2: Initialize the solution array
        const solution = [];

        // Step 3: Generate the solution
        while (solution.length < 5) {
            const randomColor = pollColors[Math.floor(Math.random() * pollColors.length)];
            if (allowDuplicates || !solution.includes(randomColor)) {
                solution.push(randomColor);
            }
        }
        // console.log("Solution:", solution);
        return solution;
    }
    
    function setupGame(settings) {
        const predefinedColors = [
            "red", "blue", "green", "brown", "purple", "yellow", "orange",
            "pink", "gray", "black", "tomato", "cyan", "magenta", "lime", "teal"
        ];

        solution = generateSolution(settings, predefinedColors);

        const pollColors = new Set(solution); // Ensure poll includes all solution colors
        while (pollColors.size < settings.colorPollLength) {
            const randomColor = predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
            pollColors.add(randomColor);
        }

        const sortedPollColors = Array.from(pollColors).sort();

        return {
            solution,
            pollColors: sortedPollColors // Sorted poll colors
        };
    }

    function translateSolution(solution) {
        const colorTranslations = {
            red: "piros",
            blue: "kék",
            green: "zöld",
            brown: "barna",
            purple: "lila",
            yellow: "sárga",
            orange: "narancs",
            pink: "rózsaszín",
            gray: "szürke",
            black: "fekete",
            tomato: "paradicsom",
            cyan: "cián",
            magenta: "magenta",
            lime: "lime",
            teal: "türkiz"
        };

        return solution.map(color => colorTranslations[color] || color); // Use translation or fallback to English
    }

    newGameButton.click();
});