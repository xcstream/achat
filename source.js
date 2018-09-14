Date.prototype.format = function(format) //author: meizz
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1 ? o[k] :
                ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}

function scroll() {
    setTimeout(function () {
        var scrollDom = document.getElementById('chat');
        scrollDom.scrollTop = scrollDom.scrollHeight
    },100)
    setTimeout(function () {
        var scrollDom = document.getElementById('chat');
        scrollDom.scrollTop = scrollDom.scrollHeight
    },300)
}

var huajilist = `
    0.jpg   12.jpeg 16.jpeg 2.jpeg  23.jpeg 27.jpeg 30.jpeg 34.gif  5.jpg   9.jpeg
    1.gif   13.jpeg 17.jpeg 20.jpeg 24.jpeg 28.jpeg 31.jpeg 35.gif  6.jpeg
    10.jpeg 14.jpeg 18.gif  21.jpeg 25.png  29.jpeg 32.jpg  36.gif  7.jpg
    11.jpeg 15.jpeg 19.jpeg 22.jpeg 26.jpeg 3.jpeg  33.gif  4.jpeg  8.jpeg`.split(' ').filter(x=>x.length>3)

var clientid = ""+Math.random() + new Date().getTime()
var client = new Paho.MQTT.Client("am.appxc.com", Number(8084), clientid)
window.chatname = localStorage['chatname']||'匿名用户'
client.onMessageArrived = function(message) {
    var payload = JSON.parse(message.payloadString)

    console.log(payload)

    if(payload.type==1){
        window.vm.messages.push(payload.content)
        setTimeout(function () {
            var scrollDom = document.getElementById('chat');
            scrollDom.scrollTop = scrollDom.scrollHeight

            try{
                var utterThis = new window.SpeechSynthesisUtterance(payload.content.name+'说'+payload.content.text);
                window.speechSynthesis.speak(utterThis);
            }catch (e) {
                console.log(e)
            }
        },120)
    }
    if(payload.type==2){
        vm.messages = payload.messages.map(x=>x.content)
        scroll()
    }
}

var topic = window.location.hostname

client.connect({useSSL:true, onSuccess:function(){
    client.subscribe(topic)
    client.subscribe(clientid)

    var payload = ({clientid: clientid})
    var message = new Paho.MQTT.Message(JSON.stringify(payload))
    message.destinationName = topic+'_init'
    client.send(message)

}})
window.vm=new Vue({el:'body>div',data:{
        messages:[],
        tosend:'',
        screenWidth: document.body.clientWidth,
        screenHeight: document.body.clientHeight,
        ch: (document.body.clientHeight-120)+'px',
        bh:(document.body.clientHeight-90)+'px'
    },
    watch:{
        messages:function () {
            scroll()
        }
    },
    mounted:function(){
        window.onresize = () => {
            return (() => {
                vm.screenWidth = document.body.clientWidth
                vm.screenHeight = document.body.clientHeight
                vm.ch = (document.body.clientHeight-120)+'px'
                vm.bh = (document.body.clientHeight-90)+'px'

            })()
        }

    },
    watch:{
        screenHeight:function(){
            console.log (this.screenHeight)
        }

    },

    methods:{send:function(){
if(this.tosend == "") return


if(this.tosend.substr(0,1) == '/') {
    if(this.tosend.indexOf('/name ') == 0){
        window.chatname = this.tosend.substr('/name '.length)
        localStorage['chatname'] = window.chatname
        vm.messages.push({
            type:'alert',
            alert:'名字已经修改为:' + window.chatname
        })
    }
    if(this.tosend.indexOf('/help') == 0){
        vm.messages.push({
            type:'alert',
            alert:'帮助',
            description:
                `[修改自己的名字    /name 名字] [滑稽  /huaji]`
        })
    }
    if(this.tosend.indexOf('/huaji') == 0){
        var rand = Math.floor( Math.random()*huajilist.length)
        var content = {
            type:'huaji',
            name: window.chatname,
            time:''+new Date().format('hh:mm:ss') ,
            url:huajilist[rand]
        }
        var payload = ({ type:1, content: content })
        var message = new Paho.MQTT.Message(JSON.stringify(payload))
        message.destinationName = topic
        client.send(message)
    }
}else{
    var content = {
        type:'message',
        name: window.chatname,
        time:''+new Date().format('hh:mm:ss') ,
        text:this.tosend
    }
    var payload = ({ type:1, content: content })
    var message = new Paho.MQTT.Message(JSON.stringify(payload))
    message.destinationName = topic
    client.send(message)
}
    this.tosend = ""
    }}
})