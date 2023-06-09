
let config_ = {};
let javaPaths = {};
document.getElementById("versionInfo").style.display = "none"


// 读取配置文件
 ipcRenderer.on('get-config-reply', (event, config) => {
  if(config.hasOwnProperty('minecraftDir')){
    document.getElementById("mcDir").textContent = config.minecraftDir
      if (!config_.hasOwnProperty('minecraftDir')){
        updateConfig(config.minecraftDir)
        config_ = config;
      }
      if (config.hasOwnProperty("java")) {
        javaPaths = config.java;
      }else{
        getJavaAndUpdateConfig()
      }
  }else{
    document.getElementById("versionInfo").style.display = "none"

  }
 })

async function getJavaAndUpdateConfig(newJavaPath) {
  javaPaths = {};
  let javaExePaths;
  if (config_.hasOwnProperty("java")) {
    javaPaths = config_.java;
  }
  if (newJavaPath != undefined) {
    javaExePaths = Array.isArray(newJavaPath) ? newJavaPath : [newJavaPath];
  } else {
    const result = await findJavaInProgramFiles();
    javaExePaths = Array.isArray(result) ? result : [result];
  }
  javaExePaths.forEach((path) => {
    const match = path.match(/(?:jdk-|jre)(\d+\.\d+)/i);
    if (match) {
      const version = match[1];
      let key;
      if (version === "1.8") {
        key = "java8";
      } else if (version.includes("18.")) {
        key = "java18";
      } else if (version.includes("17.")) {
        key = "java17";
      } else if (version.includes("16.")) {
        key = "java16";
      }
      if (key) {
        if (!javaPaths[key]) {
          javaPaths[key] = [];
        }
        if (!javaPaths[key].some((item) => item.path === path)) {
          javaPaths[key].push({
            path: path,
          });
        }
      }
    }
  });
  ipcRenderer.send("update-config", "java", javaPaths);
}

async function findJavaByExe(javaPath){
  if (await fs.existsSync(javaPath)) {
    getJavaAndUpdateConfig(javaPath)
  }
}

 async function findJavaInProgramFiles(programFilesPath = 'C:\\Program Files\\Java') {
   if (!fs.existsSync(programFilesPath)) {
    createDialogue("错误","无法从Java默认路径中找到可执行的java文件！",8)
     return [];
   }
   const javaExePaths = [];
   const javaDirs = await fs.readdirSync(programFilesPath);
   for (const javaDir of javaDirs) {
     const javaExePath = path.join(programFilesPath, javaDir, 'bin', 'java.exe');
     if (await fs.existsSync(javaExePath)) {
       javaExePaths.push(javaExePath);
     }
   }
   return javaExePaths;
 }
document.getElementById("mcDir").addEventListener("click" ,() => {
    selectMcDir()
 })

 function selectMcDir(){
  dialog.showOpenDialog({
    properties: ['openDirectory']
    }).then(result => {
    // 更新配置数据
    if(hasChineseCharacters(result.filePaths[0])){
      createDialog("ERROR", "游戏路径上中含有中文,请尝试将游戏根目录移动到非中文路径上！",0)
    }else{
      updateConfig(result.filePaths[0])
    }
    })
 }

function hasChineseCharacters(path) {
  const regex = /[\u4E00-\u9FA5]/;
  return regex.test(path);
}

 function updateConfig(dir){
  let versionsDir = path.join(dir, 'versions');
  minecraftVersions = fs.readdirSync(versionsDir);
  let versionJson= {};
  document.getElementById("mcDir").textContent = dir
  minecraftVersions.forEach(version => {
    checkAndCreateButtons(dir,version)
    versionJson[version] = [{
      "java" : "default"
    }]
  })
  ipcRenderer.send('update-config', 'versions', versionJson);
  ipcRenderer.send('update-config', "minecraftDir",dir)
 }


 function createButton(mcs){
  const selectVersion = document.querySelector('.selectVersion');
  const existingButtons = document.querySelectorAll('#version');
  const versions = document.querySelector('.versions');
  
    let shouldCreateButton = true;
    
    existingButtons.forEach(button => {
      if (button.querySelector('span').textContent === mcs) {
        shouldCreateButton = false;
      }
    });
    
    if (shouldCreateButton) {
      const versions = document.querySelector('.versions');
      const button = document.createElement('button');
      button.id = 'version';
      
      const img = document.createElement('img');
      img.classList.add('ico');
      img.src = './img/test.png';
      
      const span = document.createElement('span');
      span.textContent = mcs;
      
      button.appendChild(img);
      button.appendChild(span);
      
      versions.appendChild(button);
        button.addEventListener("click", (event) => {
          const buttons = document.querySelectorAll('#version');
            buttons.forEach((btn) => {
              if (btn === button) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
    } 
  });
          ipcRenderer.send('update-config',"selectVersion",event.currentTarget.querySelector('span').textContent)
      })
    }
  selectVersion.appendChild(versions);
}


function checkFiles(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function checkAndCreateButtons(dir,version) {
  let jsonPath = path.join(dir,"versions", version, `${version}.json`)
  let corePath = path.join(dir,"versions", version, `${version}.jar`)
  let mcv = version;

  if (await checkFiles(jsonPath) && await checkFiles(corePath)) {
    createButton(mcv);
  }
}