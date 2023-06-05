// 轮播图区域

// 获取当前轮播图的五张图片
let items = document.querySelectorAll('.lubo');

let tigger = $('.tigger');

// console.log(spans)
let active = 0;
let timer ;

// 根据轮播图的数量动态生成按钮

for(let i =0 ; i<items.length;i++){
    let span = document.createElement('span');
    
    if(i===0){
        span.setAttribute('class','on');
    }else{
        items[i].setAttribute('style','transform:translate3d(550px,0px,0px)');
    }
    tigger.append(span);
    // 为span创建单击响应事件
    span.onclick = function(){
        clearInterval(timer);
        // alert(1)
        // 判断当前是第几个
        if(i!==active){
            clearOn();
            span.setAttribute('class','on');
        }
        index = i;
        changeSilder(i);
        active = i;
        
        autoShow();
    }
}

function changeSilder(newVal){

    for(let i = 0;i<items.length;i++){

        if(i < newVal){
            items[i].setAttribute('style','transform:translate3d(-550px,0px,0px)');
        }else if(i > newVal){
            items[i].setAttribute('style','transform:translate3d(550px,0px,0px)');
        }else{
            items[i].setAttribute('style','transform:translate3d(0px,0px,0px)');
        }   


    }
    

}


var index = 0;
let spans = $('.tigger span');


function clearOn(){
    for(let c = 0;c<items.length;c++){
        spans[c].className = '';
    }
}
function autoShow(){
    timer = setInterval(function(){
    if(index > items.length-1){
        index=0;
    }
        clearOn();
        changeSilder(index);
        spans[index].className='on';
        index++;

    },2500)
}
// autoShow()


    



setTimeout(function(){
$('.autoShow').css('opacity','1');

},420)




