const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const BUBBLE_API_URL = 'https://yourcreation.studio/version-test/api/1.1/obj/shipment';
const BUBBLE_API_TOKEN = '99fc4482ebed8ca24d90cbd25f1af9c7';

app.get('/fetch-shipments', async (req, res) => {
  try {
    const response = await axios.get(BUBBLE_API_URL, {
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_TOKEN}`
      }
    });
    const shipments = response.data.response.results;
    res.json(shipments);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/process-shipments', async (req, res) => {
  const shipments = req.body.shipments;
  const processedShipments = shipments.map(shipment => {
    shipment.estimated_delivery = calculateEstimatedDelivery(shipment);
    shipment.status = 'Processed';
    return shipment;
  });
  try {
    await Promise.all(processedShipments.map(shipment =>
      axios.patch(`${BUBBLE_API_URL}/${shipment._id}`, shipment, {
        headers: {
          'Authorization': `Bearer ${BUBBLE_API_TOKEN}`
        }
      })
    ));
    res.send('Shipments processed successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const calculateEstimatedDelivery = (shipment) => {
  // Your logic to calculate estimated delivery time
  return '2024-07-01';
};


app.get('status', (req, res) => {
  res.send('Server is online 🚢🚢🚢');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
