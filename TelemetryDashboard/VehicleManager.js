console.log('Vehicle manager script loaded')

window.MAVLinkParsers = new Map()

window.createVehicleParser = function (vehicle, vehicleID) {
    if (!window.MAVLinkParsers.has(vehicleID)) {
        window.MAVLinkParsers.set(vehicleID, {
            vehicleDetails: vehicle,
            parser: new MAVLink20Processor(),
            lastSeen: Date.now()
        })
    }
    console.log('Created parser')
    return window.MAVLinkParsers.get(vehicleID)
}