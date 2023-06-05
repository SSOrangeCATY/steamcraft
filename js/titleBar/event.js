var { dialog } = require('@electron/remote')
var { ipcRenderer } = require('electron')
var fs = require('fs')
var path = require('path')
var { spawn } = require('child_process');
var os = require('os');


const maximizeBtn = document.getElementById('maximize-btn');
const restoreBtn = document.createElement('button');
restoreBtn.innerHTML = '<i class="fa-solid fa-window-restore"></i>';

document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('close-window')
})

maximizeBtn.addEventListener('click', () => {
 ipcRenderer.send('maximize-window');
 maximizeBtn.replaceWith(restoreBtn);
});

restoreBtn.addEventListener('click', () => {
 ipcRenderer.send('unmaximize-window');
 restoreBtn.replaceWith(maximizeBtn);
});


document.getElementById('minimize-btn').addEventListener('click', () => {
  ipcRenderer.send('minimize-window')
})
