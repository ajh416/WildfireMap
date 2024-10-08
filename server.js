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

		if (feature.geometry.coordinates != [0, 0])
			features.push(feature)
	})
	return {type: "FeatureCollection", features: features}
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

app.post("/api/aqi", async (req, res) => {
	if (process.env.AQI_KEY === undefined) {
		res.status(500).send()
		return
	}
	if (req.headers.x_api_key !== process.env.AQI_KEY) {
		res.status(401).send()
		return
	}

	res.status(200).send()
})

let get_incidents = async () => {
	console.log(`Fetching new incidents at ${new Date()}...`)
	let temp = {}
	// NIFC ArcGIS API for incidents
	try {
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	temp = await response.json()
	}
	catch (e) {
		setTimeout(get_incidents, 4000)
		return
	}
	if (temp !== undefined && temp.features.length > 0) {
		nifc_incidents = temp
	} else {
		setTimeout(get_incidents, 4000)
		return
	}

	// set a timer for 15 minutes
	setTimeout(get_incidents, 60000 * 15)
}

let get_perimeters = async () => {
	console.log(`Fetching new perimeters at ${new Date()}...`)
	let temp = {}
	// NIFC ArcGIS API
	try {
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	temp = await response.json()
	}
	catch (e) {
		setTimeout(get_perimeters, 4000)
		return
	}
	if (temp !== undefined && temp.features.length > 0) {
		nifc_perimeters = temp
	} else {
		setTimeout(get_perimeters, 4000)
		return
	}

	// set a timer for 45 minutes
	setTimeout(get_perimeters, 60000 * 45)
}

let get_noaa_firms = async () => {
	console.log(`Fetching new noaa firms at ${new Date()}...`)
	let temp = {}
	// NOAA FIRMS API
	try {
	let response = await fetch("https://firms.modaps.eosdis.nasa.gov/api/area/csv/7349994f446f64c565d38ce5a40e9c23/VIIRS_NOAA21_NRT/-160,-90,-90,90/2")
	csv = await response.text()
	temp = csv_to_geojson(csv)
	}
	catch (e) {
		setTimeout(get_noaa_firms, 4000)
		return
	}
	if (temp !== undefined && temp.features.length > 0) {
		noaa_firms = temp
	}
	else {
		setTimeout(get_noaa_firms, 4000)
		return
	}

	// set a timer for 60 minutes
	setTimeout(get_perimeters, 60000 * 60)
}
