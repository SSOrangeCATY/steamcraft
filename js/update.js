document.getElementById("games").style.color = "rgb(26,159,255)"
document.getElementById('loading').style.display = 'none';
document.getElementById('accountInfo').style.display = 'none';

ipcRenderer.send('update-config', "selectVersion","none")


let buttons = document.querySelectorAll(".navButton");
buttons.forEach(function(button) {
      button.addEventListener("click", function() {
          buttons.forEach(function(otherButton) {
              if (otherButton === button) {
                  otherButton.style.color = "rgb(26,159,255)";
                  setViewElements(otherButton.id)
              } else {
                  otherButton.style.color = "rgb(196,199,200)";
              }
          });
      });
  });

  
  function setViewElements(id){
    if(id == "home"){
      ipcRenderer.send('set-htmlView',path.join(__dirname,"home","index.html"))
    }else if(id == "games"){
      ipcRenderer.send('remove-View')
      document.getElementById('gamesCard').display = "flex"
      document.getElementById('accountInfo').style.display = 'none';
    }else if(id == "account"){
      document.getElementById('gamesCard').display = "none"
      document.getElementById('accountInfo').style.display = 'flex';
    }
  }
  