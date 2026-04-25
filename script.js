const slider = document.getElementById("slider");
const stars = document.getElementById("stars");

/* LOCAL IMAGES */
const images = {
  sunrise: "images/sunrise.jpg",
  morning: "images/morning.jpg",
  afternoon: "images/afternoon.jpg",
  sunset: "images/sunset.jpg",
  night: "images/night.jpg"
};

let currentBg = document.getElementById("bg1");
let nextBg = document.getElementById("bg2");
let lastPhase = "";

/* SWITCH BACKGROUND */
function setBackground(url) {
  nextBg.style.backgroundImage = `url(${url})`;
  nextBg.style.opacity = 1;
  currentBg.style.opacity = 0;

  let temp = currentBg;
  currentBg = nextBg;
  nextBg = temp;
}

/* PHASE */
function getPhase(hour) {
  if (hour >= 5 && hour < 8) return "sunrise";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

/* UPDATE */
function update() {
  let ist = parseInt(slider.value);
  let pst = (ist - 13 + 24) % 24;

  document.getElementById("istTime").innerText = ist + ":00";
  document.getElementById("pstTime").innerText = pst + ":00";

  if (pst >= 9 && pst <= 17) {
    document.getElementById("status").innerText = "✔ Good Meeting Time";
  } else {
    document.getElementById("status").innerText = "✖ Not Ideal";
  }

  let phase = getPhase(ist);

  if (phase !== lastPhase) {
    setBackground(images[phase]);
    lastPhase = phase;
  }

  /* Stars */
  if (phase === "night") {
    stars.style.opacity = 0.7;
  } else {
    stars.style.opacity = 0;
  }
}

slider.addEventListener("input", update);
update();