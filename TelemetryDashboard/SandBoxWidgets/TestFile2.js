// Build component ID lookup
let comp_id = {}
for (const [key, value] of Object.entries(mavlink20)) {
    if (key.startsWith("MAV_COMP_ID")) {
        comp_id[value] = key
    }
}
// Add a heading
const heading = document.createElement("h3")
heading.appendChild(document.createTextNode("MAVLink Inspector"))
heading.style.margin = 0
div.appendChild(heading)

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

let selected = null //IB add

// Create a new details elememnt with summary
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

// Runtime function
handle_msg = function (msg) {
    
    const id = msg._vehicleID
    const sys_id = msg._header.srcSystem //IB change sys_id and id
    const comp = msg._header.srcComponent
    const msg_id = msg._id
    selected = msg._vehicleID //IB add
    
    // Add new ID to tree if not already there
    if (!(id in ids)) {
        add_to_tree(ids, id, tree_div, create_details("System ID: " + sys_id))
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


//IB vehicle disconnect
parent.addEventListener('vehicleDisconnect', e => {
    const vehicleID = e.detail.vehicleID
    console.log('vehicle Disconnect heard from mavlink inspector', vehicleID)
    if (vehicleID == selected) {
        tree_div.innerHTML = ""
    } 
})