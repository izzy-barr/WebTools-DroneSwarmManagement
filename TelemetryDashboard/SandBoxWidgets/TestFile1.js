// Add a heading
const heading = document.createElement("h3")
heading.appendChild(document.createTextNode("Messages"))
heading.style.margin = 0
div.appendChild(heading)

// Use flex to allow the tree to take up the remaining space
div.style.display = "flex"
div.style.flexDirection = "column"

// Add a div to hold the tree
const msg_div = document.createElement("div")
msg_div.style.height = "100%"
div.appendChild(msg_div)

// Allow scrolling if needed
msg_div.style.overflow = "auto"

const speech_msg = new SpeechSynthesisUtterance()
let selected = null //IB

function print(text, severity) {

    const text_color = options["textColor" + severity]
    const background_color = options["backgroundColor" + severity]
    const speech = options["speech" + severity]

    const div = document.createElement("div")
    if (text_color != null) {
        div.style.color = text_color 
    }
    if (background_color != null) {
        div.style.backgroundColor = background_color
    }
    
    div.innerText = text

    // Add item
    msg_div.appendChild(div)

    // Remove any item over the history
    while (msg_div.childElementCount > options.lineHistory) {
        msg_div.removeChild(msg_div.firstElementChild)
    }
    
    // Move scroll to bottom
    msg_div.scrollTop = msg_div.scrollHeight

    // Say if enabled
    if (speech) {
        speech_msg.text = text
        window.speechSynthesis.speak(speech_msg)
    }

}

// Class for accumulating status texts
class status_text {

    constructor(msg) {
        this.chunks = []
        this.expected_chunks = 1
        this.severity = null
        this.id = null

        this.add(msg)
    }

    add(msg) {
        if ((this.severity == null) || (this.id == null)) {
            // First message
            this.severity = msg.severity
            this.id = msg.id

        } else if ((msg.severity != this.severity) || (msg.id != this.id)) {
            // New message does not belong in this set
            return false
        }

        // Remove null chars
        this.chunks[msg.chunk_seq] = msg.text.replace(/\0.*$/g,'')

        // If this message does not contain a null then another is expected
        const text_max_length = 50
        if (this.chunks[msg.chunk_seq].length == text_max_length) {
            this.expected_chunks = msg.chunk_seq + 1
        }

        // Record the time
        this.last_chunk = Date.now()

        return true
    }

    get_text() {
        let text = ""
        for (const chunk of this.chunks) {
            if (chunk != null) {
                text += chunk
            } else {
                // Indicate the missing chunk
                text += " ... "
            }
        }
        return text
    }

    get_msg() {
        if (this.id == 0) {
            // Id of 0 means single chunk message
            return { text: this.get_text(), severity: this.severity }
        }

        // Multi chunk, count chunks
        let chunk_count = 0
        for (const chunk of this.chunks) {
            if (chunk != null) {
                chunk_count++
            }
        }

        if (chunk_count == this.expected_chunks) {
            // Got all the expected chunks
            return { text: this.get_text(), severity: this.severity }
        }

        if ((Date.now() - this.last_chunk) > 1000) {
            // More than 1 second since last chunk, assume its lost and return what we have
            return { text: this.get_text(), severity: this.severity }
        }

        return null
    }
}

// Object for each system ID and component ID
let systems = {}

// Print any messages from message array and remove
function print_message(messages) {
    for (let i = 0; i<messages.length; i++) {
        const msg = messages[i].get_msg()
        if (msg != null) {
            print(msg.text,  msg.severity)

            // Remove item from array
            messages.splice(i, 1)

            // Re-run
            print_message(messages)
        }
    }
}

// Print any pending messages
function print_pending() {
    for (const system of Object.values(systems)) {
        for (const component of Object.values(system)) {
            print_message(component)
        }
    }
}

const status_text_id = 253

// Runtime function
handle_msg = function (msg) {
    // Only interested in status text
    if (msg._id != status_text_id) {
        return
    }

    selected = msg._vehicleID //IB
    const sys_id = msg._header.srcSystem
    const comp_id = msg._header.srcComponent

    if (!(sys_id in systems)) {
        systems[sys_id] = {}
    }

    const system = systems[sys_id]

    if (!(comp_id in system)) {
        system[comp_id] = []
    }

    const component = system[comp_id]

    // Check if this is a chunk of a existing message
    let added = false
    for (const message of component) {
        if (message.add(msg)) {
            added = true
            break
        }
    }

    // Add a new message
    if (!added) {
        component.push(new status_text(msg))
    }

    print_pending()
}

// Options changed
handle_options = function(new_options) {
    options = new_options
}

// Add 10Hz callback to print any pending messages
setInterval(print_pending, 100)


//IB vehicle disconnect
parent.addEventListener('vehicleDisconnect', e => {
    const vehicleID = e.detail.vehicleID
    console.log('vehicle Disconnect heard from messages', vehicleID)
    if (vehicleID == selected) {
        msg_div.innerHTML = ""
    } 
})