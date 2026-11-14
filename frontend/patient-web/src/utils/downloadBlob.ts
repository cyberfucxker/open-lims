/** Triggers a browser file-save for an already-fetched `Blob` — for a
 *  download that must go through `httpClient` (Bearer-authenticated), so a
 *  plain `<a href>` to the API endpoint can't attach the header itself. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
