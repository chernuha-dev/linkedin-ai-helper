const $ = id => document.getElementById(id);
const state = { serious: '', humorous: '', selected: 'serious', capabilities: null };

function notice(message, error = false) {
  const el = $('notice');
  el.textContent = message;
  el.classList.toggle('error', error);
  el.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function api(path, payload) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Assistant-Request': '1' }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Что-то пошло не так.');
  return data;
}

async function busy(button, task) {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Подождите…';
  try { await task(); }
  catch (error) { notice(error.message, true); }
  finally { button.disabled = false; button.textContent = original; }
}

async function status() {
  const data = await fetch('/api/status').then(r => r.json());
  state.capabilities = data;
  $('connection-dot').classList.toggle('on', data.connected);
  $('connection-text').textContent = data.connected ? `Подключён: ${data.name}` : 'LinkedIn не подключён';
  $('connect').hidden = data.connected || !data.linkedinReady;
  $('disconnect').hidden = !data.connected;
  $('publish-button').disabled = !data.connected;
  $('publish-hint').textContent = data.connected ? 'Будет опубликован ровно текст из поля выше.' : 'Чтобы публиковать из приложения, настрой LinkedIn OAuth. Сейчас можно скопировать текст и опубликовать вручную.';
  showProviderStatus();
}

function showProviderStatus() {
  const data = state.capabilities;
  if (!data) return;
  if ($('provider').value === 'codex' && !data.codexReady) notice('Для режима подписки запусти npm install и npx codex login в терминале.', true);
  else if ($('provider').value === 'api' && !data.aiReady) notice('Для режима API добавь OPENAI_API_KEY и OPENAI_MODEL в локальный .env и перезапусти приложение.', true);
  else if ($('notice').classList.contains('error')) $('notice').hidden = true;
}
$('provider').addEventListener('change', showProviderStatus);

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  const isPost = tab.dataset.tab === 'post';
  $('post-panel').hidden = !isPost;
  $('comment-panel').hidden = isPost;
  document.querySelectorAll('.tab').forEach(item => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', String(item === tab)); });
}));

$('connect').addEventListener('click', () => { location.href = '/auth/linkedin'; });
$('disconnect').addEventListener('click', () => busy($('disconnect'), async () => { await api('/api/disconnect', {}); await status(); notice('LinkedIn отключён. Токен удалён из памяти приложения.'); }));

$('questions-button').addEventListener('click', () => busy($('questions-button'), async () => {
  const data = await api('/api/questions', { note: $('note').value, provider: $('provider').value });
  $('questions-list').replaceChildren(...data.questions.map((question, i) => {
    const p = document.createElement('p'); p.className = 'question'; p.textContent = `${i + 1}. ${question}`; return p;
  }));
  $('questions-box').hidden = false;
  $('questions-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

$('drafts-button').addEventListener('click', () => busy($('drafts-button'), async () => {
  const data = await api('/api/drafts', { note: $('note').value, answers: $('answers').value, language: $('language').value, provider: $('provider').value });
  state.serious = data.serious; state.humorous = data.humorous; state.selected = 'serious';
  $('draft').value = data.serious;
  $('serious-button').classList.add('active'); $('humorous-button').classList.remove('active');
  renderChecklist('checklist', data.checklist);
  $('drafts-box').hidden = false;
  $('drafts-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

function choose(kind) {
  state[state.selected] = $('draft').value;
  state.selected = kind;
  $('draft').value = state[kind];
  $('serious-button').classList.toggle('active', kind === 'serious');
  $('humorous-button').classList.toggle('active', kind === 'humorous');
}
$('serious-button').addEventListener('click', () => choose('serious'));
$('humorous-button').addEventListener('click', () => choose('humorous'));

function renderChecklist(id, items) {
  const box = $(id); box.replaceChildren();
  if (!items?.length) { box.hidden = true; return; }
  box.hidden = false;
  const title = document.createElement('strong'); title.textContent = 'Перед публикацией проверь';
  const list = document.createElement('ul');
  items.forEach(item => { const li = document.createElement('li'); li.textContent = item; list.append(li); });
  box.append(title, list);
}

$('copy-post').addEventListener('click', () => busy($('copy-post'), async () => { await navigator.clipboard.writeText($('draft').value); notice('Текст поста скопирован.'); }));
$('publish-button').addEventListener('click', () => busy($('publish-button'), async () => {
  const content = $('draft').value.trim();
  if (!content) throw new Error('Пост пустой.');
  if (!confirm(`Опубликовать этот текст в LinkedIn от твоего имени?\n\n${content.slice(0, 500)}${content.length > 500 ? '…' : ''}`)) return;
  const result = await api('/api/publish', { content, approval: 'PUBLISH_EXACT_TEXT' });
  notice(`Пост опубликован в LinkedIn${result.id ? ` (ID: ${result.id})` : ''}.`);
}));

$('comments-button').addEventListener('click', () => busy($('comments-button'), async () => {
  const data = await api('/api/comments', { post: $('source-post').value, angle: $('angle').value, language: $('comment-language').value, provider: $('provider').value });
  const box = $('comment-options'); box.replaceChildren();
  data.comments.forEach((comment, index) => {
    const card = document.createElement('div'); card.className = 'comment-card';
    const title = document.createElement('label'); title.textContent = `Вариант ${index + 1}`;
    const field = document.createElement('textarea'); field.value = comment; field.rows = 4;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'small secondary'; copy.textContent = 'Скопировать';
    copy.addEventListener('click', () => busy(copy, async () => { await navigator.clipboard.writeText(field.value); notice('Комментарий скопирован. Проверь его перед отправкой.'); }));
    card.append(title, field, copy); box.append(card);
  });
  renderChecklist('comment-checklist', data.checklist);
  const sourceUrl = $('source-url').value.trim();
  const link = $('open-source');
  try { const url = new URL(sourceUrl); link.hidden = url.hostname !== 'www.linkedin.com' && url.hostname !== 'linkedin.com'; if (!link.hidden) link.href = url.href; }
  catch { link.hidden = true; }
  $('comments-box').hidden = false;
  $('comments-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

status().catch(error => notice(error.message, true));
