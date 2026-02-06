document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const TOTAL_PLATES = 20;
    const TOTAL_ROUNDS = 9; // 1 to 9 chips
    
    // --- Game State ---
    let state = {
        phase: 'SETUP', // 'SETUP' or 'PLAY'
        round: 1,       // Current chip count (1 to 9)
        currentTurn: 'A', // 'A' or 'B'
        scores: { A: 45, B: 45 }, // Chips remaining to place
        plates: Array(20).fill(null).map((_, i) => ({
            id: i + 1,
            chips: 0,
            owner: null,
            isOpen: true
        }))
    };

    // --- DOM Elements ---
    const plateCircle = document.getElementById('plate-circle');
    const statusEl = document.getElementById('game-status');
    const scoreAEl = document.getElementById('score-a');
    const scoreBEl = document.getElementById('score-b');
    const areaA = document.querySelector('.player-a');
    const areaB = document.querySelector('.player-b');

    // --- initialization ---
    initBoard();
    updateUI();

    function initBoard() {
        plateCircle.innerHTML = '';
        const radius = 250;
        const angleStep = 360 / TOTAL_PLATES;

        for (let i = 1; i <= TOTAL_PLATES; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'plate-wrapper';
            
            // Positioning 0 at top (-90deg)
            // Adjust so Plate 1 is slightly to the right
            const simpleAngle = (i * angleStep) - (angleStep / 2);
            const cssAngle = simpleAngle - 90;

            const x = Math.cos(cssAngle * Math.PI / 180) * radius;
            const y = Math.sin(cssAngle * Math.PI / 180) * radius;

            wrapper.style.transform = `translate(${x}px, ${y}px)`;

            const plate = document.createElement('div');
            plate.className = 'plate';
            plate.id = `plate-${i}`;
            plate.innerHTML = `<span class="plate-number">${i}</span>`;
            
            plate.addEventListener('click', () => handlePlateClick(i));
            wrapper.appendChild(plate);
            plateCircle.appendChild(wrapper);
        }
    }

    // --- Core Logic ---

    function handlePlateClick(plateId) {
        if (state.phase !== 'SETUP') return;

        const plateIndex = plateId - 1;
        const plateData = state.plates[plateIndex];

        // Validation: Must be an empty plate
        if (plateData.chips > 0) {
            alert("이미 칩이 있는 접시입니다! 비어있는 접시를 선택하세요.");
            return;
        }

        // Logic: Place chips
        const chipsToPlace = state.round;
        const currentPlayer = state.currentTurn;

        // Update State
        state.plates[plateIndex].chips = chipsToPlace;
        state.plates[plateIndex].owner = currentPlayer;
        state.plates[plateIndex].isOpen = false; // Close it immediately after placing
        state.scores[currentPlayer] -= chipsToPlace; // Deduct from pile

        // Visual Feedback
        animatePlacement(plateId, currentPlayer, chipsToPlace);
        updatePlateVisual(plateId);

        // Advance Turn
        advanceTurn();
        updateUI();
    }

    function advanceTurn() {
        // Sequence: A -> B -> Next Round A -> Next Round B ...
        if (state.currentTurn === 'A') {
            state.currentTurn = 'B';
        } else {
            // End of round for this number
            state.currentTurn = 'A';
            state.round++;
            
            if (state.round > TOTAL_ROUNDS) {
                state.phase = 'PLAY';
                // Trigger next phase logic here later
                alert("모든 칩 배치가 끝났습니다! 이제 게임이 시작됩니다. (다음 단계 구현 예정)");
            }
        }
    }

    // --- UI Updates ---

    function updateUI() {
        // Scores (Remaining Chips in Setup Phase)
        scoreAEl.textContent = state.scores.A;
        scoreBEl.textContent = state.scores.B;

        // Active Player Highlight
        if (state.currentTurn === 'A') {
            areaA.classList.add('active');
            areaB.classList.remove('active');
        } else {
            areaA.classList.remove('active');
            areaB.classList.add('active');
        }

        // Status Text
        if (state.phase === 'SETUP') {
            const playerColor = state.currentTurn === 'A' ? 'red' : 'green';
            const playerName = state.currentTurn === 'A' ? 'PLAYER A' : 'PLAYER B';
            statusEl.innerHTML = `
                <span style="color:${state.currentTurn === 'A' ? '#ff4444' : '#44ff44'}">${playerName}</span>의 차례<br>
                칩 <span style="font-size: 1.5em; color: yellow;">${state.round}</span>개를 숨길 접시를 선택하세요.
            `;
        } else {
            statusEl.textContent = "게임 시작! (규칙 대기 중)";
        }
    }

    function updatePlateVisual(plateId) {
        const plateIndex = plateId - 1;
        const plateData = state.plates[plateIndex];
        const plateEl = document.getElementById(`plate-${plateId}`);

        if (!plateData.isOpen) {
            plateEl.classList.add('closed');
            // Maybe animate lid closing
        }
    }

    function animatePlacement(plateId, player, amount) {
        // Simple console log for now, or subtle animation class
        console.log(`${player} placed ${amount} on plate ${plateId}`);
    }
});
