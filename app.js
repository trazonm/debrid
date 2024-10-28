require('dotenv').config();
var express = require('express');
var path = require('path');
var axios = require('axios');
const qs = require('querystring');
const multer = require('multer'); // Import multer


var app = express();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage()
}); // Store files in memory

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/scripts', express.static(__dirname + '/scripts', {
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "no-store");
    }
  }));
  
// For /index page
app.get('/', function (req, res) {
    res.sendFile('index.html', {
        root: path.join(__dirname, './views')
    });
});

// New endpoint for making API call to Jackett
app.get('/search', async function (req, res) {
    console.log("Received search request");
    console.log(process.env);
    const query = req.query.query;
    const apiURL = `https://jackett-service.gleeze.com/api/v2.0/indexers/all/results?apikey=${process.env.JACKETT_API_KEY}&Query=${query}`;

    try {
        const apiResponse = await axios.get(apiURL);
        res.json(apiResponse.data);
    } catch (error) {
        console.error('Error fetching data from Jackett API:', error);
        res.status(500).json({
            error: 'Failed to fetch data from Jackett API'
        });
    }
});

// Endpoint for adding a magnet link
app.get('/addMagnet', async function (req, res) {
    console.log("Received request to add magnet link");
    const link = req.query.link;

    if (link && link.includes('magnet:')) {
        const apiURL = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';
        const headers = {
            'Authorization': process.env.REAL_DEBRID_AUTH,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const data = qs.stringify({
            magnet: link
        });

        try {
            const apiResponse = await axios.post(apiURL, data, {
                headers: headers
            });
            console.log('Add magnet response:', apiResponse.data);

            const selectFilesResponse = await selectFiles(apiResponse.data.id, headers);
            console.log('Select files status:', selectFilesResponse.status);

            res.json(apiResponse.data);
        } catch (error) {
            console.error('Error fetching data from Real-Debrid API:', error);
            res.status(500).json({
                error: 'Failed to fetch data from Real-Debrid API'
            });
        }
    } else {
        res.status(400).json({
            error: 'Invalid magnet link provided'
        });
    }
});

// Endpoint for adding a torrent file
app.put('/addTorrent', upload.single('file'), async function (req, res) {
    console.log("Received request to add torrent file");

    const torrentFile = req.file;

    if (!torrentFile) {
        return res.status(400).json({
            error: 'No torrent file provided'
        });
    }

    const apiURL = 'https://api.real-debrid.com/rest/1.0/torrents/addTorrent';
    const headers = {
        'Authorization': process.env.REAL_DEBRID_AUTH,
        'Content-Type': 'application/octet-stream' // Set content type to binary
    };

    try {
        // Step 2: Upload the binary data of the torrent file to Real-Debrid
        const uploadResponse = await axios.put(apiURL, torrentFile.buffer, {
            headers: headers
        });

        console.log('Add torrent response:', uploadResponse.data);

        const selectFilesResponse = await selectFiles(uploadResponse.data.id, headers);
        console.log('Select files status:', selectFilesResponse.status);

        res.json(uploadResponse.data);
    } catch (error) {
        console.error('Error processing torrent:', error);
        res.status(500).json({
            error: 'Failed to process torrent'
        });
    }
});

// Function to check progress of a torrent
app.get('/checkProgress/:id', async function (req, res) {
    const torrentId = req.params.id;
    const apiURL = `https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`;
    const headers = {
        'Authorization': process.env.REAL_DEBRID_AUTH
    };

    try {
        const apiResponse = await axios.get(apiURL, {
            headers: headers
        });
        res.json(apiResponse.data);
    } catch (error) {
        console.error('Error checking progress from Real-Debrid API:', error);
        res.status(500).json({
            error: 'Failed to fetch progress from Real-Debrid API'
        });
    }
});

app.get('/unrestrict', async function (req, res) {
    console.log('Received request to unrestrict a link');
    const link = req.query.link;
    const data = qs.stringify({
        link: link
    });
    const apiURL = `https://api.real-debrid.com/rest/1.0/unrestrict/link?link=${link}`;
    const headers = {
        'Authorization': process.env.REAL_DEBRID_AUTH
    };

    try {
        const apiResponse = await axios.post(apiURL, data, {
            headers: headers
        });
        console.log(apiResponse.data);
        res.json(apiResponse.data);
    } catch (error) {
        console.error('Error unrestricting link from Real-Debrid API:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to unrestrict link from Real-Debrid API'
        });
    }
});

app.get('/checkRedirect', async function (req, res) {
    console.log('Received request to check redirect');
    const link = req.query.link;
    try {
        const response = await axios({
            url: link,
            method: 'get',
            maxRedirects: 0
        });

        // If we get here, it means no redirects occurred.
        res.json({
            redirects: 0,
            finalUrl: null // Get the final URL after all redirects
        });
    } catch (error) {
        if (error.response && error.response.status === 302) {
            // Handle the 302 redirect case
            const redirectLocation = error.response.headers.location;
            console.log('Redirect detected:', redirectLocation);
            res.json({
                redirects: 1, // Indicate one redirect
                finalUrl: redirectLocation
            });
        } else {
            console.error(error);
            res.status(204).json({
                message: 'No redirects, or an unexpected error occurred'
            });
        }
    }
});


// Function to select files
async function selectFiles(torrentId, headers) {
    const selectFilesData = qs.stringify({
        files: 'all'
    });
    return await axios.post(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, selectFilesData, {
        headers: headers
    });
}

app.listen(5002, function () {
    console.log('Listening at port 5002...');
});

module.exports = app;