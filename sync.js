const SUPABASE_URL = 'https://qguvfnrchjviswsuwano.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DlFQfSRQsXMG7O27ns8yRg_mlHN6xrL';
const SESSION_KEY = 'hanstep-session';
const accountButton = document.querySelector('#accountButton');
const backdrop = document.querySelector('#authBackdrop');
const authForm = document.querySelector('#authForm');
const signedPanel = document.querySelector('#signedPanel');
const authMessage = document.querySelector('#authMessage');
const syncLabel = document.querySelector('#syncLabel');
let session = readSession();
let syncTimer;
let applyingCloud = false;

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function normalizePhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) throw new Error('请输入正确的手机号码');
  return digits;
}
function accountEmail(phone) { return `${phone}@hanstep.app`; }
async function api(path, options = {}, token = null) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || '请求失败，请稍后再试');
  return data;
}
function localState() {
  return {
    progress: JSON.parse(localStorage.getItem('hanstep-progress') || '{}'),
    xp: Number(localStorage.getItem('hanstep-xp') || 0),
    quests: JSON.parse(localStorage.getItem('hanstep-quests') || '{}')
  };
}
function hasProgress(state) {
  return state.xp > 0 || Object.keys(state.progress || {}).length > 0 || Object.keys(state.quests || {}).length > 0;
}
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function applyState(state) {
  applyingCloud = true;
  localStorage.setItem('hanstep-progress', JSON.stringify(state.progress || {}));
  localStorage.setItem('hanstep-xp', String(state.xp || 0));
  localStorage.setItem('hanstep-quests', JSON.stringify(state.quests || {}));
  applyingCloud = false;
}
function setAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle('error', isError);
}
function updateAccountUI() {
  const loggedIn = Boolean(session?.access_token);
  authForm.hidden = loggedIn;
  signedPanel.hidden = !loggedIn;
  accountButton.textContent = loggedIn ? '✓ 已同步' : '登录同步';
  syncLabel.textContent = loggedIn ? '云同步已开启 · 手机、电脑和 iPad 进度一致' : '本机模式 · 登录后可在手机、电脑和 iPad 同步';
  if (loggedIn) document.querySelector('#signedPhone').textContent = session.phone;
}
async function refreshSession() {
  if (!session?.refresh_token) return false;
  try {
    const phone = session.phone;
    const data = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
    session = { ...data, phone };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    session = null;
    localStorage.removeItem(SESSION_KEY);
    updateAccountUI();
    return false;
  }
}
async function cloudRequest(path, options = {}) {
  try { return await api(path, options, session.access_token); }
  catch (error) {
    if (/jwt|token|expired/i.test(error.message) && await refreshSession()) return api(path, options, session.access_token);
    throw error;
  }
}
async function loadOrSeedCloud() {
  const rows = await cloudRequest(`/rest/v1/hanstep_progress?user_id=eq.${session.user.id}&select=state`);
  if (rows.length && hasProgress(rows[0].state || {})) {
    const cloudState = rows[0].state;
    if (stableStringify(cloudState) !== stableStringify(localState())) {
      applyState(cloudState);
      if (!sessionStorage.getItem('malbit-cloud-applied')) {
        sessionStorage.setItem('malbit-cloud-applied', '1');
        location.reload();
      }
    }
    return;
  }
  await uploadState();
}
async function uploadState() {
  if (!session?.access_token || applyingCloud) return;
  await cloudRequest('/rest/v1/hanstep_progress?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: session.user.id, state: localState(), updated_at: new Date().toISOString() })
  });
  syncLabel.textContent = '刚刚已同步 · 手机、电脑和 iPad 进度一致';
}
function scheduleSync() {
  if (!session?.access_token) return;
  clearTimeout(syncTimer);
  syncLabel.textContent = '正在同步学习进度…';
  syncTimer = setTimeout(() => uploadState().catch(() => { syncLabel.textContent = '同步暂时失败 · 本机进度仍已保存'; }), 500);
}
async function authenticate(mode) {
  try {
    setAuthMessage(mode === 'signup' ? '正在创建账号…' : '正在登录…');
    const phone = normalizePhone(document.querySelector('#phoneInput').value);
    const password = document.querySelector('#passwordInput').value;
    if (password.length < 6) throw new Error('密码至少需要 6 位');
    const path = mode === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    const data = await api(path, { method: 'POST', body: JSON.stringify({ email: accountEmail(phone), password, data: { phone_login: phone } }) });
    if (!data.access_token) throw new Error('账号已创建，但项目仍要求邮件确认。请在 Supabase 关闭 Confirm email 后再试');
    session = { ...data, phone };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    updateAccountUI();
    setAuthMessage(mode === 'signup' ? '账号创建成功，正在上传当前进度…' : '登录成功，正在读取云端进度…');
    await loadOrSeedCloud();
    setAuthMessage('同步完成');
  } catch (error) { setAuthMessage(error.message, true); }
}

accountButton.onclick = () => { backdrop.hidden = false; updateAccountUI(); };
document.querySelector('#authClose').onclick = () => { backdrop.hidden = true; };
backdrop.onclick = event => { if (event.target === backdrop) backdrop.hidden = true; };
authForm.onsubmit = event => { event.preventDefault(); authenticate('login'); };
document.querySelector('#signupButton').onclick = () => authenticate('signup');
document.querySelector('#logoutButton').onclick = () => {
  api('/auth/v1/logout', { method: 'POST' }, session?.access_token).catch(() => {});
  session = null;
  localStorage.removeItem(SESSION_KEY);
  setAuthMessage('已退出。本机仍保留当前学习进度。');
  updateAccountUI();
};
['#learn','#listen','#speak','#home','#reset'].forEach(selector => document.querySelector(selector)?.addEventListener('click', scheduleSync));
updateAccountUI();
if (session?.access_token) loadOrSeedCloud().catch(() => { syncLabel.textContent = '同步暂时失败 · 本机进度仍已保存'; });
