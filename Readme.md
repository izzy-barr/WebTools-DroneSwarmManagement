# Low Cost Drone Swarm Management
## Developing Telemetry Dashboard from the ArduPilot WebTools for multiple vehicles as part of my MEng Research & Development Project at Durham University
*Isabella Barr, supervised by Dr Oliver Vogt*


This repository originated from [ArduPilot's WebTools](https://github.com/ArduPilot/WebTools) which contains a number of web based tools for targeted ArduPilot log review and insight. These tools are live on [ardupilot.org](https://firmware.ardupilot.org/Tools/WebTools). For general review see [UAVLogViewer](https://github.com/ArduPilot/UAVLogViewer).

***Modifications:*** Telemetry Dashboard, created by Peter Hall, has been modified by Isabella Barr to increase breadth of its use for multiple vehicles as well as adding features including vehicle info popups, vehicle colour and vehicle type recognition with different icons for improved vehicle management. All other WebTools have not been edited.


## MEng Project Deliverables
For examiners and those interested in reading into my research, the deliverables for the project can be found in the [Deliverables](https://github.com/izzy-barr/WebTools-DroneSwarmManagement/tree/main/Deliverables) folder. These are:

**Drone Swarm Communication & Management Experimental Setup** *Deliverable 1.1* co-authored with Ethan Challinor: the compilation of research in how to set up SITL and physical drones (single & multiple vehicles, and standard & custom script swarming) with Mission Planner, MAVProxy & QGC plus integration with Telemetry Dashboard.

**Telemetry Dashboard Code** *Deliverables 2.1, S.1 & S.3*: all edits made by myself (Isabella Barr), have been commented with IB for easy identification when marking in the [Telemetry Dashboard](https://github.com/izzy-barr/WebTools-DroneSwarmManagement/tree/main/TelemetryDashboard) folder. Updates to the [Dev index.html](https://github.com/izzy-barr/WebTools-DroneSwarmManagement/tree/main/Dev) were also made to update the Work In Progress home page. The [mavtcpsniff.py script](https://github.com/izzy-barr/WebTools-DroneSwarmManagement/blob/main/Deliverables/mavtcpsniff.py) has also been modified from Peter Hall's version from only allowing the loopback address to accepting the IP address in the input too.

**Screen Recordings of Tests** *Deliverables 2.1, S.1 & S.3*: these map directly to the test environments outlined in the Methodology of this project, but also demonstrate Telemetry Dashboard's flexibility in handling different setups and potential for unique layouts for any mission. Video 2 highlights all developed features from this research, but the rest include the following:
Video 1 - Single SITL instance with MAVProxy on a single device -> shows Add/ Move/ Remove Widgets, Saving & Loading the Dashboard, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, changing Vehicle colour & Vehicle Info Pop-up, Select/ Deselect vehicle on widgets.
Video 2 - Two SITL instances with MAVProxy on a single device -> demonstrates full features of Telemetry Dashboard, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, icons for different vehicle types, Select/ Deselect vehicle on widgets, changing vehicle colour & Vehicle Info Pop-up, auto-pan, Add/ Move/ Remove Widgets.
Video 3 - Single SITL instance with Mission Planner on a Virtual Machine with two dashboards -> shows individual setup per dashboard used connected to the same vehicle, Vehicle Add/ Connect/ Disconnect/ Remove, character limit on Name input, Primary Vehicle Select, Add/ Move/ Remove Widgets, Select/ Deselect vehicle on widgets.
Video 4 - Ten SITL instances with MAVProxy on Virtual Machines -> displays a larger fleet of different vehicle types, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, Add/ Move/ Remove Widgets, icons for different vehicle types, Select/ Deselect vehicle on widgets, changing Vehicle colour & Vehicle Info Pop-up.
Video 5 - Two SITL instances with standard swarming in MAVProxy on Virtual Machines & single device -> shows swarm logic in Telemetry Dashboard and setting FOLL parameters, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, Select/ Deselect vehicle on widgets.
Video 6 - Two SITL instances with custom swarming in MAVProxy on Virtual Machines -> demonstrates Ethan Challinor's custom [Drone Swarm Communication scripts](https://github.com/ethochal5/Low-Cost-Drone-Swarm-Communication-Code) working in Telemetry Dashboard, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, Select/ Deselect vehicle on widgets, changing Vehicle colour & Vehicle Info Pop-up.
Video 7 - Two real drones with custom swarming in MAVProxy -> exemplifies Telemetry Dashboard, and Ethan Challinor's scripts, working in the real world, Vehicle Add/ Connect/ Disconnect/ Remove, Primary Vehicle Select, Select/ Deselect vehicle on widgets, changing Vehicle colour & Vehicle Info Pop-up.

**Final Report** *Deliverables 1.2 & 3.1* -> uploading after the project has concluded

## Thanks & Acknowledgements
First and foremost, I would thank my supervisor Dr Oliver Vogt for creating this amazing project, supporting me through my work and showing me the world of ArduPilot, Telemetry Dashboard and drone swarming. I'd also like to thank Peter Hall for taking the time to share the origin of Telemetry Dashboard and allow me to work on his creation! And lastly, to Ethan Challinor for helping set up the drones and fly them whilst working on Drone Swarm Communications.

## Development setup

These steps allow hosting of the tools locally for development purposes or for use without a internet connection.

Clone this repository (or your fork) and update the submodules:

```console
git clone --recurse-submodules https://github.com/izzy-barr/WebTools_DroneSwarmManagement.git
```

Host locally using python by running the following command in the root of the repo:

```
python3 -m http.server --bind 127.0.0.1
```

The landing page can then be found at http://127.0.0.1:8000/

You need to keep your submodules update. When you rebase, or switch branches, update them like so:
```console
git submodule update --init --recursive
```

## VSCode

This repository contains VSCode launch configurations for debugging with Chrome and Edge. WebTools are either hosted with python as above or using the [LiveServer extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) which enables auto-reload. More information on debugging with VSCode [here](https://code.visualstudio.com/docs/editor/debugging).

<p align="center">
<img src="images/VSCode%20debug.png" width="80%">
</p>
