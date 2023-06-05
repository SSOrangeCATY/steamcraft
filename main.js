const { app,BrowserWindow,BrowserView,ipcMain, } = require('electron')
const { initialize } = require('@electron/remote/main')
const { enable } = require('@electron/remote/main')
const fs = require('fs')
const path = require('path')
const css = `
::-webkit-scrollbar {
  width: 7px;
  background-color: rgb(23,29,37);
}

::-webkit-scrollbar-thumb {
  background-color: rgb(123,131,146);
  border-radius: 10px;
}
`;

// 定义配置文件的路径
const configPath = path.join(__dirname, 'config.json')
const blankHtml = path.join(__dirname, 'blank.html')

let viewHtml;
let config;



initialize()

function createWindow() {
  const win = new BrowserWindow({
    frame: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    },
    minWidth: 1010,
    minHeight: 600,
    width: 1010,
    height: 600,
    contentSecurityPolicy: "default-src 'self'"
  })
  enable(win.webContents)
  const view = new BrowserView()
  win.setBrowserView(view)
  const winBounds = win.getBounds()
  const viewHeight = winBounds.height - 150
  view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
  view.setAutoResize({ width: true, height: true })
  view.webContents.loadFile(blankHtml)
  setTimeout(() => {
    win.setBrowserView(null)
  }, 1000)

  ipcMain.on('remove-View', () => {
    win.setBrowserView(null)
  })

  ipcMain.on('set-htmlView', (event,html) => {
    const winBounds = win.getBounds()
    const viewHeight = winBounds.height - 150
    view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
    win.setBrowserView(view)
    if(html != viewHtml){
      view.webContents.loadURL(html)
      viewHtml = html
    }
  })

  ipcMain.on('set-fileHtmlView', (event,html) => {
    const winBounds = win.getBounds()
    const viewHeight = winBounds.height - 150
    view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
    win.setBrowserView(view)
    if(html != viewHtml){
      view.readFile(html)
      viewHtml = html
    }
  })
  
  view.webContents.on('dom-ready', () => {
    view.webContents.insertCSS(css);
  })

  ipcMain.on('close-window', () => {
    win.close()
  })
  ipcMain.on('minimize-window', () => {
    win.minimize()
  })
  ipcMain.on('maximize-window', () => {
    win.maximize()
  })
  ipcMain.on('unmaximize-window', () => {
    win.unmaximize()
  })




  ipcMain.on('update-config', (event, key, value) => {
    // 更新 config 变量中指定键的值
    config[key] = value;
    fs.writeFile(configPath, JSON.stringify(config), (err) => {
        if (err) throw err;
        console.log('Config key has been changed.');
    });
    event.sender.send('get-config-reply', config)
});

ipcMain.on('get-config', (event) => {
    // 将 config 变量的值发送回渲染进程
    event.sender.send('get-config-reply', config)
})
  
ipcMain.on('get-auth-code', (event) => {
    const winBounds = win.getBounds()
    const viewHeight = winBounds.height - 150
    view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
    win.setBrowserView(view)
    const clientId = '00000000402b5328'; // Minecraft 客户端 id
    const responseType = 'code';
    const scope = 'XboxLive.signin%20offline_access';
    const redirectUri = 'https://login.live.com/oauth20_desktop.srf';
    const url = `https://login.live.com/oauth20_authorize.srf?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`;
    view.webContents.loadURL(url);
    view.webContents.on('did-navigate', (viewEvent, url) => {
      if (url.startsWith('https://login.live.com/oauth20_desktop.srf')) {
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get('code');
        event.sender.send('get-auth-code-reply', code);
        win.setBrowserView(null)
      }
    });
  })
  

  win.loadFile('index.html')
}

// 检查配置文件是否存在
fs.access(configPath, fs.constants.F_OK, (err) => {
  if (err) {
    // 如果配置文件不存在，则创建一个新的配置对象
    const config = {}
    console.log(err)
    // 将新的配置对象写入配置文件
    fs.writeFile(configPath, JSON.stringify(config), (err) => {
      if (err) throw err
      console.log('Config file has been created.')
    })
  } else {
    fs.readFile(configPath, 'utf-8', (err, data) => {
      // 在这里访问 data 参数
      config = JSON.parse(data)
    })
    console.log('Config file already exists.')
  }
})

app.whenReady().then(createWindow)