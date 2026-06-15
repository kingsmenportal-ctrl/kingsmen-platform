export type JarvisFounderConsoleStaticHtmlInput = {
  title: string;
  generatedAtIso: string;
  bodySummary: string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const jarvisCreateFounderConsoleStaticHtml = (
  input: JarvisFounderConsoleStaticHtmlInput,
): string => {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body>
  <main data-jarvis-founder-console="static-html">
    <h1>${escapeHtml(input.title)}</h1>
    <p data-generated-at="${escapeHtml(input.generatedAtIso)}">Generated: ${escapeHtml(input.generatedAtIso)}</p>
    <section aria-label="Jarvis summary">
      <p>${escapeHtml(input.bodySummary)}</p>
    </section>
  </main>
</body>
</html>`;
};
