var express = require('express');
var router = express.Router();
var zmq = require("zeromq"),
  sock = zmq.socket("pull"),
  sockPush = zmq.socket("push");

sock.connect("tcp://127.0.0.1:8000");
sockPush.bindSync("tcp://127.0.0.1:8001");
let livres = [];

sock.on("message", function(msg) {
    let o = JSON.parse(msg.toString());
    if(o.action === "achat") {
        livres.forEach(livre => {
            if(livre.id === parseInt(o.idLivre)) {
                if(livre.stock > 1) {
                    livre.stock--;
                    console.log("livres, décompte stock")
                    sockPush.send(JSON.stringify({ action: "validation_achat", idLivre: o.idLivre }))
                } else {
                    // TODO
                    return;
                }
            }
        })
    }
    //console.log("work: %s", msg.toString());
});

router.get('/', function(req, res, next) {
    res.send(livres);
});

router.post('/', function(req, res, next) {
    let livre = {};
    livre.id = livres.length;
    livre.titre = req.body.titre;
    livre.auteur = req.body.auteur;
    livre.stock = 10;
    livres.push(livre);
    res.send({message: 'livre créé'});
});

router.get('/:id', function(req, res, next) {
    let livre = null;
    livres.forEach(l => {
        if(l.id === parseInt(req.params.id)) {
            livre = l;
        }
    })
    if(livre !== null) {
        res.send(livre)
    } else {
        res.status(404).send({error: 'livre introuvable'});
    }
});

router.post('/:id/acheter', function(req, res, next) {
    livres.forEach(livre => {
        if(livre.id === parseInt(req.params.id)) {
            if(livre.stock > 1) {
                livre.stock--;
            } else {
                res.status(400).send({ message: 'livre plus en stock' });
                return;
            }
        }
    })
    res.send({message: 'livre acheté'});
});

module.exports = router;
