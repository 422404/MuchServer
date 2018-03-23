const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const MoteurTemplate = require(Path.join(__dirname, 'templating/MoteurTemplate.js'));

class Controleur {
    rendre(requete, reponse, path, params) {
        let html;
        let cheminTemplate = Path.join(__dirname, '../src/vues/', path);
        
        try {
          let template = MoteurTemplate.getTemplate(cheminTemplate);
          let templateCompilee = template.compiler();
          
          if (typeof params !== 'undefined')
              html = templateCompilee(...params);
          else
              html = templateCompilee();
          reponse.end(html);
        } catch (e) {
            console.log(e);
            reponse.writeHead(404);
            reponse.end();
        }
    }
}

module.exports = Controleur;