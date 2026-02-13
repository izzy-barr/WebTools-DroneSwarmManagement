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

        //IB Select Vehicle Dropdown Menu and Select Vehicle
        this.selector = this.tippy_div.querySelector('select[id="vehicleSelector"]')
        this.selectVehicle = null;

        //IB Change selectedVehicle on change of dropdown menu
        this.selector.addEventListener('change', () => {
            console.log('Indiv change')
            this.set_selectVehicle();
        })

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

            //IB If there are options to choose from, set selected option
            if (this.selector.innerHTML !== "") {
                this.set_selectVehicle()
            }

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

            //IB update vehicle selector according to options in vehicleMap
            this.updateVehicleSelect()

            if (this.edit_enabled) {
            
                //IB Create options for select vehicle dropdown menu according to connected websockets
                this.selector.innerHTML="";            
                vehicleMap.forEach(element => this.selector.appendChild(new Option(element.name, element.id)));

                if (this.selectVehicle !== null) {
                    this.get_selectVehicle();
                }

                this.edit_tip.show()
            }

            // Don't propagate events, this prevents triggering the a sub grid event
            e.stopPropagation()
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

        console.log('vehicleMap:', vehicleMap, currentEntries)

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

        schema.components.unshift({
            type: "select",
            label: "Select Vehicle",
            key: "vehicleID",
            input: true,
            tableView: true,
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

        return [...vehicleMap.values()].map(vehicle => ({
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

    // Enable or disable editing
    set_edit(b) {
        this.edit_enabled = b

        // Show "move" pointer to user on hover over
        this.style.cursor = b ? "move" : "auto"
    }

    get_about() {
        return this.about
    }

    //IB Set selectedVehicle according to chosen option in dropdown menu
    set_selectVehicle() {
        let selectedVehicleID = this.selector.value;
        this.selectVehicle = vehicleMap.get(selectedVehicleID);
        console.log('Indiv selected vehicle: ' + this.selectVehicle.id)
    }

    //IB Get selectedVehicle and set it to chosen option
    get_selectVehicle () {
        let selectedVehicleID = this.selectVehicle.id;
        this.selector.value = selectedVehicleID;
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
