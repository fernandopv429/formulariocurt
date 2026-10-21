/**
 * Utilities for Brazilian phone formatting, validation, and metadata extraction
 */

export function formatBrazilianPhone(value: string): string {
  // Strip non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 11 digits (DDD + 9 digits)
  const truncated = digits.slice(0, 11);

  if (truncated.length === 0) return '';
  if (truncated.length <= 2) return `(${truncated}`;
  if (truncated.length <= 6) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
  if (truncated.length <= 10) {
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
  }
  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7, 11)}`;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Valid Brazilian phones have 10 or 11 digits (e.g. 11 99999-9999 or 11 8888-8888)
  return digits.length >= 10 && digits.length <= 13;
}

export function getUtmParameters(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'].forEach((key) => {
    const val = params.get(key);
    if (val) utms[key] = val;
  });

  return utms;
}

export function getClientMetadata() {
  if (typeof window === 'undefined') return {};
  return {
    referrer: document.referrer || 'direct',
    currentUrl: window.location.href,
    language: navigator.language,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    isMobileDevice: /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent),
  };
}
