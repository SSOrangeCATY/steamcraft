const { app,BrowserWindow,BrowserView,ipcMain,Tray,Menu } = require('electron')

const { initialize,enable } = require('@electron/remote/main')
const fs = require('fs')
const path = require('path')
const css = `
::-webkit-scrollbar {
  width: 7px;
  height: 7px;
  background-color: rgb(23,29,37);
}

::-webkit-scrollbar-thumb {
  background-color: rgb(123,131,146);
  border-radius: 10px;
}
`;
// 定义配置文件的路径
const blankHtml = path.join(__dirname,'resources','blank.html')
const icon = path.join(__dirname,'resources','img','minecraft.ico')

let viewHtml;
let config;
let win;
let swin;

initialize()

function createWindow() {
  win = new BrowserWindow({
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
    icon: icon,
    contentSecurityPolicy: "default-src 'self'"
  })
  enable(win.webContents)
  const view = new BrowserView()
  view.setAutoResize({ width: true, height: true })

  ipcMain.on('remove-View', () => {
    win.setBrowserView(null)
    win.webContents.send('removeUrlBar');
  })

  ipcMain.on('set-htmlView', (event,html) => {
    const winBounds = win.getBounds()
    const viewHeight = winBounds.height - 150
    view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
    win.setBrowserView(view)
    if (viewHtml != html){
      view.webContents.loadURL(html)
      viewHtml = html
    }
    win.webContents.send('showUrlBar');

  })

  ipcMain.on('set-fileHtmlView', (event,html) => {
    const winBounds = win.getBounds()
    const viewHeight = winBounds.height - 150
    view.setBounds({ x: 0, y: 100, width: winBounds.width, height: viewHeight })
    win.setBrowserView(view)
    if (viewHtml != html){
      view.webContents.readFile(html)
      viewHtml = html
    }
    win.webContents.send('showUrlBar');

  })
  
  view.webContents.on('dom-ready', () => {
    view.webContents.insertCSS(css);
    win.webContents.send('webReady');
  })

  view.webContents.on('did-navigate', (event, url) => {
    const canGoBack = view.webContents.canGoBack();
    const canGoForward = view.webContents.canGoForward();
    
    win.webContents.send('navigation-status', { canGoBack, canGoForward });
    win.webContents.send('urlChange', url);
  });
  ipcMain.on('get-navigation-status', () => {
    const canGoBack = view.webContents.canGoBack();
    const canGoForward = view.webContents.canGoForward();
    win.webContents.send('navigation-status', { canGoBack, canGoForward });
  })
  ipcMain.on('view-reload', () => {
    view.webContents.reload();
  });
  ipcMain.on('view-goBack', () => {
    view.webContents.goBack();
  })
  ipcMain.on('view-goForward', () => {
    view.webContents.goForward();
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
  win.on('close', (event) => {
    event.preventDefault()
    win.hide()
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
        win.webContents.send('removeUrlBar');
      }
    });
  })
ipcMain.on('create-settings-window', (event,settingsType,JsonPath) => {


});
  win.loadFile(path.join(__dirname,'resources',"index.html"))
}
// 检查配置文件是否存在
app.whenReady().then(createWindow)
app.whenReady().then(createConfigFile)
app.whenReady().then(createSettingsWindow)
app.whenReady().then(traySet)

function traySet(){
  const tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
        label: '设置',
        click: () => {
          swin.show()
        }
    },
    {
        label: '退出',
        click: () => {
          app.exit(0)
        }
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    win.show()
    win.focus()
  })
}

function createSettingsWindow(){
  swin = new BrowserWindow({ 
    frame: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    },
    minWidth: 850,
    minHeight: 720,
    maxHeight: 720,
    maxWidth: 850,
    width: 850,
    height: 720,
    icon: icon,
    contentSecurityPolicy: "default-src 'self'"
  })
  swin.hide()
  swin.setTitle('设置 - '+"还没写完")
  swin.loadFile(path.join(__dirname,'resources',"settings.html"))
  ipcMain.on('hide-settings-window',() =>{
    swin.hide()
  });
  
}

function createConfigFile(){
  const userDataPath = app.getPath('userData');
// 拼接配置文件的路径
const configPath = path.join(userDataPath,'config.json');
// 确定配置文件所在的目录
const configDir = path.dirname(configPath);

// 检查目录是否存在
if (!fs.existsSync(configDir)) {
  // 如果目录不存在，则创建它
  fs.mkdirSync(configDir, { recursive: true });
}
// 写入配置文件
  fs.access(configPath, fs.constants.F_OK, (err) => {
    if (err) {
      // 如果配置文件不存在，则创建一个新的配置对象
      const config = {}
      console.log(err)
      // 将新的配置对象写入配置文件
      fs.writeFile(configPath, JSON.stringify(config), (err) => {
        if (err) throw err
        console.log('Config file has been created.')
        app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
        app.exit(0)
      })
    } else {
      fs.readFile(configPath, 'utf-8', (err, data) => {
        // 在这里访问 data 参数
        config = JSON.parse(data)
      })
      console.log('Config file already exists.')
    }
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
}
