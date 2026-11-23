'use strict';
/* global NaseemNative */
// Android replacement for preload.js: same window.api, backed by the Kotlin bridge.
(() => {
  const pending = new Map();
  const subs = new Map();
  let seq = 0;
  window.__nsm = {
    resolve(id, json) { const r = pending.get(id); if (r) { pending.delete(id); r(JSON.parse(json)); } },
    emit(ch, json) { const d = JSON.parse(json); for (const fn of subs.get(ch) || []) fn(d); },
  };
  const inv = (ch, ...a) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); NaseemNative.invoke(id, ch, JSON.stringify(a)); });
  const on = (ch) => (fn) => {
    subs.set(ch, [...(subs.get(ch) || []), fn]);
    return () => subs.set(ch, (subs.get(ch) || []).filter((f) => f !== fn));
  };

  // same as simplify() in main.js
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
      type: 'video', url: j.webpage_url || j.original_url, title: j.title || '', thumbnail: bestThumb(j),
      duration: j.duration || null, uploader: j.uploader || j.channel || '', extractor: j.extractor_key || j.extractor || '',
      viewCount: j.view_count || null, uploadDate: j.upload_date || null, heights, audioSize: audioSize || null,
      subLangs: Object.keys(j.subtitles || {}), isLive: !!j.is_live,
    };
  }

  window.api = {
    fetchInfo: async (url) => {
      const r = await inv('info:fetch', url);
      if (!r.ok) return r;
      try { return { ok: true, info: simplify(JSON.parse(r.out)) }; } catch { return { ok: false, error: 'Bad response' }; }
    },
    download: {
      add: (items) => inv('download:add', items),
      action: (id, action) => inv('download:action', id, action),
      list: () => inv('download:list'),
      clearFinished: () => inv('download:clearFinished'),
      pauseAll: () => inv('download:pauseAll'),
      resumeAll: () => inv('download:resumeAll'),
      retryAll: () => inv('download:retryAll'),
      onUpdate: on('download:update'),
      onRemoved: on('download:removed'),
    },
    history: { get: () => inv('history:get'), remove: (id) => inv('history:remove', id), clear: () => inv('history:clear'), onChanged: on('history:changed') },
    settings: { get: () => inv('settings:get'), set: (p) => inv('settings:set', p) },
    engine: { status: () => inv('engine:status'), install: (w) => inv('engine:install', w), update: () => inv('engine:update'), onProgress: on('engine:progress') },
    shell: {
      openFile: (p) => inv('shell:openFile', p), showInFolder: (p) => inv('shell:showInFolder', p),
      openDir: () => inv('shell:openDir'), openExternal: (u) => inv('shell:openExternal', u), pickDir: () => inv('dialog:pickDir'),
    },
    images: { get: (slot) => inv('img:get', slot), pick: (slot) => inv('img:pick', slot), clear: (slot) => inv('img:clear', slot) },
    cookies: { status: () => inv('cookies:status'), firefoxSignIn: () => inv('cookies:firefoxSignIn'), import: () => inv('cookies:import'), clear: () => inv('cookies:clear') },
    clipboard: { read: () => inv('clipboard:read'), write: (t) => inv('clipboard:write', t), onUrl: on('clipboard:url') },
  };

  // Links shared to Naseem from other apps: fetch them once app.js has finished starting up.
  on('share:url')((url) => {
    const go = () => {
      if (typeof S === 'undefined' || !S.settings) return setTimeout(go, 100);
      showView('home');
      fetchUrl(url);
    };
    go();
  });

  // Back button: leave History/Settings first, then let Android close the app.
  window.__nsmBack = () => {
    const v = document.querySelector('.view:not([hidden])');
    if (v && v.id !== 'view-home') { showView('home'); return true; }
    return false;
  };

  // Keep the status bar and the strip behind it in the app's theme colours.
  const syncTheme = () => inv('ui:theme', { bg: getComputedStyle(document.body).backgroundColor, light: document.documentElement.dataset.theme === 'light' });
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('DOMContentLoaded', syncTheme);
})();
