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
  passwordInput: document.getElementById("passwordInput"),
  toggleVisibility: document.getElementById("toggleVisibility"),
  entropyText: document.getElementById("entropyText"),
  strength: document.getElementById("strength"),
  strengthText: document.getElementById("strengthText"),
};

// update slider display
el.length.addEventListener("input", () => {
  el.lengthValue.textContent = el.length.value;
});

// secure random number
function secureRandomInt(max) {
  const u32 = new Uint32Array(1);
  const limit = Math.floor(0xFFFFFFFF / max) * max;
  while (true) {
    crypto.getRandomValues(u32);
    const val = u32[0];
    if (val < limit) return val % max;
  }
}

function pickRandom(str) {
  return str.charAt(secureRandomInt(str.length));
}

// generate password
function generatePassword(length, options) {
  let charset = "";
  const required = [];

  if (options.lowercase) { charset += LOWER; required.push(pickRandom(LOWER)); }
  if (options.uppercase) { charset += UPPER; required.push(pickRandom(UPPER)); }
  if (options.numbers)   { charset += NUM; required.push(pickRandom(NUM)); }
  if (options.symbols)   { charset += SYMBOLS; required.push(pickRandom(SYMBOLS)); }

  if (!charset) return "";

  const result = [];

  for (let i = 0; i < length; i++) {
    result.push(pickRandom(charset));
  }

  // ensure all categories appear
  for (let i = 0; i < required.length && i < result.length; i++) {
    const pos = secureRandomInt(result.length);
    result[pos] = required[i];
  }

  return result.join("");
}

// entropy = length * log2(charsetSize)
function calcEntropy(length, options) {
  let size = 0;
  if (options.lowercase) size += 26;
  if (options.uppercase) size += 26;
  if (options.numbers) size += 10;
  if (options.symbols) size += SYMBOLS.length;

  return size ? length * Math.log2(size) : 0;
}

function estimateStrength(entropy) {
  if (entropy < 28) return 0;
  if (entropy < 36) return 1;
  if (entropy < 60) return 2;
  if (entropy < 128) return 3;
  return 4;
}

function updateStrength(entropy) {
  const level = estimateStrength(entropy);
  const labels = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
  el.strength.value = level;
  el.strengthText.textContent = labels[level];
}

el.generate.addEventListener("click", () => {
  const length = parseInt(el.length.value, 10);
  const options = {
    lowercase: el.lowercase.checked,
    uppercase: el.uppercase.checked,
    numbers:   el.numbers.checked,
    symbols:   el.symbols.checked,
  };

  if (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols) {
    alert("Select at least one character type.");
    return;
  }

  const pw = generatePassword(length, options);
  el.passwordInput.value = pw;

  el.copy.disabled = pw.length === 0;

  const entropy = calcEntropy(length, options);
  el.entropyText.textContent = "Entropy: " + entropy.toFixed(2) + " bits";

  updateStrength(entropy);
});

// copy to clipboard
el.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(el.passwordInput.value);
  el.copy.textContent = "Copied!";
  setTimeout(() => (el.copy.textContent = "Copy"), 1200);
});

// visibility toggle
el.toggleVisibility.addEventListener("click", () => {
  if (el.passwordInput.type === "password") {
    el.passwordInput.type = "text";
    el.toggleVisibility.textContent = "Hide";
  } else {
    el.passwordInput.type = "password";
    el.toggleVisibility.textContent = "Show";
  }
});

// init
document.addEventListener("DOMContentLoaded", () => {
  el.lengthValue.textContent = el.length.value;
  el.copy.disabled = true;
});
