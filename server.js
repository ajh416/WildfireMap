const express = require('express')

const app = express()
const port = 5000

let nifc_incidents = {}
let nifc_perimeters = {}
let noaa_firms = {}

let csv_to_geojson = (csv) => {
	let features = []
	csv.split("\n").map((line) => {
		let [latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_ti5, frp, daynight] = line.split(",")
		if (latitude === "latitude") return
		let coordinates = [parseFloat(longitude), parseFloat(latitude)]
		if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
			coordinates = [0, 0]
		}
		let feature = {
			type: "Feature",
			id: Math.floor(Math.random() * 100000),
			geometry: {
				type: "Point",
				coordinates: coordinates,
			},
			properties: {
				bright_ti4: parseFloat(bright_ti4),
				scan: parseFloat(scan),
				track: parseFloat(track),
				acq_date: acq_date,
				acq_time: acq_time,
				satellite: satellite,
				instrument: instrument,
				confidence: confidence,
				version: version,
				bright_ti5: parseFloat(bright_ti5),
				frp: parseFloat(frp),
				daynight: daynight
			}
		}
		features.push(feature)
	})
	noaa_firms = {
		type: "FeatureCollection",
		features: features
	}
}

app.use(express.static('public'))

app.listen(port, async () => {
	await get_incidents()
	await get_perimeters()
	await get_noaa_firms()
	console.log(`Server listening at http://localhost:${port}`)
})

app.get('/api/incidents', async (_, res) => {
	res.status(200).header("Access-Control-Allow-Origin", "*").send(nifc_incidents)
})

app.get('/api/perimeters', async (_, res) => {
	res.status(200).header("Access-Control-Allow-Origin", "*").send(nifc_perimeters)
})

app.get('/api/firms', async (_, res) => {
	res.status(200).header("Access-Control-Allow-Origin", "*").send(noaa_firms)
})

let get_incidents = async () => {
	console.log("Fetching new incidents...")
	// NIFC ArcGIS API for incidents
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	nifc_incidents = await response.json()
	// set a timer for 10 minutes
	setTimeout(get_incidents, 20000 * 60)
}

let get_perimeters = async () => {
	console.log("Fetching new perimeters...")
	// NIFC ArcGIS API
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	nifc_perimeters = await response.json()
	// set a timer for 30 minutes
	setTimeout(get_perimeters, 45000 * 60)
}

let get_noaa_firms = async () => {
	console.log("Fetching new noaa firms...")
	// NOAA FIRMS API
	let response = await fetch("https://firms.modaps.eosdis.nasa.gov/api/area/csv/7349994f446f64c565d38ce5a40e9c23/VIIRS_NOAA21_NRT/-160,-90,-90,90/1")
	csv = await response.text()
	csv_to_geojson(csv)
	// set a timer for 30 minutes
	setTimeout(get_perimeters, 60000 * 60)
}
