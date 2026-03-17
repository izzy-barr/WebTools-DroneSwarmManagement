// Add label
const label = document.createElement("span")
label.appendChild(document.createTextNode(options.label))
div.appendChild(label)
div.style.textAlign = "center"

// Div for main value
const value_div = document.createElement("div")
value_div.style.position = "absolute"
value_div.style.top = 0
value_div.style.bottom = 0
value_div.style.left = 0
value_div.style.right = 0
div.appendChild(value_div)
 
// Svg for value
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
svg.style.height = "100%"
svg.style.width = "100%"
svg.style.fill = options.color
value_div.appendChild(svg)
 
const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
text.innerHTML = "-"
svg.appendChild(text)
 
function resize() {
    const bbox = text.getBBox()
    svg.setAttribute('viewBox', [bbox.x, bbox.y, bbox.width, bbox.height].join(' '));

    value_div.style.top = label.getBoundingClientRect().height + "px"
}

resize()

// Runtime function
handle_msg = function (msg) {

    // Check message ID
    if (msg._id != options.message) {
        return
    }

// Check for field
    if (!(options.field in msg)) {
        throw new Error("No field " + options.field + " in " + msg._name)
    }
    let value = msg[options.field]
    value *= options.scaleFactor
 
    text.innerHTML = value.toFixed(Math.round(options.decimalPlaces))

    resize()

}
// Optional function to allow run-time update of options
handle_options = function (new_opitons) {
    options = new_opitons 
    // update color and text
    svg.style.fill = options.color
     label.innerText = options.label
}