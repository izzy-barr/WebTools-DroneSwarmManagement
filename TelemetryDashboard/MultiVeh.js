console.log('MultiVeh.js loaded')

window.vehicleMap = new Map()

window.createVehicle = function (vehicle, vehicleID) {
    if (!window.vehicleMap.has(vehicleID)) {
        window.vehicleMap.set(vehicleID, vehicle)
    }
}


class mavVehicle {
    constructor(webSocketURL, userVehicleName, removeBtn, rowEl) {
        this.webSocketURL = webSocketURL;
        this.userVehicleName = userVehicleName;
        this.removeBtn = removeBtn;
        this.rowEl = rowEl;
        this.MAVLink = new MAVLink20Processor();
        this.target = null;
        this.ws = null;
    }

    // Sets the websocket to the value the input
    set_ws() {
        console.log('set_ws called');
        this.target = this.webSocketURL.value;
        this.ws = new WebSocket(this.target);
        this.ws.binaryType = "arraybuffer";
        this.handlers();
    }

    // Defines what should happen with websocket handlers
    handlers() {
        console.log('handlers called ' + this.target);

        this.ws.onopen = () => {
            console.log('ws.onopen called ' + this.target)
        }

        this.ws.onerror = (e) => {
            console.error('ws.onerror called ' + this.target, e)
            this.ws.close()
        }

        this.ws.onclose = (e) => {
            console.error('ws.onclosed called ' + this.target, e.code, e.reason)
        }

        this.ws.onmessage = (msg) => {
            console.log('ws.onmessage ' + this.target)

            // Feed data to MAVLink parser and forward messages
            for (const char of new Uint8Array(msg.data)) {
                const m = this.MAVLink.parseChar(char)
                if ((m != null) && (m._id != -1)) {
                    m._timeStamp = Date.now()
                    broadcast.postMessage({ MAVLink: m })
                }
            }
        }
    }

    remove_ws() {
        console.log('remove_ws called');

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.rowEl) {
            this.rowEl.remove();
            this.rowEl = null;
        }

    }

}