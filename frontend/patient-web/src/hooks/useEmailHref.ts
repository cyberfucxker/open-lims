import { useIsDesktop } from "@/hooks/useMediaQuery";

/** A `mailto:` link reliably opens a configured app on mobile (Gmail/Mail
 *  app), but most desktop browsers have no default mail client set up —
 *  clicking it then does nothing visible, which just reads as a dead
 *  button. Desktop gets a Gmail web compose URL instead, which opens in any
 *  browser with no app required; mobile keeps the plain `mailto:`, which
 *  already works there. */
export function useEmailHref(
  address: string,
  options?: { subject?: string; body?: string },
): string {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    const params = new URLSearchParams({ view: "cm", fs: "1", to: address });
    if (options?.subject) params.set("su", options.subject);
    if (options?.body) params.set("body", options.body);
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  const params = new URLSearchParams();
  if (options?.subject) params.set("subject", options.subject);
  if (options?.body) params.set("body", options.body);
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ""}`;
}
