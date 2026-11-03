(function () {
  "use strict";
  const navToggle = document.getElementById("menu-toggle");
  const primaryNav = document.getElementById("primary-nav");
  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const open = primaryNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    primaryNav.querySelectorAll("a").forEach(anchor => anchor.addEventListener("click", () => {
      primaryNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }));
  }

  const fileInput = document.getElementById("demo-file");
  const fileSelection = document.getElementById("file-selection");
  if (fileInput && fileSelection) fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) { fileSelection.textContent = "No file selected"; return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      fileInput.value = "";
      fileSelection.textContent = "Choose a PDF, JPEG or PNG up to 10 MiB. No file was uploaded.";
      return;
    }
    fileSelection.textContent = "Selected locally: " + file.name + " · " + Math.ceil(file.size / 1024) + " KB. No file was uploaded.";
  });
  const filter = document.getElementById("review-filter");
  const rows = Array.from(document.querySelectorAll("#review-rows tr"));
  if (filter) filter.addEventListener("change", () => rows.forEach(row => {
    row.hidden = filter.value !== "all" && row.dataset.status !== filter.value;
  }));
  const reviewMessage = document.getElementById("review-message");
  document.querySelectorAll("[data-decision]").forEach(button => button.addEventListener("click", () => {
    const row = button.closest("tr");
    if (!row) return;
    const status = button.dataset.decision;
    row.dataset.status = status;
    const statusCell = row.children[3];
    statusCell.innerHTML = '<span class="status-pill ' + (status === "approved" ? "status-approved" : "status-rejected") + '">' + (status === "approved" ? "Approved demo" : "Rejected demo") + '</span>';
    row.children[4].innerHTML = '<span class="muted-cell">Demo state only</span>';
    if (reviewMessage) {
      reviewMessage.hidden = false;
      reviewMessage.textContent = "The sample row was marked " + status + " in this browser only. No candidate record, document decision or audit event was changed in Kingsmen.";
    }
    if (filter) filter.dispatchEvent(new Event("change"));
  }));
})();