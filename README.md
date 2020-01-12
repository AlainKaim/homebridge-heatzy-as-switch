# homebridge-heatzy-as-switch
 Homebridge plugin for Heatzy devices, considered as switches.
 
Heatzy uses the 'fil pilote' protocol to control an electric heater, with 4 states : 

* Confort  : temperature set on the heater
* Eco : temperature 3°C to 4°C below Confort
* Hors-gel : temperature set to ~7°C
* Off.

In this plugin, every Heatzy device is a switch, with these values : 

* `On` : Confort
* `Off` : Eco (or any any other state different from Confort, if set outside of Homekit).

If you set the device from the Home app, `on` will set the heater to Confort, and `off` to Eco.
If you set it from the Heatzy app, or from the hardware button, Confort will be displayed in the Home app as `on`. Any other state (Eco, Hors-Gel or Off) will be displayed as `off`.
## How to use it ?
Obviously, it is nice to have all your devices under the Home app.
I have chosen to put my Heatzy devices in the same (virtual) room, called "Heating" : it is easier to check what is going on.
As for any Home devices, you can group Heatzy devices, and control them as one. And you can change how the switch looks in the Home app (Fan is my favourite). 

But what is really nice is to control Heatzy from Siri : "Siri, allume le chauffage dans la chambre" !

And to include these devices in automations : for instance, I turn my heaters to Eco when we are all out of our home (Use Eve app for more sophisticated automations).

Heatzy app is still very useful for programation, and for specific modes (Holydays and boost). And, of course, to set to Hors-gel and Off state.

And Alexa ? At this time, Alexa native support from Heatzy maker is very limited. I am using a smart plug to to make my main heater visible from Alexa. The smart plug is from the tuya kind, which means it is visible from Homekit (thanks to [homebridge-tuya-lan](https://www.npmjs.com/package/homebridge-tuya-lan)) and from Alexa. With some simple automations in Home app, I can sync my heatzy device and the smart plug : "Alexa, allume le chauffage"  turns on the plug, which turns on the Heatzy device.

## Installation
Install or update this plugin using `npm i -g homebridge-heatzy-as-switch`.

Update the `config.json` file of your Homebridge setup, by modifying the sample configuration below.


## Configurations
The configuration parameters to enable your devices would need to be added to `accessories` section of the Homebridge configuration file. One block is necessary for each Heatzy device.

```json5
{
    ...
            "accessories": [
                {
                    "accessory": "HeatzyAsSwitch",
                    "name": "Bedroom heater",
                    "username": "XXX",
                    "password": "XXX",
                    "did": "011233455677899abbcd",
                    "interval": 60,
                    "trace" : false
                }
            ]
    ...
}
```
#### Parameters
* `accessory ` is required, with `HeatzyAsSwitch` value.  
* `name` (required) is anything you'd like to use to identify this device. You can always change the name from within the Home app.
* `username` and `password` (required) are the credentials you use in the Heatzy app.
* `did` (required) is the parameter for your device. See below how to get it.
* `interval` (optional) is how often (in seconds) the plugin will ask Heatzy servers the state of your device, which is necessary when you change the state from outside of Homekit. Default is 60s.
* `trace` (optional) displays the main events in homebridge log . Default is false.


## How to find the  `did` of your devices
In your terminal, enter the two commands below.

For the first one, you will have to replace USERNAME and PASSWORD by your credentials used in the Heatzy app.
In return, you should get a `token` : you will use it in the second command, to replace YOURTOKEN.

The second command will return many datas. For each Heatzy device, you must find this piece of information : `"did": "011233455677899abbcd"`. To know wich `did` is for which device, you will find another piece of informatation close to it:` "dev_alias": "Name"`. The Name is the one used in the Heatzy app.
(You can choose a different name in homebridge configuration file, if you wish).


`curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-Gizwits-Application-Id: c70a66ff039d41b4a220e198b0fcc8b3' -d '{ "username": "USERNAME", "password": "PASSWORD", "lang": "en" }' 'https://euapi.gizwits.com/app/login'`

`curl -X GET --header 'Accept: application/json' --header 'X-Gizwits-User-token: YOURTOKEN' --header 'X-Gizwits-Application-Id: c70a66ff039d41b4a220e198b0fcc8b3' 'https://euapi.gizwits.com/app/bindings?limit=20&skip=0'`
## Limits
### Works only with Heatzy Pilote
Other Heatzy devices (Flam, Inea, ...) are not supported. Tested with Heatzy Pilote V2 devices only, but should work with V1.
### No access to Off and Hors-Gel from Home app
I have not found a simple and meaningful way to set these states from the Home app. Yet...
Anyway, they are not used very often, so the Heatzy app may be enough to control them.
### Accessory, no platform
Platform implementation would be a better solution (not need to to get `did`, ...), but I would have to learn more about coding a homebridge plugin. One day, may be....
### Sometimes, Home app displays the wrong state
It happens mostly when you do many updates in a short period of time. The device is correctly set : you can check it on the device, and in the Heatzy app. But, for reasons I do not know, the Heatzy servers may take some time (minutes, or hours...) to reflect the new state. Until this is done, Home app wil display the old state. I hope Heatzy will fix this. In the meantime, usually, a new order sent the device will set things right.
### Errors
Sometime, Heatzy servers are not working properly for a short period time. During these periods, the plugin cannot control or even display the state of the devices. Errors will be displayed in homebridge log.
From my experience, these periods are usually very short, so this is not a real problem.

## Credit
To create this plugin, I learned a lot, from many sources  : coding in NodeJS, using github and npm, understanding homebridge and axios, ...

A lot of thanks to nfarina for homebridge !!!

And to all the plugin devs who are sharing their code.