const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const formidable = require('express-formidable');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(formidable());


router.get('/', function(req, res) {
    res.json({"LOl": "kek"})
});

router.post("/wh/", function (req, res) {
    console.log(req.body)
    console.log(req.fields)
    res.json({"OK": "Status ok"})
});


app.use('/', router);

module.exports = app;
