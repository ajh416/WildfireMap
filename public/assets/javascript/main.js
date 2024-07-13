let mobile_markers = {
	1000: 12,
	5000: 14,
	10000: 16,
	100000: 17,
}
let desktop_markers = {
	1000: 6,
	5000: 8,
	10000: 10,
	100000: 11,
}

let display_headers = () => {
	let main = document.getElementsByTagName("header")[0]
	let subheader = document.createElement("h2")
	subheader.innerHTML = "Incident Map (WIP)"
	main.appendChild(subheader)
}

let display_map = (incidents, perimeters, firms) => {
	let sat_layer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.google.com/permissions/geoguidelines.html" target="_blank">Google Maps</a> | <a href="https://data-nifc.opendata.arcgis.com/" target="_blank">NIFC</a>'
	})
	let osm_layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> | <a href="https://data-nifc.opendata.arcgis.com/" target="_blank">NIFC</a>'
	})

	let map = L.map('map', {
		center: [44.1, -121.25],
		zoom: 8,
		layers: [sat_layer, osm_layer]
	})

	let perim = L.geoJSON(perimeters, {
		style: function(_) {
			return { color: "#7777ff" }
		}
	}).addTo(map)

	let firms_layer = L.geoJSON(firms, {
		pointToLayer: function(_, latlng) {
			return L.circleMarker(latlng, { radius: 6, fillColor: "#0000ff", color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8 })
		},
		onEachFeature: function(feature, layer) {
			if (feature.properties && feature.properties.acq_date) {
				let brightness = feature.properties.bright
				if (brightness === undefined)
					brightness = "N/A"
				let confidence = feature.properties.confidence
				if (confidence === undefined)
					confidence = "N/A"
				layer.bindPopup(`<div id="popup-info"><b>Time: </b>${feature.properties.acq_date}</br><b>Brightness: </b>${brightness}</br><b>Confidence: </b>${confidence}`)
			}
		}
	})

	let baseMaps = {
		"Google Maps Satellite": sat_layer,
		"OpenStreetMap": osm_layer
	}

	/* Legend specific, from https://codepen.io/haakseth/pen/KQbjdO */
	let legend = L.control({ position: "bottomleft" })

	legend.onAdd = function(_) {
		let div = L.DomUtil.create("div", "legend")
		div.innerHTML += "<h4>Legend</h4>"
		div.innerHTML += '<i style="background: #ff7800"></i><span>Incidents >24hrs old</span><br>'
		div.innerHTML += '<i style="background: #ff5555"></i><span>Incidents <24hrs old</span><br>'
		div.innerHTML += '<i style="background: #ff0000"></i><span>Incidents <12hrs old</span><br>'
		div.innerHTML += '<i style="background: #7777ff"></i><span>Perimeters</span><br>'
		div.innerHTML += '<i style="background: #0000ff"></i><span>NOAA/NASA FIRMS Heat Sources</span><br>'
		return div
	}

	legend.addTo(map)

	let smallMarkerOptions = {
		radius: 6,
		fillColor: "#ff7800",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	}

	function onEachFeature(feature, layer) {
		let containment = feature.properties.PercentContained
		if (containment === null)
			containment = '0'
		if (feature.properties && feature.properties.IncidentName) {
			layer.bindPopup(`<div id="popup-info"><b>Name: </b>${feature.properties.IncidentName}</br><b>Incident Size: </b>${feature.properties.IncidentSize} acres</br><b>Reported Date: </b>${new Date(feature.properties.CreatedOnDateTime_dt).toString()}</br><b>Last Updated: </b>${new Date(feature.properties.ModifiedOnDateTime_dt).toString()}</br><b>% Contained: </b>${containment}</div>`)
		}
	}

	let inc = L.geoJSON(incidents, {
		style: function(feature) {
			let vars = {}
			let size = parseInt(feature.properties.IncidentSize)
			let it = {}
			if (window.innerWidth < 1000)
				it = mobile_markers
			else
				it = desktop_markers

			if (size < 1000 || feature.properties.IncidentSize === null)
				vars.radius = it[1000]
			else if (size < 5000)
				vars.radius = it[5000]
			else if (size < 10000)
				vars.radius = it[10000]
			else
				vars.radius = it[100000]

			let d = new Date(feature.properties.CreatedOnDateTime_dt)
			let now = new Date()
			if (now - d < 3600 * 12 * 1000)
				vars.fillColor = "#ff0000"
			else if (now - d < 3600 * 24 * 1000)
				vars.fillColor = "#ff5555"
			return vars
		},
		pointToLayer: function(_, latlng) {
			return L.circleMarker(latlng, smallMarkerOptions)
		},
		onEachFeature: onEachFeature
	}).addTo(map);
	firms_layer.addTo(map)
	let overlays = {
		"NASA/NOAA FIRMS": firms_layer,
		"Perimeters": perim,
		"Active Incidents": inc,
	}
	L.control.layers(baseMaps, overlays).addTo(map)
}

window.addEventListener('DOMContentLoaded', async () => {
	let main = document.getElementById("main")
	let loading = document.createElement("h1")
	loading.textContent = "Loading incidents..."
	main.appendChild(loading)

	let response = await fetch("https://wildfire-map.com/api/incidents", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const incidents = await response.json();
	loading.textContent = "Loading Perimeters..."
	response = await fetch("https://wildfire-map.com/api/perimeters", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const perimeters = await response.json();
	loading.textContent = "Loading FIRMS..."
	response = await fetch("https://wildfire-map.com/api/firms", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const firms = await response.json();

	main.removeChild(loading)
	display_headers()
	display_map(incidents, perimeters, firms)
});
