//IB add CCS
document.body.style = "display:flex; flex-direction:column; height:100vh; box-sizing:border-box; margin:0; padding:0; scrolling:no;"
const bootstrapCcs = document.createElement("link")
bootstrapCcs.rel = "stylesheet"
bootstrapCcs.href = "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css"
document.body.appendChild(bootstrapCcs)
const formioCcs = document.createElement("link")
formioCcs.rel = "stylesheet"
formioCcs.href = "https://cdn.form.io/formiojs/formio.full.min.css"
document.body.appendChild(formioCcs)

//IB add tippy ccs
const tippyCcs = document.createElement("link")
tippyCcs.rel = "stylesheet"
tippyCcs.href = "https://unpkg.com/tippy.js@6/dist/tippy.css"
document.body.appendChild(tippyCcs)

// Import leaflet
const script = document.createElement("script")
script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
document.body.appendChild(script)

//IB add popper and tippy scripts
const popperScript = document.createElement("script")
popperScript.src = "https://unpkg.com/@popperjs/core@2"
document.body.appendChild(popperScript)
const tippyScript = document.createElement("script")
tippyScript.src = "https://unpkg.com/tippy.js@6"
document.body.appendChild(tippyScript) 

// Add ccs
const ccs = document.createElement("link")
ccs.rel = "stylesheet"
ccs.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
document.body.appendChild(ccs)

let map

function init() {
    // Make sure Leaflet is loaded
    if (window.L == undefined) {
        // try again in while
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

// Try init in 0.1 seconds, this give time for the added scripts to load
setTimeout(init, 100)

// Add new vehicle to map
let vehicle = []
let clickedVehicle = null //IB

//IB Create vehicle type configuration
const vehicleTypeConfig = {
    1:  { template: 'plane_icon_template',          offset: -90 },
    2:  { template: 'copter_icon_template',         offset: 45 },
    3:  { template: 'helicopter_icon_template',     offset: -90 },
    4:  { template: 'helicopter_icon_template',     offset: -90 },
    5:  { template: 'antennaTracker_icon_template', offset: -90 },
    6:  { template: 'gcs_icon_template',            offset: -90 },
    7:  { template: 'balloon_icon_template',        offset: -90 },
    8:  { template: 'balloon_icon_template',        offset: -90 },
    9:  { template: 'rocket_icon_template',         offset: 45 },
    10: { template: 'rover_icon_template',          offset: -180 },
    11: { template: 'boat_icon_template',           offset: -180 },
    12: { template: 'anchor_icon_template',         offset: -180 }
};    
    
function vehicle_init(id, location, type, colour) {
    //IB load vehicle popup
    if (!window.tip) {
        init_vehicle_info()
    }
    //IB Select icon depending on type of vehicle
    const template = vehicleTypeConfig[type].template || 'generic_icon_template' ;

    //IB create icons
    const icon = L.divIcon({
        html: document.getElementById(template).innerHTML,
        className: "",
        iconSize: [50, 44],
    })

    // Add icon to map
    const marker = new L.marker(location, {
        icon: icon,
        rotationOrigin: "center",
        zIndexOffset: 10, // Vehicles should be on top
        interactive: true //IB change
    }).addTo(map)

    change_colour(marker._icon, colour)

    //IB add onClick to pop up VehicleInfo
    marker.on("click", (e) => {
        clickedVehicle = vehicle[id] //IB
        fill_vehicle_info(clickedVehicle._vehicleID)
        tree_div.innerHTML = null
        init_mavlink_inpsector()
        window.tip.show() //IB
    })

    const trail = new L.polyline([location], {
        color: "yellow",
        interactive: false
    }).addTo(map)

    vehicle[id] = { marker, trail }

    // Center the map on the new vehicle
    map.panTo(location)
}

//IB change icon colour
function change_colour(icon, colour) {
    if (!icon) {
        return;
    }
    
    const iconSvg = icon.querySelector('svg');
    if (iconSvg) {
        const iconPath = iconSvg.querySelector('path');
        if (iconPath) {
            iconPath.setAttribute('fill', colour);
        }
    }
}

// Update the position of a vehicle
function update_pos(msg) {

    const id = msg._header.srcSystem
    const location = new L.LatLng(msg.lat * (10 ** -7), msg.lon * (10 ** -7))
    const heading = msg.hdg * 0.01
    const type = parent.vehicleMap.get(msg._vehicleID).type

    // Make sure vehicle has been setup
    if (vehicle[id] == null) {
        vehicle_init(id, location, type, msg._colour) //IB add type
    vehicle[id]._vehicleID = msg._vehicleID //IB
    }        
    
    // Update marker
    if ("setRotationAngle" in vehicle[id].marker) {
        const offset = vehicleTypeConfig[type].offset || 0 //IB select offset
        vehicle[id].marker.setRotationAngle(heading - offset)
    }

    vehicle[id].marker.setLatLng(location)

    // If enabled makes sure vehicle is still in view
    if (options.autoPan == true) {
        map.panInside(location, { padding: [50, 50] })
    }

    // Add new point to start of trail
    const trail = vehicle[id].trail.getLatLngs()
    trail.unshift(location)

    // Remove points after the the given trail length
    let length = 0
    const len = trail.length

    for (let i = 1; i < len; i++) {
        length += trail[i - 1].distanceTo(trail[i])

        if (length > options.trailLengthM) {
            trail.splice(i)
            break
        }
    }

    vehicle[id].trail.setLatLngs(trail)

    // Update the vehicle position in nav target line
    if (vehicle[id].nav_target != null) {
        let nav_target = vehicle[id].nav_target.line.getLatLngs()
        if (nav_target.length == 2) {
            nav_target[0] = location
            vehicle[id].nav_target.line.setLatLngs(nav_target)
        }
    }

    // Update the vehicle position in pos target line
    if (vehicle[id].pos_target != null) {
        let pos_target = vehicle[id].pos_target.line.getLatLngs()
        if (pos_target.length == 2) {
            pos_target[0] = location
            vehicle[id].pos_target.line.setLatLngs(pos_target)
        }
    }
}

// Add home to the map
let home = []

function home_init(id, location) {

    const icon_div = document.createElement("div")
    icon_div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>`
    icon_div.firstChild.style.fill = "white"

    const home_icon = L.divIcon({
        html: icon_div,
        className: "",
        iconSize: [40, 36],
    })

    home[id] = new L.marker(location, {
        icon: home_icon,
        interactive: false
    }).addTo(map)
}

// Update the position of home
function update_home(msg) {

    const id = msg._header.srcSystem

    const location = new L.LatLng(
        msg.latitude * (10 ** -7),
        msg.longitude * (10 ** -7)
    )

    if (home[id] == null) {
        home_init(id, location)
    }

    home[id].setLatLng(location)
}
 
// Nav target line
function update_nav_target(msg) {

    const id = msg._header.srcSystem

    if (vehicle[id] == null) {
        // Vehicle is not shown yet
        return
    }

    if (vehicle[id].nav_target == null) {
        vehicle[id].nav_target = {
            line: new L.polyline([], { color: "red", interactive: false }),
            timeoutID: null
        }
    }

    // Clear any existing timeout
    if (vehicle[id].nav_target.timeoutID != null) {
        clearTimeout(vehicle[id].nav_target.timeoutID)
    }

    function remove_nav_target(id) {

        if (vehicle[id].nav_target.timeoutID != null) {
            clearTimeout(vehicle[id].nav_target.timeoutID)
        }

        if (map.hasLayer(vehicle[id].nav_target.line)) {
            map.removeLayer(vehicle[id].nav_target.line)
        }
    }

    const distance = msg.wp_dist

    if (distance == 0) {
        remove_nav_target(id)
        return
    }

    // Get the current vehicle location and project the target
    let bearing = msg.target_bearing
    const vehicle_location = vehicle[id].marker.getLatLng()

    bearing = (bearing + 360.0) % 360.0

    const rad = Math.PI / 180.0
    const radInv = 180.0 / Math.PI
    const R = 6378137

    const lon1 = vehicle_location.lng * rad
    const lat1 = vehicle_location.lat * rad
    const rheading = bearing * rad

    const sinLat1 = Math.sin(lat1)
    const cosLat1 = Math.cos(lat1)
    const cosDistR = Math.cos(distance / R)
    const sinDistR = Math.sin(distance / R)

    let lat2 = Math.asin(
        sinLat1 * cosDistR +
        cosLat1 * sinDistR * Math.cos(rheading)
    )

    let lon2 = lon1 + Math.atan2(
        Math.sin(rheading) * sinDistR * cosLat1,
        cosDistR - sinLat1 * Math.sin(lat2)
    )

    lon2 = lon2 * radInv
    lon2 = lon2 > 180 ? lon2 - 360 : lon2 < -180 ? lon2 + 360 : lon2

    const target_location = new L.LatLng(lat2 * radInv, lon2)

    vehicle[id].nav_target.line.setLatLngs([
        vehicle_location,
        target_location
    ])

    if (!map.hasLayer(vehicle[id].nav_target.line)) {
        map.addLayer(vehicle[id].nav_target.line)
    }

    vehicle[id].nav_target.timeoutID =
        setTimeout(remove_nav_target, 2000, id)
}

// Position target line
function update_position_target(msg) {

    const id = msg._header.srcSystem

    if (vehicle[id] == null) {
        return
    }

    const type_mask = msg.type_mask
    const TYPEMASK_X_IGNORE = 1
    const TYPEMASK_Y_IGNORE = 2

    if ((type_mask & (TYPEMASK_X_IGNORE | TYPEMASK_Y_IGNORE)) != 0) {
        return
    }

    if (vehicle[id].pos_target == null) {
        vehicle[id].pos_target = {
            line: new L.polyline([], { color: "green", interactive: false }),
            timeoutID: null
        }
    }

    if (vehicle[id].pos_target.timeoutID != null) {
        clearTimeout(vehicle[id].pos_target.timeoutID)
    }

    function remove_pos_target(id) {

        if (vehicle[id].pos_target.timeoutID != null) {
            clearTimeout(vehicle[id].pos_target.timeoutID)
        }

        if (map.hasLayer(vehicle[id].pos_target.line)) {
            map.removeLayer(vehicle[id].pos_target.line)
        }
    }

    const vehicle_location = vehicle[id].marker.getLatLng()
    const target_location = new L.LatLng(
        msg.lat_int * (10 ** -7),
        msg.lon_int * (10 ** -7)
    )

    vehicle[id].pos_target.line.setLatLngs([
        vehicle_location,
        target_location
    ])

    if (!map.hasLayer(vehicle[id].pos_target.line)) {
        map.addLayer(vehicle[id].pos_target.line)
    }

    vehicle[id].pos_target.timeoutID =
        setTimeout(remove_pos_target, 2000, id)
}

const tip_div = document.createElement("div")
const tree_div = document.createElement("div")

 //IB Setup vehicle info widget from vehicles in map
function init_vehicle_info() {
    console.log('init_vehicle_info called')

    // Make sure Tippy is loaded
    if (!window.tippy) {
        // try again
        setTimeout(init_vehicle_info, 100)
        return
    }        

    tip_div.appendChild(document.importNode(document.getElementById('vehicle_info_tip_template').content, true))

    //Fill out vehicle info
    const enterBtn = tip_div.querySelector('input[id="enter_button"]') 
    const mavlinkInspectorDiv = tip_div.querySelector(`div[id="MAVLink_inspector"]`)
    init_mavlink_inpsector(mavlinkInspectorDiv)

    //IB add anchor to top right corner
    const anchor = document.createElement('div')
    anchor.style.position = 'fixed'
    anchor.style.top = '0'
    anchor.style.right = '0'
    anchor.style.width = '0'
    anchor.style.height = '0'
    document.body.appendChild(anchor)

    window.tip = tippy(anchor, {
        content: tip_div,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-end',
        maxWidth: "1000px",
        arrow: false,
        offset: [-15, 15],
        appendTo: () => document.body,
        onShow() {
            // Call immediately, but also on the next frame and after a 0ms delay
            resizePopup();
            requestAnimationFrame(() => resizePopup());
            setTimeout(resizePopup, 0);
        },
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

    // Observe map widget size changes and resize popup accordingly
    if (window.ResizeObserver) {
        try {
            window._widgetResizeObserver = new ResizeObserver(() => {
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(resizePopup);
                } else {
                    resizePopup();
                }
            });
            // div is the sandbox/global map container provided by the widget environment
            window._widgetResizeObserver.observe(div);
        } catch (e) {
            console.warn('ResizeObserver failed to observe div', e);
        }
    }

    // Close button
    tip_div.querySelector(`svg[id="Close"]`).onclick = () => {
        window.tip.hide()
        parent.selectPoppedUp = false;
    }

    // Vehicle colour change
    tip_div.querySelector(`input[id="vehicle_colour"]`).onchange = () => {
        const newColour = tip_div.querySelector(`input[id="vehicle_colour"]`).value
        parent.vehicleMap.get(clickedVehicle._vehicleID).colour = newColour
        change_colour(clickedVehicle.marker._icon, newColour)

        // dispatch event so other widgets can hear
        const evt = new CustomEvent('vehicleColourChanged', {
            detail: {
                vehicleID: clickedVehicle._vehicleID,
                colour: newColour
            }
        })
        // dispatch from the parent window (the widget host) so Sandbox.html can catch it
        parent.dispatchEvent(evt)
    }

    // Send written input to console
    enterBtn.onclick = () => {
        const writtenScript = tip_div.querySelector(`input[id="script_writer"]`).value
        console.log('written script', writtenScript)
        tip_div.querySelector(`input[id="script_writer"]`).value = null
    }
}

//IB fill vehicle info
function fill_vehicle_info() {
    tip_div.querySelector(`b[id="vehicle_name"]`).innerHTML = parent.vehicleMap.get(clickedVehicle._vehicleID).name
    tip_div.querySelector(`b[id="vehicle_ws"]`).innerHTML = parent.vehicleMap.get(clickedVehicle._vehicleID).target
    tip_div.querySelector(`input[id="vehicle_colour"]`).value = parent.vehicleMap.get(clickedVehicle._vehicleID).colour
    window.tip.setContent(tip_div)
}        

 //IB add updating vehicle info
function update_vehicle_info(msg) {
    tip_div.querySelector(`b[id="vehicle_loc"]`).innerHTML = `${msg.lat * 1e-7}, ${msg.lon * 1e-7}`
}

//IB setup mavlink inspector
let comp_id = {}
let ids = {}

function init_mavlink_inpsector(div) {
    console.log('init mavlink inspector called')

    // Build component ID lookup
    for (const [key, value] of Object.entries(mavlink20)) {
        if (key.startsWith("MAV_COMP_ID")) {
            comp_id[value] = key 
        }
    }

    // Use flex to allow the tree to take up the remaining space
    div.style.display = "flex"
    div.style.flexDirection = "column"

    // Add a div to hold the tree
    tree_div.style.flex = "1"

    // Allow scrolling if needed
    tree_div.style.overflow = "auto"
    div.appendChild(tree_div)
}

//IB Resize popup based on tree content
function resizePopup() {
    if (!window.tip || !window.tip.popper) {
        return;
    }
    
    const mapHeight = div?.offsetHeight || window.innerHeight * 0.6;
    const treeHeight = tree_div.scrollHeight;
    
    // Constrain tree_div maxHeight to map widget
    const maxHeight = Math.min(treeHeight, mapHeight);
    tree_div.style.maxHeight = maxHeight + 'px';
    tree_div.style.overflow = treeHeight > mapHeight ? 'auto' : 'visible';
    
    // ALSO constrain the tippy popper element itself
    if (window.tip.popper) {
        const popperEl = window.tip.popper;
        popperEl.style.maxHeight = (mapHeight - 15) + 'px'; // 15px padding at bottom
        popperEl.style.overflow = 'hidden';
    }
    
    window.tip.popperInstance?.update();
}

//IB part of mavlink inspector
function create_details(summary_text, indent = false, open = true) {
    console.log('created details')
    // Create new details item
    const details = document.createElement("details")

    // Add text
    const summary = document.createElement("summary")
    summary.appendChild(document.createTextNode(summary_text))
    details.appendChild(summary)

    if (indent) {
        details.style.marginLeft = "1em"
    }

    details.open = false

    // Listen for toggle events to resize popup
    details.addEventListener('toggle', () => {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(resizePopup);
        } else {
            resizePopup();
        }
    })

    return details
}

//IB Add a new item to a tree
function add_to_tree(tree, id, parent, item) {
    console.log('added to tree')
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

//IB update MAVLink Inspector
function update_mavlink_inspector(msg) {
    console.log('update mavlink inspector called')        
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
    // ensure popup resizes after inspector update
    if (window.requestAnimationFrame) {
        window.requestAnimationFrame(resizePopup);
    } else {
        resizePopup();
    }
}

// Runtime function
handle_msg = function (msg) {
    if (map == null) {
        return
    }

    if (msg._header.srcComponent != 1) {
        return
    }

    if (msg._id == 33) {
        update_pos(msg)
        //IB add updates vehicle info
        if (window.tip && window.tip.state.isVisible && clickedVehicle._vehicleID == msg._vehicleID) {
            update_vehicle_info(msg)
        }
    } else if (msg._id == 242) {
        update_home(msg)

    } else if (msg._id == 62) {
        update_nav_target(msg)

    } else if (msg._id == 87) {
        update_position_target(msg)
    }
    //IB add mavlink inspector
    if (window.tip && window.tip.state.isVisible && clickedVehicle._vehicleID == msg._vehicleID) {
        update_mavlink_inspector(msg)
    }
}

// Options changed
handle_options = function (new_options) {
    options = new_options
}