/** Triggers a browser "Save As" download for an in-memory Blob — shared by
 *  every CSV export button (Tests/Packages/Parameters) since none of them
 *  navigate to a URL the backend can set `Content-Disposition` on directly
 *  (the request needs an Authorization header, so it goes through axios). */
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
