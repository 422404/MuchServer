const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const MoteurTemplate = require(Path.join(__dirname, 'templating/MoteurTemplate.js'));

class Controleur {
    rendre(requete, reponse, path, params) {
        let html;
        let cheminTemplate = Path.join(__dirname, '../src/vues/', path);
        let url = Url.parse(requete.url, true);
        let template = MoteurTemplate.getTemplate(cheminTemplate);
        let templateCompilee =  template.creerFonction();
      
        if (typeof params !== 'undefined') {
            html = templateCompilee(params);
        } else {
            html = templateCompilee();
        }
        reponse.end(html);
    }
}

module.exports = Controleur;