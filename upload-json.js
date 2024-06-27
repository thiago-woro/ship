const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const BUBBLE_API_URL = 'https://yourcreation.studio/version-test/api/1.1/obj/shipment';
const BUBBLE_API_TOKEN = '99fc4482ebed8ca24d90cbd25f1af9c7';

//Random Dummy Data
let uploadData = [
  {
    "shipment_id": "SHP001",
    "origin_port": "Shanghai",
    "destination": "Los Angeles",
    "status": "Pending",
    "departure_date": "2024-06-15",
    "arrival_date": "2024-06-25",
    "customs_tax": 500,
    "import_tax": 200,
    "other_taxes": 50,
    "total_weight": 1000,
    "carrier": "Maersk",
    "shipment_value": 10000,
    "estimated_delivery": ""
  },
  {
    "shipment_id": "SHP002",
    "origin_port": "Shenzhen",
    "destination": "Houston",
    "status": "Pending",
    "departure_date": "2024-06-16",
    "arrival_date": "2024-06-26",
    "customs_tax": 600,
    "import_tax": 250,
    "other_taxes": 60,
    "total_weight": 1500,
    "carrier": "COSCO",
    "shipment_value": 15000,
    "estimated_delivery": ""
  },
  {
    "shipment_id": "SHP003",
    "origin_port": "Ningbo",
    "destination": "San Francisco",
    "status": "Pending",
    "departure_date": "2024-06-17",
    "arrival_date": "2024-06-27",
    "customs_tax": 550,
    "import_tax": 220,
    "other_taxes": 55,
    "total_weight": 1200,
    "carrier": "MSC",
    "shipment_value": 12000,
    "estimated_delivery": ""
  },
  {
    "shipment_id": "SHP004",
    "origin_port": "Tianjin",
    "destination": "Dallas",
    "status": "Pending",
    "departure_date": "2024-06-18",
    "arrival_date": "2024-06-28",
    "customs_tax": 580,
    "import_tax": 240,
    "other_taxes": 58,
    "total_weight": 1300,
    "carrier": "Hapag-Lloyd",
    "shipment_value": 13000,
    "estimated_delivery": ""
  },
  {
    "shipment_id": "SHP005",
    "origin_port": "Guangzhou",
    "destination": "Denver",
    "status": "Pending",
    "departure_date": "2024-06-19",
    "arrival_date": "2024-06-29",
    "customs_tax": 610,
    "import_tax": 260,
    "other_taxes": 61,
    "total_weight": 1400,
    "carrier": "Evergreen",
    "shipment_value": 14000,
    "estimated_delivery": ""
  }
]




console.log('started');



//uploads dummy data to bubble - as JSON 
async function uploadShipments() {
  try {
    const response = await axios.post(
      'https://your-creation-studio-20.bubbleapps.io/version-test/api/1.1/wf/getdata',
      uploadData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    if (response && response.data) {
      console.log(response.data);
    } else {
      console.error('Invalid response');
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

uploadShipments()



//express route
app.post('/upload-shipments', async (req, res) => {
  try {
    const response = await axios.post('https://your-creation-studio-20.bubbleapps.io/version-test/api/1.1/wf/getdata/initialize', uploadData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});


