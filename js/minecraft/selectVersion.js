
let config_;
document.getElementById("versionInfo").style.display = "none"


// 读取配置文件
 ipcRenderer.on('get-config-reply', (event, config) => {
  if(config.hasOwnProperty('minecraftDir')){
    document.getElementById("mcDir").textContent = config.minecraftDir
      if (config_ == undefined){
        updateConfig(config.minecraftDir)
        config_ = config;
      }
  }else{
    document.getElementById("versionInfo").style.display = "none"

  }
 })

document.getElementById("mcDir").addEventListener("click" ,() => {
    selectMcDir()
 })

 function selectMcDir(){
  dialog.showOpenDialog({
    properties: ['openDirectory']
    }).then(result => {
    // 更新配置数据
    updateConfig(result.filePaths[0])
    })
 }


 function updateConfig(dir){
  let versionsDir = path.join(dir, 'versions');
  minecraftVersions = fs.readdirSync(versionsDir);

  document.getElementById("mcDir").textContent = dir
  minecraftVersions.forEach(version => {
    checkAndCreateButtons(dir,version)
  })

  ipcRenderer.send('update-config', 'versions', minecraftVersions);
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