class inputters {
    constructor(webSocketURL, uniqueVehicleName, id) {
        this.webSocketURL = webSocketURL;
        this.uniqueVehicleName = uniqueVehicleName;
        //this.MAVLink = new MAVLink20Processor();
        this.ws = null;
        this.id = id;
        
    }

    show() {
        console.log(this.webSocketURL);
        console.log(this.uniqueVehicleName);
        //console.log(this.MAVLink);
        console.log(this.ws);
        console.log(this.target);
    }
    
    //spare_ws() {
    //    const ws1 = new WebSocket('ws://127.0.0.1:56781/');
    //    ws1.onopen = () => console.log('open')
    //    ws1.onerror = e => console.error('error', e);
    //    ws1.onclose = e => console.log('close', e.code, e.reason);
    //    return
    //}

    set_ws() {
        this.target = this.webSocketURL.value;
        console.log(this.target);
        this.ws = new WebSocket(this.target);
        this.ws.binaryType = "arraybuffer";
        return this.ws;
    }   
    
    ws_ctrl() {
        console.log('ws ctrl');
        this.ws.onopen = () => console.log('connected');

        this.ws.onerror = (e) => {
            console.log('WebSocket Error', e)
            this.ws.close()
        }

        this.ws.onclose = e => console.log('closed', e.code, e.reason);
        
        this.ws.onmessage = () => console.log('message');
    }
}
