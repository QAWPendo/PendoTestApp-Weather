console.log("hello world");

const form = document.getElementById("feedback-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status${type ? ` ${type}` : ""}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const formData = new FormData(form);
  const payload = {
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
    category: formData.get("category") || "general",
    message: formData.get("message"),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const response = await fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = data.details?.[0]?.message || data.message || "Something went wrong.";
      setStatus(detail, "error");
      return;
    }

    form.reset();
    setStatus("Thanks for your feedback! We received your message.", "success");

    if (typeof pendo !== "undefined") {
      pendo.track("feedback_submitted", {
        category: payload.category,
        rating: payload.rating || 0,
        has_name: !!payload.name,
        has_email: !!payload.email,
        message_length: (payload.message || "").length,
      });
    }
  } catch {
    setStatus("Unable to submit feedback right now. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send feedback";
  }
});
