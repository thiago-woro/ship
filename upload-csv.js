//imported libraries
const express = require('express');  //server
const axios = require('axios');      //for fetching data
const bodyParser = require('body-parser'); //for parsing data
const csv = require('csv-parser');
const fs = require('fs');

//set up express server
const app = express();
app.use(bodyParser.json());

//set up Bubble API URL and token
const BUBBLE_API_URL = 'https://yourcreation.studio/version-test/api/1.1/obj/shipment';
const BUBBLE_API_TOKEN = '99fc4482ebed8ca24d90cbd25f1af9c7';


let uploadData = [];


//reads data from csv file
fs.createReadStream('dummy-data.csv')
  .pipe(csv())
  .on('data', (data) => {
    const entry = {
      ...data,
      departure_date: data.departure_date ? new Date(data.departure_date).toISOString() : null,
      arrival_date: data.arrival_date ? new Date(data.arrival_date).toISOString() : null,
      estimated_delivery: data.estimated_delivery ? new Date(data.estimated_delivery).toISOString() : null
    };
    uploadData.push(entry);
  })
  .on('end', () => {
    console.log(uploadData);
    uploadData.forEach(async (entry) => {
      try {
        const response = await axios.post(
          'https://your-creation-studio-20.bubbleapps.io/version-test/api/1.1/wf/getdata',
          entry,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${BUBBLE_API_TOKEN}`
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
    })
  });



console.log('started');


