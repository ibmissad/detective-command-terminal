const KEY_PASS = "scc.hostpass";
const KEY_OK = "scc.hostok";

export const DEFAULT_HOST_PASSCODE = "1234";

export function readHostPasscode() {
  if (typeof window === "undefined") return DEFAULT_HOST_PASSCODE;
  return window.localStorage.getItem(KEY_PASS) || DEFAULT_HOST_PASSCODE;
}

export function setHostPasscode(code: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PASS, code.trim());
}

export function isHostUnlocked() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY_OK) === "1";
}

export function tryUnlockHost(code: string) {
  if (code.trim() !== readHostPasscode()) return false;
  window.localStorage.setItem(KEY_OK, "1");
  return true;
}

export function lockHost() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_OK);
}
