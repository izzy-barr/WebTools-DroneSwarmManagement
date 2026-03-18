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
        
        //IB add vehicle selector to widgets listed in vehicleSelectorWidgets
        let vehicleSelectorWidgets = ["Attitude gauge", "Graph", "Map", "MAVLink inspector", "MAVLink messages", "Stats", "Value"]
        if (vehicleSelectorWidgets.includes(this.about.name)) {
            form_definition = this.add_vehicleSelector(form_definition) 
        }

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

        //IB Listen for primary vehicle to be selected
        parent.addEventListener('primarySelectVehicle', e => {
            const primaryVehicleID = e.detail.vehicleID
            this.primaryVehicleSelector(primaryVehicleID)
        })

        //IB add to listen for vehicle Disconnect
        parent.addEventListener('vehicleDisconnect', e => {
            const vehicleID = e.detail.vehicleID
            this.updateVehicleSelect(vehicleID)
            console.log('vehicle Disconnect heard!!!', vehicleID)
            
        })

    }

    //IB adding Vehicle Selector to schema
    add_vehicleSelector(schema) {

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

            existingComponent.data.values = currentEntries
            return schema
        }

        let allowMultiple = false;

        if (this.about.name == "Map" || this.about.name == "Graph") {
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
            },
        })

        return schema
    }

    //IB Get entries for select vehicle dropdown menu according to connected websockets
    get_mapEntries() {
        if (!vehicleMap || vehicleMap.size === 0) return []

        const connectedVehicles = [...vehicleMap.values()]
            .filter(vehicle => vehicle.ws && vehicle.ws.readyState === WebSocket.OPEN) // Only include connected vehicles
            .map(vehicle => ({
                label: vehicle.name,
                value: vehicle.id
            }))
        return connectedVehicles
    }

    //IB set default option to primary vehicle selected
    primaryVehicleSelector(id) {
         console.log('evt dispatch select veh')

        if (!this.form) return

        const comp = this.form.getComponent("vehicleID")
        if (!comp) return

        comp.setValue(id)

        this.form.triggerChange()
        
    }

     //IB update select Vehicle options in dropdown menu according to connected websockets
    updateVehicleSelect(id) {
        console.log('updateVehicleSelect called')

        if (!this.form) return

        const compVehID = this.form.getComponent("vehicleID")
        if (!compVehID) return

        const values = this.get_mapEntries()
        const validValues = values.map(v => v.value)

        // update dropdown options
        compVehID.component.data.values = values
        compVehID.redraw()

        // array-ify current selected values
        let compVehIDValues = compVehID.getValue()
        if (Array.isArray(compVehIDValues) == false) {
            compVehIDValues = [compVehIDValues]
        }

        // exit if removed vehicle was not previously selected
        if (compVehIDValues.includes(id) == false) return

        // remove vehicle from options if it was previously selected
        if (compVehIDValues.length > 1) {
            console.log('about', this.about.name, compVehIDValues)
            const newValue = compVehIDValues.filter(val => validValues.includes(val))
            console.log('new vale', newValue)
            compVehID.setValue(newValue)
        } else compVehID.setValue("")

        this.form.triggerChange()

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
