export function guestMenuUrl(origin: string): string | null {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (url.protocol !== "https:" || host === "localhost" || host === "127.0.0.1" || host.startsWith("id-preview--") || host.startsWith("preview--") || host.endsWith(".lovableproject.com")) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
}