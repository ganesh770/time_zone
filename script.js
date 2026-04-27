const DateTime = luxon.DateTime;

// DOM
const selectHome = document.getElementById("select-home");
const selectTarget = document.getElementById("select-target");
const timeSlider = document.getElementById("time-slider");
const sliderCurrentVal = document.getElementById("slider-current-val");
const timeHome = document.getElementById("time-home");
const timeTarget = document.getElementById("time-target");
const flagHome = document.getElementById("flag-home");
const flagTarget = document.getElementById("flag-target");
const statusBadge = document.getElementById("status-badge");
const bgActive = document.getElementById("bg-active");
const bgNext = document.getElementById("bg-next");

// State
let homeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let targetZone = "America/New_York";
let lastPhase = "";

let ssHome;
let ssTarget;

// Background Images
const images = {
    sunrise: "images/sunrise.png",
    morning: "images/morning.png",
    afternoon: "images/afternoon.png",
    sunset: "images/sunset.png",
    night: "images/night.png"
};

// Accent Colors
const phaseColors = {
    sunrise: {
        color: "#f59e0b",
        glow: "rgba(245,158,11,0.4)"
    },
    morning: {
        color: "#3b82f6",
        glow: "rgba(59,130,246,0.4)"
    },
    afternoon: {
        color: "#10b981",
        glow: "rgba(16,185,129,0.4)"
    },
    sunset: {
        color: "#f43f5e",
        glow: "rgba(244,63,94,0.4)"
    },
    night: {
        color: "#818cf8",
        glow: "rgba(129,140,248,0.4)"
    }
};

// Get flag URL
function getFlagUrl(zone) {
    const tz = ct.getTimezone(zone);

    if (!tz || !tz.countries?.length) {
        return "images/default-flag.png";
    }

    const code = tz.countries[0].toLowerCase();
    return `https://flagcdn.com/w80/${code}.png`;
}

// Populate dropdowns
function populateTimezones() {
    const countries = ct.getAllCountries();

    const sortedCountries = Object.values(countries).sort((a, b) => {
        if (a.id === "IN") return -1;
        if (b.id === "IN") return 1;
        return a.name.localeCompare(b.name);
    });

    [selectHome, selectTarget].forEach(select => {
        select.innerHTML = "";

        sortedCountries.forEach(country => {
            const optgroup = document.createElement("optgroup");
            optgroup.label = country.name;

            country.timezones.forEach(zone => {
                const option = document.createElement("option");
                option.value = zone;

                const city = zone
                    .split("/")
                    .pop()
                    .replace(/_/g, " ");

                option.textContent = `${country.name} - ${city}`;

                if (select === selectHome && zone === homeZone) {
                    option.selected = true;
                }

                if (select === selectTarget && zone === targetZone) {
                    option.selected = true;
                }

                optgroup.appendChild(option);
            });

            select.appendChild(optgroup);
        });
    });

    if (!ssHome) {
        ssHome = new SlimSelect({
            select: "#select-home",
            settings: {
                searchPlaceholder: "Search country or city...",
                openPosition: "auto"
            }
        });

        ssTarget = new SlimSelect({
            select: "#select-target",
            settings: {
                searchPlaceholder: "Search country or city...",
                openPosition: "auto"
            }
        });
    }
}

// Day phase
function getPhase(hour) {
    if (hour >= 5 && hour < 8) return "sunrise";
    if (hour >= 8 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 20) return "sunset";
    return "night";
}

// Update background
function updateBackground(phase) {
    if (phase === lastPhase) return;

    const colors = phaseColors[phase];

    document.documentElement.style.setProperty(
        "--accent-color",
        colors.color
    );

    document.documentElement.style.setProperty(
        "--accent-glow",
        colors.glow
    );

    const imageUrl = images[phase];

    bgNext.style.backgroundImage = `url(${imageUrl})`;
    bgNext.style.opacity = "1";
    bgActive.style.opacity = "0";

    setTimeout(() => {
        bgActive.style.backgroundImage = `url(${imageUrl})`;
        bgActive.style.opacity = "1";
        bgNext.style.opacity = "0";
        lastPhase = phase;
    }, 800);
}

// Label formatting
function getLabel(zone, dt) {
    const tz = ct.getTimezone(zone);

    const country =
        tz?.countries?.length
            ? ct.getCountry(tz.countries[0]).name
            : "Global";

    const city = zone
        .split("/")
        .pop()
        .replace(/_/g, " ");

    return `${country} (${city}) — ${dt.toFormat("ccc, d LLL")}`;
}

// Main update
function update() {
    const minutes = parseInt(timeSlider.value);

    const baseDate = DateTime.now()
        .setZone(selectHome.value)
        .startOf("day");

    const homeDateTime = baseDate.plus({
        minutes
    });

    const targetDateTime =
        homeDateTime.setZone(selectTarget.value);

    sliderCurrentVal.textContent =
        homeDateTime.toFormat("hh:mm a");

    timeHome.textContent =
        homeDateTime.toFormat("hh:mm a");

    timeTarget.textContent =
        targetDateTime.toFormat("hh:mm a");

    document.getElementById("label-home").textContent =
        getLabel(selectHome.value, homeDateTime);

    document.getElementById("label-target").textContent =
        getLabel(selectTarget.value, targetDateTime);

    // Flags
    flagHome.src = getFlagUrl(selectHome.value);
    flagTarget.src = getFlagUrl(selectTarget.value);

    flagHome.onerror = () => {
        flagHome.src = "images/default-flag.png";
    };

    flagTarget.onerror = () => {
        flagTarget.src = "images/default-flag.png";
    };

    const hHour = homeDateTime.hour;
    const tHour = targetDateTime.hour;

    const homeWork = hHour >= 9 && hHour < 18;
    const targetWork = tHour >= 9 && tHour < 18;

    if (selectHome.value === selectTarget.value) {
        statusBadge.innerHTML =
            "⚠️ Same timezone selected";
        statusBadge.className =
            "status-badge status-neutral";
    }
    else if (homeWork && targetWork) {
        statusBadge.innerHTML =
            "🟢 Great window for both";
        statusBadge.className =
            "status-badge status-good";
    }
    else if (homeWork || targetWork) {
        statusBadge.innerHTML =
            "🟡 One side outside work hours";
        statusBadge.className =
            "status-badge status-neutral";
    }
    else {
        statusBadge.innerHTML =
            "🔴 Poor meeting window";
        statusBadge.className =
            "status-badge status-bad";
    }

    // Background follows HOME timezone
    updateBackground(getPhase(hHour));
}

// Events
timeSlider.addEventListener("input", update);
selectHome.addEventListener("change", update);
selectTarget.addEventListener("change", update);

// Init
populateTimezones();

const now = DateTime.now().setZone(homeZone);

timeSlider.value =
    now.hour * 60 + now.minute;

update();

// Initial background
const initialPhase = getPhase(
    DateTime.now().setZone(homeZone).hour
);

bgActive.style.backgroundImage =
    `url(${images[initialPhase]})`;

lastPhase = initialPhase;

// Hide loader
window.addEventListener("load", () => {
    const loader =
        document.getElementById("loader");

    loader.style.opacity = "0";

    setTimeout(() => {
        loader.style.display = "none";
    }, 500);
});