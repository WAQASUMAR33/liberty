const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDbConfig: () => ipcRenderer.invoke('get-db-config'),
    saveDbConfig: (config) => ipcRenderer.invoke('save-db-config', config),
});
