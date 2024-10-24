let mobile_markers = {
	0: 10,
	1000: 12,
	5000: 14,
	10000: 16,
	100000: 17,
}

let desktop_markers = {
	0: 4,
	1000: 6,
	5000: 8,
	10000: 10,
	100000: 11,
}

let display_headers = () => {
	let main = document.getElementsByTagName("header")[0]
	let subheader = document.createElement("h2")
	subheader.className = "subheader"
	subheader.textContent = "Wildfire Map"
	main.appendChild(subheader)
}

window.addEventListener('DOMContentLoaded', async () => {
	display_headers()

	let res = init_map()
	let map = res[0]
	let sat_layer = res[1]
	let osm_layer = res[2]

	let loading = L.control({ position: "topright" })
	let div
	loading.onAdd = function(_) {
		div = L.DomUtil.create("div", "loading")
		//div.style.backgroundColor = "black"
		div.style.color = "#010101"
		div.innerHTML = "<h1>Loading incidents...</h1>"
		return div
	}
	loading.addTo(map)

	let response = await fetch("https://wildfire-map.com/api/incidents", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}
	const incidents = await response.json()
	let inc = display_incidents(incidents)

	div.innerHTML = "<h1>Loading perimeters...</h1>"
	response = await fetch("https://wildfire-map.com/api/perimeters", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}
	const perimeters = await response.json()
	let perim = display_perimeters(perimeters)
	perim.addTo(map)
	inc.addTo(map)

	div.innerHTML = "<h1>Loading FIRMS data...</h1>"
	response = await fetch("https://wildfire-map.com/api/firms", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`)
	}
	const firms = await response.json()
	let firms_layer = display_firms(firms)

	let baseMaps = {
		"Google Maps Satellite": sat_layer,
		"OpenStreetMap": osm_layer
	}

	let overlays = {
		"NASA/NOAA FIRMS": firms_layer,
		"Perimeters": perim,
		"Active Incidents": inc,
	}

	document.getElementsByClassName("loading")[0].remove()

	L.control.layers(baseMaps, overlays).addTo(map)
});

let init_map = () => {
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

	/* Legend specific, from https://codepen.io/haakseth/pen/KQbjdO */
	let legend = L.control({ position: "bottomleft" })
	legend.onAdd = function(_) {
		let div = L.DomUtil.create("div", "legend")
		div.style.backgroundColor = "#010101"
		div.style.color = "#fff"
		div.innerHTML += "<h4>Legend</h4>"
		div.innerHTML += '<i style="background: #ff7800"></i><span>Incidents >24hrs old</span><br>'
		div.innerHTML += '<i style="background: #ff5555"></i><span>Incidents <24hrs old</span><br>'
		div.innerHTML += '<i style="background: #ff0000"></i><span>Incidents <12hrs old</span><br>'
		div.innerHTML += '<i style="background: #7777ff"></i><span>Perimeters</span><br>'
		div.innerHTML += '<i style="background: #0000ff"></i><span>NOAA/NASA FIRMS Heat Sources</span><br>'
		return div
	}
	legend.addTo(map)

	return [map, sat_layer, osm_layer]
}

let display_incidents = (incidents) => {
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
		if (containment === null || containment === undefined)
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
			if (size < 2 || feature.properties.IncidentSize === null) {
				vars.radius = it[0]
			} else if (size < 1000)
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
	})

	return inc
}

let display_perimeters = (perimeters) => {
	let perim = L.geoJSON(perimeters, {
		style: function(_) {
			return { color: "#7777ff" }
		}
	})

	return perim
}

let display_firms = (firms) => {
	let firms_style = {
		radius: 6,
		fillColor: "#0000ff",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	}
	let firms_layer = L.geoJSON(firms, {
		pointToLayer: function(_, latlng) {
			let style = firms_style
			return L.circleMarker(latlng, style)
		},
		onEachFeature: function(feature, layer) {
			if (feature.properties && feature.properties.acq_date) {
				let brightness = feature.properties.bright_ti4
				if (brightness === undefined)
					brightness = "N/A"
				layer.bindPopup(`<div id="popup-info"><b>Time: </b>${feature.properties.acq_date} ${feature.properties.acq_time} UTC</br><b>Brightness: </b>${brightness}</br><b>Source: </b>${feature.properties.satellite}`)
			}
		}
	})

	return firms_layer
}
