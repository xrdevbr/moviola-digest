const { contextBridge, ipcRenderer } = require('electron');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

contextBridge.exposeInMainWorld('electron', {
  getFontPath: () => ipcRenderer.invoke('get-font-path'),
  isDeviceConnected: () => ipcRenderer.invoke('is-device-connected'),
  transferFile: (filePath) => ipcRenderer.invoke('transfer-file', filePath),
  ffmpegPath: require('@ffmpeg-installer/ffmpeg').path,
  ffprobePath: require('@ffprobe-installer/ffprobe').path,
  ipcRenderer: ipcRenderer,
  spawn: spawn,
  spawnSync: spawnSync,
  path: path,
  fs: fs,
  exec: exec,
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});
