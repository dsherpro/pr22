document.addEventListener('DOMContentLoaded', () => {
    // === MOCK TELEGRAM API FOR DESKTOP TESTING ===
    if (!window.Telegram?.WebApp?.initData) {
        window.Telegram = { WebApp: {
            initDataUnsafe: { user: { id: 12345, first_name: 'Tester' } },
            ready: () => {}, expand: () => {}, showAlert: (m) => alert(m),
            HapticFeedback: { notificationOccurred: (t) => console.log(`Haptic: ${t}`), impactOccurred: (s) => console.log(`Impact: ${s}`) },
            sendData: (data) => console.log(`Data sent to bot: ${data}`),
        }};
    }
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // === GAME CONFIGURATION ===
    const config = {
        minBet: 10, dailyBonus: 100, minWithdrawal: 500, winRateChance: 0.486,
        payouts: { red: 2, black: 2, green: 14 }, boxMultipliers: [1.2, 1.5, 2.0], maxMultiplier: 10.0,
        wheelSegments: ['G', 'B', 'R', 'B', 'R', 'B', 'R'], segmentWidth: 40,
    };

    // === DOM ELEMENTS CACHE ===
    const elements = {
        app: document.querySelector('.app'), loader: document.getElementById('loader'),
        balance: document.getElementById('balance-amount'), username: document.getElementById('username'), userId: document.getElementById('user-id'),
        resultMessage: document.getElementById('result-message'), multiplier: document.getElementById('multiplier'),
        betAmountInput: document.getElementById('bet-amount'), withdrawAmountInput: document.getElementById('withdraw-amount'),
        spinButton: document.getElementById('spin-button'), openBoxButton: document.getElementById('open-box-button'),
        withdrawButton: document.getElementById('withdraw-button'), resetProgressButton: document.getElementById('reset-progress-button'),
        luckBox: document.getElementById('luck-box'), wheel: document.getElementById('wheel'),
        navButtons: document.querySelectorAll('.nav-btn'), tabContents: document.querySelectorAll('.tab-content'), betButtons: document.querySelectorAll('.bet-btn'),
        bonusModal: document.getElementById('bonus-modal'), claimBonusButton: document.getElementById('claim-bonus-button'),
    };
    
    // === GAME STATE ===
    let state = { isSpinning: false, currentBetType: null, };
    let playerData = { balance: 0, multiplier: 1.0, lastBonusTime: 0 };

    // === CORE FUNCTIONS ===
    const savePlayerData = () => { try { localStorage.setItem('casinoPlayerData', JSON.stringify(playerData)); } catch (e) { console.error("Failed to save data:", e); } };
    const loadPlayerData = () => {
        try {
            const savedData = localStorage.getItem('casinoPlayerData');
            if (savedData) { playerData = JSON.parse(savedData); }
            else { playerData.balance = 200; /* Starting balance for new players */ }
        } catch (e) {
            console.error("Failed to load data:", e);
            playerData = { balance: 200, multiplier: 1.0, lastBonusTime: 0 };
        }
    };
    const updateBalanceDisplay = () => { elements.balance.textContent = Math.floor(playerData.balance); elements.balance.parentElement.classList.remove('balance-changed'); void elements.balance.parentElement.offsetWidth; elements.balance.parentElement.classList.add('balance-changed'); };
    const updateMultiplierDisplay = () => { elements.multiplier.textContent = `x${playerData.multiplier.toFixed(1)}`; };
    const disableControls = (disabled) => { Object.values(elements).filter(el => el.tagName === 'BUTTON').forEach(b => b.disabled = disabled); elements.betAmountInput.disabled = disabled; state.isSpinning = disabled; };

    // === GAME LOGIC ===
    function spin() { /* ... full spin logic ... */ } // Logic remains the same, but uses playerData.balance etc.
    function openBox() { /* ... full open box logic ... */ } // Logic remains the same
    
    // Daily Bonus Logic
    function handleDailyBonus() {
        const now = new Date().setHours(0, 0, 0, 0);
        const lastBonus = new Date(playerData.lastBonusTime).setHours(0, 0, 0, 0);
        if (now > lastBonus) {
            elements.bonusModal.classList.add('active');
        }
    }
    
    // --- Full Spin Logic (adapted for playerData) ---
    function spin() {
        const amount = parseInt(elements.betAmountInput.value, 10);
        if (!state.currentBetType) { return tg.showAlert("Сначала выберите цвет!"); }
        if (isNaN(amount) || amount < config.minBet) { return tg.showAlert(`Минимальная ставка: ${config.minBet} ★`); }
        if (amount > playerData.balance) { return tg.showAlert("Недостаточно средств!"); }
        disableControls(true);
        tg.HapticFeedback.impactOccurred('light');
        playerData.balance -= amount; updateBalanceDisplay();
        elements.resultMessage.textContent = `Ставка ${amount} ★ на ${state.currentBetType}`;

        let winningColor; // ... (calculation logic is the same)
        const isPlayerWinner = Math.random() < config.winRateChance;
        if (state.currentBetType !== 'green' && isPlayerWinner) { winningColor = state.currentBetType; } 
        else { const otherColors = ['red', 'black', 'green'].filter(c => c !== state.currentBetType); const randomIndex = Math.floor(Math.random() * config.wheelSegments.length); let randomColor = config.wheelSegments[randomIndex].toLowerCase().replace('b', 'black').replace('r', 'red').replace('g', 'green'); winningColor = (randomColor === state.currentBetType) ? otherColors[Math.floor(Math.random() * otherColors.length)] : randomColor; }
        const possibleIndexes = config.wheelSegments.map((s, i) => s.toLowerCase().replace('b', 'black').replace('r', 'red').replace('g', 'green') === winningColor ? i : -1).filter(i => i !== -1); const targetIndex = possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)];
        const landingPosition = (5 * config.wheelSegments.length + targetIndex) * config.segmentWidth + (Math.random() - 0.5) * (config.segmentWidth * 0.8);
        elements.wheel.style.transition = 'none';
        elements.wheel.style.backgroundPosition = `${(Math.random() * -280)}px`;
        setTimeout(() => { elements.wheel.style.transition = 'background-position 5s cubic-bezier(0.1, 0.7, 0.25, 1)'; elements.wheel.style.backgroundPosition = `-${landingPosition}px`; }, 50);

        setTimeout(() => {
            if (winningColor === state.currentBetType) {
                const winnings = amount * config.payouts[winningColor] * playerData.multiplier;
                playerData.balance += winnings;
                elements.resultMessage.textContent = `Победа! +${Math.floor(winnings)} ★`;
                playerData.multiplier = 1.0;
                tg.HapticFeedback.notificationOccurred('success');
            } else { elements.resultMessage.textContent = `Проигрыш. Выпал ${winningColor}`; tg.HapticFeedback.notificationOccurred('error'); }
            updateBalanceDisplay(); updateMultiplierDisplay(); savePlayerData(); disableControls(false);
            elements.betButtons.forEach(b => b.classList.remove('selected'));
            state.currentBetType = null;
        }, 5100);
    }
    
    // === INITIALIZATION ===
    function init() {
        loadPlayerData();
        // Setup User Info
        if (tg.initDataUnsafe?.user) { elements.username.textContent = tg.initDataUnsafe.user.first_name; elements.userId.textContent = `ID: ${tg.initDataUnsafe.user.id}`; }
        // Display initial data
        updateBalanceDisplay();
        updateMultiplierDisplay();
        
        handleDailyBonus();

        // Event Listeners
        elements.navButtons.forEach(b => b.addEventListener('click', () => {
            elements.navButtons.forEach(btn => btn.classList.remove('active')); b.classList.add('active');
            elements.tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(b.dataset.tab).classList.add('active');
        }));
        elements.betButtons.forEach(b => b.addEventListener('click', () => {
            elements.betButtons.forEach(btn => btn.classList.remove('selected')); b.classList.add('selected');
            state.currentBetType = b.dataset.bet;
        }));
        elements.spinButton.addEventListener('click', spin);
        // Bind other actions...
        elements.openBoxButton.addEventListener('click', () => {
            if (playerData.balance < config.boxCost) return tg.showAlert(`Нужно ${config.boxCost} ★`);
            if (config.boxCost > 0) { playerData.balance -= config.boxCost; updateBalanceDisplay(); }
            playerData.multiplier = Math.min(config.maxMultiplier, playerData.multiplier * config.boxMultipliers[Math.floor(Math.random() * config.boxMultipliers.length)]);
            tg.showAlert(`Ваш новый множитель: x${playerData.multiplier.toFixed(1)}`);
            updateMultiplierDisplay(); savePlayerData();
        });
        elements.withdrawButton.addEventListener('click', () => {
             const amount = parseInt(elements.withdrawAmountInput.value, 10);
             if (isNaN(amount) || amount < config.minWithdrawal) { return tg.showAlert(`Минимальная сумма: ${config.minWithdrawal} ★`); }
             if (amount > playerData.balance) { return tg.showAlert('Недостаточно средств!'); }
             tg.sendData(JSON.stringify({ type: 'withdraw_request', amount: amount }));
             playerData.balance -= amount; updateBalanceDisplay(); savePlayerData();
        });
        elements.claimBonusButton.addEventListener('click', () => {
            playerData.balance += config.dailyBonus; playerData.lastBonusTime = Date.now();
            updateBalanceDisplay(); savePlayerData();
            elements.bonusModal.classList.remove('active');
            tg.HapticFeedback.notificationOccurred('success');
        });
        elements.resetProgressButton.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие необратимо.')) {
                localStorage.removeItem('casinoPlayerData');
                window.location.reload();
            }
        });

        // Show the app
        setTimeout(() => {
            elements.loader.classList.add('hidden');
            elements.app.classList.add('loaded');
        }, 500);
    }
    
    init();
});
