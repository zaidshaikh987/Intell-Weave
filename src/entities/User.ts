export type UserType = {
  email: string;
  full_name?: string;
};

const LS_USER_KEY = 'intellweave_current_user';

export const User = {
  async me(): Promise<UserType> {
    // For demo: return a persisted or default guest user
    const raw = localStorage.getItem(LS_USER_KEY);
    if (raw) return JSON.parse(raw);
    const guest: UserType = { email: 'guest@example.com', full_name: 'Guest User' };
    localStorage.setItem(LS_USER_KEY, JSON.stringify(guest));
    return guest;
  },
  async login(): Promise<UserType> {
    // Demo login toggles between two demo users
    const user: UserType = { email: 'user@example.com', full_name: 'Demo User' };
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    return user;
  },
  async logout(): Promise<void> {
    const guest: UserType = { email: 'guest@example.com', full_name: 'Guest User' };
    localStorage.setItem(LS_USER_KEY, JSON.stringify(guest));
  }
};
