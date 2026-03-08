// ── Event handlers ───────────────────────────────────────────
import { state, save, savePoogie, getLoggedInUser, setLoggedInUser, getUserRole, setUserRole } from './state.js';
import { render, renderQuestGrid, renderStats, renderQuestDetail, renderHunterCard, renderRewardOptions } from './render.js';
import { RANKS, POOGIE_OUTFITS, randomQuote } from './data.js';
import { $, showToast } from './utils.js';

export function bindEvents() {
  // ── Auth ────────────────────────────────────────────────
  $('authToggle')?.addEventListener('click', () => {
    const panel = $('authPanel');
    panel?.classList.toggle('open');
    if (panel?.classList.contains('open')) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      $('authLoginForm').hidden = !isLogin;
      $('authRegisterForm').hidden = isLogin;
    });
  });

  $('authLoginBtn')?.addEventListener('click', () => handleLocalAuth('login'));
  $('authRegBtn')?.addEventListener('click', () => handleLocalAuth('register'));
  $('authLogout')?.addEventListener('click', () => {
    setLoggedInUser(null); setUserRole(null);
    renderAuthState(null);
    showToast('Logged out. See you next hunt!');
  });

  ['authLoginUser', 'authLoginPass'].forEach(id => {
    $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLocalAuth('login'); });
  });
  ['authRegUser', 'authRegPass'].forEach(id => {
    $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLocalAuth('register'); });
  });

  const savedUser = getLoggedInUser();
  if (savedUser) renderAuthState(savedUser, getUserRole());

  // ── Rank tabs ──────────────────────────────────────────
  document.querySelectorAll('.rank-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filterRank = tab.dataset.rank;
      renderQuestGrid();
    });
  });

  // ── Filters ────────────────────────────────────────────
  $('filterStatus')?.addEventListener('change', e => {
    state.filterStatus = e.target.value;
    renderQuestGrid();
  });

  $('filterCategory')?.addEventListener('change', e => {
    state.filterCategory = e.target.value;
    renderQuestGrid();
  });

  // ── Post quest ─────────────────────────────────────────
  $('postQuestBtn')?.addEventListener('click', () => {
    if (!getLoggedInUser()) { showToast('Log in to post quests'); return; }
    renderRewardOptions();
    document.getElementById('postModal').classList.add('open');
  });

  $('postCancel')?.addEventListener('click', () => closeModal('postModal'));
  $('postSubmit')?.addEventListener('click', submitQuest);

  $('questRank')?.addEventListener('change', updateStarOptions);

  // ── SOS Flare ──────────────────────────────────────────
  $('sosBtn')?.addEventListener('click', () => {
    showToast('SOS Flare launched! Hunters have been alerted!');
    $('sosBtn')?.classList.add('sos-active');
    setTimeout(() => $('sosBtn')?.classList.remove('sos-active'), 2000);
  });

  // ── Poogie ─────────────────────────────────────────────
  $('poogie')?.addEventListener('click', petPoogie);

  // ── Close modals on backdrop click ─────────────────────
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // ── Keyboard shortcuts ─────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  // ── Expose to window for onclick handlers ──────────────
  window.openQuest = openQuest;
  window.closeModal = closeModal;
  window.acceptQuest = acceptQuest;
  window.completeQuest = completeQuest;
  window.openHunter = openHunter;
}

function openQuest(id) {
  renderQuestDetail(id);
}

function openHunter(username) {
  renderHunterCard(username);
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function handleLocalAuth(action) {
  const isLogin = action === 'login';
  const userEl = $(isLogin ? 'authLoginUser' : 'authRegUser');
  const passEl = $(isLogin ? 'authLoginPass' : 'authRegPass');
  const username = userEl?.value.trim();
  const password = passEl?.value;
  if (!username || !password) { showToast('Enter hunter name and password'); return; }

  // Local auth (no backend): accept any credentials
  const role = username.toLowerCase() === 'guildmaster' ? 'guildmaster' : 'hunter';
  setLoggedInUser(username);
  setUserRole(role);
  renderAuthState(username, role);
  showToast(isLogin ? `Welcome back, ${username}!` : `Welcome to the guild, ${username}!`);
  if (userEl) userEl.value = '';
  if (passEl) passEl.value = '';
  $('authPanel')?.classList.remove('open');
}

function renderAuthState(username, role) {
  const loggedIn = !!username;
  $('authGate').hidden = loggedIn;
  const authUser = $('authUser');
  if (authUser) authUser.hidden = !loggedIn;
  $('authToggle')?.classList.toggle('logged-in', loggedIn);
  if (loggedIn) {
    $('authUsername').textContent = username;
    const roleEl = $('authRole');
    if (roleEl) roleEl.hidden = role !== 'guildmaster';
  }
}

function submitQuest() {
  const title = $('questTitle')?.value.trim();
  const desc = $('questDesc')?.value.trim();
  const rank = $('questRank')?.value;
  const stars = parseInt($('questStars')?.value, 10);
  const category = $('questCategory')?.value;
  const repo = $('questRepo')?.value.trim();
  const reward = document.getElementById('questReward')?.value || '';
  const user = getLoggedInUser();

  if (!title) { showToast('Quest needs a name, hunter!'); return; }
  if (!desc) { showToast('Describe the objective'); return; }

  const quest = {
    id: 'q-' + Date.now(),
    title, description: desc, rank, stars, category,
    status: 'posted',
    repository: repo,
    reward,
    postedBy: user || 'Anonymous',
    acceptedBy: [],
    completedBy: [],
    createdAt: Date.now(),
  };

  state.quests.unshift(quest);
  save(state);
  closeModal('postModal');
  renderQuestGrid();
  renderStats();
  showToast('Quest posted to the board!');
  clearPostForm();
}

function clearPostForm() {
  if ($('questTitle')) $('questTitle').value = '';
  if ($('questDesc')) $('questDesc').value = '';
  if ($('questRepo')) $('questRepo').value = '';
}

function updateStarOptions() {
  const rank = $('questRank')?.value;
  const starsEl = $('questStars');
  if (!starsEl || !rank) return;
  const range = RANKS[rank]?.stars || [1, 2, 3];
  starsEl.innerHTML = range.map(s => `<option value="${s}">${s}</option>`).join('');
}

function acceptQuest(id) {
  const user = getLoggedInUser();
  if (!user) { showToast('Log in first!'); return; }
  const q = state.quests.find(x => x.id === id);
  if (!q || q.acceptedBy.includes(user)) return;

  q.acceptedBy.push(user);
  if (q.status === 'posted') q.status = 'active';
  save(state);
  renderQuestDetail(id);
  renderQuestGrid();
  renderStats();
  showToast(`Quest accepted! Happy hunting, ${user}!`);
}

function completeQuest(id) {
  const user = getLoggedInUser();
  if (!user) return;
  const q = state.quests.find(x => x.id === id);
  if (!q || q.completedBy.includes(user)) return;

  q.completedBy.push(user);
  if (q.completedBy.length >= q.acceptedBy.length && q.acceptedBy.length > 0) {
    q.status = 'completed';
  }
  save(state);
  renderQuestDetail(id);
  renderQuestGrid();
  renderStats();
  showQuestComplete();
}

function showQuestComplete() {
  const overlay = document.createElement('div');
  overlay.className = 'quest-complete-overlay';
  overlay.innerHTML = '<div class="quest-complete-text">QUEST COMPLETE</div>';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('show'), 10);
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 500);
  }, 2500);
  showToast(randomQuote());
}

let poogieOutfitIdx = 0;
function petPoogie() {
  state.poogiePets++;
  savePoogie(state.poogiePets);
  const poog = $('poogie');
  if (!poog) return;

  poogieOutfitIdx = (poogieOutfitIdx + 1) % POOGIE_OUTFITS.length;
  const outfit = POOGIE_OUTFITS[poogieOutfitIdx];
  poog.textContent = outfit.emoji;
  poog.classList.add('pet');
  setTimeout(() => poog.classList.remove('pet'), 400);

  if (state.poogiePets === 1) showToast('You pet Poogie! Oink oink!');
  else if (state.poogiePets === 10) showToast("Poogie loves you! Badge unlocked: Palico's Friend!");
  else if (state.poogiePets % 5 === 0) showToast(`Poogie is wearing: ${outfit.name}`);
  else showToast('Oink!');
}
