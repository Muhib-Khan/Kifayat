const PENDING_SIGNUP_KEY = "kifayat_pending_signup";

export const savePendingSignup = (data) => {
  localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(data));
};

export const getPendingSignup = () => {
  const raw = localStorage.getItem(PENDING_SIGNUP_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPendingSignup = () => {
  localStorage.removeItem(PENDING_SIGNUP_KEY);
};
