var mqtt=require('mqtt')
var fetch=require('node-fetch')

var mqtt = require('mqtt')
var client  = mqtt.connect('wss://home.appxc.com:10100')

client.on('connect', function () {
    console.log('connect')
    client.subscribe('public')
    client.publish('public', 'Hello mqtt')
})

client.on('message', function (topic, message) {
    console.log(message.toString())
})