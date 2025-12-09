// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// DOM Elements
const prayerDisplay = document.getElementById('prayerDisplay');
const prayerTitle = document.getElementById('prayerTitle');
const arabicText = document.getElementById('arabicText');
const prayerText = document.getElementById('prayerText');
const translationText = document.getElementById('translationText');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const voiceBtn = document.getElementById('voiceBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const categoryBtns = document.querySelectorAll('.category-btn');
const customPrayerSection = document.getElementById('customPrayerSection');
const generateCustomBtn = document.getElementById('generateCustomBtn');
const favoritesList = document.getElementById('favoritesList');
const notification = document.getElementById('notification');

// Current prayer state
let currentPrayer = {};
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Initialize with a random prayer
function init() {
    const categories = Object.keys(prayers);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryPrayers = prayers[randomCategory];
    const randomPrayer = categoryPrayers[Math.floor(Math.random() * categoryPrayers.length)];
    displayPrayer(randomPrayer);
    updateFavoritesList();
}

// Display prayer function
function displayPrayer(prayer) {
    currentPrayer = prayer;
    prayerTitle.textContent = prayer.title;
    arabicText.textContent = prayer.arabic;
    prayerText.textContent = prayer.text;
    translationText.textContent = prayer.translation;
    
    // Update favorite button
    const isFavorite = favorites.some(fav => fav.id === prayer.id);
    updateFavoriteButton(isFavorite);
}

// Update favorite button
function updateFavoriteButton(isFavorite) {
    const icon = favoriteBtn.querySelector('i');
    if (isFavorite) {
        icon.className = 'fas fa-heart';
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Ondoa kwenye Favorite';
    } else {
        icon.className = 'far fa-heart';
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Weka kwa Favorite';
    }
}

// Copy prayer to clipboard
copyBtn.addEventListener('click', async () => {
    const prayerContent = `
${prayerTitle.textContent}

${arabicText.textContent}

${prayerText.textContent}

${translationText.textContent}
    `.trim();
    
    try {
        await navigator.clipboard.writeText(prayerContent);
        showNotification('Maombi yamenakiliwa kwenye clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Imeshindikana kukanakili, jaribu tena!');
    }
});

// Share prayer
shareBtn.addEventListener('click', async () => {
    const shareData = {
        title: prayerTitle.textContent,
        text: `${prayerText.textContent}\n\n${translationText.textContent}`,
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.text);
            showNotification('Maombi yamenakiliwa, sasa shiriki!');
        }
    } catch (err) {
        console.error('Share failed:', err);
    }
});

// Text-to-speech
voiceBtn.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance();
        speech.text = `${prayerText.textContent}. ${translationText.textContent}`;
        speech.lang = 'sw-KE';
        speech.rate = 0.9;
        speech.pitch = 1;
        speechSynthesis.speak(speech);
    } else {
        showNotification('Sauti haitumiki kwenye kivinjari chako');
    }
});

// Toggle favorite
favoriteBtn.addEventListener('click', () => {
    const isFavorite = favorites.some(fav => fav.id === currentPrayer.id);
    
    if (isFavorite) {
        favorites = favorites.filter(fav => fav.id !== currentPrayer.id);
        showNotification('Maombi yameondolewa kwenye favorite');
    } else {
        favorites.push(currentPrayer);
        showNotification('Maombi yameongezwa kwenye favorite');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton(!isFavorite);
    updateFavoritesList();
});

// Category buttons
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        
        if (category === 'custom') {
            customPrayerSection.style.display = 'block';
            return;
        }
        
        customPrayerSection.style.display = 'none';
        
        if (prayers[category]) {
            const categoryPrayers = prayers[category];
            const randomPrayer = categoryPrayers[Math.floor(Math.random() * categoryPrayers.length)];
            displayPrayer(randomPrayer);
        }
    });
});

// Generate custom prayer
generateCustomBtn.addEventListener('click', () => {
    const topic = document.getElementById('prayerTopic').value.trim();
    const details = document.getElementById('prayerDetails').value.trim();
    const style = document.getElementById('prayerStyle').value;
    
    if (!topic || !details) {
        showNotification('Tafadhali jaza mada na maelezo ya maombi');
        return;
    }
    
    const customPrayer = generateCustomPrayer(topic, details, style);
    displayPrayer(customPrayer);
    showNotification('Maombi yako yameundwa kikamilifu!');
});

// Generate custom prayer function
function generateCustomPrayer(topic, details, style) {
    const styles = {
        formal: `Ee Mungu wangu, katika mada ya ${topic}, nakuomba kwa dhati: ${details}. Ameni.`,
        personal: `Baba Mpendwa, unajua kuhusu ${topic}. Nawasilisha kwako: "${details}". Nimetegemea wewe.`,
        poetic: `Kwa jina la Mungu Mwenye Huruma,\nKuhusu ${topic} naomba rehema,\n${details},\nNa milele ni takataka.`,
        traditional: `Subhanallah, kwa ${topic} tunaomba,\n${details},\nMola wangu tumaini langu wewe tu.`
    };
    
    return {
        id: `custom_${Date.now()}`,
        title: `Maombi ya ${topic}`,
        arabic: 'دُعَاءُ الْقَلْبِ',
        text: styles[style] || styles.formal,
        translation: `Maombi ya kibinafsi kuhusu ${topic}`,
        category: 'custom'
    };
}

// Update favorites list
function updateFavoritesList() {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-favorites">Hakuna maombi ya favorite bado.</p>';
        return;
    }
    
    favorites.forEach((prayer, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        
        favoriteItem.innerHTML = `
            <div class="favorite-text">
                <strong>${prayer.title}</strong>
                <p>${prayer.text.substring(0, 100)}...</p>
            </div>
            <button class="remove-favorite" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        favoriteItem.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                displayPrayer(prayer);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        favoritesList.appendChild(favoriteItem);
    });
    
    // Add remove event listeners
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesList();
            showNotification('Maombi yameondolewa kwenye favorite');
        });
    });
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Online image fetching for background (optional)
function fetchPrayerImages() {
    // You can add image fetching functionality here
    // Example using Unsplash API (requires API key)
    // const imageUrl = `https://source.unsplash.com/featured/?prayer,islam`;
    // document.body.style.backgroundImage = `url(${imageUrl})`;
}

// Initialize app
window.addEventListener('DOMContentLoaded', init);