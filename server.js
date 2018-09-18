var mqtt=require('mqtt')
var os=require('os')
var redis = require('redis')
const maxlength = 100
var client  = mqtt.connect('mqtt://am.appxc.com')
const chalk = require('chalk');
var fetch=require('node-fetch')
var messages = []

var default_topic = 'xcstream.github.io'
if(os.type()=='Darwin'){
    default_topic='localhost'
}

Array.prototype.shuffle = function() {
    var input = this;
    for (var i = input.length-1; i >=0; i--) {
        var randomIndex = Math.floor(Math.random()*(i+1));
        var itemAtIndex = input[randomIndex];
        input[randomIndex] = input[i];
        input[i] = itemAtIndex;
    }
    return input;
}

Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1,
        "d+" : this.getDate(),
        "h+" : this.getHours(),
        "m+" : this.getMinutes(),
        "s+" : this.getSeconds(),
        "q+" : Math.floor((this.getMonth()+3)/3),
        "S" : this.getMilliseconds()
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1 ? o[k] :
                ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}

var init_topic = default_topic+'_init'
var doutu_topic = default_topic+'_doutu'

var topics = []
topics.push(default_topic)
topics.push(init_topic)
topics.push(doutu_topic)

console.log(chalk.blue('server start watching topic ' + default_topic));
client.on('connect', function () {
    for(topic of topics){
        client.subscribe(topic)
    }
})

client.on('message', function (topic, message) {
    var mstr =message.toString()
    console.log( chalk.yellow  ('[new message] ')   +chalk.blue( 'topic:'),
    topic.toString(),chalk.blue( 'payload:') ,mstr)
    var payload = JSON.parse(mstr)

    //初始化
    if(topic==init_topic){
        if(payload.clientid){
            var payload = ({type:2, clientid: payload.clientid, messages:  messages })
            client.publish(payload.clientid, JSON.stringify(payload))
        }
    }

    //发普通消息
    if(topic == default_topic){
        messages.push(payload)
        if(messages.maxlength>maxlength){
            messages.shift()
        }
        console.log(messages)
    }
    //发斗图消息
    if(topic == doutu_topic){
        var key = payload.key
        if(key){
            fetch('https://www.doutula.com/api/search?keyword='+ encodeURIComponent(key) + '&mime=0&page=1').then(function (r) {
                r.json().then(function (rj) {
                    if(rj.status==1 && rj.data.list && rj.data.list.length>0){
                        var list =rj.data.list
                        var lista = list.shuffle()
                        var toSend = ({ type:1, content: {
                                type:'huaji',
                                name: payload.chatname,
                                time:''+new Date().format('hh:mm:ss') ,
                                url: lista[0].image_url,
                                text:key
                            } })
                        client.publish(default_topic, JSON.stringify(toSend))
                    }else{
                        var toSend = ({ type:1, content: {
                                type:'message',
                                name: payload.chatname,
                                time:''+new Date().format('hh:mm:ss') ,
                                text: `[想要发送(${key}),可是未找到表情]`
                            } })
                        client.publish(default_topic, JSON.stringify(toSend))
                    }
                })
            })
        }

    }


})