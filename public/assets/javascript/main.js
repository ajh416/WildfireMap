let all_markers = []
let wildfire_markers = []
let current_markers = []

let display_headers = () => {
	let main = document.getElementsByTagName("header")[0]
	let subheader = document.createElement("h2")
	subheader.innerHTML = "Incident Map (WIP)"
	main.appendChild(subheader)
}

let display_resources_table = (json) => {
	let table = document.createElement("table")
	let table_body = document.createElement("tbody")

	let header = table.createTHead()
	let header_row = header.insertRow(-1)
	let name = header_row.insertCell(0)
	let description = header_row.insertCell(1)
	let type = header_row.insertCell(2)
	let status = header_row.insertCell(3)
	let date = header_row.insertCell(4)

	name.innerHTML = "Name"
	description.innerHTML = "Description"
	type.innerHTML = "Web Comment"
	status.innerHTML = "Status"
	date.innerHTML = "Date"

	json[0].data.forEach((resource) => {

		let row = table_body.insertRow(-1)
		let name = row.insertCell(0)
		let description = row.insertCell(1)
		let type = row.insertCell(2)
		let status = row.insertCell(3)
		let date = row.insertCell(4)

		name.innerHTML = resource.name
		description.innerHTML = resource.type
		type.innerHTML = resource.webComment
		status.innerHTML = resource.fire_status
		date.innerHTML = resource.date
	})

	let main = document.getElementById("main")
	table.appendChild(table_body)
	main.appendChild(table)
	return json
}

let display_map = (incidents, perimeters) => {
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
	let baseMaps = {
		"Google Maps Satellite": sat_layer,
		"OpenStreetMap": osm_layer
	}
	L.control.layers(baseMaps).addTo(map);

	L.geoJSON(perimeters).addTo(map)

	let smallMarkerOptions = {
		radius: 6,
		fillColor: "#ff7800",
		color: "#000",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};

	function onEachFeature(feature, layer) {
		let containment = feature.properties.PercentContained
		if (containment === null)
			containment = '0'
		if (feature.properties && feature.properties.IncidentName) {
			layer.bindPopup(`<b>Name: </b>${feature.properties.IncidentName}</br><b>Incident Size: </b>${feature.properties.IncidentSize} acres</br><b>Reported Date: </b>${new Date(feature.properties.CreatedOnDateTime_dt).toString()}</br><b>Last Updated: </b>${new Date(feature.properties.ModifiedOnDateTime_dt).toString()}</br><b>% Contained: </b>${containment}`)
		}
	}

	L.geoJSON(incidents, {
		style: function(feature) {
			if (feature.properties.IncidentSize > 1000) {
				return {
					fillColor: "#ff7800",
					color: "#000",
					weight: 2,
					opacity: 1,
					fillOpacity: 0.8
				}
			}
		},
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, smallMarkerOptions)
		},
		onEachFeature: onEachFeature
	}).addTo(map);
}

window.addEventListener('DOMContentLoaded', async () => {
	let main = document.getElementById("main")
	let loading = document.createElement("h1")
	loading.textContent = "Loading..."
	main.appendChild(loading)

	let response = await fetch("http://localhost:5000/api/incidents", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const incidents = await response.json();
	response = await fetch("http://localhost:5000/api/perimeters", { method: "GET", mode: "cors" })
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const perimeters = await response.json();
	main.removeChild(loading)
	display_headers()
	display_map(incidents, perimeters)
});
