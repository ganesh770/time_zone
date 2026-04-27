const DateTime = luxon.DateTime;

// DOM Elements
const selectHome = document.getElementById('select-home');
const selectTarget = document.getElementById('select-target');
const timeSlider = document.getElementById('time-slider');
const sliderCurrentVal = document.getElementById('slider-current-val');
const timeHome = document.getElementById('time-home');
const timeTarget = document.getElementById('time-target');
const flagHome = document.getElementById('flag-home');
const flagTarget = document.getElementById('flag-target');
const statusBadge = document.getElementById('status-badge');
const bgActive = document.getElementById('bg-active');
const bgNext = document.getElementById('bg-next');

// State
let homeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let targetZone = 'America/New_York';
let lastPhase = '';

// Background Images mapping
const images = {
    sunrise: 'images/sunrise.png',
    morning: 'images/morning.png',
    afternoon: 'images/afternoon.png',
    sunset: 'images/sunset.png',
    night: 'images/night.png'
};

/**
 * Get Flag URL for a timezone
 * This is a simplified mapping for major zones. 
 * For a full production app, you'd use a more robust zone-to-country library.
 */
function getFlagUrl(zone) {
    const mapping = {
        'Asia/Kolkata': 'in',
        'America/New_York': 'us',
        'Europe/London': 'gb',
        'Asia/Tokyo': 'jp',
        'Europe/Paris': 'fr',
        'Australia/Sydney': 'au',
        'Asia/Dubai': 'ae',
        'Asia/Singapore': 'sg',
        'America/Los_Angeles': 'us',
        'America/Chicago': 'us',
        'Europe/Berlin': 'de',
        'Asia/Shanghai': 'cn',
        'America/Sao_Paulo': 'br',
        'Africa/Cairo': 'eg'
    };
    
    // Default to 'un' (United Nations) flag if not in mapping
    const code = mapping[zone] || 'un';
    return `https://flagcdn.com/w80/${code}.png`;
}

/**
 * Populate Timezone Selectors
 */
function populateTimezones() {
    const zones = Intl.supportedValuesOf('timeZone');
    
    // Major cities mapped to countries for better searchability
    const countryMapping = {
        'Asia/Kolkata': 'India',
        'America/New_York': 'USA (EST)',
        'America/Los_Angeles': 'USA (PST)',
        'America/Chicago': 'USA (CST)',
        'Europe/London': 'UK',
        'Europe/Paris': 'France',
        'Asia/Tokyo': 'Japan',
        'Asia/Singapore': 'Singapore',
        'Australia/Sydney': 'Australia',
        'Europe/Berlin': 'Germany',
        'Asia/Dubai': 'UAE',
        'Asia/Shanghai': 'China',
        'America/Sao_Paulo': 'Brazil',
        'Africa/Cairo': 'Egypt'
    };

    // Sort zones so India and common ones are easy to find
    const sortedZones = [...zones].sort((a, b) => {
        if (a === 'Asia/Kolkata') return -1;
        if (b === 'Asia/Kolkata') return 1;
        return a.localeCompare(b);
    });
    
    sortedZones.forEach(zone => {
        const optionHome = document.createElement('option');
        const optionTarget = document.createElement('option');
        
        const parts = zone.split('/');
        const city = parts[parts.length - 1].replace(/_/g, ' ');
        const country = countryMapping[zone] || parts[0];
        
        // Format: "India (Kolkata)" or "USA (New York)"
        const displayName = countryMapping[zone] ? `${country} (${city})` : `${city} (${country})`;
        
        optionHome.value = zone;
        optionHome.textContent = displayName;
        if (zone === homeZone) optionHome.selected = true;
        
        optionTarget.value = zone;
        optionTarget.textContent = displayName;
        if (zone === targetZone) optionTarget.selected = true;
        
        selectHome.appendChild(optionHome);
        selectTarget.appendChild(optionTarget);
    });
}

/**
 * Determine the phase of the day
 */
function getPhase(hour) {
    if (hour >= 5 && hour < 8) return 'sunrise';
    if (hour >= 8 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
}

/**
 * Update Background smoothly
 */
function updateBackground(phase) {
    if (phase === lastPhase) return;
    
    const imageUrl = images[phase];
    bgNext.style.backgroundImage = `url(${imageUrl})`;
    bgNext.style.opacity = '1';
    bgActive.style.opacity = '0';
    
    setTimeout(() => {
        bgActive.style.backgroundImage = `url(${imageUrl})`;
        bgActive.style.opacity = '1';
        bgNext.style.opacity = '0';
        lastPhase = phase;
    }, 2000); // 2s transition
}

/**
 * Core Logic
 */
function update() {
    const minutes = parseInt(timeSlider.value);
    
    // Create a base time for today in the Home zone at midnight
    const baseDate = DateTime.now().setZone(selectHome.value).startOf('day');
    const homeDateTime = baseDate.plus({ minutes: minutes });
    const targetDateTime = homeDateTime.setZone(selectTarget.value);
    
    // Update Slider text
    sliderCurrentVal.textContent = homeDateTime.toFormat('hh:mm a');
    
    // Update Times
    timeHome.textContent = homeDateTime.toFormat('hh:mm a');
    timeTarget.textContent = targetDateTime.toFormat('hh:mm a');
    
    // Update Labels with Days
    document.getElementById('label-home').textContent = homeDateTime.toFormat('ccc, LLL d');
    document.getElementById('label-target').textContent = targetDateTime.toFormat('ccc, LLL d');

    // Flags
    flagHome.src = getFlagUrl(selectHome.value);
    flagTarget.src = getFlagUrl(selectTarget.value);

    // Meeting Suitability (9 AM - 6 PM)
    const hHour = homeDateTime.hour;
    const tHour = targetDateTime.hour;
    const isHomeWork = hHour >= 9 && hHour < 18;
    const isTargetWork = tHour >= 9 && tHour < 18;
    
    if (isHomeWork && isTargetWork) {
        statusBadge.innerHTML = '<span>🟢</span> Great window for both';
        statusBadge.className = 'status-badge status-good';
    } else if (isHomeWork || isTargetWork) {
        statusBadge.innerHTML = '<span>🟡</span> One side is outside work hours';
        statusBadge.className = 'status-badge status-neutral';
    } else {
        statusBadge.innerHTML = '<span>🔴</span> Poor window (Night/Early)';
        statusBadge.className = 'status-badge status-bad';
    }
    
    // Background based on TARGET
    updateBackground(getPhase(tHour));
}

// Events
timeSlider.addEventListener('input', update);
selectHome.addEventListener('change', update);
selectTarget.addEventListener('change', update);

// Init
populateTimezones();
const now = DateTime.now().setZone(homeZone);
timeSlider.value = now.hour * 60 + now.minute;
update();

// Initial BG load
const initialPhase = getPhase(DateTime.now().setZone(selectTarget.value).hour);
bgActive.style.backgroundImage = `url(${images[initialPhase]})`;
lastPhase = initialPhase;