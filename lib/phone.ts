/** wa.me chat link for a phone number; 7-digit local Gambian numbers get the +220 country code. */
export function whatsappChatUrl(phoneDigits: string): string {
  const digits = phoneDigits.length === 7 ? `220${phoneDigits}` : phoneDigits.replace(/^00/, "");
  return `https://wa.me/${digits}`;
}
