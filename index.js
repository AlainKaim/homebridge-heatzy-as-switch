'use strict'
//v1.2.1
// We will use axios module to perform our HTTP requests.
const url = ('url');
const axios = require('axios');

// From Heatzy API : https://drive.google.com/drive/folders/0B9nVzuTl4YMOaXAzRnRhdXVma1k
// https://heatzy.com/blog/tout-sur-heatzy
const heatzyUrl = "https://euapi.gizwits.com/app/";
const loginUrl = 'https://euapi.gizwits.com/app/login';
const heatzy_Application_Id = "c70a66ff039d41b4a220e198b0fcc8b3";
// The following values are used in the API to set the mode. (To get the mode, the API returns a string "cft" or "eco")
const cft = 0 // Comfort mode
const eco = 1 // Eco mode

let Service, Characteristic

module.exports = (homebridge) => {
  /* this is the starting point for the plugin where we register the accessory */
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-heatzy-as-switch', 'HeatzyAsSwitch', SwitchAccessory)
}

function SwitchAccessory(log, config) {
    /* assign both log and config to properties on 'this' class so we can use them in other methods */
    this.log = log
    this.config = config
// Get informations from config file
    this.getUrl = heatzyUrl + "devdata/" + config['did'] + "/latest";
  	this.postUrl = heatzyUrl + "control/" + config['did'] ;
  	this.name = config["name"];
  	this.username = config["username"];
  	this.password = config["password"];
  	this.interval = config["interval"] || 60;  	// default value is 60s
  	this.trace = config["trace"] || false;	//default value is false (no trace)
// Heatzy Token management
  	this.heatzyToken = "";
  	this.heatzyTokenExpire_at = Date.now() - 10000; // In ms since epoch time (January 1, 1970). Initial value is 10s in the past, to force login and refresh of token

  	this.state = null; // Last state of the device, as known on Heatzy servers
  	this.updatedAt = 0; // Last time the state was updated on Heatzy server (not used)

     /* Create a new information service. This just tells HomeKit about our accessory. */
    this.informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Heatzy')
        .setCharacteristic(Characteristic.Model, 'Heatzy Pilote V2')
        .setCharacteristic(Characteristic.SerialNumber, ' unknown')
  // Create the switch service
	  this.service = new Service.Switch(this.config.name);
  // Add to the switch service the functions called to modify it characteristic
	  this.service
		.getCharacteristic(Characteristic.On)
		.on('get', this.getOnCharacteristicHandler.bind(this))
		.on('set', this.setOnCharacteristicHandler.bind(this));

	this.updateState()  // Get the current state of the device, and update HomeKit
	setInterval(this.updateState.bind(this), 1000*this.interval)  // The state of the device will be checked every this.interval seconds
	this.log("starting HeatzyAsSwitch...");
}	//SwitchAccessory

/////////// Supporting functions, for updating the token, getting and setting the state of a device
async function updateToken (device) {  // This function get the Heatzy token, and store it
	const me = device;
//	me.log('loginUrl ' + loginUrl); // Used for debugging <--
	try {
  		const response = await axios ({
 			method: 'post',
  			url: loginUrl,
   			headers: {
            	'Content-Type': 'application/json',
                'Accept': 'application/json',
  				'X-Gizwits-Application-Id': heatzy_Application_Id
 			},
   			data: {
			  "username" : me.username,
			  "password" : me.password,
			  "lang": "en"
			}
  		})
//	me.log(response);
    if (response.status == 200) {
    	me.heatzyToken = response.data.token;
    	me.heatzyTokenExpire_at = 1000 * response.data.expire_at; //The API returns a date in seconds, but javascript works in ms...
		if (me.trace) {
			me.log('Logged in Heatzy server.')
		}

    }
    else { // Useless ? all status != 2xx will be errors
    	me.log ('Error at login - returned code not 200: ' + response.status + ' ' + response.statusText + ' ' + response.data.error_message);
    }
  }
   catch (error) {
    // handle error
//    me.log(error);
    me.log ('Error - Plugin unable to login to Heatzy server, and will not work');
    me.log('Error message : ', error.message);
//     me.log ('Error authenticating: ' + error.response.status + ' ' + error.response.statusText );
  }
} // updateToken


async function  getState(device) { //return the state of the device as a boolean. Or null if undefined
	const me = device;
//    me.log ('test getState 0'); // Used for debugging <--
//    me.log('getUrl ' + me.getUrl); // Used for debugging <--
	if (me.heatzyTokenExpire_at < Date.now()) {await updateToken (device)}; // Forced at first run, and then calld only if token is expired
   	var state = false;
	try {
//  		const response = 	await axios.get (me.getUrl, {
//  			headers: {'X-Gizwits-Application-Id': heatzy_Application_Id}
  		const response = 	await axios ({
 			method: 'get',
  			url: me.getUrl,
   			headers: {
            	'Content-Type': 'application/json',
                'Accept': 'application/json',
  				'X-Gizwits-Application-Id': heatzy_Application_Id,
  				'X-Gizwits-User-token': me.heatzyToken
 			},
 		});
    // handle success
//    me.log ('test getState 1'); // Used for debugging <--
//	me.log('getState new state ' + response.data.attr.mode); // Used for debugging <--
//  	me.log(response);// Used for debugging <--
    if (response.status == 200) {
		if (response.data.attr.mode == "cft") {state = true	}
    }
    else { // Useless ? all status != 2xx will be errors
    	me.log ('Error - returned code not 200: ' + response.status + ' ' + response.statusText + ' ' + response.data.error_message);
    	state = null
    }
  } catch (error) {
    // handle error
//    me.log ('test getState 2'); // Used for debugging <--
     me.log ('Error when getting state : ' + error.code );
     state = null
  } finally {return state}
} // getState


async function  setState(device, state) { //Set the state of the device, and return it if successful. Or null if failed
	const me = device;
//    me.log ('test setState'); // Used for debugging <--
//    me.log('postUrl ' + me.postUrl); // Used for debugging <--
	if (me.heatzyTokenExpire_at < Date.now()) {await updateToken (device)}; // Forced at first run, and then calld only if token is expired
	let mode = eco;
	if (state) {mode = cft};
	try {
  		const response = await axios ({
 			method: 'post',
  			url: me.postUrl,
   			headers: {
  				'X-Gizwits-Application-Id': heatzy_Application_Id,
				'X-Gizwits-User-token': me.heatzyToken
 			},
   			data: {
			  "attrs" : {
			  "mode": mode
			  }
			}
  		})
//	me.log('SetState mode 0=cft 1=eco : ' + mode ) // Used for debugging <--
//	me.log(response);// Used for debugging <--
    if (response.status == 200) {
    }
    else { // Useless ? all status != 2xx will be errors
    	me.log ('Error - returned code not 200: ' + response.status + ' ' + response.statusText + ' ' + response.data.error_message);
    	state = null
    }
  } catch (error) {
    // handle error
//    me.log(error);
     me.log ('Error when setting state : ' + error.code);
     state = null
  } finally {return state}
} // setState

/////// Implementation of the homebridge services

SwitchAccessory.prototype.updateState = async function() {
  	var state = await getState(this);
  	if (this.trace) { this.log('DEBUG - Mode was ' + this.state + '. Updating it to : ' + state)} // Uncomment for easier debugging...
  	if (state !== null ) {
  		if (this.state === null) {this.state = state}  //Initialize for first run
  		if (state !== this.state) {	// If device state has changed since last update
			if (this.trace) {
				this.log('State has changed from: ' + this.state + ' to ' + state);
			};
		this.state = state;   // Update last state
		this.service.updateCharacteristic(Characteristic.On, state);  // update HomeKit
		}
   	}
	// If state  is null (i.e unavailable from Heatzy server) , do nothing because the device state will be updated at the next call
  } // SwitchAccessory.prototype.updateState


SwitchAccessory.prototype.getOnCharacteristicHandler = async function(callback) {
  	var state = await getState(this);
  	if (this.trace) {
		this.log('HomeKit asked for state (true for cft, false for eco): ' + state)
	}
  	if (state != null) {
  		callback (null, state);
   	}
   	else {
		this.log("Error : Unavailable state");
		callback (true);
   	}
} // SwitchAccessory.prototype.getOnCharacteristicHandler



SwitchAccessory.prototype.setOnCharacteristicHandler = async function(value, callback) {
   	var state = await setState(this, value);
  	if (this.trace) {
		this.log('HomeKit changed state to (true for cft, false for eco): ' + state)
	}
//  This code works only when the new state is correctly reflected on Heatzy servers.
// It is not always the case.
  	if (state != null) {
  		callback (null, state);
   	}
   	else {
		this.log("Error - Cannot change state");
		callback (true);
   	}
}  // SwitchAccessory.prototype.setOnCharacteristicHandler


SwitchAccessory.prototype.getServices = function() {
this.log ("Init Services...")
  return [this.service, this.informationService];
} // SwitchAccessory.prototype.getServices
