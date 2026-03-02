//IB Map widget
//Adds map

/*class WidgetMap extends WidgetBase {
    constructor(options) {

        if (options == null) {
            options = {}
        }

        options.form = {
            components: 
            [{
                label: "Trail length (m)",
                tooltip: "Length of the trail left by the vehicle in meters.",
                key: "trailLengthM",
                type: "number",
                input: true,
                tableView: false,
                defaultValue: 500,
                id: "emvxmp2",
                placeholder: "",
                prefix: "",
                customClass: "",
                suffix: "",
                multiple: false,
                protected: false,
                unique: false,
                persistent: true,
                hidden: false,
                clearOnHide: true,
                refreshOn: "",
                redrawOn: "",
                modalEdit: false,
                dataGridLabel: false,
                labelPosition: "top",
                description: "",
                errorLabel: "",
                hideLabel: false,
                tabindex: "",
                disabled: false,
                autofocus: false,
                dbIndex: false,
                customDefaultValue: "",
                calculateValue: "",
                calculateServer: false,
                widget: {
                    type: "input"
                },
                attributes: {},
                validateOn: "change",
                validate: {
                    required: false,
                    custom: "",
                    customPrivate: false,
                    strictDateValidation: false,
                    multiple: false,
                    unique: false,
                    min: "",
                    max: "",
                    step: "any",
                    integer: ""
                },
                conditional: {
                    show: null,
                    when: null,
                    eq: ""
                },
                overlay: {
                    style: "",
                    left: "",
                    top: "",
                    width: "",
                    height: ""
                },
                allowCalculateOverride: false,
                encrypted: false,
                showCharCount: false,
                showWordCount: false,
                properties: {},
                allowMultipleMasks: false,
                addons: []
                },
                {
                label: "Auto pan",
                tooltip: "Set to keep vehicle in view.",
                defaultValue: false,
                key: "autoPan",
                type: "checkbox",
                input: true,
                tableView: false,
                id: "efdr3md",
                placeholder: "",
                prefix: "",
                customClass: "",
                suffix: "",
                multiple: false,
                protected: false,
                unique: false,
                persistent: true,
                hidden: false,
                clearOnHide: true,
                refreshOn: "",
                redrawOn: "",
                modalEdit: false,
                dataGridLabel: true,
                labelPosition: "right",
                description: "",
                errorLabel: "",
                hideLabel: false,
                tabindex: "",
                disabled: false,
                autofocus: false,
                dbIndex: false,
                customDefaultValue: "",
                calculateValue: "",
                calculateServer: false,
                widget: null,
                attributes: {},
                validateOn: "change",
                validate: {
                    required: false,
                    custom: "",
                    customPrivate: false,
                    strictDateValidation: false,
                    multiple: false,
                    unique: false
                },
                conditional: {
                    show: null,
                    when: null,
                    eq: ""
                },
                overlay: {
                    style: "",
                    left: "",
                    top: "",
                    width: "",
                    height: ""
                },
                allowCalculateOverride: false,
                encrypted: false,
                showCharCount: false,
                showWordCount: false,
                properties: {},
                allowMultipleMasks: false,
                addons: [],
                inputType: "checkbox",
                value: "",
                name: ""
            }]
        }

        // Add info used in palette tool tip
        options.about = {
            name: "Map",
            info: "Map example built using the Sandbox widget. Show the vehicle location in real time."
        }

        super(options, true)

        this.classList.add("grid-stack-item")
        this.classList.add("grid-stack-draggable-item")
        this.classList.add("grid-stack-sub-grid")

        this.widget_div = document.createElement("div")
        this.widget_div.style.border = "5px solid"
        this.widget_div.style.borderRadius = "10px"
        this.widget_div.style.borderColor = "#c8c8c8"
        this.widget_div.style.padding = "5px"
        this.widget_div.style.flex = 1
        this.widget_div.style.overflow = "hidden"

        this.widget_div.classList.add("grid-stack-item-content")
        this.appendChild(this.widget_div)

        this.size_div = document.createElement("div")
        this.size_div.style.position = "absolute"
        this.size_div.style.top = 0
        this.size_div.style.left = 0
        this.size_div.style.bottom = 0
        this.size_div.style.right = 0
        this.widget_div.appendChild(this.size_div)

        this.map = null
        this.vehicle = {}
        this.home = {}
        this.mavlinkChannel = new BroadcastChannel("MAVLinkMSG")
        this.options = options
        this.selected = {}

        this.mavlinkChannel.onmessage = (e) => {
            if (e?.data?.MAVLink) {
                const msg = e.data.MAVLink;
                this.handle_MAVLink(msg);
            }
        }

        // Listen to vehicle being clicked
        window.addEventListener("vehicleSelectedOnMap", (e) => {
            const { msg } = e.detail
            this.setup_vehicle_info(msg)
        })

        

    }

    init() {

        // Make sure Leaflet is loaded
        if (window.L == undefined) {
            // try again in while
            setTimeout(() => this.init(), 100)
            return
        }

        this.map = L.map(this.widget_div)

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map)

        // Default to 0,0 and sensible zoom level for when vehicle is found
        this.map.setView([0.0, 0.0], 14)

        // Add scale bar
        L.control.scale().addTo(this.map)

    }

    // Add new vehicle to map
    vehicle_init(id, location) {

        const vehicle_icon = L.divIcon({
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.2 495.9c-5.7 10-16.3 16.1-27.8 16.1l-56.2 0c-10.6 0-18.3-10.2-15.4-20.4l49-171.6L112 320 68.8 377.6c-3 4-7.8 6.4-12.8 6.4l-42 0c-7.8 0-14-6.3-14-14c0-1.3 .2-2.6 .5-3.9L32 256 .5 145.9c-.4-1.3-.5-2.6-.5-3.9c0-7.8 6.3-14 14-14l42 0c5 0 9.8 2.4 12.8 6.4L112 192l102.9 0-49-171.6C162.9 10.2 170.6 0 181.2 0l56.2 0c11.5 0 22.1 6.2 27.8 16.1L365.7 192l116.6 0z"/></svg>`,
            className: "",
            iconSize: [50, 44],
        })

        // Add icon to map
        const marker = new L.marker(location, {
            icon: vehicle_icon,
            rotationOrigin: "center",
            zIndexOffset: 10,
            interactive: true
        }).addTo(this.map)

        marker.on("click", (e, msg) => {
            console.log("marker clicked for vehicle:", id)

            const message = this.vehicle[id].last_msg

            window.dispatchEvent(
                new CustomEvent("vehicleSelectedOnMap", {
                    detail: {
                        msg: message
                    }
                })
            )
            console.log("event dispatched")
        })

        const trail = new L.polyline([location], {
            color: "yellow",
            interactive: false
        }).addTo(this.map)

        this.vehicle[id] = { marker, trail }

        this.map.panTo(location)
    }

    // Update vehicle position
    update_pos(msg) {

        const id = msg._header.srcSystem
        const location = new L.LatLng(msg.lat * 1e-7, msg.lon * 1e-7)
        const heading = msg.hdg * 0.01

        if (this.vehicle[id] == null) {
            this.vehicle_init(id, location)
        }

        this.vehicle[id].last_msg = msg

        if ("setRotationAngle" in this.vehicle[id].marker) {
            this.vehicle[id].marker.setRotationAngle(heading - 90.0)
        }

        this.vehicle[id].marker.setLatLng(location)

        if (this.options.autoPan === true) {
            this.map.panInside(location, { padding: [50, 50] })
        }

        const trail = this.vehicle[id].trail.getLatLngs()
        trail.unshift(location)

        let length = 0
        for (let i = 1; i < trail.length; i++) {
            length += trail[i - 1].distanceTo(trail[i])
            if (length > this.options.trailLengthM) {
                trail.splice(i)
                break
            }
        }

        this.vehicle[id].trail.setLatLngs(trail)

        if (this.vehicle[id].nav_target?.line?.getLatLngs().length === 2) {
            const nav = this.vehicle[id].nav_target.line.getLatLngs()
            nav[0] = location
            this.vehicle[id].nav_target.line.setLatLngs(nav)
        }

        if (this.vehicle[id].pos_target?.line?.getLatLngs().length === 2) {
            const pos = this.vehicle[id].pos_target.line.getLatLngs()
            pos[0] = location
            this.vehicle[id].pos_target.line.setLatLngs(pos)
        }
    }

    home_init(id, location) {

        const home_icon = L.divIcon({
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 22.1-17.9 40-40 40l-16 0-24 0c-22.1 0-40-17.9-40-40l0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64c0 22.1-17.9 40-40 40l-24 0-16 0c-22.1 0-40-17.9-40-40l0-112-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>`,
            className: "",
            iconSize: [40, 36],
        })

        this.home[id] = new L.marker(location, {
            icon: home_icon,
            interactive: false
        }).addTo(this.map)
    }

    update_home(msg) {
        const id = msg._header.srcSystem
        const location = new L.LatLng(msg.latitude * 1e-7, msg.longitude * 1e-7)

        if (this.home[id] == null) {
            this.home_init(id, location)
        }

        this.home[id].setLatLng(location)
    }

    handle_msg(msg) {

        if (this.map == null) return
        if (msg._header.srcComponent != 1) return

        if (msg._id == 33) {
            this.update_pos(msg)
        } else if (msg._id == 242) {
            this.update_home(msg)
        }
    }

    handle_user_options() {
       
        super.form_changed()

        this.options = super.get_form_content()

        console.log("Map options changed:", this.options)

    }

    handle_MAVLink(msg) {
        this.handle_user_options()

        console.log('options', this.options)
        console.log('form', this.options.form)
        console.log('componenets', this.form.components)
        console.log('select', this.options.vehicleID)
        console.log('trailler', this.options.trailLengthM)
        //IB added if logic to filter messages
        
        this.selected = this.options.form.components[0].vehicleID
        //this.selected = this.options.vehicleID

        console.log('selected', this.selected)
        
        if (this.selected == undefined) return
        if (this.selected.size !== 36) {
            if (this.selected.includes(msg._vehicleID)) {
                this.handle_msg(msg)
            }
        } else {
            if (msg._vehicleID === this.selected) {
                this.handle_msg(msg)
            }
        }
        
    }

    // Setup vehicle info widget from vehicles in map
    setup_vehicle_info(msg) {
        console.log('setup_vehicle_info called')

        const tip_div = document.createElement("div")
        tip_div.appendChild(document.importNode(document.getElementById('vehicle_info_tip_template').content, true))

        //Fill out vehicle info
        tip_div.querySelector(`b[id="vehicle_name"]`).innerHTML = window.vehicleMap.get(msg._vehicleID).name
        tip_div.querySelector(`b[id="vehicle_ws"]`).innerHTML = window.vehicleMap.get(msg._vehicleID).target
        tip_div.querySelector(`b[id="vehicle_loc"]`).innerHTML = `${msg.lat * 1e-7}, ${msg.lon * 1e-7}`
        const vehicle_colour = tip_div.querySelector(`input[id="vehicle_colour"]`)
        vehicle_colour.value = window.vehicleMap.get(msg._vehicleID).colour   
        const enterBtn = tip_div.querySelector('input[id="enter_button"]') 
        const div = tip_div.querySelector(`div[id="MAVLink_inspector"]`)
        this.setup_mavlink_inspector(msg, div)

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
            window.vehicleMap.get(msg._vehicleID).colour = vehicle_colour.value
        }

        // Send written input to console
        enterBtn.onclick = () => {
            const writtenScript = tip_div.querySelector(`input[id="script_writer"]`).value
            console.log('written script', writtenScript)
            tip_div.querySelector(`input[id="script_writer"]`).value = null
        }

    }
    
    // MAVLink Inspector setup (mostly moved from MAVLink_Inspector.json)
    setup_mavlink_inspector(msg, div) {
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

        handle_msg(msg) //IB add to complement change of function definition
    }

}

customElements.define('widget-map', WidgetMap) */