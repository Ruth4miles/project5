 [The application can be launched from here.](https://Ruth4miles.github.io/project5/)
 
 Project Description

# Project5: GeoWeb APP

ENGO 651 - Adv. Geospatial Topics

## Overview:
We created a simple IoT web mapping application that uses javascript geolocation API and turns any smart phone into an IoT sensor, and also visualises the location of the smart phone sensor. It utilizes the MQTT protocol to exchange location updates and other user selected messages through the paho javascript client which connecte to an MQTT broker over websockets.    

## System requirement:
- Any platform you like such as Windows, Linux, and so on. 
- Use any browsers (Firefox, Google Chrome,...) to display the html pages. 

## Tools and Resources used:
- HTML 5
- CSS
- Javascript
- [Leaflet](https://leafletjs.com/)
- [GeoJSON](https://leafletjs.com/examples/geojson/)


## How to use the webpage:
* when the application is launched on the phone, the user is prompted to enter their details such as Name, Course Code, Host and the port(test.mosquitto.com and 8081 are the recommended host and port) The Name and Curse Code can take any arbitrary string values and the initiates a connection by clicking on the start button. Once a connection is established, several input fields and a base map will be displayed on the interface. A user will not be able to change the host and port number for each connection session. However, if there is any need to do this for whatsoever reason, the user will have to end the session by clicking on the end button. The start button becomes active thereafter.
There are some input field sections displayed following a successful connection to the MQTT Broker.
When a user inputs a topic of interest and a message in the publish section, it gets published to the MQTT broker. Also, a user can subscribe to or unsubscribe from any topic from in the sebscribe section.
When a user click on the 'share my status' section, a geojson response is generated which contains the user's location, a random temperature value, and the topic/message published. The application is by default subscribed to <your course code>/<your name>/my_temperature. Messages published to this topic will appear in the received messages section. A leaflet pop up in the map shows the temperature value. In addititon, the location icon changes based on the current temperature value ([-40,10] blue. [10,30] green. [30,60] red).


## what’s contained in each file:
- Index.html: The front end of the application is defined in this file. It also contains links to all the necessary libraries.
- websocket-script.js: The variables used for the application were initialised, and the leaflet map was set-up. A connection to the MQTT broker was established via a websocket. It also has functions to handle a lost and failed connection, an arrived message to a subscribed topic and also sending or publishing messages to a topic. Also, it has a function thnat limits the user's ability to change the information after a connection is established and disables buttons accordingly.
