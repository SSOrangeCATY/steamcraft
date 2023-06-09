
let configJson;
const clientId = '00000000402b5328'; // Minecraft 客户端 id
let checkProfile = true;
let skinUrl;

ipcRenderer.on('get-config-reply', (event, config) => {
    configJson = config;
    // 检测config中是否有在线或者离线字段
    if(configJson.hasOwnProperty('onlineProfile') || configJson.hasOwnProperty('offlineProfile') || configJson.hasOwnProperty('mcAccessToken')){
      document.getElementById('accountCard').style.display = 'flex';
      document.getElementById('loginCard').style.display = 'none';
      if (config.hasOwnProperty('onlineProfile') || configJson.hasOwnProperty('mcAccessToken') && configJson.hasOwnProperty('account') && configJson.account.hasOwnProperty('expiresIn')){
        const currentTime = new Date();
        if (currentTime.getTime() > configJson.account.expiresIn) {
           getRefreshToken()
        } else {
         if(checkProfile){
            checkProfile = false;
            getProfile();
          }
          if(configJson.onlineProfile.hasOwnProperty('skins')){
            skinUrl = configJson.onlineProfile.skins[0].url;
            downloadSkin()
          }
          document.getElementById('accountBar').querySelector('span').textContent = configJson.onlineProfile.name;
          document.getElementById('playerName').textContent = configJson.onlineProfile.name;

          document.getElementById('account').textContent = configJson.onlineProfile.name;
        }
      }else if(configJson.hasOwnProperty('offlineProfile')){
          document.getElementById('accountBar').querySelector('span').textContent = configJson.offlineProfile.name;
          document.getElementById('playerName').textContent = configJson.offlineProfile.name;

          document.getElementById('account').textContent = configJson.offlineProfile.name;
        }
      }else{
        document.getElementById('gamesCard').display = "none"
        document.getElementById('accountCard').style.display = 'none';
        document.getElementById('accountInfo').style.display = 'flex';
        document.getElementById('loginCard').style.display = 'flex';
      }
});


document.getElementById('microsoft').addEventListener('click' ,() => {
 ipcRenderer.send('get-auth-code');
 document.getElementById('loading').style.display = 'flex';
})


ipcRenderer.on('get-auth-code-reply', (event, wrCode) => {
  document.getElementById('loading').style.display = 'flex';

    const redirectUri = 'https://login.live.com/oauth20_desktop.srf';
    // 使用 XMLHttpRequest 发送 POST 请求
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://login.live.com/oauth20_token.srf');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    // 构建请求参数
    const params = `client_id=${clientId}&code=${wrCode}&grant_type=authorization_code&redirect_uri=${redirectUri}&scope=XboxLive.signin%20offline_access`;
    
    xhr.onload = function() {
        console.log("执行微软登录2")
      if (this.status === 200) {
        // 解析响应数据
        const response = JSON.parse(this.responseText);
        const accessToken = response.access_token;

        const currentTime = new Date();
        const expires_in = currentTime.getTime() + response.expires_in * 1000;

        const refreshToken = response.refresh_token; // 获取 refresh token
        const account = {
            "accessToken": accessToken,
            "refreshToken": refreshToken,
            "expiresIn": expires_in
        };
        ipcRenderer.send('update-config', "account", account)
        document.getElementById('loading').style.display = 'flex';

        getXboxLiveToken(accessToken)
      }else{
        document.getElementById('loading').style.display = 'none';
      }
    };
    
    xhr.send(params);
    });


async function getXboxLiveToken(liveAccessToken) {
    console.log("执行微软登录3")

    let response = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            Properties: {
                AuthMethod: "RPS",
                SiteName: "user.auth.xboxlive.com",
                RpsTicket: `d=${liveAccessToken}`
            },
            RelyingParty: "http://auth.xboxlive.com",
            TokenType: "JWT"
        })
    });
    let xboxResponse = await response.json();
    ipcRenderer.send('update-config',"uhs",xboxResponse.DisplayClaims.xui[0].uhs);
    getXstsToken(xboxResponse.Token)
}


  

function getXstsToken(xblToken){
  document.getElementById('loading').style.display = 'flex';

    console.log("执行微软登录4")
// 构建请求正文
const body = {
  Properties: {
    SandboxId: 'RETAIL',
    UserTokens: [xblToken]
  },
  RelyingParty: 'rp://api.minecraftservices.com/',
  TokenType: 'JWT'
};

// 使用 XMLHttpRequest 发送 POST 请求
const xhr = new XMLHttpRequest();
xhr.open('POST', 'https://xsts.auth.xboxlive.com/xsts/authorize');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Accept', 'application/json');

xhr.onload = function() {
  if (this.status === 200) {
    // 解析响应数据
    const response = JSON.parse(this.responseText);
    const xstsToken = response.Token; // 获取 XSTS 令牌

    getMinecraftToken(xstsToken,configJson.uhs)
    // 使用 XSTS 令牌进行后续操作
  } else{
    document.getElementById('loading').style.display = 'none';
  }
};

xhr.send(JSON.stringify(body));

}

function getMinecraftToken(xstsToken,uhs){
  document.getElementById('loading').style.display = 'flex';

    console.log("执行微软登录5")

// 构建请求正文
const body = {
  identityToken: `XBL3.0 x=${uhs};${xstsToken}`
};

// 使用 XMLHttpRequest 发送 POST 请求
const xhr = new XMLHttpRequest();
xhr.open('POST', 'https://api.minecraftservices.com/authentication/login_with_xbox');
xhr.setRequestHeader('Content-Type', 'application/json');

xhr.onload = function() {
  if (this.status === 200) {
    // 解析响应数据
    const response = JSON.parse(this.responseText);
    const mcAccessToken = response.access_token; // 获取 Minecraft 访问令牌
    ipcRenderer.send('update-config', "mcAccessToken", mcAccessToken)
    document.getElementById('accountInfo').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    // 使用 Minecraft 访问令牌进行后续操作
    getProfile()
  } else{
    document.getElementById('loading').style.display = 'none';
  }
};

xhr.send(JSON.stringify(body));

}

function getProfile() {
  document.getElementById('loading').style.display = 'flex';
        // 使用 XMLHttpRequest 发送 GET 请求
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.minecraftservices.com/minecraft/profile');
        xhr.setRequestHeader('Authorization', `Bearer ${configJson.mcAccessToken}`);

        xhr.onload = function() {
            if (this.status === 200) {
                // 解析响应数据
                const response = JSON.parse(this.responseText);
                document.getElementById('loading').style.display = 'none';

                ipcRenderer.send('update-config', "onlineProfile", response)
            } else {
                document.getElementById('loading').style.display = 'none';
                // 请求失败，可能是因为账号没有拥有游戏
            }
        };
        xhr.send();

}

function downloadSkin(){
  const filePath = path.join(__dirname,"img", 'skin.png');
  const file = fs.createWriteStream(filePath);
  request = http.get(skinUrl, response => {
   response.pipe(file);
   reloadSkin()
})

request.on('error', error => {
    console.error(error);
});
}

function reloadSkin() {
 const canvas = document.getElementById('skinHead');
 const ctx = canvas.getContext('2d');
 canvas.width = 22;
 canvas.height = 22;
 
 const img = new Image();
 img.src = './img/skin.png';
 
 img.onload = function() {
     ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 8, 8);
 
     const imageData = ctx.getImageData(0, 0, 8, 8);
     const data = imageData.data;
 
     const newImageData = ctx.createImageData(canvas.width, canvas.height);
     const newData = newImageData.data;
 
     for (let y = 0; y < canvas.height; y++) {
         for (let x = 0; x < canvas.width; x++) {
             const srcX = Math.floor(x / 2.75);
             const srcY = Math.floor(y / 2.75);
 
             const srcIndex = (srcY * 8 + srcX) * 4;
             const dstIndex = (y * canvas.width + x) * 4;
 
             newData[dstIndex] = data[srcIndex];
             newData[dstIndex + 1] = data[srcIndex + 1];
             newData[dstIndex + 2] = data[srcIndex + 2];
             newData[dstIndex + 3] = data[srcIndex + 3];
         }
     }
 
     ctx.putImageData(newImageData, 0, 0);
};
const canva = document.getElementById('playerHead');
const ctx1 = canva.getContext('2d');
canva.width = 164;
canva.height = 164;

const image = new Image();
image.src = './img/skin.png';

image.onload = function() {
  ctx1.drawImage(image, 8, 8, 8, 8, 0, 0, 8, 8);

    const imageData = ctx1.getImageData(0, 0, 8, 8);
    const data = imageData.data;

    const newImageData = ctx1.createImageData(canva.width, canva.height);
    const newData = newImageData.data;

    for (let y = 0; y < canva.height; y++) {
        for (let x = 0; x < canva.width; x++) {
            const srcX = Math.floor(x / 20.5);
            const srcY = Math.floor(y / 20.5);

            const srcIndex = (srcY * 8 + srcX) * 4;
            const dstIndex = (y * canva.width + x) * 4;

            newData[dstIndex] = data[srcIndex];
            newData[dstIndex + 1] = data[srcIndex + 1];
            newData[dstIndex + 2] = data[srcIndex + 2];
            newData[dstIndex + 3] = data[srcIndex + 3];
        }
    }

    ctx1.putImageData(newImageData, 0, 0);
};
}


function getRefreshToken(){
  const refreshToken = configJson.account.refreshToken;

// 使用 XMLHttpRequest 发送 POST 请求
const xhr = new XMLHttpRequest();
xhr.open('POST', 'https://login.live.com/oauth20_token.srf');
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

// 构建请求参数
const params = `client_id=${clientId}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=https://login.live.com/oauth20_desktop.srf`;

xhr.onload = function() {
  if (this.status === 200) {
    // 解析响应数据
    const response = JSON.parse(this.responseText);
    const accessToken = response.access_token;
    const currentTime = new Date();
    const expires_in = currentTime.getTime() + response.expires_in * 1000;
    const account = {
        "accessToken": accessToken,
        "expiresIn": expires_in,
        "refreshToken": refreshToken
    };
    ipcRenderer.send('update-config', "account", account)
    getXboxLiveToken(accessToken)
  } else {
    // 请求失败，可能是因为 refresh token 失效
    // 提示用户重新登录，以获取新的授权码和 refresh token
    ipcRenderer.send('get-auth-code')
  }
};

xhr.send(params);
}