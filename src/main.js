import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { submitContact } from "./api/contact";
import { initMotion } from "./motion";

Amplify.configure(outputs);
initMotion();

const form = document.getElementById("contact-form");
const button = form.querySelector('button[type="submit"]');
const status = document.getElementById("form-status");
const buttonHtml = button.innerHTML;
const SUCCESS_VISIBLE_MS = 5000;
let hideTimer;

function showStatus(message, isError) {
  clearTimeout(hideTimer);
  status.style.opacity = "1";
  status.textContent = message;
  status.classList.toggle("text-error", isError);
  status.classList.toggle("text-tertiary", !isError);
  status.classList.toggle("font-bold", Boolean(message));
}

// Fade the message out, then clear it once the fade has finished.
function hideStatus() {
  if (!status.textContent) return;
  status.style.opacity = "0";
  hideTimer = setTimeout(() => showStatus("", false), 300);
}

// Typing again means the old message no longer applies.
form.addEventListener("input", hideStatus);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);

  button.disabled = true;
  button.innerHTML = "<span>Sending...</span>";
  showStatus("", false);

  try {
    await submitContact({
      name: data.get("name"),
      email: data.get("email"),
      mobileNumber: data.get("mobileNumber"),
    });
    form.reset();
    showStatus("Message sent! ✨ I'll get back to you soon.", false);
    hideTimer = setTimeout(hideStatus, SUCCESS_VISIBLE_MS);
  } catch (err) {
    console.error(err);
    showStatus("Could not send. Please check your details and try again.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = buttonHtml;
  }
});
