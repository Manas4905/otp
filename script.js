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

  expireTimer = setTimeout(() => {
    currentOtp = null;
    otpExpiresAt = null;
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    updateExpiryDisplay();
    clearInterval(expireInterval);
  }, 300000); // 5 minutes
}

function stopExpireTimer() {
  clearTimeout(expireTimer);
  clearInterval(expireInterval);
  expireTimer = null;
  expireInterval = null;
  updateExpiryDisplay();
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
  otpValue.textContent = currentOtp;
  otpInput.value = "";
  otpInput.focus();
  updateStatus("OTP generated and valid for 5 minutes.");
  otpExpiresAt = Date.now() + 300000;
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
    currentOtp = null;
    otpExpiresAt = null;
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    stopExpireTimer();
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
    currentOtp = null;
    otpExpiresAt = null;
    stopExpireTimer();
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

generateBtn.addEventListener("click", generateOtp);
otpForm.addEventListener("submit", verifyOtp);
otpInput.addEventListener("input", checkInput);
noticeAction.addEventListener("click", () => {
  if (noticeActionHandler) {
    noticeActionHandler();
  }
});
window.addEventListener("load", () => {
  otpValue.textContent = "------";
  updateStatus("Click Generate OTP to begin.");
  expiryTimer.textContent = "";
  hideNotice();
});
