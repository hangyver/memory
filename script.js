document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const TOTAL_PLATES = 20;
    const SETUP_ROUNDS = 9; 
    const START_GAME_TOKENS = 10;
    const MAX_GAME_TOKENS = 20; // Defeat condition
    const TURN_TIME_LIMIT = 60; 

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
        matchedPlates: [], 
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

    // Modal Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalBtn = document.getElementById('modal-close-btn');

    let onModalClose = null;

    modalBtn.addEventListener('click', () => {
        closeModal();
    });

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
            plate.innerHTML = `
                <span class="plate-lid-number">${i}</span>
                <span class="plate-content" style="display:none;">0</span>
            `;
            
            plate.addEventListener('click', () => handlePlateClick(i));
            wrapper.appendChild(plate);
            plateCircle.appendChild(wrapper);
        }
    }

    // --- Modal System ---
    function showModal(title, message, callback) {
        modalTitle.textContent = title;
        modalBody.innerHTML = message; // Allow HTML for colors/bold
        modalOverlay.classList.remove('hidden');
        onModalClose = callback;
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        if (onModalClose) {
            const cb = onModalClose;
            onModalClose = null;
            cb();
        }
    }

    // --- Core Interaction ---

    function handlePlateClick(plateId) {
        if (state.isProcessingResult) return; 
        // Block clicks if modal is open (extra safety)
        if (!modalOverlay.classList.contains('hidden')) return;

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
            showModal("알림", "이미 칩이 있는 접시입니다.<br>비어있는 접시를 선택하세요.");
            return;
        }

        const amount = state.setupRound;
        plate.count = amount;
        state.setupChips[state.currentTurn] -= amount;

        // Turn Management
        if (state.currentTurn === 'A') {
            state.currentTurn = 'B';
        } else {
            state.currentTurn = 'A';
            state.setupRound++;
            
            if (state.setupRound > SETUP_ROUNDS) {
                state.phase = 'PLAY'; // Transition phase locally to update text
                updateUI();
                showModal("준비 완료", "모든 칩 배치가 끝났습니다!<br>이제 <b>'기억의 저녁식사'</b>를 시작합니다.<br><br>숫자가 같으면 토큰을 넣을 접시를 선택하세요!", () => {
                    startPlayPhase();
                });
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
            stopTimer(); 
            setTimeout(checkMatchResult, 800); 
        }
    }

    function checkMatchResult() {
        const [idx1, idx2] = state.selectedPlates;
        const val1 = state.plates[idx1].count;
        const val2 = state.plates[idx2].count;
        const player = state.currentTurn;
        
        if (val1 === val2) {
            // SUCCESS
            state.phase = 'MATCH_DECISION';
            state.matchedPlates = [idx1, idx2];
            state.isProcessingResult = false; 
            
            showModal("기억 일치!", 
                `<span style="color:var(--gold); font-size:1.5em; font-weight:bold;">Success!</span><br>
                숫자가 일치합니다. (개수: ${val1})<br>
                토큰을 추가할 접시를 하나 선택하세요.`, null);
            updateUI(); 
        } else {
            // FAILURE
            showModal("기억 불일치", 
                `숫자가 다릅니다. (${val1} vs ${val2})<br>
                <span style="color:${player === 'A' ? '#ff4444' : '#44ff44'}">${player}</span>는 벌칙 토큰을 받습니다.`, 
                () => {
                    state.gameTokens[player]++; 
                    
                    // Defeat Condition Check
                    if (state.gameTokens[player] >= MAX_GAME_TOKENS) {
                        endGame(player === 'A' ? 'B' : 'A', 'LOSE_LIMIT'); // Opponent wins
                    } else {
                        finalizeTurn();
                    }
                }
            );
        }
    }

    function handleMatchDecisionClick(index) {
        if (!state.matchedPlates.includes(index)) {
            showModal("주의", "일치하는 접시 중 하나를 선택해야 합니다!");
            return;
        }

        const player = state.currentTurn;
        state.gameTokens[player]--; 
        state.plates[index].count += 1; 

        if (state.gameTokens[player] <= 0) {
            endGame(player, 'WIN_ZERO');
            return;
        }
        
        showModal("토큰 제거", 
            `${player}의 토큰이 하나 줄었습니다.<br>접시 ${index + 1}번에 토큰이 추가되었습니다.`, 
            () => finalizeTurn()
        );
    }

    function finalizeTurn() {
        const [idx1, idx2] = state.selectedPlates;
        if (idx1 !== undefined) state.plates[idx1].isTemporaryOpen = false;
        if (idx2 !== undefined) state.plates[idx2].isTemporaryOpen = false;
        
        state.selectedPlates = [];
        state.matchedPlates = [];
        state.isProcessingResult = false;
        state.phase = 'PLAY';

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
                showModal("시간 초과", "제한시간이 지났습니다!<br>벌칙 토큰을 받습니다.", () => {
                    state.gameTokens[state.currentTurn]++;
                    
                    if (state.gameTokens[state.currentTurn] >= MAX_GAME_TOKENS) {
                        endGame(state.currentTurn === 'A' ? 'B' : 'A', 'LOSE_LIMIT');
                    } else {
                        finalizeTurn();
                    }
                });
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
    }

    function endGame(winner, reason) {
        stopTimer();
        state.phase = 'GAME_OVER';
        
        let message = "";
        if (reason === 'WIN_ZERO') {
            message = "모든 토큰을 제거했습니다!<br>완벽한 기억력입니다!";
        } else {
            const loser = winner === 'A' ? 'B' : 'A';
            message = `${loser}의 토큰이 ${MAX_GAME_TOKENS}개가 되었습니다.<br>토큰 과부하로 패배했습니다!`;
        }

        showModal("게임 종료!", 
            `<span style="font-size:2em; color:var(--gold);">Player ${winner} WIN!</span><br>
            ${message}`, null);
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

        // Center Status Logic
        let turnText = `PLAYER <span style="color:${state.currentTurn === 'A' ? '#ff4444' : '#44ff44'}">${state.currentTurn}</span>`;
        if (state.phase === 'SETUP') {
           // SETUP
           scoreAEl.textContent = state.setupChips.A;
           scoreBEl.textContent = state.setupChips.B;
           statusEl.innerHTML = `
                <div class="status-turn">${turnText}</div>
                <div class="status-main">${state.setupRound}개</div>
                <div class="status-sub">숨길 접시를<br>선택하세요</div>
           `;
        } else if (state.phase === 'PLAY') {
            scoreAEl.textContent = state.gameTokens.A;
            scoreBEl.textContent = state.gameTokens.B;
            // Play Timer
            const timerColor = state.timer < 10 ? '#ff4444' : 'var(--gold)';
            statusEl.innerHTML = `
                <div class="status-turn">${turnText}</div>
                <div class="status-main" style="color:${timerColor}">${state.timer}</div>
                <div class="status-sub">남은 시간</div>
            `;
        } else if (state.phase === 'MATCH_DECISION') {
             scoreAEl.textContent = state.gameTokens.A;
             scoreBEl.textContent = state.gameTokens.B;
             statusEl.innerHTML = `
                <div class="status-turn">${turnText}</div>
                <div class="status-main" style="font-size:1.5rem">CHOICE</div>
                <div class="status-sub" style="color:yellow">토큰을 넣을 접시를<br>선택하세요</div>
             `;
        }

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

        plateEl.classList.remove('selectable-match');

        if (state.phase === 'SETUP') {
           if (plateData.count > 0) plateEl.classList.add('closed');
        } else {
            if (plateData.isTemporaryOpen) {
                plateEl.classList.add('open');
                plateEl.classList.remove('closed');
                contentEl.style.display = 'block';
                contentEl.textContent = plateData.count;
                lidEl.style.display = 'none';

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
});
