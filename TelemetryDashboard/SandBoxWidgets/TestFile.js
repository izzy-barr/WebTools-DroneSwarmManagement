// Import leaflet
const script = document.createElement("script")
script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
document.body.appendChild(script)

// Add css
const ccs = document.createElement("link")
ccs.rel = "stylesheet"
ccs.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
document.body.appendChild(ccs)

// Can't init immediately because script will not be loaded
let map
function init() {

    // Make sure Leaflet is loaded
    if (window.L == undefined) {
        setTimeout(init, 100)
        return
    }

    map = L.map(div)

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Default to 0,0 and sensible zoom level for when vehicle is found
    map.setView([0.0, 0.0], 14)

    // Add scale bar
    L.control.scale().addTo(map)

    // Add marker rotation helper
    const rotation_helper = document.createElement("script")
    rotation_helper.src = "https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"
    document.body.appendChild(rotation_helper)
}

// Try init in 0.1 seconds
setTimeout(init, 100)

let vehicle = []

function vehicle_init(id, location) {

    const vehicle_icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0--><path d="M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.2 495.9c-5.7 10-16.3 16.1-27.8 16.1l-56.2 0c-10.6 0-18.3-10.2-15.4-20.4l49-171.6L112 320 68.8 377.6c-3 4-7.8 6.4-12.8 6.4l-42 0c-7.8 0-14-6.3-14-14c0-1.3 .2-2.6 .5-3.9L32 256 .5 145.9c-.4-1.3-.5-2.6-.5-3.9c0-7.8 6.3-14 14-14l42 0c5 0 9.8 2.4 12.8 6.4L112 192l102.9 0-49-171.6C162.9 10.2 170.6 0 181.2 0l56.2 0c11.5 0 22.1 6.2 27.8 16.1L365.7 192l116.6 0z"/></svg>`,
        className: "",
        iconSize: [50, 44],
    })

    const marker = new L.marker(location, {
        icon: vehicle_icon,
        rotationOrigin: "center",
        zIndexOffset: 10,
        interactive: true
    }).addTo(map)

    marker.on("click", (e) => {

        setup_vehicle_info(vehicle[id].last_msg)

    })

    const trail = new L.polyline([location], {
        color: "yellow",
        interactive: false
    }).addTo(map)

    vehicle[id] = { marker, trail }
    map.panTo(location)
}

function update_pos(msg) {

    const id = msg._header.srcSystem
    const location = new L.LatLng(msg.lat * 1e-7, msg.lon * 1e-7)
    const heading = msg.hdg * 0.01

    if (vehicle[id] == null) {
        vehicle_init(id, location)
    }

    vehicle[id].last_msg = msg

    if ("setRotationAngle" in vehicle[id].marker) {
        vehicle[id].marker.setRotationAngle(heading - 90.0)
    }

    vehicle[id].marker.setLatLng(location)

    if (options.autoPan === true) {
        map.panInside(location, { padding: [50, 50] })
    }

    const trail = vehicle[id].trail.getLatLngs()
    trail.unshift(location)

    let length = 0
    for (let i = 1; i < trail.length; i++) {
        length += trail[i - 1].distanceTo(trail[i])
        if (length > options.trailLengthM) {
            trail.splice(i)
            break
        }
    }

    vehicle[id].trail.setLatLngs(trail)
}

let home = []

function home_init(id, location) {

    const home_icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 22.1-17.9 40-40 40l-16 0-24 0c-22.1 0-40-17.9-40-40l0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64c0 22.1-17.9 40-40 40l-24 0-16 0c-22.1 0-40-17.9-40-40l0-112-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>`,
        className: "",
        iconSize: [40, 36],
    })

    home[id] = new L.marker(location, {
        icon: home_icon,
        interactive: false
    }).addTo(map)
}

function update_home(msg) {
    const id = msg._header.srcSystem
    const location = new L.LatLng(msg.latitude * 1e-7, msg.longitude * 1e-7)

    if (home[id] == null) {
        home_init(id, location)
    }

    home[id].setLatLng(location)
}


handle_msg = function (msg) {

    if (map == null) return
    if (msg._header.srcComponent != 1) return

    if (msg._id == 33) {
        update_pos(msg)
    } else if (msg._id == 242) {
        update_home(msg)
    }
}

handle_options = function (new_options) {
    options = new_options
}


//IB Setup vehicle info widget from vehicles in map
setup_vehicle_info = function (msg) {
    console.log('setup_vehicle_info called')

    const tip_div = document.createElement("div")
    tip_div.appendChild(document.importNode(document.getElementById('vehicle_info_tip_template').content, true))

    //Fill out vehicle info
    tip_div.querySelector(`b[id="vehicle_name"]`).innerHTML = parent.vehicleMap.get(msg._vehicleID).name
    tip_div.querySelector(`b[id="vehicle_ws"]`).innerHTML = parent.vehicleMap.get(msg._vehicleID).target
    tip_div.querySelector(`b[id="vehicle_loc"]`).innerHTML = `${msg.lat * 1e-7}, ${msg.lon * 1e-7}`
    const vehicle_colour = tip_div.querySelector(`input[id="vehicle_colour"]`)
    vehicle_colour.value = parent.vehicleMap.get(msg._vehicleID).colour   
    const enterBtn = tip_div.querySelector('input[id="enter_button"]') 
    const div = tip_div.querySelector(`div[id="MAVLink_inspector"]`)
    setup_mavlink_inspector(msg, div)

    //Create tip or update content if it already exists
    if (window.tip == null){
        console.log('Creating new tip')
        window.tip = tippy(this, {
            content: tip_div,
            interactive: true,
            trigger: 'manual',
            placement: 'top-end',
            maxWidth: "1000px",
            arrow: false,
            offset: [-15, -360],
            appendTo: () => document.body,
            popperOptions: {
                strategy: 'fixed',
                modifiers: [
                    {
                    name: 'flip',
                    options: {
                        fallbackPlacements: ['bottom', 'right'],
                    },
                    },
                    {
                    name: 'preventOverflow',
                    options: {
                        altAxis: true,
                        tether: false,
                    },
                    },
                ],
            },
        })
        } else {
        console.log('Updating existing tip')
        window.tip.setContent(tip_div)
    }

    window.tip.show()

    // Close button
    tip_div.querySelector(`svg[id="Close"]`).onclick = () => {
        window.tip.hide()
        parent.selectPoppedUp = false;
    }

    // Register vehicle colour change
    vehicle_colour.onchange = () => {
        parent.vehicleMap.get(msg._vehicleID).colour = vehicle_colour.value
        console.log('Vehicle colour changed to', vehicle_colour.value,  parent.vehicleMap.get(msg._vehicleID).colour, msg._vehicleID)
    }

    // Send written input to console
    enterBtn.onclick = () => {
        const writtenScript = tip_div.querySelector(`input[id="script_writer"]`).value
        console.log('written script', writtenScript)
        tip_div.querySelector(`input[id="script_writer"]`).value = null
    }

}

//IB MAVLink Inspector setup (mostly moved from MAVLink_Inspector.json)
setup_mavlink_inspector = function (msg, div) {
    console.log('setup_mavlink_inspector called')

    // Build component ID lookup
    let comp_id = {}
    
    for (const [key, value] of Object.entries(mavlink20)) {
        if (key.startsWith("MAV_COMP_ID")) {
            comp_id[value] = key    
        }
    }
    
    // Use flex to allow the tree to take up the remaining space
    div.style.display = "flex"
    div.style.flexDirection = "column"
    
    // Add a div to hold the tree
    const tree_div = document.createElement("div")
    tree_div.style.height = "100%"
    div.appendChild(tree_div)
    
    // Allow scrolling if needed
    tree_div.style.overflow = "auto"
    
    // List for any system IDs
    let ids = {}
                
    // Create a new details element with summary
    function create_details(summary_text, indent = false, open = true) {
        
        // Create new details item
        const details = document.createElement("details")
                    
        // Add text
        const summary = document.createElement("summary")
        summary.appendChild(document.createTextNode(summary_text))
        details.appendChild(summary)
        
        if (indent) {
            details.style.marginLeft = "1em"
        }
        
        details.open = open
                        
        return details
    }
                            
    // Add a new item to a tree
    function add_to_tree(tree, id, parent, item) {
        
        // Find any existing id that should come before this one
        let prior_item = null
        for (const existing_id of Object.keys(tree)) {
            if (parseInt(existing_id) < id) {
                prior_item = tree[existing_id]
            }
        }
                                    
        if (prior_item == null) {
            // No prior element, add to start of tree
            parent.append(item)
        } else {
            // Add affter the prior element
            prior_item.ele.after(item)
        }
                                                
        tree[id] = { ele: item, content: {} }
    }
                                                                        
    // Runtime function IB changed how method of defined
    function handle_msg(msg) {    
        const id = msg._header.srcSystem
        const comp = msg._header.srcComponent
        const msg_id = msg._id
                
        // Add new ID to tree if not already there
        if (!(id in ids)) {
            add_to_tree(ids, id, tree_div, create_details("System ID: " + id))
        }
                        
        const id_branch = ids[id]
                        
        // Add new component to tree if not already there
        if (!(comp in id_branch.content)) {
            let comp_str = "Component ID:" + comp
            if (comp in comp_id) {
                comp_str += " " + comp_id[comp]
            }
            add_to_tree(id_branch.content, comp, id_branch.ele, create_details(comp_str, true))
        }
                
        const component_branch = id_branch.content[comp]
                                                                            
        // Add new message to tree if not already there
                                                                            
        if (!(msg_id in component_branch.content)) {
            let msg_str
            let type = null
            
            if (msg_id in mavlink20.map) {
                type = new mavlink20.map[msg_id].type
                msg_str = type._name + " (" + msg_id + ")"
            } else {
                msg_str = "" + msg_id
            }
            
            add_to_tree(component_branch.content, msg_id, component_branch.ele, create_details(msg_str, true, false))
            
            const msg_item = component_branch.content[msg_id]
            msg_item.type = type
                                                                                                                
            if (type != null) {
                // Add line for each field
                for (const field of type.fieldnames) {
                    const line = document.createElement("li")
                    line.style.marginLeft = "1em"
                    line.appendChild(document.createTextNode(field + ": "))
                    msg_item.ele.appendChild(line)
                    const value = document.createTextNode("?")
                    line.appendChild(value)
                    msg_item.content[field] = value
                }
            }  
        }
                        
        // Update the field values
        const msg_item = component_branch.content[msg_id]
        if (msg_item.type != null) {
            for (const [field, text] of Object.entries(msg_item.content)) {
                text.nodeValue = msg[field]   
            } 
        }                     
    }

    handle_msg(msg) //IB add to completment change of function definition
}