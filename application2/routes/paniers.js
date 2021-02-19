var express = require('express');
var router = express.Router();
const axios = require('axios');
var zmq = require("zeromq"),
  sock = zmq.socket("push")
  sockPull = zmq.socket("pull");

let paniers = [];
sock.bindSync("tcp://127.0.0.1:8000");
sockPull.connect("tcp://127.0.0.1:8001");

sockPull.on("message", function(msg) {
    console.log("message reçu")
    let o = JSON.parse(msg.toString());
    if(o.action === "validation_achat") {
        console.log("panier validé")
    }
});

router.get('/', function (req, res, next) {
    res.send(paniers);
});

router.post('/', function (req, res, next) {
    let panier = {};
    panier.idLivre = req.body.idLivre;

    axios.get(`http://127.0.0.1:3000/livres/${panier.idLivre}`)
        .then(function (response) {
            panier.id = paniers.length;
            panier.date = new Date();
            paniers.push(panier);
            res.send({ message: 'panier créé' });
        })
        .catch(function (error) {
            res.status(400).send({ message: 'panier non créé' });
        })
});

router.put('/:id/valider', function (req, res, next) {
    let panier = null;
    paniers.forEach(p => {
        if(p.id === parseInt(req.params.id)) {
            panier = p;
        }
    })
    if(panier !== null) {
        sock.send(JSON.stringify({ action: "achat", idLivre: panier.idLivre }));
        /*axios.post(`http://127.0.0.1:3000/livres/${panier.idLivre}/acheter`)
        .then(function (response) {
            res.send({ message: 'panier validé' });
        })
        .catch(function (error) {
            res.status(400).send({ message: 'panier non validé' });
        })*/
        res.send({ message: 'panier en cours de validation' });
    } else {
        res.status(404).send({error: 'panier introuvable'});
    }
});

module.exports = router;
