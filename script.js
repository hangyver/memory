document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const TOTAL_PLATES = 20;
    const SETUP_ROUNDS = 9; // Setup: 1 to 9 chips
    const START_GAME_TOKENS = 10;
    const TURN_TIME_LIMIT = 60; // seconds

    // --- Game State ---
    let state = {
        phase: 'SETUP', // 'SETUP', 'PLAY', 'GAME_OVER'
        setupRound: 1,  // 1 to 9
        currentTurn: 'A', // 'A' or 'B'
        
        // Setup Phase Counters (Chips to place)
        setupChips: { A: 45, B: 45 },
        
        // Play Phase Counters (Tokens to get rid of)
        gameTokens: { A: 0, B: 0 }, 
        
        // Board Data
        plates: Array(TOTAL_PLATES).fill(null).map((_, i) => ({
            id: i + 1,
            count: 0,      // Number of chips inside
            isOpen: false, // Is it currently visible?
            isTemporaryOpen: false // For the split second reveal
        })),

        // Play Logic
        selectedPlates: [], // IDs of plates selected this turn
        isProcessingResult: false, // Lock input during animation
        timer: TURN_TIME_LIMIT,
        timerInterval: null
    };

    // --- DOM Elements ---
    const plateCircle = document.getElementById('plate-circle');
    const statusEl = document.getElementById('game-status');
    const scoreAEl = document.getElementById('score-a');
    const scoreBEl = document.getElementById('score-b');
    const playerAContainer = document.querySelector('.player-a .chip-stack');
    const playerBContainer = document.querySelector('.player-b .chip-stack');
    const areaA = document.querySelector('.player-a');
    const areaB = document.querySelector('.player-b');

    // --- Initialization ---
    initBoard();
    updateUI();

    function initBoard() {
        plateCircle.innerHTML = '';
        const radius = 250;
        const angleStep = 360 / TOTAL_PLATES;

        for (let i = 1; i <= TOTAL_PLATES; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'plate-wrapper';
            
            // Positioning Logic
            const simpleAngle = (i * angleStep) - (angleStep / 2);
            const cssAngle = simpleAngle - 90;
            const x = Math.cos(cssAngle * Math.PI / 180) * radius;
            const y = Math.sin(cssAngle * Math.PI / 180) * radius;

            wrapper.style.transform = `translate(${x}px, ${y}px)`;

            const plate = document.createElement('div');
            plate.className = 'plate';
            plate.id = `plate-${i}`;
            // Inner content for displaying chip count when open
            plate.innerHTML = `
                <span class="plate-lid-number">${i}</span>
                <span class="plate-content" style="display:none;">0</span>
            `;
            
            plate.addEventListener('click', () => handlePlateClick(i));
            wrapper.appendChild(plate);
            plateCircle.appendChild(wrapper);
        }
    }

    // --- Core Interaction ---

    function handlePlateClick(plateId) {
        if (state.isProcessingResult) return; // Input locked
        const plateIndex = plateId - 1;

        if (state.phase === 'SETUP') {
            handleSetupClick(plateIndex);
        } else if (state.phase === 'PLAY') {
            handlePlayClick(plateIndex);
        }
    }

    // --- Phase 1: Setup Logic ---

    function handleSetupClick(index) {
        const plate = state.plates[index];
        
        // Setup Rule: Cannot place on occupied plates
        if (plate.count > 0) {
            alert("이미 칩이 있는 접시입니다! 비어있는 접시를 선택하세요.");
            return;
        }

        // Logic
        const amount = state.setupRound;
        plate.count = amount;
        state.setupChips[state.currentTurn] -= amount;

        // Visuals
        animatePlacement(index + 1, state.currentTurn, amount);

        // Turn Management
        if (state.currentTurn === 'A') {
            state.currentTurn = 'B';
        } else {
            state.currentTurn = 'A';
            state.setupRound++;
            
            if (state.setupRound > SETUP_ROUNDS) {
                startPlayPhase();
                return;
            }
        }
        updateUI();
    }

    function startPlayPhase() {
        state.phase = 'PLAY';
        state.gameTokens = { A: START_GAME_TOKENS, B: START_GAME_TOKENS };
        state.currentTurn = 'A'; // A starts first as per request
        state.timer = TURN_TIME_LIMIT;
        
        // Reset Visuals
        playerAContainer.className = 'chip-stack yellow';
        playerBContainer.className = 'chip-stack yellow';
        
        alert("모든 칩 배치가 끝났습니다! 이제 '기억의 저녁식사'를 시작합니다.\n\n[규칙]\n1. 1분 안에 접시 2개를 오픈\n2. 숫자가 같으면 성공 (내 토큰 -1, 접시에 +1)\n3. 다르면 실패 (내 토큰 +1)\n4. 토큰을 모두 없애면 승리!");
        
        startTimer();
        updateUI();
    }

    // --- Phase 2: Play Logic ---

    function handlePlayClick(index) {
        const plate = state.plates[index];

        // Validate: Cannot click already open plate (if managing persistant open state) 
        // Or duplicate click
        if (state.selectedPlates.includes(index)) return;
        if (state.selectedPlates.length >= 2) return;

        // Reveal Plate
        plate.isTemporaryOpen = true;
        state.selectedPlates.push(index);
        updatePlateVisual(index + 1);

        // Check if 2 selected
        if (state.selectedPlates.length === 2) {
            state.isProcessingResult = true;
            stopTimer();
            setTimeout(resolveTurn, 1000); // Wait 1 sec to let user see
        }
    }

    function resolveTurn() {
        const [idx1, idx2] = state.selectedPlates;
        const val1 = state.plates[idx1].count;
        const val2 = state.plates[idx2].count;
        const player = state.currentTurn;

        let message = "";
        let isSuccess = false;

        if (val1 === val2) {
            // SUCCESS
            isSuccess = true;
            state.gameTokens[player]--; // Remove 1 token
            
            // Add 1 token to one of the opened plates (Rule: "오픈한 곳 중 1곳에 토큰 추가")
            // Strategy: Add to the first one selected
            state.plates[idx1].count += 1; 
            
            message = `성공! (숫자: ${val1})\n${player}의 토큰이 줄어듭니다.\n접시 ${idx1 + 1}번에 토큰이 하나 추가됩니다.`;
            
            // Win Condition
            if (state.gameTokens[player] <= 0) {
                endGame(player);
                return;
            }

        } else {
            // FAILURE
            state.gameTokens[player]++; // Penalty
            message = `실패! (${val1} vs ${val2})\n${player}가 패널티 토큰을 받습니다.`;
        }

        alert(message);
        
        // Reset Board for next turn
        state.plates[idx1].isTemporaryOpen = false;
        state.plates[idx2].isTemporaryOpen = false;
        state.selectedPlates = [];
        state.isProcessingResult = false;

        // Switch Turn
        state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';
        state.timer = TURN_TIME_LIMIT;
        
        updateUI();
        startTimer();
    }

    function startTimer() {
        clearInterval(state.timerInterval);
        state.timerInterval = setInterval(() => {
            state.timer--;
            updateUI();
            if (state.timer <= 0) {
                // Time Over Logic -> Treat as Failure
                stopTimer();
                alert("시간 초과! 패널티 토큰을 받습니다.");
                state.gameTokens[state.currentTurn]++;
                state.currentTurn = state.currentTurn === 'A' ? 'B' : 'A';
                state.timer = TURN_TIME_LIMIT;
                updateUI();
                startTimer();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
    }

    function endGame(winner) {
        stopTimer();
        state.phase = 'GAME_OVER';
        statusEl.innerHTML = `<span style="font-size:2em; color:gold;">${winner} WIN!</span><br>모든 토큰을 제거했습니다!`;
        alert(`축하합니다! Player ${winner} 승리!`);
        updateUI();
    }

    // --- Visuals Updates ---

    function updateUI() {
        // Player Highlighting
        if (state.currentTurn === 'A') {
            areaA.classList.add('active');
            areaB.classList.remove('active');
        } else {
            areaA.classList.remove('active');
            areaB.classList.add('active');
        }

        // Display Logic based on Phase
        if (state.phase === 'SETUP') {
            scoreAEl.textContent = state.setupChips.A;
            scoreBEl.textContent = state.setupChips.B;
            
            const playerColor = state.currentTurn === 'A' ? '#ff4444' : '#44ff44';
            statusEl.innerHTML = `
                <span style="color:${playerColor}">PLAYER ${state.currentTurn}</span> 차례<br>
                칩 <span style="color:yellow">${state.setupRound}</span>개를 숨기세요
            `;
        } else if (state.phase === 'PLAY') {
            scoreAEl.textContent = state.gameTokens.A;
            scoreBEl.textContent = state.gameTokens.B;

            // Timer display
            const playerColor = state.currentTurn === 'A' ? '#ff4444' : '#44ff44';
            statusEl.innerHTML = `
                <span style="color:${playerColor}">PLAYER ${state.currentTurn}</span> 차례<br>
                남은 시간: <span style="color:${state.timer < 10 ? 'red' : 'white'}">${state.timer}</span>초<br>
                <span style="font-size:0.6em">남은 토큰: A(${state.gameTokens.A}) vs B(${state.gameTokens.B})</span>
            `;
            
            // Token colors loop override
            updateTokenStacks('yellow');
        } else if (state.phase === 'GAME_OVER') {
             // Handled in endGame
        }

        // Refresh all plates (in case counts changed)
        for (let i = 1; i <= TOTAL_PLATES; i++) {
            updatePlateVisual(i);
        }
    }

    function updatePlateVisual(plateId) {
        const index = plateId - 1;
        const plateData = state.plates[index];
        const plateEl = document.getElementById(`plate-${plateId}`);
        const contentEl = plateEl.querySelector('.plate-content');
        const lidEl = plateEl.querySelector('.plate-lid-number');

        if (state.phase === 'SETUP') {
           if (plateData.count > 0) {
               plateEl.classList.add('closed'); // Visually 'filled'
           }
        } else {
            // PLAY Phase
            if (plateData.isTemporaryOpen) {
                plateEl.classList.add('open');
                plateEl.classList.remove('closed');
                contentEl.style.display = 'block';
                contentEl.textContent = plateData.count;
                lidEl.style.display = 'none';
            } else {
                plateEl.classList.remove('open');
                plateEl.classList.add('closed');
                contentEl.style.display = 'none';
                lidEl.style.display = 'block';
            }
        }
    }

    function updateTokenStacks(colorClass) {
        document.querySelector('.player-a .chip-stack').setAttribute('class', `chip-stack ${colorClass}`);
        document.querySelector('.player-b .chip-stack').setAttribute('class', `chip-stack ${colorClass}`);
    }

    function animatePlacement(plateId, player, amount) {
        // Animation placeholder logic
        // Could spawn flying chips later
    }
});
