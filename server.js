var mqtt=require('mqtt')
var redis = require('redis')
const maxlength = 100
var client  = mqtt.connect('mqtt://am.appxc.com')
const chalk = require('chalk');
var messages = []
var default_topic = 'xcstream.github.io'
// default_topic='localhost'
console.log(chalk.blue('server start watching topic ' + default_topic));
client.on('connect', function () {
    client.subscribe(default_topic)
    client.subscribe(default_topic+'_init')
})
client.on('message', function (topic, message) {
    var mstr =message.toString()
    console.log( chalk.yellow  ('[new message] ')   +chalk.blue( 'topic:'),
    topic.toString(),chalk.blue( 'payload:') ,mstr)
    var payload = JSON.parse(mstr)
    if(topic.indexOf('_init')>0){
        if(payload.clientid){
            var payload = ({type:2, clientid: payload.clientid, messages:  messages })
            client.publish(payload.clientid, JSON.stringify(payload))
        }
    }
    if(topic == default_topic){
        messages.push(  payload)
        if(messages.maxlength>maxlength){
            messages.shift()
        }
        console.log(messages)
    }
})