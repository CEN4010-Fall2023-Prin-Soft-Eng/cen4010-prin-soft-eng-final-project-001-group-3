const express = require('express')
const app = express()
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

const port = process.env.PORT || 5678;

console.log(`Server listening at ${port}`);
app.listen(port);
