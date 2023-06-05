// 轮播图区域

// 获取当前轮播图的五张图片
let items2 = document.querySelectorAll('.lubo2');

let tigger2 = $('.tigger2');

// console.log(spans)
let active2 = 0;
let timer2 ;

// 根据轮播图的数量动态生成按钮

for(let i =0 ; i<items2.length;i++){
    let span2 = document.createElement('span');
    
    if(i===0){
        span2.setAttribute('class','on');
    }else{
        items2[i].setAttribute('style','transform:translate3d(320px,0px,0px)');
    }
    tigger2.append(span2);
    // 为span创建单击响应事件
    span2.onclick = function(){
        clearInterval(timer2);
        // alert(1)
        // 判断当前是第几个
        if(i!==active2){
            clearOn2();
            span2.setAttribute('class','on');
        }
        index2 = i;
        changeSilder2(i);
        active2 = i;
        
        autoShow2();
    }
}

function changeSilder2(newVal){

    for(let i = 0;i<items2.length;i++){

        if(i < newVal){
            items2[i].setAttribute('style','transform:translate3d(-320px,0px,0px)');
        }else if(i > newVal){
            items2[i].setAttribute('style','transform:translate3d(320px,0px,0px)');
        }else{
            items2[i].setAttribute('style','transform:translate3d(0px,0px,0px)');
        }


    }
    

}


var index2 = 0;
let spans2 = $('.tigger2 span');


function clearOn2(){
    for(let c = 0;c<items2.length;c++){
        spans2[c].className = '';
    }
}
function autoShow2(){
    timer2 = setInterval(function(){
    if(index2 > items2.length-1){
        index2=0;
    }
        clearOn2();
        changeSilder2(index2);
        spans2[index2].className='on';
        index2++;

    },2500)
}
autoShow2()


    



setTimeout(function(){
$('.secontAutoShow').css('opacity','1');

},420)