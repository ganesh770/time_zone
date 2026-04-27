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
let ssHome, ssTarget;

// Background Images mapping
const images = {
    sunrise: 'images/sunrise.png',
    morning: 'images/morning.png',
    afternoon: 'images/afternoon.png',
    sunset: 'images/sunset.png',
    night: 'images/night.png'
};

/**
 * Get Flag URL for a timezone using the ct library
 */
function getFlagUrl(zone) {
    const tz = ct.getTimezone(zone);
    const code = tz && tz.countries ? tz.countries[0].toLowerCase() : 'un';
    return `https://flagcdn.com/w80/${code}.png`;
}

/**
 * Populate Timezone Selectors with Grouping
 */
function populateTimezones() {
    const countries = ct.getAllCountries();
    const sortedCountries = Object.values(countries).sort((a, b) => {
        // Prioritize India at the top
        if (a.id === 'IN') return -1;
        if (b.id === 'IN') return 1;
        return a.name.localeCompare(b.name);
    });

    [selectHome, selectTarget].forEach(select => {
        select.innerHTML = ''; // Clear existing
        
        sortedCountries.forEach(country => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = country.name;

            country.timezones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone;
                
                // Format city name (e.g., "America/New_York" -> "New York")
                const parts = zone.split('/');
                const city = parts[parts.length - 1].replace(/_/g, ' ');
                
                option.textContent = city;
                
                if (select === selectHome && zone === homeZone) option.selected = true;
                if (select === selectTarget && zone === targetZone) option.selected = true;
                
                optgroup.appendChild(option);
            });
            
            select.appendChild(optgroup);
        });
    });

    // Initialize/Update SlimSelect
    if (!ssHome) {
        ssHome = new SlimSelect({
            select: '#select-home',
            settings: { searchPlaceholder: 'Search Country or City...' }
        });
        ssTarget = new SlimSelect({
            select: '#select-target',
            settings: { searchPlaceholder: 'Search Country or City...' }
        });
    } else {
        ssHome.setData(ssHome.getData()); // Refresh if already exists
        ssTarget.setData(ssTarget.getData());
    }
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
    
    // Update Labels with Country (City) + Date
    const getLabel = (zone, dt) => {
        const tz = ct.getTimezone(zone);
        const country = tz && tz.countries ? ct.getCountry(tz.countries[0]).name : 'Global';
        const city = zone.split('/').pop().replace(/_/g, ' ');
        return `${country} (${city}) — ${dt.toFormat('ccc, d LLL')}`;
    };

    document.getElementById('label-home').textContent = getLabel(selectHome.value, homeDateTime);
    document.getElementById('label-target').textContent = getLabel(selectTarget.value, targetDateTime);

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

// Hide Loader
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
});