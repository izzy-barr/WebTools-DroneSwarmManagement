        // Include Plotly
const script = document.createElement("script");
script.src = "https://cdn.plot.ly/plotly-2.35.0.min.js";
document.body.appendChild(script);

// Setup layout
const plot_layout = {
    title: { text: options.title },
    legend: { itemclick: false, itemdoubleclick: false },
    margin: { b: 50, l: 65, r: 50, t: 50 },
    xaxis: {
        title: { text: "time (s)" },
        range: [-options.time, 0],
        zeroline: false,
        showline: true,
        mirror: true
    },
    yaxis: {
        title: { text: options.label },
        zeroline: false,
        showline: true,
        mirror: true
    }
};

const plot_data = [] //IB change

let vehicle_data = {} //IB add
let plot_created = false;

//IB moved plot_data and vehicle_data into function for multi vehicle purposes
function graph_vehicle_init(id, colour, vehicleID) {

    const trace = {
        mode: "lines",
        x: [],
        y: [],
        line: { color: colour },
        name: parent.vehicleMap.get(vehicleID).name
    };

    plot_data.push(trace)

    vehicle_data[id] = {
        time: [],
        value: [],
        trace_index: plot_data.length - 1
    };

    replot()
}

// Update plot
function update_data() {

    //IB move inside for loop for each vehicle and updated variable names
    for (const id in vehicle_data) {
        
         // Calculate time since sample
        const v = vehicle_data[id] //IB add
        const now = Date.now();
        const len = v.time.length;
        const dt = new Array(len);

        for (let i = 0; i < len; i++) {
            dt[i] = (now - v.time[i]) / -1000.0;
        }

        // See if there is any data to discard
        const last = dt.findLastIndex((x) => -x > options.time);

        if (last !== -1) {
            v.time.splice(0, last);
            v.value.splice(0, last);
            dt.splice(0, last);
        }

        // Update plot data
        plot_data[v.trace_index].x = dt;
        plot_data[v.trace_index].y = v.value;

    }
    

    // Make sure Plotly is loaded
    if (window.Plotly !== undefined) {
        if (!plot_created) {
            replot();
        }
        Plotly.redraw(div);
    }
}

function replot() {
    // Clear plot and redraw to cope with change in size or options
    plot_layout.title.text = options.title;
    plot_layout.xaxis.range[0] = -options.time;
    plot_layout.yaxis.title.text = options.label;

    if (window.Plotly !== undefined) {
        Plotly.purge(div);
        Plotly.newPlot(div, plot_data, plot_layout, { displaylogo: false });
        plot_created = true;
    }
}

//IB change plotline colour
function change_colour(colour, id) {
    // Clear plot and redraw to cope with change in size or options
    plot_data[vehicle_data[id].trace_index].line.color = colour;

    if (window.Plotly !== undefined) {
        Plotly.purge(div);
        Plotly.newPlot(div, plot_data, plot_layout, { displaylogo: false });
        plot_created = true;
    }
}

// Watch for size changes
new ResizeObserver(() => {
    replot();
}).observe(div);

// Runtime function
handle_msg = function (msg) {

    // Check message ID
    if (msg._id !== options.message) {
        return;
    }

    // Check for field
    if (!(options.field in msg)) {
        throw new Error("No field " + options.field + " in " + msg._name);
    }

    const id = msg._header.srcSystem //IB add

    //IB add
    if (vehicle_data[id] == null) {
        graph_vehicle_init(id, msg._colour, msg._vehicleID)
    } else if (plot_data[vehicle_data[id].trace_index].line.color !== msg._colour) {
        console.log('vehicleData', vehicle_data, 'plotdata', plot_data)
        change_colour(msg._colour, id)
    }

    let value = msg[options.field];
    value *= options.scaleFactor;

    // Add data
    vehicle_data[id].value.push(value);
    vehicle_data[id].time.push(Date.now());

    // Plot
    update_data();
};

// Add 10 Hz update plot
setInterval(update_data, 100);

// Optional function to allow run-time update of options
handle_options = function (new_options) {
    options = new_options;
    replot();
}

on_disconnect = function () {
    
}