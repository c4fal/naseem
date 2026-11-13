'use strict';
/* global api */

// ---------------- i18n ----------------
const I18N = {
  ar: {
    appName: 'نسيم', navHome: 'التنزيل', navHistory: 'السجل', navSettings: 'الإعدادات', openFolder: 'مجلد التنزيلات',
    heroTitle: 'نزّل أي فيديو أو صوت', heroSub: 'يوتيوب، تيك توك، إكس، إنستغرام، فيسبوك وأكثر من ألف موقع',
    urlPh: 'الصق الرابط هنا… (Ctrl+V)', paste: 'لصق', fetch: 'جلب', batchMode: 'تنزيل عدة روابط دفعة واحدة', batchPh: 'رابط في كل سطر…', addAll: 'إضافة الكل',
    video: 'فيديو', audio: 'صوت', quality: 'الجودة', format: 'الصيغة', best: 'أفضل جودة', download: 'تنزيل', subs: 'الترجمة', trim: 'قص مقطع', from: 'من', to: 'إلى',
    clipDetected: 'رابط جديد في الحافظة:', dismiss: 'تجاهل', downloads: 'التنزيلات', pauseAll: 'إيقاف الكل', resumeAll: 'استئناف الكل', clearFinished: 'مسح المنتهية',
    queueEmpty: 'لا توجد تنزيلات بعد. الصق رابطًا للبدء.', dropHere: 'أفلت الرابط هنا',
    engineMissingTitle: 'محرك التنزيل غير مثبت', engineMissingBody: 'يحتاج البرنامج إلى yt-dlp و FFmpeg (مفتوحَي المصدر). سيتم تنزيلهما من GitHub مرة واحدة (~100 ميغابايت).', installEngine: 'تثبيت المحرك',
    st_queued: 'في الانتظار', st_starting: 'جارٍ البدء…', st_downloading: 'جارٍ التنزيل', st_processing: 'جارٍ المعالجة والدمج…', st_done: 'اكتمل', st_error: 'فشل', st_canceled: 'أُلغي', st_paused: 'متوقف مؤقتًا',
    a_pause: 'إيقاف مؤقت', a_resume: 'استئناف', a_cancel: 'إلغاء', a_retry: 'إعادة المحاولة', a_open: 'تشغيل الملف', a_folder: 'إظهار في المجلد', a_remove: 'إزالة', a_copy: 'نسخ الرابط', a_redownload: 'تنزيل مجددًا',
    playlist: 'قائمة تشغيل', items: 'عنصر', selectAll: 'تحديد الكل', selectNone: 'إلغاء التحديد', downloadSelected: 'تنزيل المحدد', selected: 'محدد',
    fetching: 'جارٍ جلب المعلومات…', fetchFailed: 'تعذّر جلب الرابط', added: 'أُضيف إلى قائمة التنزيل', addedN: 'أُضيف {n} إلى قائمة التنزيل', invalidUrl: 'الرابط غير صالح',
    all: 'الكل', clearAll: 'مسح السجل', historyEmpty: 'السجل فارغ', searchPh: 'بحث…', totalFiles: 'ملف', totalSize: 'الحجم الكلي', missing: 'محذوف',
    confirmClear: 'مسح سجل التنزيلات بالكامل؟ (الملفات نفسها لن تُحذف)', copied: 'تم النسخ', views: 'مشاهدة', live: 'بث مباشر',
    g_general: 'عام', g_download: 'التنزيل', g_video: 'الفيديو', g_audio: 'الصوت', g_network: 'الشبكة والحسابات', g_engine: 'المحرك',
    s_dir: 'مجلد الحفظ', s_dirHint: 'المكان الذي تُحفظ فيه الملفات', change: 'تغيير', s_conc: 'التنزيلات المتزامنة', s_concHint: 'عدد الملفات التي تُنزّل في نفس الوقت',
    s_template: 'قالب اسم الملف', s_templateHint: 'بصيغة قوالب yt-dlp', s_mode: 'الوضع الافتراضي', s_quality: 'الجودة الافتراضية',
    s_container: 'حاوية الفيديو', s_h264: 'تفضيل H.264', s_h264Hint: 'أكثر توافقًا مع الهواتف والمشغلات', s_subs: 'تضمين الترجمة افتراضيًا', s_subLangs: 'لغات الترجمة', s_subLangsHint: 'مثل ar,en',
    s_sponsor: 'حذف المقاطع الإعلانية (SponsorBlock)', s_sponsorHint: 'يحذف الرعاية والترويج من فيديوهات يوتيوب', s_audioFmt: 'صيغة الصوت', s_thumb: 'تضمين الصورة المصغرة', s_thumbHint: 'كغلاف للملف',
    s_cookies: 'استخدام كوكيز المتصفح', s_cookiesHint: 'للمحتوى الخاص أو المقيد بالعمر', none: 'بدون', s_proxy: 'بروكسي', s_proxyHint: 'مثل socks5://127.0.0.1:1080', s_rate: 'حد السرعة', s_rateHint: 'مثل 2M أو 500K (فارغ = بلا حد)',
    s_clip: 'مراقبة الحافظة', s_clipHint: 'اقتراح الروابط المنسوخة تلقائيًا', s_autofetch: 'جلب تلقائي عند اللصق', s_notify: 'إشعار عند اكتمال التنزيل', s_lang: 'اللغة', s_theme: 'المظهر', dark: 'داكن', light: 'فاتح', system: 'حسب النظام',
    e_ytdlp: 'yt-dlp', e_ffmpeg: 'FFmpeg', e_update: 'تحديث المحرك', e_reinstall: 'إعادة التثبيت', notInstalled: 'غير مثبت', updating: 'جارٍ التحديث…', installing: 'جارٍ التثبيت…', e_done: 'تم بنجاح',
    eng_ytdlp: 'تنزيل yt-dlp', eng_ffmpeg: 'تنزيل FFmpeg', eng_extract: 'فك الضغط…', engineReady: 'المحرك جاهز', engineMissing: 'المحرك غير مثبت',
    ENGINE_MISSING: 'المحرك غير مثبت. ثبّته من الأعلى أولًا.', approx: '≈',
  },
  en: {
    appName: 'Naseem', navHome: 'Download', navHistory: 'History', navSettings: 'Settings', openFolder: 'Downloads folder',
    heroTitle: 'Download any video or audio', heroSub: 'YouTube, TikTok, X, Instagram, Facebook and 1000+ sites',
    urlPh: 'Paste a link here… (Ctrl+V)', paste: 'Paste', fetch: 'Fetch', batchMode: 'Download many links at once', batchPh: 'One link per line…', addAll: 'Add all',
    video: 'Video', audio: 'Audio', quality: 'Quality', format: 'Format', best: 'Best', download: 'Download', subs: 'Subtitles', trim: 'Trim clip', from: 'From', to: 'To',
    clipDetected: 'New link in clipboard:', dismiss: 'Dismiss', downloads: 'Downloads', pauseAll: 'Pause all', resumeAll: 'Resume all', clearFinished: 'Clear finished',
    queueEmpty: 'No downloads yet. Paste a link to start.', dropHere: 'Drop the link here',
    engineMissingTitle: 'Download engine not installed', engineMissingBody: 'Naseem needs yt-dlp and FFmpeg (open source). They will be downloaded once from GitHub (~100 MB).', installEngine: 'Install engine',
    st_queued: 'Queued', st_starting: 'Starting…', st_downloading: 'Downloading', st_processing: 'Processing & merging…', st_done: 'Completed', st_error: 'Failed', st_canceled: 'Canceled', st_paused: 'Paused',
    a_pause: 'Pause', a_resume: 'Resume', a_cancel: 'Cancel', a_retry: 'Retry', a_open: 'Open file', a_folder: 'Show in folder', a_remove: 'Remove', a_copy: 'Copy link', a_redownload: 'Download again',
    playlist: 'Playlist', items: 'items', selectAll: 'Select all', selectNone: 'Select none', downloadSelected: 'Download selected', selected: 'selected',
    fetching: 'Fetching info…', fetchFailed: 'Could not fetch link', added: 'Added to queue', addedN: 'Added {n} to queue', invalidUrl: 'Invalid link',
    all: 'All', clearAll: 'Clear history', historyEmpty: 'History is empty', searchPh: 'Search…', totalFiles: 'files', totalSize: 'Total size', missing: 'deleted',
    confirmClear: 'Clear the entire download history? (files are not deleted)', copied: 'Copied', views: 'views', live: 'Live',
    g_general: 'General', g_download: 'Downloading', g_video: 'Video', g_audio: 'Audio', g_network: 'Network & accounts', g_engine: 'Engine',
    s_dir: 'Save folder', s_dirHint: 'Where files are saved', change: 'Change', s_conc: 'Concurrent downloads', s_concHint: 'How many files download at once',
    s_template: 'Filename template', s_templateHint: 'yt-dlp syntax, e.g. %(title)s.%(ext)s', s_mode: 'Default mode', s_quality: 'Default quality',
    s_container: 'Video container', s_h264: 'Prefer H.264', s_h264Hint: 'Best compatibility with phones and players', s_subs: 'Embed subtitles by default', s_subLangs: 'Subtitle languages', s_subLangsHint: 'e.g. ar,en',
    s_sponsor: 'Remove sponsor segments (SponsorBlock)', s_sponsorHint: 'Cuts sponsors and self-promo from YouTube videos', s_audioFmt: 'Audio format', s_thumb: 'Embed thumbnail', s_thumbHint: 'As cover art',
    s_cookies: 'Use browser cookies', s_cookiesHint: 'For private or age-restricted content', none: 'None', s_proxy: 'Proxy', s_proxyHint: 'e.g. socks5://127.0.0.1:1080', s_rate: 'Speed limit', s_rateHint: 'e.g. 2M or 500K (empty = unlimited)',
    s_clip: 'Watch clipboard', s_clipHint: 'Suggest copied links automatically', s_autofetch: 'Auto-fetch on paste', s_notify: 'Notify when a download finishes', s_lang: 'Language', s_theme: 'Theme', dark: 'Dark', light: 'Light', system: 'System',
    e_ytdlp: 'yt-dlp', e_ffmpeg: 'FFmpeg', e_update: 'Update engine', e_reinstall: 'Reinstall', notInstalled: 'Not installed', updating: 'Updating…', installing: 'Installing…', e_done: 'Done',
    eng_ytdlp: 'Downloading yt-dlp', eng_ffmpeg: 'Downloading FFmpeg', eng_extract: 'Extracting…', engineReady: 'Engine ready', engineMissing: 'Engine missing',
    ENGINE_MISSING: 'Engine not installed. Install it from the banner first.', approx: '~',
  },
};

const ICONS = {
  download: '<path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  clipboard: '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  retry: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m10 13 4 2.5-4 2.5z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};

// ---------------- helpers ----------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = { settings: null, jobs: new Map(), history: [], info: null, engine: null, batchMode: 'video' };
const t = (k, vars) => { let s = (I18N[S.settings?.lang || 'ar'] || I18N.ar)[k] ?? I18N.en[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b); return s; };

function icon(name, cls = 'ic') { const s = document.createElement('span'); s.className = cls; s.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`; return s; }
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
const iconBtn = (name, title, onclick, cls = '') => h('button', { class: `icon-btn ${cls}`, title, 'aria-label': title, onclick }, icon(name));

function fmtBytes(n) { if (!n && n !== 0) return ''; const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return `${n.toFixed(n < 10 && i ? 1 : 0)} ${u[i]}`; }
function fmtDur(s) { if (s == null || !isFinite(s)) return ''; s = Math.round(s); const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60; return (hh ? `${hh}:${String(mm).padStart(2, '0')}` : `${mm}`) + `:${String(ss).padStart(2, '0')}`; }
function fmtDate(ms) { return new Date(ms).toLocaleString(S.settings.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }
function fmtNum(n) { return new Intl.NumberFormat(S.settings.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en', { notation: 'compact' }).format(n); }
const isUrl = (s) => /^https?:\/\/\S+$/i.test((s || '').trim());

function toast(msg, kind = '') {
  const el = h('div', { class: `toast ${kind}` }, msg);
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 3500);
}

const QUALITIES = ['best', '2160', '1440', '1080', '720', '480', '360', '240'];
const AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'flac', 'wav'];
function qualityLabel(q) { return q === 'best' ? t('best') : q === '2160' ? '4K (2160p)' : q === '1440' ? '2K (1440p)' : `${q}p`; }
function fillQualitySelect(sel, value) { sel.replaceChildren(...QUALITIES.map((q) => h('option', { value: q }, qualityLabel(q)))); sel.value = value || 'best'; }

// ---------------- i18n apply ----------------
function applyLang() {
  const lang = S.settings.lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $('#urlInput').placeholder = t('urlPh');
  $('#batchInput').placeholder = t('batchPh');
  $('#historySearch').placeholder = t('searchPh');
  document.title = t('appName');
}
function applyTheme() {
  const th = S.settings.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.settings.theme;
  document.documentElement.dataset.theme = th;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.settings && applyTheme());

// ---------------- navigation ----------------
function showView(v) {
  $$('.nav').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  $$('.view').forEach((s) => (s.hidden = s.id !== `view-${v}`));
  if (v === 'history') loadHistory();
  if (v === 'settings') renderSettings();
}

// ---------------- engine ----------------
async function refreshEngine() {
  S.engine = await api.engine.status();
  const ok = !!(S.engine.ytdlp && S.engine.ffmpeg);
  $('#engineBanner').hidden = ok;
  const pill = $('#enginePill');
  pill.replaceChildren(
    h('div', {}, h('span', { class: `dot ${ok ? '' : 'bad'}` }), h('b', {}, ok ? t('engineReady') : t('engineMissing'))),
    S.engine.ytdlp ? h('div', {}, 'yt-dlp ', h('bdi', {}, S.engine.ytdlp)) : null,
  );
  return ok;
}

async function installEngine(which = 'all') {
  const btn = $('#installEngineBtn');
  btn.disabled = true; btn.textContent = t('installing');
  $('#engineProg').hidden = false;
  const r = await api.engine.install(which);
  btn.disabled = false; btn.textContent = t('installEngine');
  $('#engineProg').hidden = true; $('#engineProgText').textContent = '';
  if (!r.ok) toast(`${t('fetchFailed')}: ${r.error}`, 'err'); else toast(t('e_done'), 'ok');
  await refreshEngine();
  if ($('#view-settings').hidden === false) renderSettings();
}
api.engine.onProgress(({ step, got, total }) => {
  const bar = $('#engineProg > div');
  const txt = $('#engineProgText');
  if (step === 'extract') { $('#engineProg').classList.add('indet'); txt.textContent = t('eng_extract'); return; }
  $('#engineProg').classList.remove('indet');
  if (step === 'done') return;
  bar.style.width = total ? `${(got / total) * 100}%` : '30%';
  txt.textContent = `${t('eng_' + step)} — ${fmtBytes(got)}${total ? ' / ' + fmtBytes(total) : ''}`;
  const sp = $('#settingsEngineMsg'); if (sp) sp.textContent = txt.textContent;
});

// ---------------- fetch & preview ----------------
let fetchToken = 0;
async function fetchUrl(url) {
  url = (url || '').trim();
  if (!isUrl(url)) { toast(t('invalidUrl'), 'err'); return; }
  $('#urlInput').value = url;
  $('#clipBar').hidden = true;
  const my = ++fetchToken;
  const pv = $('#preview');
  pv.replaceChildren(h('div', { class: 'skeleton' }));
  $('#fetchBtn').disabled = true;
  const r = await api.fetchInfo(url);
  $('#fetchBtn').disabled = false;
  if (my !== fetchToken) return;
  if (!r.ok) {
    const msg = r.error === 'ENGINE_MISSING' ? t('ENGINE_MISSING') : r.error;
    pv.replaceChildren(h('div', { class: 'card err-card' }, icon('alert'), h('div', {}, h('b', {}, t('fetchFailed')), h('div', {}, msg))));
    return;
  }
  S.info = r.info;
  if (r.info.type === 'playlist') renderPlaylist(r.info); else renderVideo(r.info);
}

function closeBtn() { return iconBtn('x', t('dismiss'), () => { $('#preview').replaceChildren(); S.info = null; }, 'close-x'); }

function modeSeg(initial, onChange) {
  const seg = h('div', { class: 'seg' });
  for (const m of ['video', 'audio']) {
    seg.append(h('button', { class: m === initial ? 'on' : '', onclick: (ev) => { const me = ev.currentTarget; $$('button', seg).forEach((b) => b.classList.toggle('on', b === me)); onChange(m); } }, icon(m === 'video' ? 'film' : 'music'), t(m)));
  }
  return seg;
}

function renderVideo(info) {
  const st = S.settings;
  let mode = st.defaultMode;
  const qSel = h('select');
  const opts = [h('option', { value: 'best' }, t('best') + (info.heights[0] ? ` (${info.heights[0].height}p)` : ''))];
  for (const { height, size } of info.heights) opts.push(h('option', { value: String(height) }, `${height}p${size ? `  ${t('approx')} ${fmtBytes(size)}` : ''}`));
  qSel.replaceChildren(...opts);
  qSel.value = info.heights.some((x) => String(x.height) === st.defaultQuality) ? st.defaultQuality : 'best';
  if (!info.heights.length) qSel.disabled = true;

  const aSel = h('select', {}, AUDIO_FORMATS.map((f) => h('option', { value: f }, f.toUpperCase())));
  aSel.value = st.audioFormat;
  const subsChk = h('input', { type: 'checkbox', checked: st.embedSubs });
  const trimChk = h('input', { type: 'checkbox' });
  const tStart = h('input', { class: 'time-in', placeholder: '0:00' });
  const tEnd = h('input', { class: 'time-in', placeholder: fmtDur(info.duration) || '1:00' });
  const trimFields = h('span', { class: 'opt-row', hidden: true }, t('from'), tStart, t('to'), tEnd);
  trimChk.addEventListener('change', () => (trimFields.hidden = !trimChk.checked));

  const qRow = h('div', { class: 'opt-row' }, h('label', { class: 'lbl' }, t('quality')), qSel);
  const aRow = h('div', { class: 'opt-row', hidden: true }, h('label', { class: 'lbl' }, t('format')), aSel, info.audioSize ? h('span', { class: 'muted' }, `${t('approx')} ${fmtBytes(info.audioSize)}`) : null);
  const subsLbl = h('label', { class: 'check' }, subsChk, t('subs'), info.subLangs.length ? h('span', { class: 'tag' }, info.subLangs.slice(0, 4).join(', ')) : null);
  const setMode = (m) => { mode = m; qRow.hidden = m !== 'video'; aRow.hidden = m !== 'audio'; subsLbl.hidden = m !== 'video'; };

  const dlBtn = h('button', { class: 'primary', onclick: async () => {
    const item = { url: info.url, title: info.title, thumbnail: info.thumbnail, mode, quality: qSel.value, audioFormat: aSel.value, subs: mode === 'video' && subsChk.checked };
    if (trimChk.checked) { item.trimStart = tStart.value.trim(); item.trimEnd = tEnd.value.trim(); }
    await api.download.add(item);
    toast(t('added'), 'ok');
    $('#preview').replaceChildren(); $('#urlInput').value = ''; S.info = null;
  } }, icon('download'), t('download'));

  const meta = h('div', { class: 'meta' },
    info.uploader ? h('span', {}, info.uploader) : null,
    info.extractor ? h('span', { class: 'tag' }, info.extractor) : null,
    info.viewCount ? h('span', {}, `${fmtNum(info.viewCount)} ${t('views')}`) : null,
    info.isLive ? h('span', { class: 'tag st-error' }, t('live')) : null,
  );

  const card = h('div', { class: 'card pv-wrap' }, closeBtn(),
    h('div', { class: 'pv' },
      h('div', { class: 'thumb' }, info.thumbnail ? h('img', { src: info.thumbnail, alt: '', referrerpolicy: 'no-referrer' }) : null, info.duration ? h('span', { class: 'dur' }, fmtDur(info.duration)) : null),
      h('div', {},
        h('h3', {}, info.title), meta,
        h('div', { class: 'opts' },
          h('div', { class: 'opt-row' }, modeSeg(mode, setMode)),
          qRow, aRow,
          h('div', { class: 'opt-row' }, subsLbl, h('label', { class: 'check' }, trimChk, t('trim')), trimFields),
          h('div', { class: 'opt-row' }, dlBtn),
        ),
      ),
    ),
  );
  setMode(mode);
  $('#preview').replaceChildren(card);
}

function renderPlaylist(info) {
  const st = S.settings;
  let mode = st.defaultMode;
  const sel = new Set(info.entries.map((e) => e.idx));
  const count = h('span', { class: 'muted' });
  const updCount = () => { count.textContent = `${sel.size} / ${info.entries.length} ${t('selected')}`; dl.disabled = !sel.size; };
  const list = h('div', { class: 'pl-list' });
  for (const e of info.entries) {
    const cb = h('input', { type: 'checkbox', checked: true });
    cb.addEventListener('change', () => { cb.checked ? sel.add(e.idx) : sel.delete(e.idx); updCount(); });
    const row = h('label', { class: 'pl-item' }, cb, h('span', { class: 'n' }, e.idx),
      e.thumbnail ? h('img', { src: e.thumbnail, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : h('span', { class: 'ph' }),
      h('span', { class: 't', title: e.title }, e.title), h('span', { class: 'd' }, fmtDur(e.duration)));
    list.append(row);
  }
  const setAll = (v) => { $$('input', list).forEach((c) => (c.checked = v)); sel.clear(); if (v) info.entries.forEach((e) => sel.add(e.idx)); updCount(); };
  const qSel = h('select'); fillQualitySelect(qSel, st.defaultQuality);
  const aSel = h('select', { hidden: true }, AUDIO_FORMATS.map((f) => h('option', { value: f }, f.toUpperCase()))); aSel.value = st.audioFormat;
  const dl = h('button', { class: 'primary', onclick: async () => {
    const items = info.entries.filter((e) => sel.has(e.idx)).map((e) => ({ url: e.url, title: e.title, thumbnail: e.thumbnail, mode, quality: qSel.value, audioFormat: aSel.value, subs: mode === 'video' && st.embedSubs }));
    await api.download.add(items);
    toast(t('addedN', { n: items.length }), 'ok');
    $('#preview').replaceChildren(); $('#urlInput').value = '';
  } }, icon('download'), t('downloadSelected'));

  const card = h('div', { class: 'card pv-wrap' }, closeBtn(),
    h('div', { class: 'pl-head' }, h('span', { class: 'tag' }, t('playlist')), h('h3', {}, info.title), h('span', { class: 'muted' }, `${info.entries.length} ${t('items')}`)),
    h('div', { class: 'row' },
      modeSeg(mode, (m) => { mode = m; qSel.hidden = m !== 'video'; aSel.hidden = m !== 'audio'; }), qSel, aSel,
      h('button', { class: 'ghost small', onclick: () => setAll(true) }, t('selectAll')),
      h('button', { class: 'ghost small', onclick: () => setAll(false) }, t('selectNone')),
      h('span', { class: 'grow' }), count, dl),
    list);
  $('#preview').replaceChildren(card);
  updCount();
}

// ---------------- queue ----------------
function jobCard(j) {
  const el = h('div', { class: 'job', id: `job-${j.id}` });
  fillJob(el, j);
  return el;
}
function fillJob(el, j) {
  const active = ['starting', 'downloading', 'processing'].includes(j.status);
  const thumb = h('div', { class: 'jt' });
  if (j.thumbnail) thumb.style.backgroundImage = `url("${encodeURI(j.thumbnail).replace(/"/g, '%22')}")`; else thumb.append(icon(j.mode === 'audio' ? 'music' : 'film'));

  const subs = [h('span', { class: `st-${j.status}` }, t(`st_${j.status}`))];
  subs.push(h('span', { class: 'tag' }, j.mode === 'audio' ? (j.audioFormat || 'mp3').toUpperCase() : qualityLabel(j.quality)));
  if (j.trimStart || j.trimEnd) subs.push(h('span', { class: 'tag' }, '✂ ', h('bdi', {}, `${j.trimStart || '0'}–${j.trimEnd || '∞'}`)));
  if (j.status === 'downloading') {
    if (j.percent != null) subs.push(h('span', { class: 'num' }, `${j.percent.toFixed(1)}%`));
    if (j.total) subs.push(h('span', { class: 'num' }, `${fmtBytes(j.downloaded)} / ${fmtBytes(j.total)}`));
    if (j.speed) subs.push(h('span', { class: 'num' }, `${fmtBytes(j.speed)}/s`));
    if (j.eta != null) subs.push(h('span', { class: 'num' }, `⏱ ${fmtDur(j.eta)}`));
  }
  if (j.status === 'done' && j.size) subs.push(h('span', { class: 'num' }, fmtBytes(j.size)));

  const bar = h('div', { class: 'progress' + (j.status === 'done' ? ' done' : j.status === 'error' ? ' error' : '') + ((j.status === 'processing' || j.status === 'starting' || (j.status === 'downloading' && j.percent == null)) ? ' indet' : '') }, h('div'));
  bar.firstChild.style.width = `${j.status === 'done' ? 100 : j.percent || 0}%`;

  const acts = h('div', { class: 'acts' });
  const act = (a) => () => api.download.action(j.id, a);
  if (active || j.status === 'queued') acts.append(iconBtn('pause', t('a_pause'), act('pause')));
  if (j.status === 'paused') acts.append(iconBtn('play', t('a_resume'), act('resume')));
  if (j.status === 'error' || j.status === 'canceled') acts.append(iconBtn('retry', t('a_retry'), act('retry')));
  if (j.status === 'done') { acts.append(iconBtn('file', t('a_open'), () => api.shell.openFile(j.file)), iconBtn('folder', t('a_folder'), () => api.shell.showInFolder(j.file))); }
  if (active || j.status === 'queued' || j.status === 'paused') acts.append(iconBtn('x', t('a_cancel'), act('cancel')));
  else acts.append(iconBtn('trash', t('a_remove'), act('remove')));

  const body = h('div', { style: 'min-width:0' }, h('div', { class: 'title', title: j.title }, j.title), h('div', { class: 'sub' }, subs),
    j.status === 'done' ? null : bar,
    j.status === 'error' && j.error ? h('div', { class: 'errmsg', title: j.error }, j.error === 'ENGINE_MISSING' ? t('ENGINE_MISSING') : j.error) : null);
  el.replaceChildren(thumb, body, acts);
}

function renderQueueMeta() {
  const n = [...S.jobs.values()].filter((j) => ['queued', 'starting', 'downloading', 'processing'].includes(j.status)).length;
  const b = $('#activeBadge'); b.hidden = !n; b.textContent = n;
  $('#queueEmpty').hidden = S.jobs.size > 0;
}

api.download.onUpdate((j) => {
  S.jobs.set(j.id, j);
  const ex = document.getElementById(`job-${j.id}`);
  if (ex) fillJob(ex, j); else $('#queue').prepend(jobCard(j));
  renderQueueMeta();
});
api.download.onRemoved((id) => { S.jobs.delete(id); document.getElementById(`job-${id}`)?.remove(); renderQueueMeta(); });

// ---------------- history ----------------
async function loadHistory() { S.history = await api.history.get(); renderHistory(); }
api.history.onChanged(() => { if (!$('#view-history').hidden) loadHistory(); });

function renderHistory() {
  const q = $('#historySearch').value.trim().toLowerCase();
  const f = $('#historyFilter').value;
  const items = S.history.filter((x) => (f === 'all' || x.mode === f) && (!q || (x.title || '').toLowerCase().includes(q) || (x.url || '').toLowerCase().includes(q)));
  const total = S.history.reduce((a, x) => a + (x.size || 0), 0);
  $('#historyStats').replaceChildren(
    h('div', { class: 'stat' }, h('b', {}, S.history.length), h('span', {}, t('totalFiles'))),
    h('div', { class: 'stat' }, h('b', {}, h('bdi', {}, fmtBytes(total) || '0 B')), h('span', {}, t('totalSize'))),
    h('div', { class: 'stat' }, h('b', {}, S.history.filter((x) => x.mode === 'video').length), h('span', {}, t('video'))),
    h('div', { class: 'stat' }, h('b', {}, S.history.filter((x) => x.mode === 'audio').length), h('span', {}, t('audio'))),
  );
  $('#historyEmpty').hidden = items.length > 0;
  $('#historyList').replaceChildren(...items.slice(0, 300).map((x) => {
    const thumb = h('div', { class: 'jt' });
    if (x.thumbnail) thumb.style.backgroundImage = `url("${encodeURI(x.thumbnail).replace(/"/g, '%22')}")`; else thumb.append(icon(x.mode === 'audio' ? 'music' : 'film'));
    const acts = h('div', { class: 'acts' });
    if (x.exists) acts.append(iconBtn('file', t('a_open'), () => api.shell.openFile(x.file)), iconBtn('folder', t('a_folder'), () => api.shell.showInFolder(x.file)));
    acts.append(
      iconBtn('external', x.url, () => api.shell.openExternal(x.url)),
      iconBtn('copy', t('a_copy'), async () => { await api.clipboard.write(x.url); toast(t('copied')); }),
      iconBtn('retry', t('a_redownload'), async () => { await api.download.add({ url: x.url, title: x.title, thumbnail: x.thumbnail, mode: x.mode, quality: x.quality, audioFormat: x.audioFormat }); toast(t('added'), 'ok'); }),
      iconBtn('trash', t('a_remove'), async () => { await api.history.remove(x.id); loadHistory(); }),
    );
    return h('div', { class: 'job' }, thumb,
      h('div', { style: 'min-width:0' }, h('div', { class: 'title', title: x.title }, x.title),
        h('div', { class: 'sub' }, h('span', {}, fmtDate(x.date)), h('span', { class: 'tag' }, x.mode === 'audio' ? (x.audioFormat || '').toUpperCase() : qualityLabel(x.quality || 'best')),
          x.size ? h('span', { class: 'num' }, fmtBytes(x.size)) : null, x.exists ? null : h('span', { class: 'st-error' }, t('missing')))),
      acts);
  }));
}

// ---------------- settings ----------------
async function saveSetting(patch) {
  S.settings = await api.settings.set(patch);
  if ('lang' in patch) { applyLang(); renderSettings(); refreshEngine(); for (const j of S.jobs.values()) { const el = document.getElementById(`job-${j.id}`); if (el) fillJob(el, j); } fillQualitySelect($('#batchQuality'), $('#batchQuality').value); }
  if ('theme' in patch) applyTheme();
}

function field(label, hint, control) { return h('div', { class: 'field' }, h('div', { class: 'lab' }, label, hint ? h('small', {}, hint) : null), control); }
function sw(key) { const i = h('input', { type: 'checkbox', checked: S.settings[key] }); i.addEventListener('change', () => saveSetting({ [key]: i.checked })); return h('label', { class: 'switch' }, i, h('span')); }
function selectOf(key, options) { const s = h('select', {}, options.map(([v, l]) => h('option', { value: v }, l))); s.value = String(S.settings[key]); s.addEventListener('change', () => saveSetting({ [key]: s.value })); return s; }
function textOf(key, ph) { const i = h('input', { type: 'text', value: S.settings[key] || '', placeholder: ph || '' }); i.addEventListener('change', () => saveSetting({ [key]: i.value.trim() })); return i; }

function renderSettings() {
  const st = S.settings;
  const dirPath = h('span', { class: 'path', title: st.downloadDir }, st.downloadDir);
  const dirCtl = h('div', { class: 'opt-row' }, dirPath, h('button', { class: 'ghost small', onclick: async () => { const d = await api.shell.pickDir(); if (d) { await saveSetting({ downloadDir: d }); renderSettings(); } } }, t('change')));
  const conc = h('input', { type: 'number', min: 1, max: 8, value: st.concurrency });
  conc.addEventListener('change', () => { const v = Math.min(8, Math.max(1, parseInt(conc.value, 10) || 1)); conc.value = v; saveSetting({ concurrency: v }); });
  const qOpts = QUALITIES.map((q) => [q, qualityLabel(q)]);

  const eng = S.engine || {};
  const engMsg = h('small', { id: 'settingsEngineMsg', class: 'muted' });
  const updBtn = h('button', { class: 'ghost small', onclick: async () => {
    updBtn.disabled = true; engMsg.textContent = t('updating');
    const r = await api.engine.update(); updBtn.disabled = false;
    engMsg.textContent = r.ok ? r.output : (r.error === 'ENGINE_MISSING' ? t('ENGINE_MISSING') : r.output || r.error);
    await refreshEngine(); renderSettings(); $('#settingsEngineMsg').textContent = engMsg.textContent;
  } }, t('e_update'));
  const reBtn = (which) => h('button', { class: 'ghost small', onclick: async (ev) => { ev.currentTarget.disabled = true; engMsg.textContent = t('installing'); await installEngine(which); } }, t('e_reinstall'));

  $('#settingsForm').replaceChildren(
    h('div', { class: 'group' }, h('h4', {}, t('g_general')),
      field(t('s_lang'), null, selectOf('lang', [['ar', 'العربية'], ['en', 'English']])),
      field(t('s_theme'), null, selectOf('theme', [['dark', t('dark')], ['light', t('light')], ['system', t('system')]])),
      field(t('s_clip'), t('s_clipHint'), sw('clipboardWatch')),
      field(t('s_autofetch'), null, sw('autoFetchOnPaste')),
      field(t('s_notify'), null, sw('notify'))),
    h('div', { class: 'group' }, h('h4', {}, t('g_download')),
      field(t('s_dir'), t('s_dirHint'), dirCtl),
      field(t('s_conc'), t('s_concHint'), conc),
      field(t('s_mode'), null, selectOf('defaultMode', [['video', t('video')], ['audio', t('audio')]])),
      field(t('s_template'), t('s_templateHint'), textOf('filenameTemplate', '%(title)s [%(id)s].%(ext)s'))),
    h('div', { class: 'group' }, h('h4', {}, t('g_video')),
      field(t('s_quality'), null, selectOf('defaultQuality', qOpts)),
      field(t('s_container'), null, selectOf('container', [['mp4', 'MP4'], ['mkv', 'MKV'], ['webm', 'WebM']])),
      field(t('s_h264'), t('s_h264Hint'), sw('preferH264')),
      field(t('s_subs'), null, sw('embedSubs')),
      field(t('s_subLangs'), t('s_subLangsHint'), textOf('subLangs', 'ar,en')),
      field(t('s_sponsor'), t('s_sponsorHint'), sw('sponsorblock'))),
    h('div', { class: 'group' }, h('h4', {}, t('g_audio')),
      field(t('s_audioFmt'), null, selectOf('audioFormat', AUDIO_FORMATS.map((f) => [f, f.toUpperCase()]))),
      field(t('s_thumb'), t('s_thumbHint'), sw('embedThumbnail'))),
    h('div', { class: 'group' }, h('h4', {}, t('g_network')),
      field(t('s_cookies'), t('s_cookiesHint'), selectOf('cookiesBrowser', [['', t('none')], ['chrome', 'Chrome'], ['edge', 'Edge'], ['firefox', 'Firefox'], ['brave', 'Brave'], ['opera', 'Opera'], ['vivaldi', 'Vivaldi']])),
      field(t('s_proxy'), t('s_proxyHint'), textOf('proxy', 'socks5://127.0.0.1:1080')),
      field(t('s_rate'), t('s_rateHint'), textOf('rateLimit', '2M'))),
    h('div', { class: 'group' }, h('h4', {}, t('g_engine')),
      field(t('e_ytdlp'), eng.ytdlp ? null : t('notInstalled'), h('div', { class: 'opt-row' }, eng.ytdlp ? h('bdi', { class: 'muted' }, eng.ytdlp) : null, eng.ytdlp ? updBtn : reBtn('ytdlp'))),
      field(t('e_ffmpeg'), eng.ffmpeg ? null : t('notInstalled'), h('div', { class: 'opt-row' }, eng.ffmpeg ? h('bdi', { class: 'muted path' }, eng.ffmpeg) : null, reBtn('ffmpeg'))),
      h('div', { class: 'field' }, engMsg)),
  );
}

// ---------------- events ----------------
function bind() {
  $$('[data-icon]').forEach((el) => el.replaceWith(Object.assign(icon(el.dataset.icon, el.className), {})));
  $$('.nav').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $('#openDirBtn').addEventListener('click', () => api.shell.openDir());
  $('#installEngineBtn').addEventListener('click', () => installEngine('all'));

  const input = $('#urlInput');
  $('#fetchBtn').addEventListener('click', () => fetchUrl(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') fetchUrl(input.value); });
  input.addEventListener('paste', () => setTimeout(() => { if (S.settings.autoFetchOnPaste && isUrl(input.value)) fetchUrl(input.value); }, 30));
  $('#pasteBtn').addEventListener('click', async () => { const txt = (await api.clipboard.read()).trim(); input.value = txt; if (isUrl(txt)) fetchUrl(txt); else input.focus(); });

  document.addEventListener('keydown', async (e) => {
    const tag = document.activeElement?.tagName;
    if (e.ctrlKey && e.key.toLowerCase() === 'v' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
      const txt = (await api.clipboard.read()).trim();
      if (isUrl(txt)) { showView('home'); fetchUrl(txt); }
    }
  });

  // batch
  $('#batchToggle').addEventListener('click', () => { $('#batchBox').hidden = !$('#batchBox').hidden; if (!$('#batchBox').hidden) $('#batchInput').focus(); });
  fillQualitySelect($('#batchQuality'), S.settings.defaultQuality);
  $$('#batchMode button').forEach((b) => b.addEventListener('click', () => { S.batchMode = b.dataset.v; $$('#batchMode button').forEach((x) => x.classList.toggle('on', x === b)); $('#batchQuality').hidden = S.batchMode !== 'video'; }));
  $('#batchAdd').addEventListener('click', async () => {
    const urls = [...new Set($('#batchInput').value.split(/\s+/).map((s) => s.trim()).filter(isUrl))];
    if (!urls.length) return toast(t('invalidUrl'), 'err');
    await api.download.add(urls.map((url) => ({ url, mode: S.batchMode, quality: $('#batchQuality').value, audioFormat: S.settings.audioFormat, subs: S.settings.embedSubs })));
    toast(t('addedN', { n: urls.length }), 'ok');
    $('#batchInput').value = '';
  });

  // queue toolbar
  $('#clearBtn').addEventListener('click', () => api.download.clearFinished());
  $('#pauseAllBtn').addEventListener('click', () => api.download.pauseAll());
  $('#resumeAllBtn').addEventListener('click', () => api.download.resumeAll());

  // history
  $('#historySearch').addEventListener('input', renderHistory);
  $('#historyFilter').addEventListener('change', renderHistory);
  $('#historyClear').addEventListener('click', async () => { if (confirm(t('confirmClear'))) { await api.history.clear(); loadHistory(); } });

  // clipboard
  let clipUrl = null;
  api.clipboard.onUrl((url) => {
    if (url === $('#urlInput').value.trim() || S.info?.url === url) return;
    clipUrl = url; $('#clipUrl').textContent = url; $('#clipBar').hidden = false;
  });
  $('#clipFetch').addEventListener('click', () => { showView('home'); fetchUrl(clipUrl); });
  $('#clipDismiss').addEventListener('click', () => ($('#clipBar').hidden = true));

  // drag & drop
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('#dropOverlay').hidden = false; });
  window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#dropOverlay').hidden = true; } });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault(); dragDepth = 0; $('#dropOverlay').hidden = true;
    const txt = (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '').split(/\s+/).find(isUrl);
    if (txt) { showView('home'); fetchUrl(txt); } else toast(t('invalidUrl'), 'err');
  });
}

// ---------------- init ----------------
(async function init() {
  S.settings = await api.settings.get();
  applyTheme();
  applyLang();
  bind();
  applyLang();
  for (const j of await api.download.list()) { S.jobs.set(j.id, j); $('#queue').prepend(jobCard(j)); }
  renderQueueMeta();
  refreshEngine();
  $('#urlInput').focus();
})();
