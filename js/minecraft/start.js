"use strict";
let release = os.release().split('.')[0];

let batPath
let jsonPath
let javaPath = "java"
let fixedPath = '"'
let text;

let auth_player_name = "player"
let version_name
let game_directory
let assets_root
let assets_index_name
let auth_uuid = "00000XXXXXXXXXXXXXXXXXXXXXX32A4D"
let auth_access_token = "00000XXXXXXXXXXXXXXXXXXXXXX32A4D"
let user_type = "msa"
let version_type

let natives_directory
let launcher_name = "orange"
let launcher_version = "001"
let classpath

let maxMemory = "1024"
let minMemory = "256"

let version_names = [];

let startBt = document.querySelector('.startBt')

let versionInfo = document.getElementById("versionInfo")

let showVersion = document.getElementById("showVersion")


const crypto = require('crypto');

function generateString(name) {
  // 使用 SHA-256 哈希函数计算名字的哈希值
  const hash = crypto.createHash('sha256').update(name).digest('hex');
  // 截取哈希值的前 32 个字符
  const result = hash.slice(0, 32);
  // 返回结果
  return result;
}




ipcRenderer.on('get-config-reply', (event, config) => {
  if(config.hasOwnProperty('minecraftDir') && config.hasOwnProperty('versions')){
    game_directory = config.minecraftDir
    classpath = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}.jar`)
    jsonPath = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}.json`)
    batPath = path.join(config.minecraftDir,"versions", config.selectVersion, "launch.bat")
    natives_directory = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}-natives`)
    version_name = config.selectVersion
  }
  if(config.hasOwnProperty('onlineProfile')){
     auth_player_name = config.onlineProfile.name
     auth_uuid = config.onlineProfile.id
     auth_access_token = auth_uuid;
  }else if (config.hasOwnProperty('offlineProfile')){
    const name = 'YourName';
    const result = generateString(name);
  }
  if (config.selectVersion == "none") {
    versionInfo.style.display = "none";
  }else{
    if(version_names.includes(version_name)){
      let index = version_names.indexOf(version_name);
      let status = version_names[index + 1];
      changeStartElement(version_name,status)
    }else{
      version_names.push(version_name)
      version_names.push("0")
      changeStartElement(version_name,"0")
      if(startBt.id !== 'start'){
        startBt.id = 'start';
      }
    }
    versionInfo.style.display = "flex";
    showVersion.textContent = version_name;
  }
})


 startBt.addEventListener("click", () => {

   if (document.querySelector('.startBt').id == "start"){
     if(version_name != "none"){
      changeStartElement(version_name,"1")
      changeSelectElement(version_name,"0")
       fixedPath = '"'
       executeJson()
     }
   }
   if(styleCheck == false){
   }
 });
 

function getJson(callback){
  fs.readFile(jsonPath, 'utf-8', (event,data) => {
    const jsonData = JSON.parse(data);
    callback(jsonData)
 }); 
 }

 function executeJson(){
  text = '@echo off\n'
  text += 'set APPDATA="'+ game_directory +'\\"\n'
  text += 'cd /D "'+ game_directory +'\\"\n'
  text += javaPath+' '
  getJson(function(jsonData){
  const regex = /\$\{(.+?)\}/g;
  assets_index_name = jsonData.assets;
  assets_root = path.join(game_directory,"assets")
  version_type = jsonData.type

  const gameArguments = jsonData.arguments.game;
  const jvmArguments = jsonData.arguments.jvm;

  for (let i = 0; i < jvmArguments.length; i++) {
    let argument = jvmArguments[i];

    if (typeof argument === 'object') {
      let rules = argument.rules;
      let value = argument.value;

      rules.forEach(rule => {
        if (rule.action === 'allow') {
          let os = rule.os;
          if (os && os.name === 'windows') {
            if (os.version) {
              let version = os.version.replace('^', '').replace('\\.', '');
              if (version === release) {
                let result = value.map(item => {
                  if (item.includes('Windows 10')) {
                    item = item.replace('Windows 10', '"Windows 10"');
                  }
                  return item;
                }).join(' ');
                text += result
                text += " "
              }
            }else{
              text += value
              text += " "
            }
          }
        }
      });
    }

    if (typeof argument === 'string') {
      if(argument === "-cp"){
        argument = ""
      }else if(argument == "${classpath}"){
        argument = ""
      }
      const matches = argument.match(regex)
      if (matches) {
        for (const match of matches) {
          const value = match.slice(2, -1);
          switch (value) {
            case 'natives_directory':
              argument = argument.replace(match, '"'+natives_directory+'"');
              break;
            case 'launcher_name':
              argument = argument.replace(match, launcher_name);
              break;
            case 'launcher_version':
              argument = argument.replace(match, launcher_version);
              break;
          }
        }
      }
      text += argument+" "
    }
  }
  text += "-cp "
  jsonData.libraries.forEach(library => {
    let skipLibrary = false;
    if (library.rules) {
      if (library.rules) {
        library.rules.forEach(rule => {
          if (rule.action === 'allow') {
            if (rule.os && rule.os.name !== 'windows') {
              skipLibrary = true;
            }
          } else if (rule.action === 'disallow') {
            if (rule.os && rule.os.name === 'windows') {
              skipLibrary = true;
            }
          }
        });
      }
    }

    if (!skipLibrary && library.downloads && library.downloads.artifact) {
      let libUrl = library.downloads.artifact.url;
      let libPath = libUrl.replace('https://libraries.minecraft.net/', '');
      libPath = libPath.replace(/\//g, '\\');
      fixedPath += path.join(game_directory, "libraries", libPath) + ";";
    }
  });

  text += fixedPath
  text += classpath+'"'
  text += " -Xmn"+minMemory+"m"
  text += " -Xmx"+maxMemory+"m"
  text += " "+jsonData.mainClass+" "

  for (let i = 0; i < gameArguments.length; i += 2) {
    const key = gameArguments[i];
    let value = gameArguments[i + 1];
  
    switch (key) {
      case '--username':
        value = auth_player_name;
        break;
      case '--version':
        value = version_name;
        break;
      case '--gameDir':
        value = game_directory;
        break;
      case '--assetsDir':
        value = assets_root;
        break;
      case '--assetIndex':
        value = assets_index_name;
        break;
      case '--uuid':
        value = auth_uuid;
        break;
      case '--accessToken':
        value = auth_access_token;
        break;
      case '--userType':
        value = user_type;
        break;
      case '--versionType':
        value = version_type;
        break;
    }
    if (typeof key === 'string') {
      text += `${key} ${value} `;
    }
  }
  text += " --width 854 --height 480\n"
  text += "exit"
  fs.writeFile(batPath, text, (err) => {
    if (err) throw err
    console.log('Config file has been created,now opening bat file.')
    runExec()
  })
})  
}

function runExec() {
let checkCount = 0;
let styleCheck = true;

let version = version_name;
const child = spawn('cmd.exe', ['/c', 'chcp 65001 && ' + batPath]);

child.stdout.on('data', (data) => {
  checkCount++
  console.log(`${data}`);
  if(checkCount >= 5 && styleCheck){
    changeSelectElement(version,"1")
    changeStartElement(version,"2")
  }
});

child.stderr.on('data', (data) => {
  console.error(`${data}`);
});

child.on('close', (code) => {
  changeSelectElement(version,"2")
  changeStartElement(version,"0")
  const index = version_names.indexOf(version);
  if (index !== -1) {
      version_names.splice(index, 2);
  }
  checkCount = 0;
  styleCheck = false
});
}
function changeStartElement(version,code) {

  let index = version_names.indexOf(version);
  version_names[index + 1] = code;

  if(version === version_name){
    if(code === "0"){
      startBt.id = 'start';
      document.getElementById('buttonPause').style.display = 'none';
      document.getElementById('buttonPlay').style.display = 'flex';
      startBt.querySelector('span').textContent = "开始游戏"
    }else if(code === "1"){
      document.getElementById('buttonPause').style.display = 'none';
      document.getElementById('buttonPlay').style.display = 'flex';
      startBt.querySelector('span').textContent = "正在启动"

    }else if(code === "2"){
      startBt.id = 'running';
      document.getElementById('buttonPause').style.display = 'flex';
      document.getElementById('buttonPlay').style.display = 'none';
      startBt.querySelector('span').textContent = "运行中"
    }
  }
}

function changeSelectElement(versionName,code){
  let versions = document.querySelectorAll('.versions button');
  versions.forEach(version => {
    let span = version.querySelector('span');
    if (span.textContent === versionName) {
      if(code === "0"){
        let c = document.createElement("c")
        c.textContent = '-';
        let text = document.createElement('text');
        text.textContent = '正在启动';
        version.appendChild(c)
        version.appendChild(text);
        version.querySelector('text').style.color = "rgb(105,182,224)"
      }else if(code === "1"){
        span.style.color = "rgb(166,245,50)";
        version.querySelector('text').textContent = '正在运行';
        version.querySelector('text').style.color = "rgb(119,175,60)"
      }else if(code === "2"){
        span.style.color = "rgb(209, 216, 225)";
        version.querySelector('c').remove()
        version.querySelector('text').remove()
      }
    }
  });
}

