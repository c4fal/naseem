const { contextBridge, ipcRenderer } = require('electron');

const inv = (ch, ...a) => ipcRenderer.invoke(ch, ...a);
const on = (ch) => (fn) => { const l = (_e, d) => fn(d); ipcRenderer.on(ch, l); return () => ipcRenderer.removeListener(ch, l); };

contextBridge.exposeInMainWorld('api', {
  fetchInfo: (url) => inv('info:fetch', url),
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
  yt: { status: () => inv('yt:status'), login: () => inv('yt:login'), logout: () => inv('yt:logout'), onStatus: on('yt:status') },
  cookies: { import: () => inv('cookies:import'), clear: () => inv('cookies:clear') },
  clipboard: { read: () => inv('clipboard:read'), write: (t) => inv('clipboard:write', t), onUrl: on('clipboard:url') },
});
