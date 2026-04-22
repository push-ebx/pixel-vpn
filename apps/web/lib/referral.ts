const REFERRAL_CODE_KEY = "pixel-vpn-ref";

export function saveReferralCode(code: string) {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem(REFERRAL_CODE_KEY)) {
    window.localStorage.setItem(REFERRAL_CODE_KEY, code);
  }
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFERRAL_CODE_KEY);
}

export function clearReferralCode() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERRAL_CODE_KEY);
}
