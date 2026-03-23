### Telemetry Dashboard

This tool has been modified by Isabella from Peter Hall's original version found at [ArduPilot/WebTools/TelemetryDashboard](https://github.com/ArduPilot/WebTools/tree/main/TelemetryDashboard). All the customisable features have been left intact (html editing, save, load templates (note, on load all previously added vehicles are removed) etc).

This is a display only tool to help visualizing incoming MAVLink telemetry data.

This is not a GCS! It should be used in addition to a GCS.

Focus is on flexibility and user customization.

## Modifications
It now accepts multiple vehicles which you can add with the + button in the Connections tippy. Here you can enter the websocket address, a vehicle name and connect/disconnect/remove as you wish (upon disconnect, any widget with that vehicle selected will remove its content and its name from the options). There is a Primary Vehicle selector which when chosen and 'selected' pressed, sends that vehicle's messages to all widgets in the dashboard. Note, it overrides and removes any vehicles already selected and is primarily designed to speed up the setup time particularly for only using one vehicle.

When Edit is enabled (found in the Settings tippy), you can now select and deselect vehicles at each widget. The map and graphs accept multiple vehicles, all the rest only allow one vehicle's data. Each vehicle is assigned a colour at random for easy identification across the dashboard and can be changed by clicking on the vehicle in the map which brings up a vehicle info popup (also new feature) where you can see the vehicle's websocket, name, coordinates, colour and MAVLink Inspector which has been moved inside here (it is still a widget which can be added and assigned a vehicle). 

Known bugs!! There are two known bugs plus one dormant feature to be aware of, all of which harmless but slightly inconvenient. Have I had had infinite time to work on my Dissertation Project these would have been ironed out, but unfortunately I do have the rest of my degree to complete, a limited amount of hours allocated to this project and indeed in the day so I got as far as I could in the time given. (I will be continuing to clean up these bugs after my exams are done though!). The bugs are as follows:
- Tippy expanding issue in the Vehicle Info Popup when the MAVLink Inspector tree branch is expanded
- Plots on the graph not removed when vehicles deselected (either manually or via disconnect)
Dormant feature:
- Command line text input just prints to console (could be the start of sending commands back to the vehicle...?)
