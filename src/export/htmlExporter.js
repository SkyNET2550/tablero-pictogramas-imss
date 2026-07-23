export function exportHtmlDocument(html, filename = "tablero.html") { return { filename, mime: "text/html", content: html }; }
