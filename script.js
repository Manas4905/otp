const generateBtn = document.getElementById("generateBtn");
const generateCountdown = document.getElementById("generateCountdown");
const otpForm = document.getElementById("otpForm");
const verifyBtn = document.getElementById("verifyBtn");
const otpInput = document.getElementById("otpInput");
const otpValue = document.getElementById("otpValue");
const noticeOverlay = document.getElementById("noticeOverlay");
const noticeBox = document.getElementById("noticeBox");
const noticeText = document.getElementById("noticeText");
const noticeAction = document.getElementById("noticeAction");
const statusMessage = document.getElementById("statusMessage");
const expiryTimer = document.getElementById("expiryTimer");

const OTP_STORAGE_KEY = "otp-generator-state";
const OTP_DURATION_MS = 300000;

let currentOtp = null;
let otpExpiresAt = null;
let expireTimer = null;
let expireInterval = null;
let generateInterval = null;
let noticeActionHandler = null;

function updateStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.color = isError ? "#d93025" : "#0f3557";
}

function saveOtpState() {
  if (!currentOtp || !otpExpiresAt) {
    localStorage.removeItem(OTP_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    OTP_STORAGE_KEY,
    JSON.stringify({
      otp: currentOtp,
      expiresAt: otpExpiresAt,
    }),
  );
}

function clearOtpState() {
  currentOtp = null;
  otpExpiresAt = null;
  localStorage.removeItem(OTP_STORAGE_KEY);
}

function hideNotice() {
  noticeOverlay.hidden = true;
  noticeBox.classList.remove("success", "error");
  noticeText.textContent = "";
  noticeAction.textContent = "";
  noticeActionHandler = null;
}

function showNotice({ variant = "success", text, actionText, onAction }) {
  noticeOverlay.hidden = false;
  noticeBox.classList.remove("success", "error");
  noticeBox.classList.add(variant);
  noticeText.textContent = text;
  noticeAction.textContent = actionText;
  noticeActionHandler = onAction;
  noticeAction.focus();
}

function updateExpiryDisplay() {
  if (!otpExpiresAt) {
    expiryTimer.textContent = "";
    return;
  }

  const remainingMs = otpExpiresAt - Date.now();
  if (remainingMs <= 0) {
    expiryTimer.textContent = "OTP expired.";
    return;
  }

  const seconds = Math.floor(remainingMs / 1000);
  expiryTimer.textContent = `OTP valid for ${seconds} second${seconds === 1 ? "" : "s"} more.`;
}

function startExpireTimer() {
  if (expireTimer) {
    clearTimeout(expireTimer);
  }
  if (expireInterval) {
    clearInterval(expireInterval);
  }

  expireInterval = setInterval(() => {
    updateExpiryDisplay();
  }, 1000);

  const remainingMs = otpExpiresAt - Date.now();
  if (remainingMs <= 0) {
    clearOtpState();
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    updateExpiryDisplay();
    hideNotice();
    clearInterval(expireInterval);
    stopGenerateCooldown();
    return;
  }

  expireTimer = setTimeout(() => {
    clearOtpState();
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    updateExpiryDisplay();
    hideNotice();
    clearInterval(expireInterval);
    stopGenerateCooldown();
  }, remainingMs);
}

function stopExpireTimer() {
  clearTimeout(expireTimer);
  clearInterval(expireInterval);
  expireTimer = null;
  expireInterval = null;
  updateExpiryDisplay();
}

function stopGenerateCooldown() {
  clearInterval(generateInterval);
  generateInterval = null;
  generateCountdown.hidden = true;
  generateBtn.hidden = false;
}

function startGenerateCooldown(seconds) {
  if (generateInterval) {
    clearInterval(generateInterval);
  }

  generateBtn.hidden = true;
  generateCountdown.hidden = false;
  let remaining = seconds;
  generateCountdown.textContent = `Please wait ${remaining} second${remaining === 1 ? "" : "s"} before generating a new OTP.`;

  generateInterval = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      generateCountdown.textContent = `Please wait ${remaining} second${remaining === 1 ? "" : "s"} before generating a new OTP.`;
      return;
    }

    clearInterval(generateInterval);
    generateInterval = null;
    generateCountdown.hidden = true;
    generateBtn.hidden = false;
    generateBtn.focus();
  }, 1000);
}

function generateOtp() {
  hideNotice();
  currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpExpiresAt = Date.now() + OTP_DURATION_MS;
  saveOtpState();
  otpValue.textContent = currentOtp;
  otpInput.value = "";
  otpInput.focus();
  verifyBtn.disabled = true;
  startExpireTimer();
  updateExpiryDisplay();
  startGenerateCooldown(20);
}

function verifyOtp(event) {
  if (event) {
    event.preventDefault();
  }

  const enteredValue = otpInput.value;
  if (!currentOtp || !otpExpiresAt || Date.now() > otpExpiresAt) {
    clearOtpState();
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    stopExpireTimer();
    stopGenerateCooldown();
    hideNotice();
    return;
  }

  if (enteredValue === currentOtp) {
    showNotice({
      variant: "success",
      text: "OTP approved successfully. You can continue to the next step now.",
      actionText: "Continue",
      onAction: () => {
        hideNotice();
        updateStatus("OTP approved.");
      },
    });
    verifyBtn.disabled = true;
    clearOtpState();
    stopExpireTimer();
    stopGenerateCooldown();
    otpValue.textContent = "------";
  } else {
    showNotice({
      variant: "error",
      text: "The OTP you entered is incorrect. Please check it and try again.",
      actionText: "Try Again",
      onAction: () => {
        hideNotice();
        otpInput.focus();
      },
    });
    updateStatus("Incorrect OTP. Please try again.", true);
  }
}

function checkInput() {
  const value = otpInput.value.replace(/\D/g, "");
  otpInput.value = value;
  verifyBtn.disabled = value.length !== 6 || !currentOtp;
}

function restoreOtpState() {
  const raw = localStorage.getItem(OTP_STORAGE_KEY);
  if (!raw) {
    otpValue.textContent = "------";
    updateStatus("Click Generate OTP to begin.");
    expiryTimer.textContent = "";
    hideNotice();
    return;
  }

  try {
    const stored = JSON.parse(raw);
    if (!stored.otp || !stored.expiresAt || Date.now() >= stored.expiresAt) {
      clearOtpState();
      otpValue.textContent = "------";
      updateStatus("Click Generate OTP to begin.");
      expiryTimer.textContent = "";
      hideNotice();
      return;
    }

    currentOtp = stored.otp;
    otpExpiresAt = stored.expiresAt;
    otpValue.textContent = currentOtp;
    verifyBtn.disabled = otpInput.value.replace(/\D/g, "").length !== 6;
    updateExpiryDisplay();
    hideNotice();
    startExpireTimer();
  } catch {
    clearOtpState();
    otpValue.textContent = "------";
    updateStatus("Click Generate OTP to begin.");
    expiryTimer.textContent = "";
    hideNotice();
  }
}

generateBtn.addEventListener("click", generateOtp);
otpForm.addEventListener("submit", verifyOtp);
otpInput.addEventListener("input", checkInput);
noticeAction.addEventListener("click", () => {
  if (noticeActionHandler) {
    noticeActionHandler();
  }
});
window.addEventListener("load", () => {
  restoreOtpState();
});
