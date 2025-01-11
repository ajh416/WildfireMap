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
	res = display_incidents(incidents)
	let inc = res[0]
	let smallinc = res[1]

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
		"Small/Undefined Incidents": smallinc,
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
		div.innerHTML += "<h4>Legend</h4>"
		let ul = L.DomUtil.create("ul", "", div)
		ul.style = "list-style-type:none; padding: 0px 0px;"
		ul.innerHTML += "<li><i class='incident-icon'></i><span>Incidents</span></li>"
		ul.innerHTML += "<li><i style='background: #7777ff'></i><span>Perimeters</span></li>"
		ul.innerHTML += "<li><i style='background: #0000ff'></i><span>NOAA/NASA FIRMS Heat Sources</span></li>"
		return div
	}

	legend.addTo(map)

	return [map, sat_layer, osm_layer]
}

let display_incidents = (incidents) => {
	let verysmallFireIcon = L.icon({
		iconUrl: 'https://wildfire-map.com/assets/images/flame-icon.png',
		iconSize: [15, 15],
		iconAnchor: [15/2, 15],
		popupAnchor: [0, -14],
	})

	let smallFireIcon = L.icon({
		iconUrl: 'https://wildfire-map.com/assets/images/flame-icon.png',
		iconSize: [25, 25],
		iconAnchor: [25/2, 25],
		popupAnchor: [0, -24],
	})
	let largeFireIcon = L.icon({
		iconUrl: 'https://wildfire-map.com/assets/images/flame-icon.png',
		iconSize: [35, 35],
		iconAnchor: [35/2, 35],
		popupAnchor: [0, -34],
	})
	
	function onEachFeature(feature, layer) {
		let containment = feature.properties.PercentContained
		if (containment === null || containment === undefined)
			containment = '0'
		if (feature.properties && feature.properties.IncidentName) {
			layer.bindPopup(`<div id="popup-info"><b>Name: </b>${feature.properties.IncidentName}</br><b>Incident Size: </b>${feature.properties.IncidentSize} acres</br><b>Reported Date: </b>${new Date(feature.properties.CreatedOnDateTime_dt).toString()}</br><b>Last Updated: </b>${new Date(feature.properties.ModifiedOnDateTime_dt).toString()}</br><b>% Contained: </b>${containment}</div>`)
		}
	}
	let inc = L.geoJSON(incidents, {
		pointToLayer: function(feature, latlng) {
			let icon = smallFireIcon
			if (feature.properties.IncidentSize > 1000)
				icon = largeFireIcon
			if (feature.properties.IncidentSize == null || feature.properties.IncidentSize < 1)
				return null
			return L.marker(latlng, { icon: icon })
		},
		onEachFeature: onEachFeature
	})

	let smallinc = L.geoJSON(incidents, {
		pointToLayer: function(feature, latlng) {
			let icon = verysmallFireIcon
			if (feature.properties.IncidentSize < 1 || feature.properties.IncidentSize == null)
				return L.marker(latlng, { icon: icon })
		},
		onEachFeature: onEachFeature
	})

	return [inc, smallinc]
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
