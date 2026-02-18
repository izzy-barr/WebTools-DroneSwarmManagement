// Base class for widget
// Adds form in tool tip

class WidgetBase extends HTMLElement {

    constructor(options, editable) {
        super()

        // Stash info used for widget palette
        this.about = null
        if ((options != null) && ("about" in options)) {
            this.about = options.about
        } else {
            this.about = { name: this.constructor.name }
        }

        let form_definition = {}
        let form_content = {}

        if ((options != null) && ("form" in options)) {
            form_definition = options.form
            if ("form_content" in options) {
                form_content = options.form_content
            }
        }

        this.style.display = "flex"
        this.edit_enabled = false

        // Bool to track changes, used to prompt user to save
        this.changed = false

        // Popup to show on double click when edit is enabled
        this.tippy_div = document.createElement("div")
        this.tippy_div.appendChild(document.importNode(document.getElementById('widget_tip_template').content, true))

        // Add name
        this.tippy_div.querySelector(`span[id="NameSpan"]`).innerHTML = this.about.name

        // Copy button
        this.tippy_div.querySelector(`svg[id="Copy"]`).onclick = () => {
            const copy = add_widget(this.gridstackNode.grid, get_widget_object(this))
            if (copy != null) {
                copy.init()
            }
        }

        // Remove button
        this.tippy_div.querySelector(`svg[id="Delete"]`).onclick = () => {
            const text = "This widget has not been downloaded!\n Click OK to delete anyway."
            if (this.changed && (confirm(text) != true)) {
                return
            }
            this.destroy()
            this.gridstackNode.grid.removeWidget(this)
        }

        // Close button
        this.tippy_div.querySelector(`svg[id="Close"]`).onclick = () => {
            this.edit_tip.hide()
        }

        // Edit button
        let edit_button = this.tippy_div.querySelector(`svg[id="Edit"]`)
        if (editable) {
            edit_button.onclick = () => {
                this.edit_tip.hide()
                load_editor(this)
            }
        } else {
            edit_button.style.display = "none"
        }

        // Save button
        let save_button = this.tippy_div.querySelector(`svg[id="Save"]`)
        if (editable) {
            save_button.onclick = () => {
                this.edit_tip.hide()
                save_widget(this)

                // Reset change tracking
                this.saved()
            }
        } else {
            save_button.style.display = "none"
        }

        // Add form
        const form_div = this.tippy_div.querySelector(`div[id="form"]`)
        form_definition = this.add_vehicleSelector(form_definition) //IB add vehicle selector to all widget form definitions

        Formio.createForm(form_div, form_definition).then((form) => {
            // Populate form object and add changed callback
            this.form = form
            
            // Load form
            this.form.setForm(form_definition).then(() => {

                // If there is no item in the form it can be hidden
                this.#check_form_hide()

                // Set data
                this.form.setSubmission( { data: form_content } ).then(() => {

                    // Trigger initial callback for first load
                    this.form_changed()

                    // Clear changed flag
                    this.changed = false

                    // Add change callback
                    this.last_content = JSON.stringify(this.form.submission.data)
                    this.form.on('change', (e) => {
                        if (e.changed == null) {
                            // No changes
                            return
                        }
                        if (!this.form.checkValidity(this.form.submission.data)) {
                            // Invalid value
                            return
                        }
                        const JSON_data = JSON.stringify(this.form.submission.data)
                        if (this.last_content == JSON_data) {
                            // No change from last submission
                            return
                        }
                        this.last_content = JSON_data
                        this.form_changed()
                    })
                })
            })
        })

        this.edit_tip = tippy(this, {
            content: this.tippy_div,
            interactive: true,
            trigger: 'manual',
            maxWidth: "500px",
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

        this.ondblclick = (e) => {

            this.updateVehicleSelect() //IB update vehicle selector according to options in vehicle

            if (this.edit_enabled) {
                this.edit_tip.show()
            }

            // Don't propagate events, this prevents triggering the a sub grid event
            e.stopPropagation()
        }

        //IB Listen for vehicle selected on map event to show vehicle info
       if (this.about.name == "Map") {
            window.addEventListener("vehicleSelectedOnMap", (e) => {
                const { id, x, y, msg } = e.detail

                this.setup_vehicle_info(x, y, msg)
            })
        }
    }

    //IB adding Vehicle Selector to schema
    add_vehicleSelector(schema) {
        console.log('add_vehicleSelector called')

        if (!schema || !schema.components) {
            console.log('No schema or components found, returning original schema')
            return schema
        }

        let currentEntries = this.get_mapEntries()

        // Try to find existing selector
        const existingComponent = schema.components.find(
            comp => comp.key === "vehicleID"
        )

        if (existingComponent) {
            console.log('Vehicle selector exists — updating values')

            existingComponent.data.values = currentEntries
            return schema
        }

        console.log('Vehicle selector does not exist — creating it')

        let allowMultiple = false;

        if (this.about.name == "Map") {
            allowMultiple = true;
        } else allowMultiple = false;

        schema.components.unshift({
            type: "select",
            label: "Select Vehicle",
            key: "vehicleID",
            input: true,
            tableView: true,
            multiple: allowMultiple,
            dataSrc: "values",
            data: {
                values: currentEntries
            }
        })

        return schema
    }

    //IB Get entries for select vehicle dropdown menu according to connected websockets
    get_mapEntries() {
        console.log('get_mapEntries called')
        if (!vehicleMap || vehicleMap.size === 0) {
            console.log('vehicleMap is empty')
            return []
        }

        console.log('not empty', vehicleMap)

        return [...vehicleMap.values()]
            .filter(vehicle => vehicle.connectBtn?.disabled == true) // Only include connected vehicles
            .map(vehicle => ({
                label: vehicle.name,
                value: vehicle.id
            }))
    }

     //IB update select Vehicle options in dropdown menu according to connected websockets
    updateVehicleSelect() {
        console.log('updateVehicleSelect called')
        if (!this.form) {
            return
        }

        const comp = this.form.getComponent("vehicleID")
        if (!comp) {
            return
        }

        const values = this.get_mapEntries()

        comp.component.data.values = values
        comp.redraw()
    }

    //IB Setup vehicle info widget from vehicles in map
    setup_vehicle_info(x, y, msg) {
        console.log('setup_vehicle_info called')

        const tip_div = document.createElement("div")
        tip_div.appendChild(document.importNode(document.getElementById('vehicle_info_tip_template').content, true))

        const tip = tippy(document.body, {
            content: tip_div,
            interactive: true,
            trigger: 'manual',
            maxWidth: "1000px",
            appendTo: () => document.body,
            getReferenceClientRect: () => ({
                width: 0,
                height: 0,
                top: y,
                bottom: y,
                left: x,
                right: x,
            }),
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

        tip_div.querySelector(`b[id="vehicle_name"]`).innerHTML = parent.vehicleMap.get(msg._vehicleID).name
        tip_div.querySelector(`b[id="vehicle_ws"]`).innerHTML = parent.vehicleMap.get(msg._vehicleID).target

        const div = tip_div.querySelector(`div[id="MAVLink_inspector"]`)
        this.setup_mavlink_inspector(msg, div)
        tip.show()

        // Close button
        tip_div.querySelector(`svg[id="Close"]`).onclick = () => {
            tip.hide()
                            }
    }

    //IB MAVLink Inspector setup
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

        handle_msg(msg)
    }

    // Enable or disable editing
    set_edit(b) {
        this.edit_enabled = b

        // Show "move" pointer to user on hover over
        this.style.cursor = b ? "move" : "auto"
    }

    get_about() {
        return this.about
    }
    
    // Get edit text type
    get_edit_language() { }

    // Get text value to be edited in the editor
    get_edit_text() {}

    // Set text that has been edited by the editor
    set_edited_text(text) {}

    // Don't want all buttons to work in the editor
    disable_buttons_for_edit() {
        this.tippy_div.querySelector(`svg[id="Delete"]`).style.display = "none"
        this.tippy_div.querySelector(`svg[id="Copy"]`).style.display = "none"
        this.tippy_div.querySelector(`svg[id="Save"]`).style.display = "none"
        this.tippy_div.querySelector(`svg[id="Edit"]`).style.display = "none"
    }

    // Clean up
    destroy() {
        this.edit_tip.destroy()
    }

    // Hide form with no content
    #check_form_hide() {
        const content = this.form.form

        let have_content = true
        if ((Object.values(content).length == 0) ||
            !("components" in content) ||
            (content.components.length == 0)) {
            have_content = false
        }

        this.tippy_div.querySelector(`div[id="form"]`).style.display = have_content ? "block" : "none"

    }


    // Update form definition
    set_form_definition(new_def) {
        if (JSON.stringify(this.form.form) != JSON.stringify(new_def)) {
            // Update change tracking
            this.changed = true
        }

        this.form.setForm(new_def)

        this.#check_form_hide()
    }

    // Get current form definition
    get_form_definition() {
        if (this.form == null) {
            return
        }

        return this.form.form
    }

    // Get options to save
    get_options() {
        return { form: this.get_form_definition(), form_content: this.get_form_content(), about: this.about }
    }

    // Form changed due to user input
    form_changed() {
        // Update change tracking
        this.changed = true
    }

    // Get the user submission to the form
    get_form_content() {
        if (this.form == null) {
            return {}
        }

        return this.form.submission.data
    }

    // Called after the widget has been added its parent main grid
    init() {}

    // Changed and saved functions used to warn user about leaving the page
    get_changed() {
        return this.changed
    }

    saved() {
        this.changed = false
    }

}
customElements.define('widget-base', WidgetBase)
