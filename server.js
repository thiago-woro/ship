const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

require("dotenv").config();
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; 
let aiModel = "mistralai/mistral-7b-instruct:free"   //"openai/gpt-3.5-turbo";

let uploadData = [];



app.post("/ai-insights", async (req, res) => {

	// This determines which KPI the client wants to know about
	const base_kpi = req.body.base_kpi;
	const compare_kpi = req.body.compare_kpi;

	try {
		//const base_kpi_data = await aiInsights(base_kpi);
		//const compare_kpi_data = await aiInsights(compare_kpi);

		const insights = await aiInsights(base_kpi, compare_kpi);


		// Send response back to client
		res.send({ base_kpi: base_kpi_data, compare_kpi: compare_kpi_data });
	} catch (error) {
		res.status(500).send(error.message);
	}

});


async function aiInsights(kpi) {
	try {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
			  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
			  "Content-Type": "application/json"
			},
			body: JSON.stringify({
			  "model": aiModel,
			  "messages": [
				{
					role: 'user',
					content: `Compare the following two datasets and provide insights:
					Base KPI: ${JSON.stringify(base_kpi)}
					Compare KPI: ${JSON.stringify(compare_kpi)}`
				  }
				
			  ],
			})
		});
		const data = await response.json();
		console.log('Response:', data);
		return data;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}




const BUBBLE_API_URL = "https://yourcreation.studio/version-test/api/1.1/obj/shipment";
const BUBBLE_API_TOKEN = "99fc4482ebed8ca24d90cbd25f1af9c7";

app.get("/fetch-shipments", async (req, res) => {
	try {
		const response = await axios.get(BUBBLE_API_URL, {
			headers: {
				Authorization: `Bearer ${BUBBLE_API_TOKEN}`,
			},
		});
		const shipments = response.data.response.results;
		res.json(shipments);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

app.post("/process-shipments", async (req, res) => {
	const shipments = req.body.shipments;
	const processedShipments = shipments.map((shipment) => {
		shipment.estimated_delivery = calculateEstimatedDelivery(shipment);
		shipment.status = "Processed";
		return shipment;
	});
	try {
		await Promise.all(
			processedShipments.map((shipment) =>
				axios.patch(`${BUBBLE_API_URL}/${shipment._id}`, shipment, {
					headers: {
						Authorization: `Bearer ${BUBBLE_API_TOKEN}`,
					},
				})
			)
		);
		res.send("Shipments processed successfully");
	} catch (error) {
		res.status(500).send(error.message);
	}
});

const calculateEstimatedDelivery = (shipment) => {
	// Your logic to calculate estimated delivery time
	return "2024-07-01";
};

app.post("/calculate-kpis", async (req, res) => {
	const shipments = req.body.shipments;
	const kpis = calculateKPIs(shipments);
	res.json(kpis);
});

const calculateKPIs = async (shipments) => {
	try {
		const kpis = await calculateKPIsHelper(shipments);
		return kpis;
	} catch (error) {
		throw error;
	}
};

// Helper function
const calculateKPIsHelper = (shipments) => {
	return new Promise((resolve, reject) => {
		const totalShipments = shipments.length;
		const shipmentsInTransit = shipments.filter((shipment) => shipment.status === "In Transit").length;
		const deliveredShipments = shipments.filter((shipment) => shipment.status === "Delivered").length;
		const delayedShipments = shipments.filter((shipment) => new Date(shipment.estimated_delivery) < new Date() && shipment.status !== "Delivered").length;

		const totalDeliveryTime = shipments.filter((shipment) => shipment.status === "Delivered").reduce((sum, shipment) => sum + (new Date(shipment.arrival_date) - new Date(shipment.departure_date)), 0);

		const averageDeliveryTime = totalDeliveryTime / deliveredShipments / (1000 * 60 * 60 * 24); // Convert milliseconds to days

		const totalShipmentValue = shipments.reduce((sum, shipment) => sum + shipment.shipment_value, 0);
		const totalWeight = shipments.reduce((sum, shipment) => sum + shipment.total_weight, 0);
		const customsTaxCollected = shipments.reduce((sum, shipment) => sum + shipment.customs_tax, 0);
		const importTaxCollected = shipments.reduce((sum, shipment) => sum + shipment.import_tax, 0);
		const otherTaxesCollected = shipments.reduce((sum, shipment) => sum + shipment.other_taxes, 0);

		const kpis = {
			totalShipments,
			shipmentsInTransit,
			deliveredShipments,
			delayedShipments,
			averageDeliveryTime: averageDeliveryTime.toFixed(2), // Rounded to 2 decimal places
			totalShipmentValue,
			totalWeight,
			customsTaxCollected,
			importTaxCollected,
			otherTaxesCollected,
		};

		resolve(kpis);
	});
};

app.post("/process-shipments", async (req, res) => {
	const shipments = req.body.shipments;
	const processedShipments = shipments.map((shipment) => {
		shipment.estimated_delivery = "2024-07-01";
		shipment.status = "Processed";
		return shipment;
	});
	try {
		await Promise.all(
			processedShipments.map((shipment) =>
				axios.patch(`${BUBBLE_API_URL}/${shipment._id}`, shipment, {
					headers: {
						Authorization: `Bearer ${BUBBLE_API_TOKEN}`,
					},
				})
			)
		);
		res.send("Shipments processed successfully");
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// Example JSON body to call the route via Postman
const dummyData = [
	{
		_id: "6469759e3f5c000010b9331a",
		shipment_id: "SHP001",
		origin_port: "Shanghai",
		destination: "Los Angeles",
		status: "Pending",
		departure_date: "2024-06-15",
		arrival_date: "2024-06-25",
		customs_tax: 500,
		import_tax: 200,
		other_taxes: 50,
		total_weight: 1000,
		carrier: "Maersk",
		shipment_value: 10000,
		estimated_delivery: "",
	},
	{
		_id: "646975a33f5c000010b9331d",
		shipment_id: "SHP002",
		origin_port: "Shenzhen",
		destination: "Houston",
		status: "Pending",
		departure_date: "2024-06-16",
		arrival_date: "2024-06-26",
		customs_tax: 600,
		import_tax: 250,
		other_taxes: 60,
		total_weight: 1500,
		carrier: "COSCO",
		shipment_value: 15000,
		estimated_delivery: "",
	},
];

app.get("/status", (req, res) => {
	res.send("Server is online 🚢🚢🚢");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
