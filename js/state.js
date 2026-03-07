// ── State management ─────────────────────────────────────────
import { SAMPLE_QUESTS } from './data.js';

const STORAGE_KEY = 'guild-hall';
const AUTH_USER_KEY = 'guild-hall-user';
const AUTH_ROLE_KEY = 'guild-hall-role';
const POOGIE_KEY = 'guild-hall-poogie';
const VISIT_KEY = 'guild-hall-visits';

export const state = {
  quests: [],
  hunters: [],
  filterRank: 'all',
  filterStatus: 'all',
  filterCategory: 'all',
  poogiePets: 0,
  visits: 0,
};

export function loadSaved(s) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(s, saved);
    }
    if (!s.quests || s.quests.length === 0) {
      s.quests = JSON.parse(JSON.stringify(SAMPLE_QUESTS));
    }
    if (!s.hunters) s.hunters = [];
    s.poogiePets = parseInt(localStorage.getItem(POOGIE_KEY) || '0', 10);
    s.visits = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_KEY, String(s.visits));
  } catch { /* ignore corrupted data */ }
}

export function save(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      quests: s.quests,
      hunters: s.hunters,
    }));
  } catch { /* quota exceeded */ }
}

export function savePoogie(count) {
  localStorage.setItem(POOGIE_KEY, String(count));
}

export function getLoggedInUser() {
  return localStorage.getItem(AUTH_USER_KEY) || null;
}

export function setLoggedInUser(username) {
  if (username) localStorage.setItem(AUTH_USER_KEY, username);
  else localStorage.removeItem(AUTH_USER_KEY);
}

export function getUserRole() {
  return localStorage.getItem(AUTH_ROLE_KEY) || 'hunter';
}

export function setUserRole(role) {
  if (role && role !== 'hunter') localStorage.setItem(AUTH_ROLE_KEY, role);
  else localStorage.removeItem(AUTH_ROLE_KEY);
}

// Convex client (uncomment when backend is connected)
// import { ConvexHttpClient } from 'convex/browser';
// export const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);
// import { api } from '../convex/_generated/api.js';
