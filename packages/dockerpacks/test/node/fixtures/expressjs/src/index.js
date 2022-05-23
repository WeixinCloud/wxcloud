const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }));
app.use(bodyParser.text({ type: 'text/html' }));

app.get('/', async (req, res) => {
  res.json({ Hello: 'World' });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
