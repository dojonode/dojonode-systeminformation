const express = require('express');
const si = require('systeminformation');
const cors = require('cors');
const app = express();
const port = 3009;
const CONFIG_KEY = process.env.CONFIG_KEY;
const fs = require('fs');

if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data/");
}

if (!fs.existsSync("./data/config.json")) {
  // If the file doesn't exist, create an empty JSON file
  fs.writeFileSync("./data/config.json", '{}');
}

// Start new timer on startup, to keep track of runtime
const startTime = Math.floor(new Date() / 1000);

app.use(cors({
  origin: '*'
  }),
  express.json() // This middleware parses JSON request bodies
);

// Middleware for access token check - excluding routes that don't need the token
app.use((req, res, next) => {
  if (req.url === '/metrics') {
    next();
    return;
  }

  const providedToken = req.header('Authorization')?.split(' ')[1];
  if (providedToken === CONFIG_KEY) {
    next(); // If the token is valid, continue to the next middleware or route
  } else {
    res.status(401).send('Unauthorized'); // For protected routes, return an unauthorized response
  }
});

app.get('/metrics', async (req, res) => {
  const mem = await si.mem();
  const cpu = await si.currentLoad();
  const disk = await si.fsSize();

  const metrics = {
    mem,
    cpu,
    disk,
    startTime
  };

  res.json(metrics);
});

// Update the current config
app.post('/config', async (req, res) => {
  fs.writeFile("./data/config.json", JSON.stringify(req.body), (err) => {
    if(err) {
      res.status(500).send('Error updating config'); // Set an appropriate error response
      throw err;
    } else res.status(200).send('Config updated successfully'); // Send a success response

  })
});

// Retrieve the current config
app.get('/config', async (req, res) => {
  const configFile = fs.readFileSync('./data/config.json');
  const configJson = JSON.parse(configFile);
  res.json(configJson);
});

app.listen(port, () => {
  console.log(`dojonode-systeminformation API listening at http://localhost:${port}`);
});
