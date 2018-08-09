var client = new Paho.MQTT.Client("am.appxc.com", Number(8084), ""+Math.random())
client.onMessageArrived = function(message) { window.vm.messages.push(JSON.parse(message.payloadString).content)}
client.connect({useSSL:true, onSuccess:function(){ client.subscribe("public")}})
window.vm=new Vue({
el:'body>div',
data:{messages:[], tosend:''},
methods:{
send:function(){
if(this.tosend == "") return
var payload = ({content:this.tosend})
var message = new Paho.MQTT.Message(JSON.stringify(payload))
message.destinationName = "public"
client.send(message)
this.tosend = ""
}
}
})