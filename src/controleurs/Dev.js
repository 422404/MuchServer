const Path = require('path');
const Controleur = require(Path.join(__dirname, '../../app/Controleur.js'));

class DevControleur extends Controleur {
    indexAction(requete, reponse, params) {
        this.rendre(requete, reponse, 'hello.template', {
            nb: params.nb,
            titre: 'Mon super titre !',
        });
    }
}

module.exports = DevControleur;