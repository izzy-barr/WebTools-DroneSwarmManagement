// Setup connect button in menu widget, this handles WebSocket and incoming MAVLink
function setup_connect(button_svg, button_color) {

    console.log('MultiVeh loaded', window.createVehicle)

    const tip_div = document.createElement("div")
    tip_div.appendChild(document.importNode(document.getElementById('connection_tip_template').content, true))
    const tip = tippy(button_svg, {
        content: tip_div,
        interactive: true,
        trigger: 'manual',
        maxWidth: "1000px",
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
    button_svg.onclick = () => { tip.show() }


    // Fix html examples, add stats example to pallet.


    // Connection tool tip
    tippy(tip_div.querySelector('img[id="TT"]'), {
        appendTo: () => document.body,
        theme: 'light-border', // differentiate from the interactive tip were in already
    })

    // Close button
    tip_div.querySelector(`svg[id="Close"]`).onclick = () => {
        tip.hide()
    }


    //IB Define Buttons 
    let activeVehicle = null;
    const add_button = tip_div.querySelector('input[id="add_button"]')
    const connect_button = tip_div.querySelector(`input[id="connection_button"]`)
    const disconnect_button = tip_div.querySelector(`input[id="disconnection_button"]`)
    const form = tip_div.querySelector('div[id="form"]')

    // Websocket object
    let expecting_close = false
    let been_connected = false

    //IB Create new websocket input
    function addURL(idNum) {
        const ipURL = document.createElement('input');
        ipURL.id = 'url' + idNum;
        ipURL.type = 'url';
        ipURL.placeholder = 'ws://127.0.0.1:56781';
        ipURL.required = 'true';
        ipURL.pattern = '^(ws|wss)://.*';
        return ipURL;
    }

    //IB Create new name input
    function addName(idNum) {
        const ipName = document.createElement('input');
        ipName.id = 'name' + idNum;
        ipName.placeholder = 'Unique Vehicle Name';
        ipName.required = 'true';
        return ipName;
    }

    function addRemove(idNum) {
        const remove = document.createElement('input');
        remove.id = 'remove' + idNum;
        remove.type = 'button';
        remove.value = '-';
        return remove;
    }

    //IB Add inputs on button click
    add_button.onclick = () => {
        console.log('Add button clicked')

        const id = crypto.randomUUID();
        const newRemove = addRemove(id);
        const row = document.createElement('div');
        row.className = 'vehicleRow';

        row.appendChild(addURL(id));
        row.appendChild(addName(id));
        row.appendChild(newRemove);
        form.appendChild(row);



        const vehicle = new mavVehicle(row, id);

        window.createVehicle(vehicle, id);

        newRemove.onclick = () => {
            console.log('remove button clicked')

            const vehicle = vehicleMap.get(id);

            if (!vehicle) {
                console.log('No vehicle of that id')
                return;
            }

            if (vehicle.webSocketURL.disabled === true) {
                disconnect(vehicle)
            }

            vehicle.remove_ws();
            vehicleMap.delete(id);

        }

        activeVehicle = vehicle;

        set_inputs(false)
    }
    

    function set_inputs(connected) {
        // Disable connect button and url input, enable disconnect button
        connect_button.disabled = connected
        disconnect_button.disabled = !connected
        if (activeVehicle === null) {
            return
        } else {
            activeVehicle.webSocketURL.disabled = connected //IB part change
            activeVehicle.userVehicleName.disabled = connected //IB
            activeVehicle.removeBtn.disabled = connected //IB
        }
    }

    set_inputs(false)

    // Connect to WebSocket server
    function connect(vehicle, auto_connect) { 
        console.log('connect function called')
        
        // Make sure we are not connected to something else
        disconnect(vehicle)

        //IB Sets websocket to value inputted
        vehicle.set_ws();
        vehicle.set_name();

        // Can't connect twice
        set_inputs(true)

        // Set orange for connecting
        button_color("orange")

        // True if we have ever been connected
        been_connected = false
        expecting_close = false

        //IB addEventListeners for Open and Close of websockets, nb no 'error' or 'message' here since it is independent of TelemetryDashboard.js
        vehicle.ws.addEventListener('open', () => {
            console.log('we have open!')

            button_color("green")
            
            // Hide tip
            tip.hide()

            // Allow disconnect
            disconnect_button.disabled = false

            // Set input to current value
            vehicle.webSocketURL.value = vehicle.target

            // Have been connected
            been_connected = true
        })

        vehicle.ws.addEventListener('close', () => {
            console.log('we have close!')

            if ((auto_connect === true) && !been_connected) {
                // Don't show a failed connection if this is a auto connection attempt which failed
                button_color("black")

            } else if (!expecting_close) {
                // Don't show red if the user manually disconnected
                button_color("red")
            }

            // Enable connect buttons
            set_inputs(false)

        })

    }

    // Disconnect from WebSocket server
    function disconnect(vehicle) {
        console.log('disconnect function called')
        // Close socket
        if (activeVehicle.ws != null) {
            expecting_close = true
            activeVehicle.ws.close()
        }

        // Return button to black
        button_color("black")        

        // Enable connect buttons
        set_inputs(false)

    }


    connect_button.onclick = () => {
        console.log('Connect button clicked')

        //IB Check for activeVehicle
        if (!activeVehicle) {
            console.error('No active vehicle');
            return
        }
        
        const in_progress = (activeVehicle.ws != null) && ((activeVehicle.ws.readyState == WebSocket.CONNECTING) || (activeVehicle.ws.readyState == WebSocket.CLOSING))
        if (in_progress) {
            // Don't do anything if the socket is connecting or closing a connection
            return
        }

        if (!activeVehicle.webSocketURL.checkValidity()) {
            // Invalid address, re-fire the tip and focus the url
            tip.show()
            activeVehicle.webSocketURL.focus()
            return
        }

        connect(activeVehicle)

    }

    disconnect_button.onclick = () => {

        if ((activeVehicle.ws != null) && (activeVehicle.ws.readyState == WebSocket.CLOSING)) {
            // Don't do anything if the socket is already or closing a connection
            return
        }

        disconnect(activeVehicle)
    }

    // Try auto connecting to MissionPlanner
    // connect("ws://127.0.0.1:56781", true) IB commented outs

}

//IB Setup manager button in menu widget, this handles multiple vehicle management and selection
function setup_manager(button_svg) {
    console.log('setup_manager called')

    const tip_div = document.createElement("div")
    tip_div.appendChild(document.importNode(document.getElementById('multivehicle_tip_template').content, true))
    const selector = tip_div.querySelector('select[id="vehicleSelector"]')

    const tip = tippy(button_svg, {
        content: tip_div,
        interactive: true,
        trigger: 'manual',
        maxWidth: "1000px",
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

    // Set selected vehicle
    function set_selectVehicle() {
        let selectedVehicleID = selector.value;
        window.selectVehicle = vehicleMap.get(selectedVehicleID);
        console.log('selected vehicle: ' + window.selectVehicle)
    }

    function get_selectVehicle () {
        let selectedVehicleID = window.selectVehicle.id;
        selector.value = selectedVehicleID;
    }

    // On click, update list of vehicles to be selected according to connected websockets
    button_svg.onclick = () => { 
        selector.innerHTML="";            
        vehicleMap.forEach(element => selector.appendChild(new Option(element.name, element.id)));

        if (window.selectVehicle !== null) {
            get_selectVehicle();
        }

        tip.show()
    }

    selector.addEventListener('change', () => {
        console.log('change')
        set_selectVehicle();
    })

    // Close button
    tip_div.querySelector(`svg[id="Close"]`).onclick = () => {

        // If there are options to choose from, set selected option
        if (selector.innerHTML !== "") {
            set_selectVehicle()
        }

        tip.hide()
    }

    // Connection tool tip
    tippy(tip_div.querySelector('img[id="TT"]'), {
        appendTo: () => document.body,
        theme: 'light-border', // differentiate from the interactive tip were in already
    })

}

// Get the details of the passed in widget for copy or save
function get_widget_object(widget) {
    return {
        x: widget.getAttribute("gs-x"),
        y: widget.getAttribute("gs-y"),
        w: widget.getAttribute("gs-w"),
        h: widget.getAttribute("gs-h"),
        type: widget.constructor.name,
        options: widget.get_options()
    }
}

// Get array of widgets from the target grid for saving
function get_widgets(target_grid) {
    const save_widgets = {}

    const widgets = target_grid.getGridItems()
    for (let i = 0; i<widgets.length; i++) {
        save_widgets[i] = get_widget_object(widgets[i])
    }

    return save_widgets
}

// Get the current layout as a object
function get_layout() {

    return {
        header: {
            version: 1.0,
        },
        grid: {
            columns: grid.opts.column,
            rows: grid.opts.maxRow,
            color: document.getElementById("dashboard").style.backgroundColor
        },
        widgets: get_widgets(grid)
    }

}

// Save the layout to a json file
function save_layout() {

    var blob = new Blob([JSON.stringify(get_layout(), null, 2)], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "TelemetryDashboard.json")

    // Mark grid and widgets as saved
    grid_changed = false

    // Each widget on grid
    for (const widget of grid.getGridItems()) {
        widget.saved()
    }

}

// Save single widget to json file
function save_widget(widget) {

    let grid_layout = {
        header: {
            version: 1.0,
        },
        widget: get_widget_object(widget)
    }

    var blob = new Blob([JSON.stringify(grid_layout, null, 2)], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "TelemetryDashboard_Widget.json")
}

// Clear all widgets and destroy grid
function clear_grid(target_grid) {

    if (target_grid == null) {
        return
    }

    // Call the destroy method on each widget in the sub grid removed
    for (const widget of target_grid.getGridItems()) {
        widget.destroy()
        target_grid.removeWidget(widget)
    }

    // Make sure there is nothing left
    target_grid.removeAll()

    target_grid.destroy(false)
}

// Initialize gird with a given number of rows and columns
function init_grid(columns, rows) {

    clear_grid(grid)

    grid = GridStack.init({
        float: true,
        disableDrag: true,
        disableResize: true,
        column: columns,
        row: rows,
        cellHeight: (100 / rows) + "%",
        disableOneColumnMode: true,
        alwaysShowResizeHandle: true,
        acceptWidgets: true
    })

    // Set the input values to match the current grid
    const grid_settings = document.getElementById("settings_tip_div")
    if (grid_settings != null) {
        const colum_input = grid_settings.querySelector(`input[id="num_columns"]`)
        const row_input = grid_settings.querySelector(`input[id="num_rows"]`)

        colum_input.value = columns
        row_input.value = rows
    }

    // Bind dropped callback
    grid.on('dropped', widget_dropped)

    // Bind changed callback
    grid.on('change added removed', () => { 
        grid_changed = true
    })
}

function load_default_grid() {

    // Read in file and load
    fetch("Default_Layout_Multi.json").then((res) => {
        return res.json()
    }).then((obj) => {
        load_layout(obj.grid, obj.widgets)
    })

}

function new_widget(type, options) {

    switch (type) {
        case "WidgetMenu":
            return new WidgetMenu(options)

        case "WidgetSandBox":
            return new WidgetSandBox(options)

        case "WidgetSubGrid":
            return new WidgetSubGrid(options)

        case "WidgetCustomHTML":
            return new WidgetCustomHTML(options)
    }

    throw new Error("Unknown widget type: " + type)
}

function grid_edit_enabled(target_grid) {
    if (target_grid == null) {
        return false
    }
    return !((target_grid.opts.disableDrag === true) && (target_grid.opts.disableResize === true))
}

function grid_set_edit(target_grid, b) {
    if (target_grid == null) {
        return false
    }

    // Set the grid itself
    if (b) {
        target_grid.enable()
    } else {
        target_grid.disable()
    }

    // Set the widgets on the grid
    for (const widget of target_grid.getGridItems()) {
        widget.set_edit(b)
    }
}

// Add a widget checking if it will fit
function add_widget(target_grid, obj) {

    const pos_opts =  {
        x: (obj.x == null) ? null : parseInt(obj.x),
        y: (obj.y == null) ? null : parseInt(obj.y),
        w: (obj.w == null) ? null : parseInt(obj.w),
        h: (obj.h == null) ? null : parseInt(obj.h),
        autoPosition: false
    }

    // See if there is in the closest position
    if (!target_grid.willItFit(pos_opts)) {
        // See if it would fit with auto-position
        pos_opts.autoPosition = true
        if (!target_grid.willItFit(pos_opts)) {
            alert("Widget won't fit on Grid")
            return
        }
    }

    let widget = new_widget(obj.type, obj.options)

    target_grid.addWidget(widget, pos_opts)

    widget.set_edit(grid_edit_enabled(target_grid))

    return widget
}

// Load widget object to target grid
function load_widgets(target_grid, widgets) {

    target_grid.batchUpdate(true)

    for (const widget of Object.values(widgets)) {
        add_widget(target_grid, widget)
    }

    target_grid.batchUpdate(false)

    // Call init on each widget after grid has updated
    for (const widget of target_grid.getGridItems()) {
        widget.init()
    }
}

function load_layout(grid_layout, widgets) {

    // Stash edit state
    const edit_enabled = grid_edit_enabled(grid)

    try {
        // Set background color
        const dashboard_div = document.getElementById("dashboard")
        dashboard_div.style.backgroundColor = grid_layout.color

        // Reload grid
        init_grid(parseInt(grid_layout.columns), parseInt(grid_layout.rows))

        load_widgets(grid, widgets)

    } catch (error) {
        load_default_grid()

        alert('Grid load failed\n' + error.message)
    }

    // Restore edit state
    grid_set_edit(grid, edit_enabled)

    // Clear changed flag after load
    grid_changed = false

}

async function load_file(e) {

    const file = e.files[0]
    if (file == null) {
        return
    }

    let reader = new FileReader()
    reader.onload = function (e) {
        const obj = JSON.parse(reader.result)
        if ("widgets" in obj) {
            load_layout(obj.grid, obj.widgets)

        } else if ("widget" in obj) {
            const widget = add_widget(grid, obj.widget)
            if (widget != null) {
                widget.init()
            }

        } else {
            alert("Unable to load from: " + file)
        }

    }
    reader.readAsText(file)

    // Clear file input so the same file can be loaded a second time
    e.value = null
}

// Pallet for user to add widgets
function init_pallet() {

    const dashboard = document.getElementById("dashboard")

    const tip_div = document.createElement("div")
    tip_div.style.width = "600px"
    tip_div.style.height = "400px"
    tip_div.style.padding = "10px"
    tip_div.style.borderRadius = "10px"

    const grid_div = document.createElement("div")
    grid_div.classList.add("grid-stack-item-content")
    grid_div.style.overflow = "auto"
    tip_div.appendChild(grid_div)

    // Pallet grid object
    let palette

    // True is the tip is currently being shown
    let tip_shown = false

    // Add grid at run time
    function tippy_mount(instance) {

        const columns = 6
        const rows = 5

        palette = GridStack.init({
            float: true,
            disableOneColumnMode: true,
            column: columns,
            row: rows,
            cellHeight: (100 / rows) + "%",
            disableResize: true,
        }, grid_div)

        palette.batchUpdate(true)

        // Add pure JS widgets
        add_widget(palette, { type: "WidgetSubGrid", x: 0, y: 0, w: 1, h: 1 })
        add_widget(palette, { type: "WidgetSandBox", x: 0, y: 1, w: 1, h: 1 })
        add_widget(palette, { type: "WidgetCustomHTML", x: 1, y: 5, w: 1, h: 1 })

        // Load in json definitions
        const sandbox_files = [
            { path: "SandBoxWidgets/Attitude.json", pos: { x: 1, y: 0, w: 2, h: 2 } },
            { path: "SandBoxWidgets/Graph.json",    pos: { x: 3, y: 0, w: 3, h: 2 } },
            { path: "SandBoxWidgets/Map.json", pos: { x: 0, y: 2, w: 2, h: 2 } },
            { path: "SandBoxWidgets/MAVLink_Inspector.json", pos: { x: 2, y: 2, w: 2, h: 2 } },
            { path: "SandBoxWidgets/Messages.json", pos: { x: 4, y: 2, w: 2, h: 2 } },
            { path: "SandBoxWidgets/Value.json", pos: { x: 0, y: 4, w: 1, h: 1 } },
            { path: "SandBoxWidgets/Stats.json", pos: { x: 3, y: 5, w: 1, h: 1 } },
        ]

        let import_done = []

        // Add widget for each file
        for (const file of sandbox_files) {
            import_done.push(
                new Promise((resolve, reject) => {
                    fetch(file.path).then((res) => {
                        return res.json()
                    }).then((obj) => {
                        Object.assign(obj.widget, file.pos)
                        add_widget(palette, obj.widget)
                        resolve()
                    })
                })
            )
        }

        // Wait for all files to load
        Promise.allSettled(import_done).then(() => {
            palette.batchUpdate(false)

            // Call init on each widget after grid has updated
            for (const widget of palette.getGridItems()) {
                widget.init()
            }

            // Add tip to each widget to give more information
            for (const widget of palette.getGridItems()) {
                const about = widget.get_about()

                const widget_tip_div = document.createElement("div")

                const heading = document.createElement("h6")
                heading.innerText = about.name
                widget_tip_div.appendChild(heading)

                if ("info" in about) {
                    widget_tip_div.appendChild(document.createTextNode(about.info))
                }

                const tip = tippy(widget, {
                    content: widget_tip_div,
                    appendTo: () => document.body,
                    theme: 'light-border', // differentiate from the interactive tip were in already
                })

            }
        })

        palette.on('removed', () => {
            // Hide tip once item has been removed
            // when the user re-triggers grid is re-generated replacing the removed item
            instance.hide()
            tip_shown = false
        })
    }

    // Clear grid on tip hide
    function tippy_hidden(instance) {
        clear_grid(palette)
        palette = null
    }

    const tip = tippy(dashboard, {
        content: tip_div,
        interactive: true,
        trigger: 'manual',
        maxWidth: "1000px",
        followCursor: "initial",
        appendTo: () => document.body,
        onMount: tippy_mount,
        onHidden: tippy_hidden,
        arrow: false
    })

    // Clicks toggle tip
    dashboard.onclick = (e) => {
        if (e.target != e.currentTarget ) {
            // Only trigger on direct clicks
            // Reset toggle to allow clicking off menu
            tip_shown = true
            return
        }

        if (!grid_edit_enabled(grid)) {
            // only trigger if editing of the base grid is enabled
            return
        }

        if (!tip_shown) {
            if (palette != null) {
                // Don't allow rapid triggers
                // Old palette must be cleared before new one is added
                // Note toggle is not updated
                return
            }
            tip.show()
        }
        tip_shown = !tip_shown
    }

}

// Called when a widget is dropped, sub grids don't like being moved for some reason.
// The fix seems to be to delete and re-create them.
function widget_dropped(event, previousWidget, newWidget) {

    // Copy
    const obj = get_widget_object(newWidget.el)
    const target = newWidget.grid

    // Remove ordinal
    newWidget.el.destroy()
    target.removeWidget(newWidget.el)

    // Add copy
    const copy = add_widget(target, obj)
    if (copy != null) {
        copy.init()
    }

}

function handle_unload(event) {

    let all_saved = true

    if (grid != null) {
        // The grid itself
        if (grid_changed) {
            all_saved = false
        }

        // Each widget on grid
        for (const widget of grid.getGridItems()) {
            if (widget.get_changed()) {
                all_saved = false
            }
        }
    }

    if (all_saved) {
        // No need to warn
        return
    }

    // Cancel the event as stated by the standard.
    event.preventDefault()
    event.returnValue = ""

    // Focus the save button
    const settings_menu = document.getElementById("MenuSettingsIcon")
    const menu = settings_menu._tippy

    menu.show()
    const save_button = menu.props.content.querySelector(`input[id="save_button"]`)
    save_button.focus()

}