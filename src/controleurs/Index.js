const Path = require('path');
const Controleur = require(Path.join(__dirname, '../../app/Controleur.js'));

class IndexControleur extends Controleur {
    indexAction(requete, reponse) {
        this.rendre(requete, reponse, 'docs/index.template');
    }
    
    templatingAction(requete, reponse) {
        this.rendre(requete, reponse, 'docs/templating/index.template');
    }
    
    ifAction(requete, reponse) {
        this.rendre(requete, reponse, 'docs/templating/if.template');
    }
}

module.exports = IndexControleur;