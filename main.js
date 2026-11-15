// Naseem — video downloader (main process)
const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Notification, Menu, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { spawn } = require('child_process');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const DATA = app.getPath('userData');
const BIN = path.join(DATA, 'bin');
const SETTINGS_FILE = path.join(DATA, 'settings.json');
const HISTORY_FILE = path.join(DATA, 'history.json');
fs.mkdirSync(BIN, { recursive: true });

const DEFAULTS = {
  downloadDir: path.join(app.getPath('downloads'), 'Naseem'),
  concurrency: 2,
  container: 'mp4',
  preferH264: true,
  defaultMode: 'video',
  defaultQuality: 'best',
  audioFormat: 'mp3',
  embedThumbnail: true,
  embedSubs: false,
  subLangs: 'ar,en',
  sponsorblock: false,
  cookiesBrowser: '',
  cookiesFile: '',
  proxy: '',
  rateLimit: '',
  filenameTemplate: '%(title)s [%(id)s].%(ext)s',
  clipboardWatch: true,
  notify: true,
  autoFetchOnPaste: true,
  lang: 'ar',
  theme: 'dark',
  motion: 'on',
  bgImage: '',
  bgVisibility: 25,
  artImage: '',
  artVisibility: 55,
};

const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v, null, 2), 'utf8'); } catch (e) { console.error(e); } };

let settings = { ...DEFAULTS, ...readJSON(SETTINGS_FILE, {}) };
let history = readJSON(HISTORY_FILE, []);
let win = null;

const send = (ch, data) => { if (win && !win.isDestroyed()) win.webContents.send(ch, data); };
// ELECTRON_RUN_AS_NODE lets yt-dlp use this app's own executable as its JavaScript runtime (needed for YouTube).
const ENV = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ELECTRON_RUN_AS_NODE: '1' };

// ---------- engine location ----------
function findOnPath(exe) {
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    if (!d) continue;
    const p = path.join(d, exe);
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}
const ytdlpExe = () => { const p = path.join(BIN, 'yt-dlp.exe'); return fs.existsSync(p) ? p : findOnPath('yt-dlp.exe'); };
const ffmpegExe = () => { const p = path.join(BIN, 'ffmpeg.exe'); return fs.existsSync(p) ? p : findOnPath('ffmpeg.exe'); };

function commonArgs(cookiePath) {
  const a = ['--no-colors', '--encoding', 'utf-8', '--no-warnings', '--js-runtimes', `node:${process.execPath}`];
  if (settings.cookiesBrowser) a.push('--cookies-from-browser', settings.cookiesBrowser);
  else if (cookiePath) a.push('--cookies', cookiePath);
  if (settings.proxy) a.push('--proxy', settings.proxy);
  const ff = ffmpegExe();
  if (ff) a.push('--ffmpeg-location', ff);
  return a;
}

// ---------- cookies for sites that ask you to sign in (e.g. YouTube's "not a bot" check) ----------
// Google blocks signing in inside app windows, so cookies come from the user's own browser
// (--cookies-from-browser; Firefox works best on Windows) or from an imported cookies.txt.
// An imported file is copied to a private per-run file for yt-dlp and deleted afterwards.
const COOKIE_DIR = path.join(DATA, 'cookies');
const IMPORTED_COOKIES = 'cookies-import.txt';
async function prepareCookies(tag) {
  if (settings.cookiesBrowser || !settings.cookiesFile) return null;
  try {
    const imported = path.join(DATA, settings.cookiesFile);
    if (!fs.existsSync(imported)) return null;
    fs.mkdirSync(COOKIE_DIR, { recursive: true });
    const out = path.join(COOKIE_DIR, `run-${tag}.txt`);
    fs.copyFileSync(imported, out);
    return out;
  } catch { return null; }
}
const dropCookies = (p) => { if (p) fs.rm(p, { force: true }, () => {}); };
const firefoxInstalled = () => fs.existsSync(path.join(app.getPath('appData'), 'Mozilla', 'Firefox', 'Profiles'));
ipcMain.handle('cookies:status', () => ({ firefox: firefoxInstalled() }));
ipcMain.handle('cookies:import', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'cookies.txt', extensions: ['txt'] }] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  let text = fs.readFileSync(r.filePaths[0], 'utf8').replace(/^\uFEFF/, '');
  if (!/^[^#\r\n][^\t\r\n]*\t(TRUE|FALSE)\t/im.test(text)) return { ok: false, error: 'BAD_COOKIES' };
  if (!/^# (Netscape )?HTTP Cookie File/.test(text)) text = '# Netscape HTTP Cookie File\n' + text;
  fs.writeFileSync(path.join(DATA, IMPORTED_COOKIES), text);
  settings = { ...settings, cookiesFile: IMPORTED_COOKIES };
  writeJSON(SETTINGS_FILE, settings);
  return { ok: true, settings };
});
ipcMain.handle('cookies:clear', () => {
  fs.rmSync(path.join(DATA, IMPORTED_COOKIES), { force: true });
  settings = { ...settings, cookiesFile: '' };
  writeJSON(SETTINGS_FILE, settings);
  return settings;
});

function eachLine(stream, fn) {
  let buf = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.search(/\r?\n|\r/)) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + (buf[i] === '\r' && buf[i + 1] === '\n' ? 2 : 1));
      if (line.trim()) fn(line);
    }
  });
  stream.on('end', () => { if (buf.trim()) fn(buf); });
}

function runCollect(exe, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(exe, args, { env: ENV, windowsHide: true });
    let out = '', err = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const t = setTimeout(() => killTree(child.pid), timeoutMs);
    child.on('error', (e) => { clearTimeout(t); resolve({ code: -1, out, err: String(e.message) }); });
    child.on('close', (code) => { clearTimeout(t); resolve({ code, out, err }); });
  });
}

function killTree(pid) {
  if (!pid) return;
  try { spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true }); } catch {}
}

function cleanError(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const e = [...lines].reverse().find((l) => l.startsWith('ERROR')) || lines[lines.length - 1] || 'Unknown error';
  return e.replace(/^ERROR:\s*/, '').slice(0, 400);
}

// ---------- info ----------
const bestThumb = (j) => {
  if (j.thumbnail) return j.thumbnail;
  const t = j.thumbnails;
  return Array.isArray(t) && t.length ? t[t.length - 1].url : null;
};

function simplify(j) {
  if (j._type === 'playlist' || Array.isArray(j.entries)) {
    const entries = (j.entries || []).filter(Boolean).map((e, i) => ({
      idx: i + 1,
      url: e.url && /^https?:/i.test(e.url) ? e.url : e.webpage_url || e.original_url || e.url,
      title: e.title || `#${i + 1}`,
      duration: e.duration || null,
      thumbnail: bestThumb(e),
    }));
    return { type: 'playlist', title: j.title || 'Playlist', uploader: j.uploader || j.channel || '', extractor: j.extractor_key || '', entries };
  }
  const formats = j.formats || [];
  const audio = formats.filter((f) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'));
  const audioSize = Math.max(0, ...audio.map((f) => f.filesize || f.filesize_approx || 0));
  const byHeight = {};
  for (const f of formats) {
    if (!f.height || !f.vcodec || f.vcodec === 'none') continue;
    const sz = f.filesize || f.filesize_approx || 0;
    byHeight[f.height] = Math.max(byHeight[f.height] || 0, sz);
  }
  const heights = Object.keys(byHeight).map(Number).sort((a, b) => b - a)
    .map((h) => ({ height: h, size: byHeight[h] ? byHeight[h] + audioSize : null }));
  return {
    type: 'video',
    url: j.webpage_url || j.original_url,
    title: j.title || '',
    thumbnail: bestThumb(j),
    duration: j.duration || null,
    uploader: j.uploader || j.channel || '',
    extractor: j.extractor_key || j.extractor || '',
    viewCount: j.view_count || null,
    uploadDate: j.upload_date || null,
    heights,
    audioSize: audioSize || null,
    subLangs: Object.keys(j.subtitles || {}),
    isLive: !!j.is_live,
  };
}

ipcMain.handle('info:fetch', async (_e, url) => {
  const exe = ytdlpExe();
  if (!exe) return { ok: false, error: 'ENGINE_MISSING' };
  const ck = await prepareCookies(`f${Date.now().toString(36)}`);
  const r = await runCollect(exe, [...commonArgs(ck), '-J', '--flat-playlist', '--', url]);
  dropCookies(ck);
  if (r.code !== 0) return { ok: false, error: cleanError(r.err) };
  try { return { ok: true, info: simplify(JSON.parse(r.out)) }; }
  catch { return { ok: false, error: cleanError(r.err) || 'Bad response' }; }
});

// ---------- download queue ----------
const jobs = new Map();
let seq = 0;
const ACTIVE = new Set(['starting', 'downloading', 'processing']);

const publicJob = (j) => { const { child, _last, ...rest } = j; return rest; };
function update(j, patch, force = false) {
  const statusChanged = patch.status && patch.status !== j.status;
  Object.assign(j, patch);
  const now = Date.now();
  if (force || statusChanged || !j._last || now - j._last > 200) { j._last = now; send('download:update', publicJob(j)); }
}

function pump() {
  let slots = Math.max(1, +settings.concurrency || 1) - [...jobs.values()].filter((j) => ACTIVE.has(j.status)).length;
  for (const j of jobs.values()) {
    if (slots <= 0) break;
    if (j.status === 'queued') { startJob(j); slots--; }
  }
}

function buildArgs(j, cookiePath) {
  const a = [
    ...commonArgs(cookiePath), '--newline', '--progress', '--no-playlist', '--no-simulate', '--no-mtime',
    '-P', settings.downloadDir, '-o', settings.filenameTemplate || DEFAULTS.filenameTemplate,
    '--progress-template', 'download:NSM|%(progress.status)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s',
    '--print', 'video:NSMINFO|%(title)s|%(thumbnail)s',
    '--print', 'after_move:NSMFILE|%(filepath)s',
    '--embed-metadata',
  ];
  if (j.mode === 'audio') {
    a.push('-f', 'ba/b', '-x', '--audio-format', j.audioFormat || 'mp3', '--audio-quality', '0');
  } else {
    const h = j.quality && j.quality !== 'best' ? parseInt(j.quality, 10) : null;
    a.push('-f', h ? `bv*[height<=${h}]+ba/b[height<=${h}]/bv*+ba/b` : 'bv*+ba/b');
    if (settings.preferH264) a.push('-S', 'res,vcodec:h264,acodec:m4a');
    a.push('--merge-output-format', settings.container || 'mp4');
    if (j.subs) a.push('--write-subs', '--write-auto-subs', '--sub-langs', settings.subLangs || 'ar,en', '--embed-subs');
  }
  if (settings.embedThumbnail && !(j.mode === 'audio' && j.audioFormat === 'wav')) a.push('--embed-thumbnail');
  if (j.trimStart || j.trimEnd) a.push('--download-sections', `*${j.trimStart || '0'}-${j.trimEnd || 'inf'}`, '--force-keyframes-at-cuts');
  if (settings.sponsorblock && j.mode !== 'audio') a.push('--sponsorblock-remove', 'sponsor,selfpromo,interaction');
  if (settings.rateLimit) a.push('-r', settings.rateLimit);
  a.push('--', j.url);
  return a;
}

const num = (s) => { const n = parseFloat(s); return Number.isFinite(n) ? n : null; };

async function startJob(j) {
  const exe = ytdlpExe();
  if (!exe) return update(j, { status: 'error', error: 'ENGINE_MISSING' }, true);
  try { fs.mkdirSync(settings.downloadDir, { recursive: true }); } catch {}
  update(j, { status: 'starting', percent: 0, error: null, speed: null, eta: null }, true);
  const ck = await prepareCookies(j.id);
  if (j.status !== 'starting') { dropCookies(ck); return; } // paused or canceled while preparing
  const child = spawn(exe, buildArgs(j, ck), { env: ENV, windowsHide: true });
  j.child = child;
  const errTail = [];
  eachLine(child.stdout, (line) => {
    if (line.startsWith('NSM|')) {
      const [, st, dl, tot, est, sp, eta] = line.split('|');
      const total = num(tot) || num(est);
      const done = num(dl);
      if (st === 'finished') update(j, { status: 'processing', percent: 100, speed: null, eta: null });
      else update(j, { status: 'downloading', percent: total && done != null ? Math.min(100, (done / total) * 100) : null, speed: num(sp), eta: num(eta), total, downloaded: done });
    } else if (line.startsWith('NSMINFO|')) {
      const [, title, thumb] = line.split('|');
      const patch = {};
      if (title && title !== 'NA' && (!j.title || j.title === j.url)) patch.title = title;
      if (thumb && thumb !== 'NA' && !j.thumbnail) patch.thumbnail = thumb;
      update(j, patch, true);
    } else if (line.startsWith('NSMFILE|')) {
      j.file = line.slice(8).trim();
    }
  });
  eachLine(child.stderr, (line) => { errTail.push(line); if (errTail.length > 30) errTail.shift(); });
  child.on('error', (e) => { dropCookies(ck); update(j, { status: 'error', error: e.message }, true); });
  child.on('close', (code) => {
    j.child = null;
    dropCookies(ck);
    if (j.status === 'canceled' || j.status === 'paused') return pump();
    if (code === 0) {
      let size = null;
      try { size = fs.statSync(j.file).size; } catch {}
      update(j, { status: 'done', percent: 100, size, finishedAt: Date.now() }, true);
      addHistory(j);
      if (settings.notify && Notification.isSupported()) {
        const n = new Notification({ title: settings.lang === 'ar' ? 'اكتمل التنزيل' : 'Download complete', body: j.title || j.url });
        n.on('click', () => { if (j.file) shell.showItemInFolder(j.file); });
        n.show();
      }
    } else {
      update(j, { status: 'error', error: cleanError(errTail.join('\n')) }, true);
    }
    pump();
  });
}

ipcMain.handle('download:add', (_e, items) => {
  const added = [];
  for (const it of [].concat(items)) {
    if (!it || !it.url) continue;
    const j = {
      id: `j${Date.now().toString(36)}${(seq++).toString(36)}`,
      url: it.url, title: it.title || it.url, thumbnail: it.thumbnail || null,
      mode: it.mode === 'audio' ? 'audio' : 'video', quality: it.quality || 'best',
      audioFormat: it.audioFormat || settings.audioFormat, subs: !!it.subs,
      trimStart: it.trimStart || '', trimEnd: it.trimEnd || '',
      status: 'queued', percent: 0, addedAt: Date.now(),
    };
    jobs.set(j.id, j);
    added.push(publicJob(j));
    send('download:update', publicJob(j));
  }
  pump();
  return added;
});

function stopJob(j, status) {
  if (j.child) { const pid = j.child.pid; update(j, { status, speed: null, eta: null }, true); killTree(pid); }
  else update(j, { status }, true);
}

ipcMain.handle('download:action', (_e, id, action) => {
  const j = jobs.get(id);
  if (!j) return false;
  switch (action) {
    case 'cancel': if (ACTIVE.has(j.status) || j.status === 'queued' || j.status === 'paused') stopJob(j, 'canceled'); break;
    case 'pause': if (ACTIVE.has(j.status) || j.status === 'queued') stopJob(j, 'paused'); break;
    case 'resume': case 'retry': if (!ACTIVE.has(j.status)) { update(j, { status: 'queued', error: null }, true); pump(); } break;
    case 'remove': if (!ACTIVE.has(j.status)) { jobs.delete(id); send('download:removed', id); } break;
  }
  return true;
});

ipcMain.handle('download:clearFinished', () => {
  for (const [id, j] of jobs) if (['done', 'canceled', 'error'].includes(j.status)) { jobs.delete(id); send('download:removed', id); }
});
ipcMain.handle('download:list', () => [...jobs.values()].map(publicJob));
ipcMain.handle('download:pauseAll', () => { for (const j of jobs.values()) if (ACTIVE.has(j.status) || j.status === 'queued') stopJob(j, 'paused'); });
ipcMain.handle('download:retryAll', () => { for (const j of jobs.values()) if (j.status === 'error' || j.status === 'canceled') update(j, { status: 'queued', error: null }, true); pump(); });
ipcMain.handle('download:resumeAll', () => { for (const j of jobs.values()) if (j.status === 'paused') update(j, { status: 'queued' }, true); pump(); });

// ---------- history ----------
function addHistory(j) {
  history.unshift({ id: j.id, title: j.title, url: j.url, file: j.file || null, thumbnail: j.thumbnail, mode: j.mode, quality: j.quality, audioFormat: j.audioFormat, size: j.size, date: Date.now() });
  history = history.slice(0, 1000);
  writeJSON(HISTORY_FILE, history);
  send('history:changed', history);
}
ipcMain.handle('history:get', () => history.map((h) => ({ ...h, exists: h.file ? fs.existsSync(h.file) : false })));
ipcMain.handle('history:remove', (_e, id) => { history = history.filter((h) => h.id !== id); writeJSON(HISTORY_FILE, history); return true; });
ipcMain.handle('history:clear', () => { history = []; writeJSON(HISTORY_FILE, history); return true; });

// ---------- settings ----------
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:set', (_e, patch) => {
  settings = { ...settings, ...patch };
  writeJSON(SETTINGS_FILE, settings);
  if ('theme' in patch) applyTitleBar();
  pump();
  return settings;
});

// ---------- shell helpers ----------
ipcMain.handle('shell:openFile', async (_e, p) => (p && fs.existsSync(p) ? (await shell.openPath(p)) === '' : false));
ipcMain.handle('shell:showInFolder', (_e, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); else shell.openPath(settings.downloadDir); });
ipcMain.handle('shell:openDir', () => { fs.mkdirSync(settings.downloadDir, { recursive: true }); return shell.openPath(settings.downloadDir); });
ipcMain.handle('shell:openExternal', (_e, url) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); });
ipcMain.handle('dialog:pickDir', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'], defaultPath: settings.downloadDir });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_e, t) => clipboard.writeText(String(t)));

// ---------- custom images: background + side art (copies stay in the app's data folder, never uploaded) ----------
const IMG_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const IMG_SLOTS = { bg: { key: 'bgImage', base: 'background' }, art: { key: 'artImage', base: 'side-art' } };
function imgDataUrl(slot) {
  const name = settings[IMG_SLOTS[slot].key];
  if (!name) return null;
  const p = path.join(DATA, name);
  try { return `data:${IMG_TYPES[path.extname(p).toLowerCase()]};base64,${fs.readFileSync(p).toString('base64')}`; } catch { return null; }
}
function removeImgFiles(slot) {
  const re = new RegExp(`^${IMG_SLOTS[slot].base}\\.[a-z]+$`, 'i');
  for (const f of fs.readdirSync(DATA)) if (re.test(f)) fs.rmSync(path.join(DATA, f), { force: true });
}
ipcMain.handle('img:get', (_e, slot) => (IMG_SLOTS[slot] ? imgDataUrl(slot) : null));
ipcMain.handle('img:pick', async (_e, slot) => {
  if (!IMG_SLOTS[slot]) return { ok: false };
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  const src = r.filePaths[0];
  const ext = path.extname(src).toLowerCase();
  if (!IMG_TYPES[ext]) return { ok: false, error: 'TYPE' };
  if (fs.statSync(src).size > 20 * 1024 * 1024) return { ok: false, error: 'TOO_BIG' };
  removeImgFiles(slot);
  const name = IMG_SLOTS[slot].base + ext;
  fs.copyFileSync(src, path.join(DATA, name));
  settings = { ...settings, [IMG_SLOTS[slot].key]: name };
  writeJSON(SETTINGS_FILE, settings);
  return { ok: true, url: imgDataUrl(slot), settings };
});
ipcMain.handle('img:clear', (_e, slot) => {
  if (!IMG_SLOTS[slot]) return settings;
  removeImgFiles(slot);
  settings = { ...settings, [IMG_SLOTS[slot].key]: '' };
  writeJSON(SETTINGS_FILE, settings);
  return settings;
});

// ---------- engine install / update ----------
function httpDownload(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const go = (u, n) => {
      if (n > 10) return reject(new Error('Too many redirects'));
      https.get(u, { headers: { 'User-Agent': 'Naseem-Downloader' } }, (r) => {
        if ([301, 302, 303, 307, 308].includes(r.statusCode)) { r.resume(); return go(new URL(r.headers.location, u).toString(), n + 1); }
        if (r.statusCode !== 200) { r.resume(); return reject(new Error('HTTP ' + r.statusCode)); }
        const total = +r.headers['content-length'] || 0;
        let got = 0;
        const tmp = dest + '.tmp';
        const f = fs.createWriteStream(tmp);
        r.on('data', (c) => { got += c.length; onProgress && onProgress(got, total); });
        r.on('error', reject); f.on('error', reject);
        f.on('finish', () => f.close(() => { try { fs.renameSync(tmp, dest); resolve(); } catch (e) { reject(e); } }));
        r.pipe(f);
      }).on('error', reject);
    };
    go(url, 0);
  });
}

function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const r = findFile(p, name); if (r) return r; }
    else if (e.name.toLowerCase() === name) return p;
  }
  return null;
}

let installing = false;
ipcMain.handle('engine:install', async (_e, which = 'all') => {
  if (installing) return { ok: false, error: 'BUSY' };
  installing = true;
  const prog = (step, got, total) => send('engine:progress', { step, got, total });
  try {
    if (which === 'all' || which === 'ytdlp') {
      await httpDownload('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe', path.join(BIN, 'yt-dlp.exe'), (g, t) => prog('ytdlp', g, t));
    }
    if (which === 'all' || which === 'ffmpeg') {
      const zip = path.join(os.tmpdir(), `naseem-ffmpeg-${Date.now()}.zip`);
      const out = zip.replace(/\.zip$/, '');
      await httpDownload('https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip', zip, (g, t) => prog('ffmpeg', g, t));
      prog('extract', 0, 0);
      fs.mkdirSync(out, { recursive: true });
      const r = await runCollect('tar', ['-xf', zip, '-C', out], 300000);
      if (r.code !== 0) throw new Error('Extract failed: ' + cleanError(r.err));
      for (const name of ['ffmpeg.exe', 'ffprobe.exe']) {
        const src = findFile(out, name);
        if (!src) throw new Error(name + ' not found in archive');
        fs.copyFileSync(src, path.join(BIN, name));
      }
      fs.rmSync(zip, { force: true }); fs.rmSync(out, { recursive: true, force: true });
    }
    prog('done', 0, 0);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally { installing = false; }
});

ipcMain.handle('engine:status', async () => {
  const y = ytdlpExe(), f = ffmpegExe();
  let ytVersion = null, ffVersion = null;
  if (y) { const r = await runCollect(y, ['--version'], 30000); if (r.code === 0) ytVersion = r.out.trim(); }
  if (f) { const r = await runCollect(f, ['-version'], 30000); const m = /ffmpeg version (\S+)/.exec(r.out); ffVersion = m ? m[1] : 'ok'; }
  return { ytdlp: ytVersion, ffmpeg: ffVersion, ytdlpPath: y, ffmpegPath: f, bin: BIN };
});

ipcMain.handle('engine:update', async () => {
  const y = ytdlpExe();
  if (!y) return { ok: false, error: 'ENGINE_MISSING' };
  const r = await runCollect(y, ['-U'], 180000);
  return { ok: r.code === 0, output: (r.out + '\n' + r.err).trim().split(/\r?\n/).slice(-3).join('\n') };
});

// ---------- clipboard watcher ----------
let lastClip = '';
function startClipboardWatch() {
  try { lastClip = clipboard.readText().trim(); } catch {}
  setInterval(() => {
    let t = '';
    try { t = clipboard.readText().trim(); } catch { return; }
    if (t === lastClip) return;
    lastClip = t;
    if (settings.clipboardWatch && /^https?:\/\/\S+$/i.test(t) && t.length < 2000) send('clipboard:url', t);
  }, 1000);
}

// ---------- window ----------
function themeColors() {
  if (settings.theme === 'lain') return { color: '#06090e', symbolColor: '#d7e6f5' };
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && nativeTheme.shouldUseDarkColors);
  return dark ? { color: '#0d1117', symbolColor: '#c9d1d9' } : { color: '#f4f6fa', symbolColor: '#1f2633' };
}
function applyTitleBar() {
  if (!win || win.isDestroyed()) return;
  try { win.setTitleBarOverlay({ ...themeColors(), height: 40 }); } catch {}
  win.setBackgroundColor(themeColors().color);
}
nativeTheme.on('updated', applyTitleBar);

function createWindow() {
  win = new BrowserWindow({
    width: 1180, height: 780, minWidth: 860, minHeight: 600,
    title: 'Naseem', backgroundColor: themeColors().color,
    titleBarStyle: 'hidden', titleBarOverlay: { ...themeColors(), height: 40 },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  try { fs.rmSync(COOKIE_DIR, { recursive: true, force: true }); } catch {} // leftovers from a crash
  Menu.setApplicationMenu(null);
  // Dev runs (plain electron.exe) get their own ID; sharing the installed app's ID makes the
  // Start menu show the dev "Electron" shortcut in place of Naseem.
  app.setAppUserModelId(app.isPackaged ? 'com.naseem.downloader' : 'com.naseem.downloader.dev');
  createWindow();
  startClipboardWatch();
});
app.on('before-quit', () => { for (const j of jobs.values()) if (j.child) killTree(j.child.pid); });
app.on('window-all-closed', () => app.quit());
