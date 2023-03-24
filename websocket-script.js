// initialization 
let connected_flag = 0;
let mqtt;
const reconnectTimeout = 4000;
let marker;
let json;
let marker_id = null;

function divVis(condition) {
    document.getElementById('mqtt-div').style.display = condition;
 }

document.getElementById("stop-butt").disabled = true;
divVis("none");

var map = L.map('map').setView([51.039439, -114.054339], 11);

var basemap = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/dark-v9',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicnV0aGVrZWgiLCJhIjoiY2xlaTBsM25uMGhyZjNycGExMXJscWQ0MiJ9.bF1pWBYY3SFU9185P1BtZw'
}).addTo(map);

var markerGroup = L.layerGroup().addTo(map);


function connMQTT(){
    var host = document.getElementById("host").value;
    var port = parseInt(document.getElementById("port").value);

    if (host == "" || port == ""){
        document.getElementById("status").innerHTML = "Not enough information";
    }
    
    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    
    if (!username || !course) {
      document.getElementById("status").innerHTML = "Please enter a valid username and course.";
    }
    
    
    document.getElementById("status").innerHTML = "";

    mqtt = new Paho.MQTT.Client(host, port, 'client-' + Math.floor(Math.random() * 100000));


    var options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,
        useSSL: true,
    };

    mqtt.onConectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
    
    mqtt.connect(options);

    $("#host, #port, #username, #course").prop("readonly", true);


    document.getElementById("start-butt").disabled = true;
    document.getElementById("stop-butt").disabled = false;
}


function onConnectionLost(response){
    document.getElementById("status").innerHTML = "Connection Lost";

    alert('Connection Lost! Attempting to reconnect...');
    
    setTimeout(connMQTT, reconnectTimeout);
}

function onFailure(message){
    document.getElementById("status").innerHTML = "Failed";

    setTimeout(connMQTT, reconnectTimeout);
}


function onMessageArrived(r_message){
    var topic = r_message.destinationName;

    document.getElementById("topic").innerHTML = topic;

    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var map_update_topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";

    if (topic === map_update_topic){
        json = JSON.parse(r_message.payloadString);
        createMarker(json);
    }

    document.getElementById("message").innerHTML = r_message.payloadString;    
}


function onConnect() {
    document.getElementById("status").innerHTML = "Connected";
    connected_flag = 1

    divVis("block");

    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";
    mqtt.subscribe(topic);
}


function send_message(topic, value){
    message = new Paho.MQTT.Message(value);
    message.destinationName = topic;

    mqtt.send(message);
}


function pub() {
    if (connected_flag == 0) {
        out_msg = "<b> Not Connected so can't send </b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
    }

    var topic = document.getElementById("publish-topic").value;
    var value = document.getElementById("publish-message").value;

    if (topic == "") {
        document.getElementById("publish-topic").value = "";
        document.getElementById("publish-message").value = "";
        console.log("Topic is invalid.");
        return false;
    }

    send_message(topic, value);
    document.getElementById("publish-topic").value = "";
    document.getElementById("publish-message").value = "";

}


function pub_status(){
    if (connected_flag == 0) {
        out_msg = "<b>Not Connected so can't send</b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(createGeoJSON);
    } else { 
        document.getElementById("message").innerHTML = "Geolocation is not supported by this browser.";
    }
}

function createGeoJSON(position) {
    geojson = JSON.stringify({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [position.coords.latitude, position.coords.longitude]
        },
        "properties": {
            "temp": parseInt(Math.random() * 100 - 40)
        }
      });

    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";
    send_message(topic, geojson);
    display_msg("", "");
}

function display_msg(topic, msg){
    document.getElementById("topic").innerHTML = topic;
    document.getElementById("message").innerHTML = msg;
}


function sub_topics(con) {
    if (connected_flag == 0) { 
        out_msg = "<b>Not Connected so san't subscribe</b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
    }

    var stopic = document.getElementById("subscribe-topic").value;

    if (stopic == "") {
        return false;
    }

    if (con == "sub") {
        mqtt.subscribe(stopic); 
        
    } else if (con== "unsub") {
        mqtt.unsubscribe(stopic);
    } else {
        return false;
    }

    display_msg("", "");

    document.getElementById("subscribe-topic").value = "";
}


function createMarker(json){

    if (marker_id != null) {
        markerGroup.removeLayer(marker_id);
    }
    
    var color = [0, 270, 150];

    marker = L.marker([json.geometry.coordinates[0], json.geometry.coordinates[1]]).addTo(markerGroup).bindPopup("Temperature: "+String(json.properties.temp)).openPopup();
    
    if (json.properties.temp >= -40 && json.properties.temp < 10){
        marker._icon.style.webkitFilter = "hue-rotate(" + color[0] + "deg)";
    } else if (json.properties.temp >= 10 && json.properties.temp < 30) {
        marker._icon.style.webkitFilter = "hue-rotate(" + color[1] + "deg)";
    } else {
        marker._icon.style.webkitFilter = "hue-rotate(" + color[2] + "deg)";
    }

    marker_id = marker._leaflet_id;
}


function MQTTdisconnect(){
    try {
        mqtt.disconnect();
    } catch {}
    

    document.getElementById("status").innerHTML = "";
    
    document.getElementById("host").readOnly = false;
    document.getElementById("port").readOnly = false;
    document.getElementById("username").readOnly = false;
    document.getElementById("course").readOnly = false;


    document.getElementById("start-butt").disabled = false;
    document.getElementById("stop-butt").disabled = true;

    divVis("none");
}

