// ── DOM rendering ────────────────────────────────────────────
import { state, getLoggedInUser } from './state.js';
import { RANKS, CATEGORIES, BADGES, hunterTitleForCompletions, randomQuote } from './data.js';
import { escHtml, starsHtml, timeAgo } from './utils.js';

export function render() {
  renderMotto();
  renderStats();
  renderQuestGrid();
}

function renderMotto() {
  const el = document.getElementById('guildMotto');
  if (el) el.textContent = randomQuote();
}

export function renderStats() {
  const sq = document.getElementById('statQuests');
  const sh = document.getElementById('statHunters');
  const sc = document.getElementById('statCompleted');
  if (sq) sq.textContent = state.quests.length;
  const uniqueHunters = new Set();
  state.quests.forEach(q => {
    q.acceptedBy.forEach(h => uniqueHunters.add(h));
    q.completedBy.forEach(h => uniqueHunters.add(h));
  });
  if (sh) sh.textContent = uniqueHunters.size;
  if (sc) sc.textContent = state.quests.filter(q => q.status === 'completed').length;
}

export function renderQuestGrid() {
  const grid = document.getElementById('questGrid');
  if (!grid) return;

  const filtered = filterQuests();
  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = `${filtered.length} quest${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No quests match your filters. The quest board is empty... for now.</div>';
    return;
  }

  grid.innerHTML = filtered.map(q => questCardHtml(q)).join('');
}

function filterQuests() {
  return state.quests.filter(q => {
    if (state.filterRank !== 'all' && q.rank !== state.filterRank) return false;
    if (state.filterStatus !== 'all' && q.status !== state.filterStatus) return false;
    if (state.filterCategory !== 'all' && q.category !== state.filterCategory) return false;
    return true;
  });
}

function questCardHtml(q) {
  const rank = RANKS[q.rank] || RANKS.low;
  const cat = CATEGORIES[q.category] || CATEGORIES.hunt;
  const statusCls = `status-${q.status}`;
  const statusLabel = q.status.charAt(0).toUpperCase() + q.status.slice(1);
  const hunters = q.acceptedBy.length;
  const reward = BADGES.find(b => b.key === q.reward);

  return `
    <div class="quest-card rank-${escHtml(q.rank)}" data-id="${escHtml(q.id)}" onclick="window.openQuest('${escHtml(q.id)}')">
      <div class="quest-card-header">
        <span class="quest-rank-badge rank-${escHtml(q.rank)}">${escHtml(rank.label)}</span>
        <span class="quest-stars">${starsHtml(q.stars, q.rank)}</span>
        <span class="quest-status ${statusCls}">${escHtml(statusLabel)}</span>
      </div>
      <h3 class="quest-title">${escHtml(q.title)}</h3>
      <p class="quest-desc">${escHtml(q.description)}</p>
      <div class="quest-meta">
        <span class="quest-category">${cat.icon} ${escHtml(cat.label)}</span>
        ${q.repository ? `<span class="quest-repo">${escHtml(q.repository)}</span>` : ''}
        <span class="quest-hunters">${hunters > 0 ? `${hunters} hunter${hunters > 1 ? 's' : ''}` : 'No hunters yet'}</span>
        ${reward ? `<span class="quest-reward-tag">${reward.icon} ${escHtml(reward.name)}</span>` : ''}
      </div>
      <div class="quest-footer">
        <span class="quest-posted-by">Posted by ${escHtml(q.postedBy)}</span>
        <span class="quest-time">${timeAgo(q.createdAt)}</span>
      </div>
    </div>`;
}

export function renderQuestDetail(questId) {
  const q = state.quests.find(x => x.id === questId);
  if (!q) return;

  const rank = RANKS[q.rank] || RANKS.low;
  const cat = CATEGORIES[q.category] || CATEGORIES.hunt;
  const reward = BADGES.find(b => b.key === q.reward);
  const user = getLoggedInUser();
  const isAccepted = user && q.acceptedBy.includes(user);
  const isCompleted = user && q.completedBy.includes(user);
  const canAccept = user && q.status !== 'completed' && !isAccepted;
  const canComplete = user && isAccepted && !isCompleted && q.status !== 'completed';

  const detail = document.getElementById('questDetail');
  detail.innerHTML = `
    <button class="modal-close" onclick="window.closeModal('questModal')">&times;</button>
    <div class="qd-header">
      <span class="quest-rank-badge rank-${escHtml(q.rank)}">${escHtml(rank.label)}</span>
      <span class="quest-stars quest-stars-lg">${starsHtml(q.stars, q.rank)}</span>
      <span class="quest-status status-${q.status}">${q.status.charAt(0).toUpperCase() + q.status.slice(1)}</span>
    </div>
    <h2 class="qd-title">${escHtml(q.title)}</h2>
    <div class="qd-category">${cat.icon} ${escHtml(cat.label)} ${cat.desc ? `- ${escHtml(cat.desc)}` : ''}</div>
    <p class="qd-desc">${escHtml(q.description)}</p>
    ${q.repository ? `<div class="qd-repo">Repository: <strong>${escHtml(q.repository)}</strong></div>` : ''}
    ${reward ? `<div class="qd-reward">Reward: <span class="reward-badge">${reward.icon} ${escHtml(reward.name)}</span> - ${escHtml(reward.description)}</div>` : ''}
    <div class="qd-info">
      <div>Posted by <strong>${escHtml(q.postedBy)}</strong> - ${timeAgo(q.createdAt)}</div>
      ${q.acceptedBy.length > 0 ? `<div>Hunters: ${q.acceptedBy.map(h => `<span class="hunter-tag" onclick="window.openHunter('${escHtml(h)}')">${escHtml(h)}</span>`).join(' ')}</div>` : ''}
      ${q.completedBy.length > 0 ? `<div>Completed by: ${q.completedBy.map(h => `<span class="hunter-tag completed">${escHtml(h)}</span>`).join(' ')}</div>` : ''}
    </div>
    <div class="qd-actions">
      ${canAccept ? `<button class="btn-accept" onclick="window.acceptQuest('${escHtml(q.id)}')">Accept Quest</button>` : ''}
      ${canComplete ? `<button class="btn-complete" onclick="window.completeQuest('${escHtml(q.id)}')">Carve Rewards</button>` : ''}
      ${!user ? '<p class="qd-login-hint">Log in to accept quests and earn rewards</p>' : ''}
    </div>`;

  document.getElementById('questModal').classList.add('open');
}

export function renderHunterCard(username) {
  const completions = state.quests.filter(q => q.completedBy.includes(username)).length;
  const accepted = state.quests.filter(q => q.acceptedBy.includes(username)).length;
  const title = hunterTitleForCompletions(completions);
  const earnedBadges = getHunterBadges(username);

  const card = document.getElementById('hunterCard');
  card.innerHTML = `
    <button class="modal-close" onclick="window.closeModal('hunterModal')">&times;</button>
    <div class="hc-header">
      <div class="hc-avatar">${username.charAt(0).toUpperCase()}</div>
      <div>
        <h2 class="hc-name">${escHtml(username)}</h2>
        <div class="hc-title">${escHtml(title)}</div>
      </div>
    </div>
    <div class="hc-stats">
      <div class="hc-stat"><span class="stat-num">${completions}</span><span class="stat-label">Completed</span></div>
      <div class="hc-stat"><span class="stat-num">${accepted}</span><span class="stat-label">Accepted</span></div>
      <div class="hc-stat"><span class="stat-num">${earnedBadges.length}</span><span class="stat-label">Badges</span></div>
    </div>
    ${earnedBadges.length > 0 ? `
    <div class="hc-badges">
      <h4>Badges</h4>
      <div class="badge-grid">${earnedBadges.map(b => `
        <div class="badge-item badge-${escHtml(b.tier)}">
          <span class="badge-icon">${b.icon}</span>
          <span class="badge-name">${escHtml(b.name)}</span>
        </div>`).join('')}
      </div>
    </div>` : '<p class="hc-no-badges">No badges earned yet. Accept some quests!</p>'}
    <div class="hc-quests">
      <h4>Quest History</h4>
      ${state.quests.filter(q => q.completedBy.includes(username)).map(q => `
        <div class="hc-quest-row">
          <span class="quest-rank-badge rank-${escHtml(q.rank)} small">${starsHtml(q.stars, q.rank)}</span>
          <span>${escHtml(q.title)}</span>
        </div>`).join('') || '<p class="hc-empty">No completed quests yet</p>'}
    </div>`;

  document.getElementById('hunterModal').classList.add('open');
}

function getHunterBadges(username) {
  const completions = state.quests.filter(q => q.completedBy.includes(username));
  const earned = [];
  const completedCount = completions.length;
  const bugSlays = completions.filter(q => q.category === 'slay').length;
  const multiHunts = completions.filter(q => q.acceptedBy.length > 1).length;
  const maxStars = completions.reduce((max, q) => Math.max(max, q.stars), 0);

  if (completedCount >= 1)  earned.push(BADGES.find(b => b.key === 'first-hunt'));
  if (bugSlays >= 5)        earned.push(BADGES.find(b => b.key === 'bug-slayer'));
  if (multiHunts >= 3)      earned.push(BADGES.find(b => b.key === 'team-player'));
  if (completedCount >= 10) earned.push(BADGES.find(b => b.key === 'rising-star'));
  if (maxStars >= 6)        earned.push(BADGES.find(b => b.key === 'code-wyvern'));
  if (completedCount >= 25) earned.push(BADGES.find(b => b.key === 'elder-hunter'));
  if (maxStars >= 9)        earned.push(BADGES.find(b => b.key === 'sapphire-star'));
  if (completedCount >= 50) earned.push(BADGES.find(b => b.key === 'ace-hunter'));

  return earned.filter(Boolean);
}

export function renderRewardOptions() {
  const sel = document.getElementById('questReward');
  if (!sel) return;
  sel.innerHTML = '<option value="">No reward</option>' +
    BADGES.map(b => `<option value="${escHtml(b.key)}">${b.icon} ${escHtml(b.name)} (${escHtml(b.tier)})</option>`).join('');
}
