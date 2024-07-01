let display_headers = () => {
	let main = document.getElementById("main")
	let subheader = document.createElement("h2")
	subheader.innerHTML = "Incident List"
	main.appendChild(subheader)
}

let display_resources_table = (url) => {
	let json = fetch(url)

	json.then((response) => {
		return response.json()
	}).then((json) => {
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

		positions = []
		json[0].data.forEach((resource) => {
			if (resource.latitude && resource.longitude) {
				positions.push({ lat: parseFloat(resource.latitude), lng: -parseFloat(resource.longitude) })
			}

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
		initMap(json)
	}).catch((error) => {
		console.log(error)
	})
}

// google maps api/library
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
	key: "AIzaSyDBXUMhIDQ9J904-bATL_euXi5AlXHc6yg",
	v: "weekly",
	// Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
	// Add other bootstrap parameters as needed, using camel case.
});

// Initialize and add the map
let map;

async function initMap(json) {
	// Request needed libraries.
	//@ts-ignore
	const position = { lat: -25.344, lng: 131.031 };
	const { Map } = await google.maps.importLibrary("maps");
	const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

	// The map, centered at Uluru
	map = new Map(document.getElementById("map"), {
		zoom: 4,
		center: { lat: 44.065, lng: -120.607 },
		mapId: "DEMO_MAP_ID",
	});

	json[0].data.forEach((resource) => {
		if (resource.latitude && resource.longitude && resource.acres) {
			const marker = new AdvancedMarkerElement({
				map: map,
				position: { lat: parseFloat(resource.latitude), lng: -parseFloat(resource.longitude) },
				title: resource.name,
			});
			console.log(`Name: ${resource.name} Latitude: ${resource.latitude} Longitude: ${resource.longitude}`)
		}
	})
}

window.addEventListener('DOMContentLoaded', () => {
	display_headers()
	display_resources_table("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/ORCOC/incidents")
});
