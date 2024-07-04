const express = require('express')
const fs = require("node:fs")

const app = express()
const port = 5000

let nifc_incidents = {}
let wildcad_incidents = {}
let nifc_perimeters = {}

app.use(express.static('public'))

app.listen(port, async () => { await get_incidents(); await get_perimeters(); console.log(`Server listening at http://localhost:${port}`) })

app.get('/api/incidents', async (_, res) => {
	res.status(200).header("Access-Control-Allow-Origin", "*").send(nifc_incidents)
})

app.get('/api/perimeters', async (_, res) => {
	res.status(200).header("Access-Control-Allow-Origin", "*").send(nifc_perimeters)
})

let get_incidents = async () => {
	console.log("Fetching new incidents...")
	// WildWeb/WILDCADE API
	//let response = await fetch("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/ORCOC/incidents") 
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	nifc_incidents = await response.json()
	// set a timer for 5 minutes
	setTimeout(get_incidents, 10000 * 60)
}

let get_perimeters = async () => {
	console.log("Fetching new perimeters...")
	// NIFC ArcGIS API
	let response = await fetch("https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")
	nifc_perimeters = await response.json()
	// set a timer for 5 minutes
	setTimeout(get_perimeters, 30000 * 60)
}
