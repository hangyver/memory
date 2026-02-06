document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const TOTAL_PLATES = 20;
    const SETUP_ROUNDS = 9; 
    const START_GAME_TOKENS = 10;
    const MAX_GAME_TOKENS = 20; // Defeat condition
    const TURN_TIME_LIMIT = 60; 

    // --- Localization ---
    let currentLang = 'ko'; // 'ko' or 'en'
    
    const translations = {
        ko: {
            title: "기억의 저녁식사",
            turn_setup: "님의 차례",
            setup_action: "칩 {n}개 배치",
            chips_left_stat: "남은 칩: {n}",
            turn_play: "님의 차례",
            phase_setup: "준비 단계",
            phase_play: "게임 시작",
            setup_prompt: "접시를 선택하세요",
            play_prompt: "두 개의 접시를 선택하세요",
            decision_prompt: "매칭 성공! 토큰을 넣을 접시를 선택하세요.",
            chips_left: "남은 칩",
            tokens_left: "남은 토큰",
            time_left: "남은 시간",
            sec: "초",
            modal_notice: "알림",
            modal_confirm: "확인",
            tutorial_btn: "게임 방법",
            lang_btn: "ENGLISH",
            
            // Messages
            msg_setup_complete: "준비 단계 완료!",
            msg_setup_complete_desc: "이제 기억의 게임을 시작합니다.<br>각자 게임 토큰 10개를 받습니다.<br><br><b>같은 개수의 칩이 들어있는<br>접시 2개를 선택하세요!</b>",
            msg_match_success: "기억 일치!",
            msg_match_success_desc: "숫자가 일치합니다! ({val})<br>토큰을 넣을 접시를 선택해주세요.",
            msg_match_fail: "기억 불일치",
            msg_match_fail_desc: "숫자가 다릅니다. ({val1} vs {val2})<br><span style='color:{color}'>{player}</span>는 벌칙 토큰을 받습니다.",
            msg_token_removed: "토큰 제거",
            msg_token_removed_desc: "접시에 토큰을 추가했습니다.<br>(칩 개수 증가: {val} -> {newVal})",
            msg_timeout: "시간 초과",
            msg_timeout_desc: "제한시간이 지났습니다!<br>벌칙 토큰을 받습니다.",
            msg_game_over: "게임 종료!",
            msg_win_zero: "모든 토큰을 제거했습니다!<br>완벽한 기억력입니다!",
            msg_lose_limit: "{loser}의 토큰이 {max}개가 되었습니다.<br>토큰 과부하로 패배했습니다!",
            msg_winner: "Player {winner} WIN!",
            msg_plate_full: "이미 칩이 있는 접시입니다!<br>비어있는 접시를 선택하세요.",
            msg_select_matched: "일치하는 접시 중 하나를 선택해야 합니다!",
            
            // Tutorial
            tut_title_1: "1단계: 칩 숨기기",
            tut_text_1: "처음에 1개, 그 다음 2개, 3개... 마지막에 9개까지.<br>두 플레이어가 교대로 총 45개의 칩을 접시에 나누어 숨깁니다.",
            tut_title_2: "2단계: 게임 시작",
            tut_text_2: "모든 칩을 숨기고 나면, 각 플레이어는 <b>게임 토큰 10개</b>를 받습니다.<br>이제 기억의 저녁식사가 시작됩니다!",
            tut_title_3: "3단계: 매칭 성공",
            tut_text_3: "두 접시를 열어 숫자가 <b>같으면 성공!</b><br>선택한 두 접시 중 <b>원하는 한 곳</b>에 내 게임 토큰 1개를 넣습니다.<br>(내 토큰은 줄어들고, 접시 안의 칩은 늘어납니다)",
            tut_title_4: "4단계: 매칭 실패",
            tut_text_4: "두 접시의 숫자가 <b>다르면 실패!</b><br>패널티로 <b>게임 토큰 1개</b>를 추가로 받습니다.<br>(내 토큰이 늘어납니다 ㅠㅠ)",
            tut_title_5: "승리 조건",
            tut_text_5: "<b>승리(WIN):</b> 내 토큰을 모두 사용하여 <b>0개</b>가 되면 승리합니다!<br><b>패배(LOSE):</b> 토큰이 쌓여서 <b>20개</b>가 되면 패배합니다."
        },
        en: {
            title: "Dinner of Memory",
            turn_setup: "'s Turn",
            setup_action: "Hide {n}",
            chips_left_stat: "Left: {n}",
            turn_play: "'s Turn",
            phase_setup: "Setup Phase",
            phase_play: "Game Start",
            setup_prompt: "Select a plate",
            play_prompt: "Select two plates to match",
            decision_prompt: "Match! Select a plate to add your token.",
            chips_left: "Chips Left",
            tokens_left: "Tokens",
            time_left: "Time",
            sec: "s",
            modal_notice: "Notice",
            modal_confirm: "OK",
            tutorial_btn: "How to Play",
            lang_btn: "한국어",

            // Messages
            msg_setup_complete: "Setup Complete!",
            msg_setup_complete_desc: "The game begins now.<br>Each player receives 10 Game Tokens.<br><br><b>Select two plates with<br>the same number of chips!</b>",
            msg_match_success: "It's a Match!",
            msg_match_success_desc: "Numbers match! ({val})<br>Select a plate to place your token.",
            msg_match_fail: "Mismatch",
            msg_match_fail_desc: "Numbers differ. ({val1} vs {val2})<br><span style='color:{color}'>{player}</span> receives a penalty token.",
            msg_token_removed: "Token Placed",
            msg_token_removed_desc: "Token added to the plate.<br>(Count increased: {val} -> {newVal})",
            msg_timeout: "Time's Up!",
            msg_timeout_desc: "Time limit exceeded!<br>You receive a penalty token.",
            msg_game_over: "Game Over!",
            msg_win_zero: "All tokens removed!<br>Perfect memory!",
            msg_lose_limit: "{loser} reached {max} tokens.<br>Defeat by Overload!",
            msg_winner: "Player {winner} WINS!",
            msg_plate_full: "This plate is already full!<br>Please select an empty plate.",
            msg_select_matched: "You must select one of the matched plates!",

            // Tutorial
            tut_title_1: "Step 1: Hiding Chips",
            tut_text_1: "Players take turns hiding chips: starting with 1, then 2, up to 9.<br>A total of 45 chips will be hidden.",
            tut_title_2: "Step 2: Game Start",
            tut_text_2: "After hiding all chips, each player receives <b>10 Game Tokens</b>.<br>The Dinner of Memory begins!",
            tut_title_3: "Step 3: Matching Success",
            tut_text_3: "If numbers match, it's a <b>Success!</b><br>Place 1 Game Token into <b>one of the chosen plates</b>.<br>(Your tokens decrease, plate count increases)",
            tut_title_4: "Step 4: Matching Failure",
            tut_text_4: "If numbers differ, it's a <b>Failure!</b><br>You receive <b>1 Penalty Token</b>.<br>(Your token count increases)",
            tut_title_5: "Victory Condition",
            tut_text_5: "<b>WIN:</b> Reach <b>0</b> tokens.<br><b>LOSE:</b> Reach <b>20</b> tokens."
        }
    };

    function t(key) {
        return translations[currentLang][key] || key;
    }

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

    function updateLanguage() {
        // Button Texts
        tutorialBtn.textContent = t('tutorial_btn');
        langBtn.textContent = t('lang_btn');
        document.getElementById('modal-close-btn').textContent = t('modal_confirm');

        // Font Adjustment
        if (currentLang === 'en') {
            document.body.classList.add('font-en');
        } else {
            document.body.classList.remove('font-en');
        }

        updateUI(); // Refresh UI text
        // If tutorial is open, refresh it
        if (!document.getElementById('tutorial-overlay').classList.contains('hidden')) {
            renderTutorial();
        }
    }

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

    const langBtn = document.getElementById('lang-btn');
    const tutorialBtn = document.getElementById('tutorial-btn');
    
    // ... (other vars)

    // Language Toggle
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        updateLanguage();
    });

    // ... (rest of vars)
    
    // Tutorial Steps Data (Simplified, text loaded dynamically)
    const tutorialImages = [
        "tutorial_setup.png", "tutorial_start.png", "tutorial_match.png", "tutorial_fail.png", "tutorial_win.png"
    ];

    // ...
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialSlidesContainer = document.querySelector('.tutorial-slides');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const closeTutorialBtn = document.getElementById('close-tutorial-btn');
    const stepIndicator = document.getElementById('step-indicator');

    let currentTutorialStep = 0;
    // tutorialSteps removed in favor of dynamic translation lookups
    
    tutorialBtn.addEventListener('click', openTutorial);
    prevStepBtn.addEventListener('click', () => changeTutorialStep(-1));
    nextStepBtn.addEventListener('click', () => changeTutorialStep(1));
    closeTutorialBtn.addEventListener('click', closeTutorial);

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

            // Number Positioning (Radial Outward)
            // Calculate offset based on angle
            const numDist = 65; // Distance from plate center
            const numRad = cssAngle * Math.PI / 180;
            const numX = Math.cos(numRad) * numDist;
            const numY = Math.sin(numRad) * numDist;

            const plate = document.createElement('div');
            plate.className = 'plate';
            plate.id = `plate-${i}`;
            plate.innerHTML = `
                <span class="plate-lid-number" style="transform: translate(-50%, -50%) translate(${numX}px, ${numY}px);">${i}</span>
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
            showModal(t('modal_notice'), t('msg_plate_full'));
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
                showModal(t('msg_setup_complete'), t('msg_setup_complete_desc'), () => {
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
            
            showModal(t('msg_match_success'), 
                t('msg_match_success_desc').replace('{val}', val1),
                null);
            updateUI(); 
        } else {
            // FAILURE
            showModal(t('msg_match_fail'), 
                t('msg_match_fail_desc')
                    .replace('{val1}', val1)
                    .replace('{val2}', val2)
                    .replace('{color}', player === 'A' ? '#ff4444' : '#44ff44')
                    .replace('{player}', player), 
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
            showModal(t('modal_notice'), t('msg_select_matched'));
            return;
        }

        const player = state.currentTurn;
        state.gameTokens[player]--; 
        state.plates[index].count += 1; 

        if (state.gameTokens[player] <= 0) {
            endGame(player, 'WIN_ZERO');
            return;
        }
        
        showModal(t('msg_token_removed'), 
            t('msg_token_removed_desc')
                .replace('{val}', state.plates[index].count-1)
                .replace('{newVal}', state.plates[index].count),
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
                showModal(t('msg_timeout'), t('msg_timeout_desc'), () => {
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

    // --- Tutorial Functions ---
    function openTutorial() {
        currentTutorialStep = 0;
        renderTutorial();
        tutorialOverlay.classList.remove('hidden');
    }

    function closeTutorial() {
        tutorialOverlay.classList.add('hidden');
    }

    function renderTutorial() {
        tutorialSlidesContainer.innerHTML = '';
        
        // Dynamic loading based on language
        const titleKey = `tut_title_${currentTutorialStep+1}`;
        const textKey = `tut_text_${currentTutorialStep+1}`;
        const img = tutorialImages[currentTutorialStep];

        const slide = document.createElement('div');
        slide.className = 'tutorial-slide active';
        slide.innerHTML = `
            <img src="${img}" class="tutorial-img" alt="Step Image">
            <div class="tutorial-text">
                <h3>${t(titleKey)}</h3>
                <p>${t(textKey)}</p>
            </div>
        `;
        tutorialSlidesContainer.appendChild(slide);
        
        stepIndicator.textContent = `${currentTutorialStep + 1} / ${tutorialImages.length}`;

        // Button texts for tutorial
        prevStepBtn.textContent = t('modal_confirm') === 'OK' ? 'Prev' : '이전'; 
        // Simple heuristic or add keys for Prev/Next/Close if strict about translations
        // Let's add keys in next iteration or just handle simple toggle here if sloppy, but better to use map.
        // Actually I missed adding 'prev', 'next', 'close' to dictionary. 
        // I will just use simple ternary for now to save space or add them. 
        // Adding them to `translations` is cleaner.
        
        prevStepBtn.textContent = currentLang === 'en' ? 'Prev' : '이전';
        nextStepBtn.textContent = currentLang === 'en' ? 'Next' : '다음';
        closeTutorialBtn.textContent = currentLang === 'en' ? 'Close' : '닫기';

        // Button States

        // Button States
        prevStepBtn.style.display = currentTutorialStep === 0 ? 'none' : 'block';
        if (currentTutorialStep === tutorialImages.length - 1) {
            nextStepBtn.style.display = 'none';
            closeTutorialBtn.style.display = 'block';
        } else {
            nextStepBtn.style.display = 'block';
            closeTutorialBtn.style.display = 'none';
        }
    }

    function changeTutorialStep(direction) {
        currentTutorialStep += direction;
        if (currentTutorialStep < 0) currentTutorialStep = 0;
        if (currentTutorialStep >= tutorialImages.length) currentTutorialStep = tutorialImages.length - 1;
        renderTutorial();
    }

    function endGame(winner, reason) {
        stopTimer();
        state.phase = 'GAME_OVER';
        
        let message = "";
        if (reason === 'WIN_ZERO') {
            message = t('msg_win_zero');
        } else {
            const loser = winner === 'A' ? 'B' : 'A';
            message = t('msg_lose_limit').replace('{loser}', loser).replace('{max}', MAX_GAME_TOKENS);
        }

        showModal(t('msg_game_over'), 
            `<span style="font-size:2em; color:var(--gold);">${t('msg_winner').replace('{winner}', winner)}</span><br>
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
        if (state.phase === 'SETUP') {
           // SETUP
           scoreAEl.textContent = state.setupChips.A;
           scoreBEl.textContent = state.setupChips.B;
           statusEl.innerHTML = `
                <div class="status-turn"><span style="color:${state.currentTurn === 'A' ? '#ff4444' : '#44ff44'}">Player ${state.currentTurn}</span>${t('turn_setup')}</div>
                <div class="status-main" style="font-size: 2.5rem;">${t('setup_action').replace('{n}', state.setupRound)}</div>
                <div class="status-sub">${t('chips_left_stat').replace('{n}', state.setupChips[state.currentTurn])}<br>${t('setup_prompt')}</div>
           `;
        } else if (state.phase === 'PLAY') {
            scoreAEl.textContent = state.gameTokens.A;
            scoreBEl.textContent = state.gameTokens.B;
            // Play Timer
            const timerColor = state.timer < 10 ? '#ff4444' : 'var(--gold)';
            statusEl.innerHTML = `
                <div class="status-turn"><span style="color:${state.currentTurn === 'A' ? '#ff4444' : '#44ff44'}">Player ${state.currentTurn}</span>${t('turn_play')}</div>
                <div class="status-main" style="color:${timerColor}">${state.timer}</div>
                <div class="status-sub">${t('time_left')}</div>
            `;
        } else if (state.phase === 'MATCH_DECISION') {
             scoreAEl.textContent = state.gameTokens.A;
             scoreBEl.textContent = state.gameTokens.B;
             statusEl.innerHTML = `
                <div class="status-turn"><span style="color:${state.currentTurn === 'A' ? '#ff4444' : '#44ff44'}">Player ${state.currentTurn}</span>${t('turn_play')}</div>
                <div class="status-main" style="font-size:1.5rem">CHOICE</div>
                <div class="status-sub" style="color:yellow">${t('decision_prompt')}</div>
             `;
        }

        // Just to update modal title if open? No, modal is separate.
        // We might want to update persistent text if any.


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
