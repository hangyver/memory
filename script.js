document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const TOTAL_PLATES = 20;
    const SETUP_ROUNDS = 9; // Setup: 1 to 9 chips
    const START_GAME_TOKENS = 10;
    const TURN_TIME_LIMIT = 60; // seconds

    // --- Game State ---
    let state = {
        phase: 'SETUP', // 'SETUP', 'PLAY', 'MATCH_DECISION', 'GAME_OVER'
        setupRound: 1,
        currentTurn: 'A',
        
        setupChips: { A: 45, B: 45 },
        gameTokens: { A: 0, B: 0 }, 
        
        plates: Array(TOTAL_PLATES).fill(null).map((_, i) => ({
            id: i + 1,
            count: 0,
            isOpen: false,
            isTemporaryOpen: false
        })),

        selectedPlates: [], 
        matchedPlates: [], // To store indices of matched plates awaiting decision
        isProcessingResult: false,
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
            
            const simpleAngle = (i * angleStep) - (angleStep / 2);
            const cssAngle = simpleAngle - 90;
            const x = Math.cos(cssAngle * Math.PI / 180) * radius;
            const y = Math.sin(cssAngle * Math.PI / 180) * radius;

            wrapper.style.transform = `translate(${x}px, ${y}px)`;

            const plate = document.createElement('div');
            plate.className = 'plate';
            plate.id = `plate-${i}`;
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
        if (state.isProcessingResult) return; 
        const plateIndex = plateId - 1;

        if (state.phase === 'SETUP') {
            handleSetupClick(plateIndex);
        } else if (state.phase === 'PLAY') {
            handlePlayClick(plateIndex);
        } else if (state.phase === 'MATCH_DECISION') {
            handleMatchDecisionClick(plateIndex);
        }
    }

    // --- Phase 1: Setup Logic ---

    function handleSetupClick(index) {
        const plate = state.plates[index];
        if (plate.count > 0) {
            alert("이미 칩이 있는 접시입니다! 비어있는 접시를 선택하세요.");
            return;
        }

        const amount = state.setupRound;
        plate.count = amount;
        state.setupChips[state.currentTurn] -= amount;

        animatePlacement(index + 1, state.currentTurn, amount);

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
        state.currentTurn = 'A';
        state.timer = TURN_TIME_LIMIT;
        
        playerAContainer.className = 'chip-stack yellow';
        playerBContainer.className = 'chip-stack yellow';
        
        alert("모든 칩 배치가 끝났습니다! 이제 '기억의 저녁식사'를 시작합니다.\n\n[규칙 변경]\n두 숫자가 같으면, 토큰을 추가할 접시 하나를 직접 선택해야 합니다!");
        
        startTimer();
        updateUI();
    }

    // --- Phase 2: Play Logic ---

    function handlePlayClick(index) {
        const plate = state.plates[index];
        if (state.selectedPlates.includes(index)) return;
        if (state.selectedPlates.length >= 2) return;

        plate.isTemporaryOpen = true;
        state.selectedPlates.push(index);
        updatePlateVisual(index + 1);

        if (state.selectedPlates.length === 2) {
            state.isProcessingResult = true;
            stopTimer(); // Pause time while checking
            setTimeout(checkMatchResult, 1000); 
        }
    }

    function checkMatchResult() {
        const [idx1, idx2] = state.selectedPlates;
        const val1 = state.plates[idx1].count;
        const val2 = state.plates[idx2].count;
        
        if (val1 === val2) {
            // SUCCESS -> Prompt user decision
            state.phase = 'MATCH_DECISION';
            state.matchedPlates = [idx1, idx2];
            state.isProcessingResult = false; // Allow click now
            
            alert(`성공!!! (숫자: ${val1})\n토큰 하나를 추가할 접시를 선택하세요!`);
            updateUI(); // Highlights the selectable plates
        } else {
            // FAILURE -> Penalty
            const player = state.currentTurn;
            state.gameTokens[player]++; 
            alert(`실패! (${val1} vs ${val2})\n${player}는 패널티 토큰을 받습니다.`);
            finalizeTurn();
        }
    }

    function handleMatchDecisionClick(index) {
        // Must click one of the matched plates
        if (!state.matchedPlates.includes(index)) {
            alert("일치하는 접시 중 하나를 선택해야 합니다!");
            return;
        }

        const player = state.currentTurn;
        state.gameTokens[player]--; // Remove token
        state.plates[index].count += 1; // Add token to selected plate

        // Check Win
        if (state.gameTokens[player] <= 0) {
            endGame(player);
            return;
        }
        
        alert(`${player}의 토큰이 줄어듭니다.\n접시 ${index + 1}번에 토큰이 추가되었습니다.`);
        finalizeTurn();
    }

    function finalizeTurn() {
        // Reset Board
        const [idx1, idx2] = state.selectedPlates;
        state.plates[idx1].isTemporaryOpen = false;
        state.plates[idx2].isTemporaryOpen = false;
        state.selectedPlates = [];
        state.matchedPlates = [];
        state.isProcessingResult = false;
        state.phase = 'PLAY';

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
                stopTimer();
                alert("시간 초과! 패널티 토큰을 받습니다.");
                state.gameTokens[state.currentTurn]++;
                finalizeTurn(); // Handles turn switching and reset
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

    // --- UI Updates ---

    function updateUI() {
        if (state.currentTurn === 'A') {
            areaA.classList.add('active');
            areaB.classList.remove('active');
        } else {
            areaA.classList.remove('active');
            areaB.classList.add('active');
        }

        if (state.phase === 'SETUP') {
           // ... (same as before)
            scoreAEl.textContent = state.setupChips.A;
            scoreBEl.textContent = state.setupChips.B;
            const playerColor = state.currentTurn === 'A' ? '#ff4444' : '#44ff44';
            statusEl.innerHTML = `
                <span style="color:${playerColor}">PLAYER ${state.currentTurn}</span> 차례<br>
                칩 <span style="color:yellow">${state.setupRound}</span>개를 숨기세요
            `;
        } else if (state.phase === 'PLAY') {
            updatePlayStatus();
        } else if (state.phase === 'MATCH_DECISION') {
             const playerColor = state.currentTurn === 'A' ? '#ff4444' : '#44ff44';
             statusEl.innerHTML = `
                <span style="color:${playerColor}">PLAYER ${state.currentTurn}</span> 결정!<br>
                <span style="color:yellow; font-size: 0.8em">토큰을 넣을 접시를 선택하세요</span>
             `;
             scoreAEl.textContent = state.gameTokens.A;
             scoreBEl.textContent = state.gameTokens.B;
        }

        for (let i = 1; i <= TOTAL_PLATES; i++) {
            updatePlateVisual(i);
        }
    }

    function updatePlayStatus() {
        scoreAEl.textContent = state.gameTokens.A;
        scoreBEl.textContent = state.gameTokens.B;
        const playerColor = state.currentTurn === 'A' ? '#ff4444' : '#44ff44';
        statusEl.innerHTML = `
            <span style="color:${playerColor}">PLAYER ${state.currentTurn}</span> 차례<br>
            남은 시간: <span style="color:${state.timer < 10 ? 'red' : 'white'}">${state.timer}</span>초<br>
            <span style="font-size:0.6em">남은 토큰: A(${state.gameTokens.A}) vs B(${state.gameTokens.B})</span>
        `;
    }

    function updatePlateVisual(plateId) {
        const index = plateId - 1;
        const plateData = state.plates[index];
        const plateEl = document.getElementById(`plate-${plateId}`);
        const contentEl = plateEl.querySelector('.plate-content');
        const lidEl = plateEl.querySelector('.plate-lid-number');

        // Cleanup special classes
        plateEl.classList.remove('selectable-match');

        if (state.phase === 'SETUP') {
           if (plateData.count > 0) plateEl.classList.add('closed');
        } else {
            // Play or Match Decision
            if (plateData.isTemporaryOpen) {
                plateEl.classList.add('open');
                plateEl.classList.remove('closed');
                contentEl.style.display = 'block';
                contentEl.textContent = plateData.count;
                lidEl.style.display = 'none';

                // Highlight if waiting for decision
                if (state.phase === 'MATCH_DECISION' && state.matchedPlates.includes(index)) {
                     plateEl.classList.add('selectable-match');
                }

            } else {
                plateEl.classList.remove('open');
                plateEl.classList.add('closed');
                contentEl.style.display = 'none';
                lidEl.style.display = 'block';
            }
        }
    }

    function animatePlacement(plateId, player, amount) {
        // Animation placeholder
    }
});
