const generateBtn = document.getElementById("generateBtn");
const verifyBtn = document.getElementById("verifyBtn");
const otpInput = document.getElementById("otpInput");
const otpValue = document.getElementById("otpValue");
const statusMessage = document.getElementById("statusMessage");

let currentOtp = null;
let otpExpiresAt = null;
let expireTimer = null;

function formatOtp(value) {
  return value.toString().padStart(6, "0");
}

function updateStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.color = isError ? "#d93025" : "#0f3557";
}

function setExpireTimer() {
  if (expireTimer) {
    clearTimeout(expireTimer);
  }

  expireTimer = setTimeout(() => {
    currentOtp = null;
    otpExpiresAt = null;
    otpValue.textContent = "------";
    updateStatus("OTP expired. Please generate a new OTP.", true);
    verifyBtn.disabled = true;
  }, 300000); // 5 minutes
}

function generateOtp() {
  currentOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpValue.textContent = `${currentOtp}`;
  otpInput.value = "";
  otpInput.focus();
  updateStatus("OTP generated and valid for 5 minutes.");
  otpExpiresAt = Date.now() + 300000;
  verifyBtn.disabled = true;
  setExpireTimer();
}

function verifyOtp() {
  if (Date.now() > otpExpiresAt) {
    alert("Genrate New OTP.");
    currentOtp = null;
    otpValue.textContent = "------";
    updateStatus("Please generate a new OTP.", true);
    verifyBtn.disabled = true;
    return;
  }

  if (otpInput.value === currentOtp) {
    alert("Approved");
    updateStatus("OTP approved.");
    clearTimeout(expireTimer);
    verifyBtn.disabled = true;
    currentOtp = null;
  } else {
    alert("OTP incorrect. Try again.");
    updateStatus("Incorrect OTP. Please try again.", true);
  }
}

function checkInput() {
  const value = otpInput.value.replace(/\D/g, "");
  otpInput.value = value;
  verifyBtn.disabled = value.length !== 6;
}

generateBtn.addEventListener("click", generateOtp);
verifyBtn.addEventListener("click", verifyOtp);
otpInput.addEventListener("input", checkInput);
window.addEventListener("load", () => {
  otpValue.textContent = "------";
  updateStatus("Click Generate OTP to begin.");
});
