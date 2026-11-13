// Alamat langganan Web Push hanya diterima dari layanan push resmi browser, supaya server tidak bisa
// disuruh mengirim permintaan ke alamat sembarang (SSRF). Chrome/Android: FCM, Firefox: Mozilla,
// Safari: Apple, Edge/Windows: WNS.

const HOST_RESMI = ["fcm.googleapis.com", "web.push.apple.com", "push.services.mozilla.com", "notify.windows.com"];

export function endpointPushResmi(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port !== "") return false;
  const host = url.hostname.toLowerCase();
  return HOST_RESMI.some((h) => host === h || host.endsWith(`.${h}`));
}
