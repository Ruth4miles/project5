// Set-up
var connected_flag = 0;
var mqtt;
var reconnectTimeout = 2000;
var marker;
var json;
var marker_id = null;

// Page set-up
document.getElementById("stop-butt").disabled = true;
showDiv("none");

// Define the map centered on Calgary
var map = L.map('map').setView([51.039439, -114.054339], 11);

// Add the basemap
var tiles = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnV0aGVrZWgiLCJhIjoiY2xlaTBsM25uMGhyZjNycGExMXJscWQ0MiJ9.bF1pWBYY3SFU9185P1BtZw', {
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/contribute/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Create a group so store markers
var markerGroup = L.layerGroup().addTo(map);


function MQTTconnect(){
    // Get the host and port info
    var host = document.getElementById("host").value;
    var port = parseInt(document.getElementById("port").value);

    // Check if the host and port were entered correctly
    if (host == "" || port == ""){
        document.getElementById("status").innerHTML = "Not enough information";
    }
    
    // Check if a username and course were entered
    if (document.getElementById("username").value=="" || document.getElementById("course").value == ""){
        document.getElementById("status").innerHTML = "Username and/or course are invalid.";
    }
    
    // Clear the status
    document.getElementById("status").innerHTML = "";

    // Connect to the broker via a websocket
    mqtt = new Paho.MQTT.Client(host=host, port=port, clientId='client-' + Math.floor(Math.random() * 100000))
    
    // Set the connection options
    var options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,
        useSSL: true,
    };

    // Register the callback functions for when the connection is lost or a message is received
    mqtt.onConectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
    
    // Connect
    mqtt.connect(options);

    // Limit user to change information
    document.getElementById("host").readOnly = true;
    document.getElementById("port").readOnly = true;
    document.getElementById("username").readOnly  = true;
    document.getElementById("course").readOnly  = true;

    // Disable buttons
    document.getElementById("start-butt").disabled = true;
    document.getElementById("stop-butt").disabled = false;
}


// Function that gets called if the connection is dropped
function onConnectionLost(response){
    document.getElementById("status").innerHTML = "Connection Lost";

    // Alert to the lost connection
    alert('Connection Lost! Attempting to reconnect...');
    
    // Reconnect
    setTimeout(MQTTconnect, reconnectTimeout);
}


// Function that gets called if the connection fails
function onFailure(message){
    document.getElementById("status").innerHTML = "Failed";

    // Reconnect
    setTimeout(MQTTconnect, reconnectTimeout);
}


// Handle an arrived message to a subscribed topic
function onMessageArrived(r_message){
    // Get the topic
    var topic = r_message.destinationName;

    // Display the topic on the page
    document.getElementById("topic").innerHTML = topic;

    // Get the username and course name the user entered
    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var map_update_topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";

    // If topic should update the temperature
    if (topic === map_update_topic){
        // Create a new marker
        json = JSON.parse(r_message.payloadString);
        createMarker(json);
    }

    // Update the displayed message on the page
    document.getElementById("message").innerHTML = r_message.payloadString;    
}


// Function that gets called when connection is established
function onConnect() {
    // Note that we're connected
    document.getElementById("status").innerHTML = "Connected";
    connected_flag = 1

    // Show mqtt-div
    showDiv("block");

    // Subscribe to get location and temp updates
    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";
    mqtt.subscribe(topic);
}


// Sends a message on a given topic
function send_message(topic, value){
    // Create the message and set the topic
    message = new Paho.MQTT.Message(value);
    message.destinationName = topic;

    // Send
    mqtt.send(message);
}


// Publish a message to a topic
function pub() {
    // Make sure we're connected
    if (connected_flag == 0) {
        out_msg = "<b> Not Connected so can't send </b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
    }

    // Get the topic and value
    var topic = document.getElementById("publish-topic").value;
    var value = document.getElementById("publish-message").value;

    // Don't publish if the topic is invalid
    if (topic == "") {
        document.getElementById("publish-topic").value = "";
        document.getElementById("publish-message").value = "";
        console.log("Topic is invalid.");
        return false;
    }

    // Otherwise, sent the message
    send_message(topic, value);
    document.getElementById("publish-topic").value = "";
    document.getElementById("publish-message").value = "";

}


// Publish the topic to update the map
function pub_status(){
    // Make sure we're connected
    if (connected_flag == 0) {
        out_msg = "<b>Not Connected so can't send</b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
    }

    // Get the location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(createGeoJSON);
    } else { 
        document.getElementById("message").innerHTML = "Geolocation is not supported by this browser.";
    }
}


// Create the geojson to update the map and send it to the correct topic
function createGeoJSON(position) {
    // Define the geojson
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

    // Define the correct topic and send the geojson message
    var username = document.getElementById("username").value;
    var course = document.getElementById("course").value;
    var topic = course.replaceAll(' ', '_') + "/" + username.replaceAll(' ', '_') + "/my_temperature";
    send_message(topic, geojson);
    display_msg("", "");
}


// Update the topic and message on the page
function display_msg(topic, msg){
    document.getElementById("topic").innerHTML = topic;
    document.getElementById("message").innerHTML = msg;
}


// Subscribe to a topic
function sub_topics(con) {
    // Make sure we're connected
    if (connected_flag == 0) { 
        out_msg = "<b>Not Connected so san't subscribe</b>"
        console.log(out_msg);
        document.getElementById("messages").innerHTML = out_msg;
        // return false;
    }

    // Get the topic to subscribe to
    var stopic = document.getElementById("subscribe-topic").value;

    // End if the topic is empty
    if (stopic == "") {
        return false;
    }

    // If we're subscribing
    if (con == "sub") {
        // Subscribe
        mqtt.subscribe(stopic); 
        
    } else if (con== "unsub") {
        // Unsubscribe
        mqtt.unsubscribe(stopic);
    } else {
        // End if a bad argument was passed in
        return false;
    }

    // Reset the message
    display_msg("", "");

    // Reset the topic field
    document.getElementById("subscribe-topic").value = "";
    // return false;
}


function createMarker(json){

    // Remove the old marker from the map
    if (marker_id != null) {
        markerGroup.removeLayer(marker_id);
    }
    
    // Define the colours
    var color = [0, 270, 150];

    // Define the marker
    marker = L.marker([json.geometry.coordinates[0], json.geometry.coordinates[1]]).addTo(markerGroup).bindPopup("Temperature: "+String(json.properties.temp)).openPopup();
    
    // Set the colour
    if (json.properties.temp >= -40 && json.properties.temp < 10){
        marker._icon.style.webkitFilter = "hue-rotate(" + color[0] + "deg)";
    } else if (json.properties.temp >= 10 && json.properties.temp < 30) {
        marker._icon.style.webkitFilter = "hue-rotate(" + color[1] + "deg)";
    } else {
        marker._icon.style.webkitFilter = "hue-rotate(" + color[2] + "deg)";
    }

    // Track the current marker
    marker_id = marker._leaflet_id;
}


// Disconnect 
function MQTTdisconnect(){
    // Disconnect
    try {
        mqtt.disconnect();
    } catch {}
    

    // Update the status
    document.getElementById("status").innerHTML = "";
    
    // Make the fields usable again
    document.getElementById("host").readOnly = false;
    document.getElementById("port").readOnly = false;
    document.getElementById("username").readOnly = false;
    document.getElementById("course").readOnly = false;

    // // Reset the fields
    // document.getElementById("host").value = "";
    // document.getElementById("port").value = "";
    // document.getElementById("username").value = "";
    // document.getElementById("course").value = "";

    // Disable/enable buttons
    document.getElementById("start-butt").disabled = false;
    document.getElementById("stop-butt").disabled = true;

    // Hide mqtt-div
    showDiv("none");
}


// Set the visibility of the mqtt-div
function showDiv(condition) {
    document.getElementById('mqtt-div').style.display = condition;
 }
Footer

