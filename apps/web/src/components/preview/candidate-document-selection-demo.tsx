"use client";

import { useState } from "react";

export default function CandidateDocumentSelectionDemo() {
  const [selection, setSelection] = useState("No file selected");
  const [error, setError] = useState("");

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setError("");
    if (!file) { setSelection("No file selected"); return; }
    const extension = file.name.toLowerCase().split(".").pop();
    const accepted = ["application/pdf", "image/jpeg", "image/png"].includes(file.type) || ["pdf", "jpg", "jpeg", "png"].includes(extension || "");
    if (!accepted) {
      event.currentTarget.value = "";
      setSelection("No file selected");
      setError("Choose a PDF, JPEG or PNG file. Nothing was uploaded.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      event.currentTarget.value = "";
      setSelection("No file selected");
      setError("The file is larger than 10 MiB. Nothing was uploaded.");
      return;
    }
    setSelection(file.name + " · " + Math.max(1, Math.ceil(file.size / 1024)) + " KB selected locally");
  }

  return (
    <div className="candidate-document-picker">
      <label htmlFor="candidate-demo-document">Choose a file to preview the selection state</label>
      <input id="candidate-demo-document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={onChange} />
      <p className="candidate-local-selection" role="status" aria-live="polite">{error || selection}</p>
      <p className="candidate-picker-boundary">The file remains local to this page. This control does not upload or save documents.</p>
    </div>
  );
}
