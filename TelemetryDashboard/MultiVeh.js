console.log('MultiVeh.js loaded')

window.vehicleMap = new Map()
window.createVehicle = function (vehicle, vehicleID) {
    if (!window.vehicleMap.has(vehicleID)) {
        window.vehicleMap.set(vehicleID, vehicle)
    }
}

class mavVehicle {
    constructor(rowEl, id) {
        this.rowEl = rowEl;
        this.id = id;
        this.set_querySelectors();
        this.MAVLink = new MAVLink20Processor();
        this.expecting_close = false;
        this.been_connected = false;
        this.target = null;
        this.ws = null;
        this.colour = null;
        this.type = null;
    }
    
    set_name() {
        this.name = this.userVehicleName.value;
    }

    // Points query selectors to respective elements in row
    set_querySelectors() {
        this.webSocketURL = this.rowEl.querySelector(`input[id="url${this.id}"]`);
        this.userVehicleName = this.rowEl.querySelector(`input[id="name${this.id}"]`);
        this.removeBtn = this.rowEl.querySelector(`input[id="remove${this.id}"]`);
        this.connectBtn = this.rowEl.querySelector(`input[id="connect${this.id}"]`);
        this.disconnectBtn = this.rowEl.querySelector(`input[id="disconnect${this.id}"]`);
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
                    m._vehicleID = this.id;
                    m._colour = this.colour;
                    mavlinkChannel.postMessage({ MAVLink: m })
                    if (this.type == null && m._id === 0) {
                        this.type = m.type
                    }
                }
            }
        }
    }

    remove_ws() {
        console.log('remove_ws called');

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.removeEventListener('open', null);
            this.ws.removeEventListener('close', null);
            this.ws.close();
            this.ws = null;
        }

        if (this.rowEl) {
            this.rowEl.remove();
            this.rowEl = null;
        }

    }

}