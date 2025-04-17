document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const colorPoll = document.getElementById("color-poll");
    const checkButton = document.getElementById("check-button");
    const newGameButton = document.getElementById("new-game-button");
    const settingsButton  = document.getElementById("settings-button");
    const saveSettingsButton = document.getElementById("save-settings-button");
    const eraseResultsButton = document.getElementById("erase-results-button");

    const maxRows = 10;
    const maxColors = 10;
    const cols = 5;

    let activeRow = 0; // Track the current active row
    let solution = []; // Store the correct solution
    let currentGuess = [null, null, null, null, null]; // Track the player's current guess
    let selectedSlotIndex = null; // Track the currently selected slot in the active row
    let stopwatchInterval;
    let elapsedTime = 0;
    let language = localStorage.getItem("language") || "hu";

    // Declare setup and settings globally
    let settings;
    let setup;
    let translations = {};

    async function loadTranslations() {
        const response = await fetch('translations.json');
        translations = await response.json();

        // Apply the default or saved language
        language = localStorage.getItem('language') || 'hu';
        applyLocalization(language);
    }

    function applyLocalization(language) {
        const texts = translations[language];

        // Update legends
        document.getElementById("settings-legend").textContent = texts.settingsLegend; // Settings
        document.getElementById("game-mode-legend").textContent = texts.gameModeLegend; // Game Mode

        // Update button labels
        document.getElementById("new-game-button").textContent = `${texts.newGame}`;
        document.getElementById("check-button").textContent = `✓️ ${texts.check}`;
        document.getElementById("settings-button").textContent = `⚙️ ${texts.settings}`;
        document.getElementById("save-settings-button").textContent = `🖫 ${texts.save}`;
        document.getElementById("erase-results-button").textContent = `🗑️ ${texts.eraseResults}`;

        // Update text in settings fields
        document.querySelector("label[for='language-selector']").textContent = texts.selectLanguage;
        document.querySelector("label[for='rows']").textContent = texts.rows;
        document.querySelector("label[for='color-poll-length']").textContent = texts.colorPollLength;
        document.querySelector("label[for='allow-duplicates']").textContent = texts.allowDuplicates;

        // Update game mode options
        document.querySelector("label[for='timer']").textContent = `⏳ ${texts.timer}`;
        document.querySelector("label[for='score']").textContent = texts.collectScore;
        document.querySelector("label[for='relax']").textContent = texts.relax;

        // Set the selected language in the dropdown
        document.getElementById("language-selector").value = language;
    }


    document.getElementById("language-selector").addEventListener("change", (event) => {
        language = event.target.value;
        applyLocalization(language);
    });

    // Check the player's guess
    checkButton.addEventListener("click", () => {
        if (currentGuess.includes(null)) {
            alert(translations[language].alertFinishGuess);
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

        if (currentGuess.join() === solution.join()) {
            // alert("Gratulálok, nyertél!");
            if (settings.mode === "stopwatch") {
                stopStopwatch();
                if (saveBestTime(elapsedTime)) {
                    displayBestTime();
                    alert(translations[language].bestTime);
                }
            }
            if (settings.mode === "score") {
                const score = calculateScore(activeRow);
                if (saveScore(score)) {
                    displayScore();
                }
            }
        }
        else {
            activeRow++;
            if (activeRow >= board.children.length) {
                if (settings.mode === "stopwatch") {
                    stopStopwatch();
                }
                alert(translations[language].gameOver + translateSolution(solution, language).join(", "));
            } else {
                currentGuess = [null, null, null, null, null]; // Reset guess
                selectedSlotIndex = null; // Reset selected slot
                updateBoard(); // Enable the next row
            }
        }
    });

    newGameButton.addEventListener("click", () => {
        settings = getSettings();
        setup = setupGame(getSettings());
        newGame(settings, setup);
    });

    saveSettingsButton.addEventListener("click", () => {
        const rows = document.getElementById("rows").value;
        const colorPollLength = document.getElementById("color-poll-length").value;
        const allowDuplicates = document.getElementById("allow-duplicates").checked;
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const helper = document.getElementById("helper").checked;
        const language = document.querySelector('#language-selector').value;


        localStorage.setItem("language", language);
        // Validation: Ensure valid settings
        if (!allowDuplicates && colorPollLength < 5) {
            alert(translations[language].wrongSettings);
            return; // Stop the function from proceeding
        }
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

    eraseResultsButton.addEventListener("click", () => {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const rows = document.getElementById("rows").value;
        const colorPollLength = document.getElementById("color-poll-length").value;
        const allowDuplicates = document.getElementById("allow-duplicates").checked;

        const duplicatesSuffix = allowDuplicates ? "DA" : "NoDA";
        const prefixes = ['bestTime', 'score'];
        prefixes.forEach((prefix) => {
            let key = `${prefix}_${rows}_${colorPollLength}_${duplicatesSuffix}`;
            localStorage.removeItem(key);
        })
    })

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
        clearInterval(stopwatchInterval);
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

        // Create the second row
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
            if (index < cols) {
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

            for (let j = 0; j < cols; j++) {
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
            alert(translations[language].noSelectedRow);
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

    function toggleContainer(containerId, show) {
        const container = document.getElementById(containerId);
        if (show) {
            container.classList.remove("hidden");
            container.classList.add("show");
        } else {
            container.classList.remove("show");
            container.classList.add("hidden");
        }
    }

    function newGame(settings, setup) {
        // Initialize game state
        activeRow = 0;
        currentGuess = [null, null, null, null, null];
        selectedSlotIndex = null;

        // Display game elements
        displayColorPoll(setup.pollColors);
        displayBoard(settings.rows);

        // Handle modes
        switch (settings.mode) {
            case "stopwatch":
                toggleContainer("stopwatch-container", true);
                displayBestTime();
                resetStopwatch();
                startStopwatch();
                break;

            case "score":
                toggleContainer("score-container", true);
                displayScore();
                break;

            default: // Handles all other modes or "none"
                toggleContainer("stopwatch-container", false);
                stopStopwatch();
                toggleContainer("score-container", false);
                break;
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
        while (solution.length < cols) {
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

    function translateSolution(solution, language) {
        const colorTranslations = translations[language].colors;

        // Use translation or fallback to original color
        return solution.map(color => colorTranslations[color] || color);
    }


    function saveBestTime(time) {
        const key = getSettingsKey('bestTime');

        // Get existing times or initialize as empty
        const bestTime = JSON.parse(localStorage.getItem(key)); // Retrieve existing best time

        // Save the new best time if it's better or if no best time exists
        if (!bestTime || elapsedTime < bestTime) {
            localStorage.setItem(key, JSON.stringify(elapsedTime));
            return true; // Indicate that a new best time was set
        }
        return false; // No change to the best time
    }

    function getBestTime() {
        const key = getSettingsKey('bestTime');

        // Return existing times or an empty array
        return JSON.parse(localStorage.getItem(key)) || [];
    }

    function displayBestTime() {
        const bestTime = getBestTime();
        const bestTimeDisplay = document.getElementById("best-time-display");

        if (bestTime) {
            bestTimeDisplay.textContent = `Legjobb idő: ${bestTime}s`;
        } else {
            bestTimeDisplay.textContent = "Legjobb idő: ";
        }
    }

    function calculateScore(rowsUsed) {
        let maxScore = settings.colorPollLength;

        if (rowsUsed == 1) {
            return maxScore;
        }
        // Minden felhasznált sor eggyel csökkenti az elérhető pontokat
        const score = maxScore - rowsUsed;
        return Math.max(0, score); // Pontszám nem lehet negatív
    }

    function saveScore(currentScore) {
        if (currentScore <= 0) {
            return false;
        }
        const key = getSettingsKey('score');
        const score = JSON.parse(localStorage.getItem(key)) || {total: 0, playedGames: 0};
        score.total += currentScore;
        score.playedGames += 1;
        localStorage.setItem(key, JSON.stringify(score));
        return true;
    }

    function getScore() {
        const key = getSettingsKey('score');

        return JSON.parse(localStorage.getItem(key)) || [];
    }

    function displayScore() {
        const score = getScore();
        const scoreDisplay = document.getElementById("score-display");

        if (score && score.total >= 0 && score.playedGames >= 0) {
            scoreDisplay.textContent = `Elért pontok: ${score.total} / ${score.playedGames} játékban`;
        } else {
            scoreDisplay.textContent = "Elért pontok: ";
        }
    }

    function getSettingsKey(prefix)
    {
        // Create a unique key based on rows, colorPollLength, and allowDuplicates
        const duplicatesSuffix = settings.allowDuplicates ? "DA" : "NoDA";
        return `${prefix}_${settings.rows}_${settings.colorPollLength}_${duplicatesSuffix}`;
    }
    loadTranslations();
    newGameButton.click();
});