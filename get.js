const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const BUBBLE_API_URL = 'https://yourcreation.studio/version-test/api/1.1/obj/shipment';
const BUBBLE_API_TOKEN = '99fc4482ebed8ca24d90cbd25f1af9c7';

console.log('started');

// Function to get shipments from bubble.io database
async function getShipments() {

console.log('fetching...');


  try {
    const response =  await axios.get(BUBBLE_API_URL, {
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_TOKEN}`
      }
    });
    const shipments = response.data.response.results[0];
    console.log(shipments);


  } catch (error) {
    res.status(500).send(error.message);
  }
}

getShipments() //run fn