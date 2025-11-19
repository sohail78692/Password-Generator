/* script.js */

// Character sets
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?|~`";

const el = {
  length: document.getElementById("length"),
  lengthValue: document.getElementById("lengthValue"),
  lowercase: document.getElementById("lowercase"),
  uppercase: document.getElementById("uppercase"),
  numbers: document.getElementById("numbers"),
  symbols: document.getElementById("symbols"),
  generate: document.getElementById("generate"),
  copy: document.getElementById("copy"),
  password: document.getElementById("password"),
  strength: document.getElementById("strength"),
  strengthText: document.getElementById("strengthText"),
};

// update length label
el.length.addEventListener("input", () => {
  el.lengthValue.textContent = el.length.value;
});

// helper: secure random int in [0, max)
function secureRandomInt(max) {
  // Use Uint32, reject numbers that would bias the result
  const u32 = new Uint32Array(1);
  const limit = Math.floor(0xFFFFFFFF / max) * max; // largest multiple of max <= 2^32-1
  while (true) {
    crypto.getRandomValues(u32);
    const val = u32[0];
    if (val < limit) return val % max;
  }
}

// generate password using secure RNG
function generatePassword(length, options) {
  let charset = "";
  const required = [];

  if (options.lowercase) { charset += LOWER; required.push(pickRandomFrom(LOWER)); }
  if (options.uppercase) { charset += UPPER; required.push(pickRandomFrom(UPPER)); }
  if (options.numbers)   { charset += NUM; required.push(pickRandomFrom(NUM)); }
  if (options.symbols)   { charset += SYMBOLS; required.push(pickRandomFrom(SYMBOLS)); }

  if (!charset) return "";

  // fill with random chars
  const out = [];
  for (let i = 0; i < length; i++) {
    out.push(pickRandomFrom(charset));
  }

  // ensure at least one of each selected type is present
  for (let i = 0; i < required.length && i < out.length; i++) {
    const pos = secureRandomInt(out.length);
    out[pos] = required[i];
  }

  return out.join("");
}

function pickRandomFrom(str) {
  const idx = secureRandomInt(str.length);
  return str.charAt(idx);
}

// estimate simple strength (0-4)
function estimateStrength(pw, options) {
  if (!pw) return 0;
  // score by length and variety
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  const variety = new Set(pw.split("")).size;
  if (options.lowercase + options.uppercase + options.numbers + options.symbols >= 3) score++;
  if (variety > Math.min(20, pw.length)) score++;
  if (pw.length >= 20) score = Math.min(4, score + 1);
  return Math.min(4, score);
}

// update UI strength meter & text
function updateStrength(pw, options) {
  const s = estimateStrength(pw, options);
  el.strength.value = s;
  const labels = ["Very weak","Weak","Okay","Strong","Very strong"];
  el.strengthText.textContent = pw ? labels[s] : "";
}

el.generate.addEventListener("click", () => {
  const length = parseInt(el.length.value, 10);
  const options = {
    lowercase: el.lowercase.checked,
    uppercase: el.uppercase.checked,
    numbers: el.numbers.checked,
    symbols: el.symbols.checked,
  };

  // basic validation
  if (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols) {
    alert("Select at least one character type.");
    return;
  }

  const pw = generatePassword(length, options);
  if (!pw) {
    el.password.textContent = "";
    el.copy.disabled = true;
    updateStrength("", options);
    return;
  }

  el.password.textContent = pw;
  el.copy.disabled = false;
  updateStrength(pw, options);
});

el.copy.addEventListener("click", async () => {
  const text = el.password.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    el.copy.textContent = "Copied!";
    setTimeout(() => el.copy.textContent = "Copy", 1400);
  } catch (err) {
    // fallback: select and execCommand
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      el.copy.textContent = "Copied!";
      setTimeout(() => el.copy.textContent = "Copy", 1400);
    } catch (e) {
      alert("Copy failed — please select and copy manually.");
    }
    document.body.removeChild(textarea);
  }
});

// Initialize UI on load
document.addEventListener("DOMContentLoaded", () => {
  el.lengthValue.textContent = el.length.value;
  updateStrength("", {
    lowercase: el.lowercase.checked,
    uppercase: el.uppercase.checked,
    numbers: el.numbers.checked,
    symbols: el.symbols.checked,
  });
});
