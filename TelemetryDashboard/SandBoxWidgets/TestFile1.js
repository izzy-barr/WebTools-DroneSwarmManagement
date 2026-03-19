div.appendChild(document.createTextNode("Stats:"))
div.appendChild(document.createElement("br"))

message_report = document.createTextNode("")
div.appendChild(message_report)
div.appendChild(document.createElement("br"))

bytes_report = document.createTextNode("")
div.appendChild(bytes_report)
div.appendChild(document.createElement("br"))

latency_report = document.createTextNode("")
div.appendChild(latency_report)
div.appendChild(document.createElement("br"))

let selected = null //IB add

const average = {
    messages: 0,
    latency: 0,
    bytes: 0,
}
var lastPrint = Date.now()

handle_msg = function (msg) {
    const now = Date.now()
    selected = msg._vehicleID //IB add

    average.latency += (now - msg._timeStamp) * 0.001
    average.messages += 1
    average.bytes += msg._header.mlen + 12
    
    const dt = (now - lastPrint) * 0.001
    if (dt > 1.0) {
        lastPrint = now;
        const messages = average.messages / dt
        const latency = average.latency / average.messages
        const bytes = average.bytes / dt
        
        average.messages = 0
        average.latency = 0
        average.bytes = 0
        
        message_report.nodeValue = `Messages per second: ${messages.toFixed(2)}`
        bytes_report.nodeValue = `Bytes per second: ${bytes.toFixed(2)}`
        latency_report.nodeValue = `Latency (seconds): ${latency.toFixed(4)}`
    }
}

//IB vehicle disconnect
parent.addEventListener('vehicleDisconnect', e => {
    const vehicleID = e.detail.vehicleID
    console.log('vehicle Disconnect heard from stats', vehicleID)
    if (vehicleID == selected) {
        message_report.nodeValue = ""
        bytes_report.nodeValue = ""
        latency_report.nodeValue = ""
    } 
})