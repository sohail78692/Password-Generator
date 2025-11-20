// Character sets
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUM = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?|~`";

// elements
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

// safe random integer in [0, max)
function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) throw new Error("max must be positive integer");
  const u32 = new Uint32Array(1);
  const range = 0x100000000; // 2^32
  const limit = Math.floor(range / max) * max;
  while (true) {
    crypto.getRandomValues(u32);
    const val = u32[0];
    if (val < limit) return val % max;
  }
}

function pickRandom(str) {
  return str.charAt(secureRandomInt(str.length));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
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

  if (required.length > length) {
    // impossible to include all required types
    return null;
  }

  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(pickRandom(charset));
  }

  // ensure all categories appear (place required characters into random positions)
  for (let i = 0; i < required.length; i++) {
    const pos = secureRandomInt(result.length);
    result[pos] = required[i];
  }

  // shuffle to remove any positional bias
  shuffle(result);

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
  el.strength.dataset.level = String(level);
  el.strengthText.textContent = labels[level];
  el.strengthText.setAttribute("aria-hidden", "false");
  return level;
}

// sync slider display
el.length.addEventListener("input", () => {
  el.lengthValue.textContent = el.length.value;
});

// Generate button
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

  // attempt to generate
  const pw = generatePassword(length, options);

  if (pw === null) {
    alert("Password length is too short for the selected character types. Increase length.");
    return;
  }

  el.passwordInput.value = pw;
  el.copy.disabled = pw.length === 0;
  el.copy.textContent = "Copy";

  // Reset visibility to hidden for security on each generation
  el.passwordInput.type = "password";
  el.toggleVisibility.textContent = "Show";
  el.toggleVisibility.setAttribute("aria-pressed", "false");

  const entropy = calcEntropy(length, options);
  const level = updateStrength(entropy);

  el.entropyText.textContent = `Entropy: ${entropy.toFixed(2)} bits — ${["Very weak","Weak","Okay","Strong","Very strong"][level]}`;
  // focus the password field so user can see result (still masked)
  el.passwordInput.focus();
  el.passwordInput.select && el.passwordInput.select();
});

// copy to clipboard
el.copy.addEventListener("click", async () => {
  const text = el.passwordInput.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);

    // Animation class
    el.copy.classList.add("copy-animate");

    // Button text change
    el.copy.textContent = "Copied!";

    // Remove animation class after it runs
    setTimeout(() => {
      el.copy.classList.remove("copy-animate");
      el.copy.textContent = "Copy";
    }, 600);

  } catch (err) {
    console.error("Clipboard write failed:", err);
    alert("Copy failed. You can copy manually.");
  }
});

// visibility toggle
el.toggleVisibility.addEventListener("click", () => {
  if (el.passwordInput.type === "password") {
    el.passwordInput.type = "text";
    el.toggleVisibility.textContent = "Hide";
    el.toggleVisibility.setAttribute("aria-pressed", "true");
  } else {
    el.passwordInput.type = "password";
    el.toggleVisibility.textContent = "Show";
    el.toggleVisibility.setAttribute("aria-pressed", "false");
  }
});

// init on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  el.lengthValue.textContent = el.length.value;
  el.copy.disabled = true;
  el.entropyText.textContent = "";
  el.strength.value = 0;
  el.strength.dataset.level = "0";
  el.strengthText.textContent = "Very weak";
});
