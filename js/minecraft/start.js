"use strict";
let release = os.release().split('.')[0];


let javas
let batPath
let jsonPath
let javaPath = "java"
let javaVersion
let fixedPath = '"'
let text;

let auth_player_name = "player"
let version_name
let game_directory
let library_directory
let assets_root
let assets_index_name
let auth_uuid = "00000XXXXXXXXXXXXXXXXXXXXXX32A4D"
let auth_access_token = "00000XXXXXXXXXXXXXXXXXXXXXX32A4D"
let user_type = "msa"
let version_type

let natives_directory
let launcher_name = "orange"
let launcher_version = "003"
let classpath

let maxMemory = "2048"
let minMemory = "256"

let version_names = [];

let startBt = document.querySelector('.startBt')

let versionInfo = document.getElementById("versionInfo")

let showVersion = document.getElementById("showVersion")

ipcRenderer.on('get-config-reply', (event, config) => {
  if(config.hasOwnProperty('minecraftDir') && config.hasOwnProperty('versions')){
    game_directory = config.minecraftDir
    library_directory = '"'+path.join(config.minecraftDir,"libraries")+'"'
    classpath = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}.jar`)
    jsonPath = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}.json`)
    batPath = path.join(config.minecraftDir,"versions", config.selectVersion, "launch.bat")
    natives_directory = path.join(config.minecraftDir,"versions", config.selectVersion, `${config.selectVersion}-natives`)
    version_name = config.selectVersion
    if(config.hasOwnProperty('java')){
      javas = config.java
    }
    /*'"C:\\Program Files\\Java\\jre1.8.0_291\\bin\\java.exe"'*/
  }
  if(config.hasOwnProperty('onlineProfile')){
     auth_player_name = config.onlineProfile.name
     auth_uuid = config.onlineProfile.id
     auth_access_token = config.mcAccessToken;
  }else if (config.hasOwnProperty('offlineProfile')){
    // 没做离线
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
 });
 

function getJson(callback){
  fs.readFile(jsonPath, 'utf-8', (event,data) => {
    const jsonData = JSON.parse(data);
    callback(jsonData)
 }); 
 }
 let versionCheck = true;
 function executeJson(){
  text = '@echo off\n'
  text += 'cd /D "'+ game_directory +'\\"\n'
  getJson(function(jsonData){
  
  if(jsonData.hasOwnProperty('javaVersion') && !jsonData.hasOwnProperty('arguments')){
    const needJavaVersion = jsonData.javaVersion.majorVersion
    if(needJavaVersion == 8 ){
      if(javas.hasOwnProperty('java8')){
        javaPath = '"'+javas.java8[0].path+'"'
        versionCheck = true;
      }else {
        createDialog("ERROR",  `无法找到适用于${version_name}运行的 Java8`,7)
      }
    }
  }
  text += javaPath+' '

  const regex = /\$\{(.+?)\}/g;
  assets_index_name = jsonData.assets;
  assets_root = path.join(game_directory,"assets")
  version_type = jsonData.type
  let gameArguments;
  let jvmArguments;
  if(jsonData.hasOwnProperty('arguments')){
    gameArguments = jsonData.arguments.game;
    jvmArguments = jsonData.arguments.jvm;
    versionCheck = false;
  }else if(jsonData.hasOwnProperty('minecraftArguments')){
    gameArguments = jsonData.minecraftArguments;
    versionCheck = true;
  }
  if(jvmArguments !== undefined){
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
        }else if(argument.includes("DFabricMcEmu")){
            argument = "-DFabricMcEmu=net.minecraft.client.main.Main "
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
              case 'version_name':
                  argument = argument.replace(match, jsonData.id);
                  break;
              case 'classpath_separator': 
                argument = argument.replace(match,"")
                break;
              case 'library_directory': 
                argument = argument.replace(match,library_directory)
                break;
            }
          }
        }
        if (argument.includes('.jar') && argument.includes('libraries')) {
          argument = argument.replace(/\.jar/g, '.jar;');
        }
        if(argument !== ''){
          text += argument+" "
        }
      }
    }
  }
  if(versionCheck){
    text += `"-Djava.library.path=${natives_directory}" `
  }
  text += "-cp "
  let latestVersions = {};
  jsonData.libraries.forEach(library => {
      let skipLibrary = false;
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
      if(versionCheck && library.hasOwnProperty('clientreq') && !library.clientreq){
            skipLibrary = true;
      }
      if (!skipLibrary && library.hasOwnProperty('downloads') && library.downloads.hasOwnProperty('artifact')) {
          let libUrl
          let libPath
          if(library.downloads.artifact.hasOwnProperty('url') && library.downloads.artifact.url !== ""){
              libUrl = library.downloads.artifact.url;
              libPath = libUrl.replace('https://libraries.minecraft.net/', '');
              libPath = libPath.replace('https://maven.minecraftforge.net/', '');
              libPath = libPath.replace(/\//g, '\\');
          }else if(library.downloads.artifact.hasOwnProperty('path')){
              libPath = library.downloads.artifact.path; 
          }
          if(!fixedPath.includes(path.join(game_directory, "libraries", libPath)+ ";")){
            fixedPath += path.join(game_directory, "libraries", libPath) + ";";
          }
          if(versionCheck){
          let parts = libPath.split("\\");
          let jarVersion = parts[parts.length - 1].split("-")[parts[parts.length - 1].split("-").length - 1].replace(".jar", "");
          let jarName = parts[parts.length - 3];
          if (!latestVersions[jarName] || parseFloat(jarVersion) > parseFloat(latestVersions[jarName])) {
              latestVersions[jarName] = jarVersion;
              let regex = new RegExp(jarName + "-[0-9.]+\\.jar", "g");
              fixedPath = fixedPath.replace(regex, jarName + "-" + jarVersion + ".jar");
          }
        }
      }else if(!skipLibrary && library.hasOwnProperty('name') || library.hasOwnProperty('url')){
          let libName = library.name;
          let parts = libName.split(':');
          let firstPart = parts.shift().replace(/\./g, '\\');
          let libPath = firstPart + '\\' + parts.join('\\');
          parts = libName.split(':');
          parts.shift();
          libName = parts.join('-') + '.jar';
          fixedPath += path.join(game_directory,"libraries",libPath,libName)+ ";";
          if(true){
            let parts = libPath.split("\\");
            let jarVersion = parts[parts.length - 1].split("-")[parts[parts.length - 1].split("-").length - 1].replace(".jar", "");
            let jarName = parts[parts.length - 3];
            if (!latestVersions[jarName] || parseFloat(jarVersion) > parseFloat(latestVersions[jarName])) {
                latestVersions[jarName] = jarVersion;  
                let regex = new RegExp(jarName + "-[0-9.]+\\.jar", "g");
                fixedPath = fixedPath.replace(regex, jarName + "-" + jarVersion + ".jar");
            }
          }
  }
  });
  

  text += fixedPath
  text += classpath+'"'
  text += " -Xmn"+minMemory+"m"
  text += " -Xmx"+maxMemory+"m"
  text += " "+jsonData.mainClass+" "
if(!versionCheck){
  for (let i = 0; i < gameArguments.length; i += 2) {
    const key = gameArguments[i];
    let value = gameArguments[i + 1];
  
    switch (key) {
      case '--username':
        value = auth_player_name;
        break;
      case '--version':
        value = '"'+version_name+'"';
        break;
      case '--gameDir':
        value = '"'+path.join(game_directory,"versions",version_name)+'"';
        break;
      case '--assetsDir':
        value = '"'+assets_root+'"';
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
}else{
  let matches = gameArguments.match(/\${.*?}/g);
  for (let i = 0; i < matches.length; i++) {
    let match = matches[i];
    let replacement;
    switch (match) {
      case "${auth_player_name}":
          replacement = auth_player_name;
          break;
      case "${version_name}":
          replacement = '"'+version_name+'"';
          break;
      case "${game_directory}":
          replacement = '"'+path.join(game_directory,"versions",version_name)+'"';
          break;
      case "${assets_root}":
          replacement = '"'+assets_root+'"';
          break;
      case "${assets_index_name}":
          replacement = assets_index_name;
          break;
      case "${auth_uuid}":
          replacement = auth_uuid;
          break;
      case "${auth_access_token}":
          replacement = auth_access_token;
          break;
      case "${user_properties}":
          replacement = "{}";
          break;
      case "${user_type}":
          replacement = "msa";
          break;
  }
  gameArguments = gameArguments.replace(match, replacement);
}
text += gameArguments;
}
  text += " --width 854 --height 480\n"
  text += "exit"
  fs.writeFile(batPath, text, (err) => {
    if (err) throw err;
    console.log('launcher file has been created,now opening game.');
    runExec();
});
})  
}

function runExec() {
let checkCount = 0;
let styleCheck = true;

let version = version_name;
const child = exec(`"${batPath}"`,{});

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
  console.log(`child process exited with code ${code}`);
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

