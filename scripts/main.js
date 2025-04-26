document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const passwordOutput = document.getElementById('password-output');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const visibilityBtn = document.getElementById('visibility-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const lengthSlider = document.getElementById('length-slider');
    const lengthValue = document.getElementById('length-value');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const lowercaseCheckbox = document.getElementById('lowercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    const avoidSimilarCheckbox = document.getElementById('avoid-similar');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strength-text');
    const passwordHistory = document.getElementById('password-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const modal = document.getElementById('clear-history-modal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');

    // Character sets
    const characterSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '@#$%^&*',
        similar: '1l0O'
    };
    
    // Password history array
    let history = JSON.parse(localStorage.getItem('passwordHistory')) || [];
    
    // Initialize
    updateHistoryDisplay();
    loadSettings();
    generatePassword();
    
    // Event Listeners
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyToClipboard);
    visibilityBtn.addEventListener('click', toggleVisibility);
    regenerateBtn.addEventListener('click', generatePassword);
    lengthSlider.addEventListener('input', updateLengthValue);
    clearHistoryBtn.addEventListener('click', showClearHistoryModal);
    confirmClearBtn.addEventListener('click', confirmClearHistory);
    cancelClearBtn.addEventListener('click', hideClearHistoryModal);

    // History list click event
    passwordHistory.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            passwordOutput.value = e.target.textContent.split(' ')[0];
            updateStrengthMeter(passwordOutput.value);
            showNotification('Password copied from history', 'info');
            speak('Password copied from history');
        }
    });
    
    // Modal functions
    function showClearHistoryModal() {
        modal.classList.add('show');
    }

    function hideClearHistoryModal() {
        modal.classList.remove('show');
    }

    function confirmClearHistory() {
        history = [];
        localStorage.removeItem('passwordHistory');
        updateHistoryDisplay();
        showNotification('Password history cleared', 'success');
        speak('Password history cleared');
        
        // Visual feedback
        clearHistoryBtn.innerHTML = '<span class="icon">✓</span> CLEARED';
        setTimeout(() => {
            clearHistoryBtn.innerHTML = '<span class="icon">🗑️</span> CLEAR';
        }, 2000);
        
        hideClearHistoryModal();
    }
    
    // Notification function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const notificationContainer = document.getElementById('notification-container');
        notificationContainer.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Functions
    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        const options = getSelectedOptions();
        
        if (options.length === 0) {
            showNotification('Please select at least one character type', 'error');
            return;
        }
        
        let password = '';
        let availableChars = getAvailableCharacters(options);
        
        // Ensure at least one character from each selected set
        for (let option of options) {
            const chars = getCharactersForOption(option);
            password += getRandomChar(chars);
        }
        
        // Fill the rest of the password
        for (let i = password.length; i < length; i++) {
            password += getRandomChar(availableChars);
        }
        
        // Shuffle the password to mix the characters
        password = shuffleString(password);
        
        passwordOutput.value = password;
        updateStrengthMeter(password);
        addToHistory(password);
        saveSettings();
        showNotification('New password generated', 'success');
    }
    
    function getSelectedOptions() {
        const options = [];
        if (uppercaseCheckbox.checked) options.push('uppercase');
        if (lowercaseCheckbox.checked) options.push('lowercase');
        if (numbersCheckbox.checked) options.push('numbers');
        if (symbolsCheckbox.checked) options.push('symbols');
        return options;
    }
    
    function getAvailableCharacters(options) {
        let chars = '';
        for (let option of options) {
            chars += getCharactersForOption(option);
        }
        
        if (avoidSimilarCheckbox.checked) {
            chars = removeSimilarCharacters(chars);
        }
        
        return chars;
    }
    
    function getCharactersForOption(option) {
        switch(option) {
            case 'uppercase': return characterSets.uppercase;
            case 'lowercase': return characterSets.lowercase;
            case 'numbers': return characterSets.numbers;
            case 'symbols': return characterSets.symbols;
            default: return '';
        }
    }
    
    function removeSimilarCharacters(chars) {
        return chars.split('').filter(c => !characterSets.similar.includes(c)).join('');
    }
    
    function getRandomChar(charSet) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        return charSet[randomIndex];
    }
    
    function shuffleString(str) {
        const array = str.split('');
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array.join('');
    }
    
    function updateStrengthMeter(password) {
        const strength = calculatePasswordStrength(password);
        const strengthPercentage = Math.min(100, Math.max(0, strength.score * 25));
        
        // Update the strength bar
        strengthBar.style.setProperty('--strength-percentage', `${strengthPercentage}%`);
        
        // Update the strength text
        let strengthLevel = 'WEAK';
        let strengthColor = 'var(--danger)';
        
        if (strength.score >= 3) {
            strengthLevel = 'MEDIUM';
            strengthColor = 'var(--warning)';
        }
        if (strength.score >= 5) {
            strengthLevel = 'STRONG';
            strengthColor = 'var(--success)';
        }
        if (strength.score >= 7) {
            strengthLevel = 'VERY STRONG';
            strengthColor = 'var(--primary)';
        }
        
        strengthText.textContent = strengthLevel;
        strengthText.style.color = strengthColor;
        
        // Animation for strength bar
        strengthBar.style.transition = 'none';
        strengthBar.style.transform = 'scaleX(0)';
        setTimeout(() => {
            strengthBar.style.transition = 'transform 0.5s ease';
            strengthBar.style.transform = `scaleX(${strengthPercentage / 100})`;
        }, 10);
    }
    
    function calculatePasswordStrength(password) {
        let score = 0;
        const analysis = {
            length: password.length,
            hasUpper: false,
            hasLower: false,
            hasNumber: false,
            hasSymbol: false,
            uniqueChars: new Set(password).size
        };
        
        // Check for character types
        for (const char of password) {
            if (characterSets.uppercase.includes(char)) analysis.hasUpper = true;
            else if (characterSets.lowercase.includes(char)) analysis.hasLower = true;
            else if (characterSets.numbers.includes(char)) analysis.hasNumber = true;
            else if (characterSets.symbols.includes(char)) analysis.hasSymbol = true;
        }
        
        // Length score
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        // Character type diversity
        if (analysis.hasUpper) score += 1;
        if (analysis.hasLower) score += 1;
        if (analysis.hasNumber) score += 1;
        if (analysis.hasSymbol) score += 1;
        
        // Uniqueness
        const uniquenessRatio = analysis.uniqueChars / password.length;
        if (uniquenessRatio > 0.7) score += 1;
        if (uniquenessRatio > 0.9) score += 1;
        
        return { score, analysis };
    }
    
    function clearHistory() {
        showClearHistoryModal();
    }
    
    function updateHistoryDisplay() {
        passwordHistory.innerHTML = '';
        
        if (history.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'No history yet';
            emptyMessage.style.opacity = '0.7';
            emptyMessage.style.fontStyle = 'italic';
            passwordHistory.appendChild(emptyMessage);
            return;
        }
        
        history.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.password} (${formatDate(item.timestamp)})`;
            passwordHistory.appendChild(li);
        });
    }
    
    function copyToClipboard() {
        if (!passwordOutput.value) return;
        
        passwordOutput.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="icon">✓</span>';
        showNotification('Password copied to clipboard', 'success');
        speak('Password copied to clipboard');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }
    
    function toggleVisibility() {
        const type = passwordOutput.type === 'password' ? 'text' : 'password';
        passwordOutput.type = type;
        visibilityBtn.innerHTML = type === 'password' ? '<span class="icon">👁️</span>' : '<span class="icon">🔒</span>';
    }
    
    function updateLengthValue() {
        lengthValue.textContent = lengthSlider.value;
    }
    
    function addToHistory(password) {
        // Add to beginning of array
        history.unshift({
            password,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 5 items
        history = history.slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem('passwordHistory', JSON.stringify(history));
        
        // Update display
        updateHistoryDisplay();
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function saveSettings() {
        const settings = {
            length: lengthSlider.value,
            uppercase: uppercaseCheckbox.checked,
            lowercase: lowercaseCheckbox.checked,
            numbers: numbersCheckbox.checked,
            symbols: symbolsCheckbox.checked,
            avoidSimilar: avoidSimilarCheckbox.checked
        };
        
        localStorage.setItem('passwordGeneratorSettings', JSON.stringify(settings));
    }
    
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('passwordGeneratorSettings'));
        
        if (settings) {
            lengthSlider.value = settings.length;
            lengthValue.textContent = settings.length;
            uppercaseCheckbox.checked = settings.uppercase;
            lowercaseCheckbox.checked = settings.lowercase;
            numbersCheckbox.checked = settings.numbers;
            symbolsCheckbox.checked = settings.symbols;
            avoidSimilarCheckbox.checked = settings.avoidSimilar;
        }
    }
    
    function showError(message) {
        showNotification(message, 'error');
    }
    
    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 1.2;
            speechSynthesis.speak(utterance);
        }
    }
    
    // Initialize particles.js
    particlesJS.load('particles-js', 'scripts/particles.json', function() {
        console.log('Particles.js loaded');
    });
});
