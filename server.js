const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

require("dotenv").config();
let OPENROUTER_API_KEY = process.env.OPENROUTER_KEY;
let aiModel = "mistralai/mistral-7b-instruct:free"; //"openai/gpt-3.5-turbo";

const BUBBLE_API_URL = "https://yourcreation.studio/version-test/api/1.1/obj/shipment";
const BUBBLE_API_TOKEN = "99fc4482ebed8ca24d90cbd25f1af9c7";







//Main route used to get AI Insights
app.post('/ai-insights', async (req, res) => {
    const { base_kpi, compare_kpi, origin, destination, departure, arrival, status, carrier, customs_tax, import_tax, total_weight } = req.body;
    console.log('Received request:', req.body);

    // Send immediate response back to bubble, while sending the data to GPT.
    res.send({ result: 200, message: 'Processing data' });

    // Fetch AI Insights via OpenRouter API
    try {
        const insights = await aiInsights({
            base_kpi, compare_kpi, origin, destination, departure, arrival, status, carrier, customs_tax, import_tax, total_weight
        });
        //console.log('Insights:', insights);

        // Save the insights after processing
        await saveInsight(insights);
    } catch (error) {
        console.error('Error:', error);
    }
});



async function aiInsights(data) {   
    // Fetch AI Insights via OpenRouter API, supports several LLM models.
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
				tokens: 400,
                model: aiModel,
                messages: [
                    {
                        role: 'user',
                        content: `Analyze the following shipment data and provide detailed insights, considering trends, anomalies, and correlations between the different fields.

						Format the response as a report article, following the following template:

						set the "title" to state what is the range dates, on the Departure dates.

						set the "subtitle", Start by stating how many items were analyzed. 

			

						set bullet points to state:

						-what is the most common origin.
						-what is the most common destination.
						-whats the most common route. (from where to where)

						-what is the most common carrier.

						-what is the most common status.

					
						write a shorter paragraph to summarize the data.

                        Base KPI: ${data.base_kpi}
                        Compare KPI: ${data.compare_kpi}
                        Additional Context:
                        Origin: ${data.origin}
                        Destination: ${data.destination}
                        Departure: ${data.departure}
                        Arrival: ${data.arrival}
                        Status: ${data.status}
                        Carrier: ${data.carrier}
                        Customs Tax: ${JSON.stringify(data.customs_tax)}
                        Import Tax: ${data.import_tax}
                        Total Weight: ${JSON.stringify(data.total_weight)}
                        Provide insights that include:
                        - Key differences and correlations between ${data.base_kpi} and ${data.compare_kpi}.
                        - Trends observed in the shipment data.
                        - Possible reasons for any patterns or anomalies.
                        - Impact of origin, destination, departure, arrival, status, and carrier on ${data.base_kpi} and ${data.compare_kpi}.
                        - Recommendations based on the comparison and analysis.`
                    }
                ]
            })
        });
        const responseData = await response.json();
        console.log('\n\nRequest Data:', data);
        console.log('\n\nResponse:', responseData);
        const insightsResults = responseData.choices[0].message.content;
        console.log('\n\nInsights results: \n\n', insightsResults);
		

        return insightsResults;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

//Getting the reply back from GPT can take some seconds, so the final response is stored in the database via this function.
async function saveInsight(insights) {
    const url = "https://your-creation-studio-20.bubbleapps.io/version-test/api/1.1/wf/store";


    const formData = {
        text: insights
    };

    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Authorization': `Bearer ${process.env.BUBBLE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
        });
        console.log('Insight saved:', response.data);
    } catch (error) {
        console.error('Error saving insight:', error);
    }
}

//post route to create ai-isights "response" data type in bubble database.// Define the route to save an insight
app.post('/save-insight', async (req, res) => {
    const url = "https://your-creation-studio-20.bubbleapps.io/version-test/api/1.1/wf/store";

    // Extract the message from the request body
    const { message } = req.body;

    const formData = new FormData();
    formData.append('data', JSON.stringify({ message }));

    formData.headers = {
        'Authorization': `Bearer ${process.env.BUBBLE_API_TOKEN}`,
        ...formData.getHeaders()
    };

    try {
        const response = await axios.post(url, formData, {
            headers: formData.headers,
        });
        res.send(response.data);
    } catch (error) {
        if (error.response) {
            // Server responded with a status other than 2xx
            res.status(error.response.status).send(error.response.data);
        } else if (error.request) {
            // Request was made but no response was received
            res.status(500).send("No response received from Bubble API");
        } else {
            // Something happened in setting up the request that triggered an error
            res.status(500).send(error.message);
        }
    }
});





app.get("/fetch-shipments", async (req, res) => {
	try {
		const response = await axios.get(BUBBLE_API_URL, {
			headers: {
				Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}`,
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
