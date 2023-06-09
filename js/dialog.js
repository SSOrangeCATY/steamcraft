// 获取容器元素
let container = document.getElementById('dialogContainer');
let body
let header

// 将对话框 HTML 添加到容器元素中


// 显示对话框
function createDialog(header, body, buttonTarget) {
    header = header;
    body = body;
    let dialogHtml = `
    <!-- 对话框遮罩层 -->
    <div id="dialog-overlay"></div>

    <!-- 对话框 -->
    <div id="dialog">
<div id="dialog-header">${header}</div>
<div id="dialog-body">${body}</div>
<div id="dialog-footer">
    <button id="dialog-close-button">关闭</button>
</div>
    </div>
`;
    container.innerHTML = dialogHtml;
    let dialogOverlay = document.getElementById("dialog-overlay");
    let wDialog = document.getElementById("dialog");
    let dialogCloseButton = document.getElementById("dialog-close-button");
    if(buttonTarget == 0){
        dialogCloseButton.addEventListener("click", hideDialog);
    }else if (buttonTarget == 9){
        dialogCloseButton.addEventListener("click", closeApp);
    }else if (buttonTarget == 8){
        dialogCloseButton.textContent = "选择Java根目录"
        dialogCloseButton.addEventListener("click", selectJavaDir);
    }else if (buttonTarget == 7){
        dialogCloseButton.textContent = "选择Java.exe"
        dialogCloseButton.addEventListener("click", selectJavaPath);
    }
    dialogOverlay.style.display = "block";
    wDialog.style.display = "block";

}

// 隐藏对话框
function hideDialog() {
    document.getElementById("dialog-overlay").style.display = "none";
    document.getElementById("dialog").style.display = "none";
}
function closeApp() {
    ipcRenderer.send('close-window')
}

function selectJavaDir() {
    dialog.showOpenDialog({
        properties: ['openDirectory']
        }).then(result => {
        // 更新配置数据
        if(hasChineseCharacters(result.filePaths[0])){
          createDialog("ERROR", "JAVA路径上中含有中文,请尝试将JAVA根目录移动到非中文路径上！",1)
        }else{
            findJavaInProgramFiles(result.filePaths[0])
        }
    })
}

function selectJavaPath() {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'java', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] }
        ]
        }).then(result => {
        // 更新配置数据
        if(hasChineseCharacters(result.filePaths[0])){
          createDialog("ERROR", "JAVA路径上中含有中文,请尝试将JAVA根目录移动到非中文路径上！",1)
        }else{
            hideDialog()
            findJavaByExe(result.filePaths[0])
        }
    })
}