const Http = require('http');
const Path = require('path');
const Url = require('url');
const Fs = require('fs');
const Static = require('node-static');
const Route = require(Path.join(__dirname, 'Route.js'));

const errorpages = require(Path.join(__dirname, '../config/routes.json'));

class HttpKernel {
    constructor (port, debug) {
        this.port = port;
        this.debug = debug;
        this.fichiersStatiques = new Static.Server(Path.join(__dirname, '../web'));
    }
    
    start() {
        Http.createServer((requete, reponse) => {
            this.traiterRequete(requete, reponse);
        }).listen(this.port);
    }
    
    traiterRequete(requete, reponse) {
        let url = Url.parse(requete.url, true);
        let route = Route.getRoute(url.pathname);
        
        console.log('\nRessource : ' + url.pathname);
        
        if (route !== null) {
            // render
            console.log('Route matchée');
            this.invoquerControleur(requete, reponse, route);
        } else {
            // on essaie les fichiers statiques
            this.servirStatique(requete, reponse, url);
        }
    }
    
    servirStatique(requete, reponse, url_ou_httpStatus) {
        if (typeof url_ou_httpStatus === 'number') {
            const config = require(Path.join(__dirname, '../config/config.json'));
            let status = url_ou_httpStatus;
            let tmp;
            let htmlStatique = false;
            
            console.log('servirStatique() avec httpStatus');
            
            function htmlMinimal(status, reponse) {
                reponse.writeHead(status);
                reponse.end('<!DOCTYPE html><html><head><title>' + status 
                            + '</title></head><body><h1>Erreur ' + status 
                            + '</h1></body></html>');
            }
            
            tmp = config.pages_erreurs[status.toString()];
            if (typeof tmp !== 'undefined') {
                console.log(tmp);
                this.fichiersStatiques.serveFile(tmp, status, {}, requete, reponse)
                .on('error', () => {
                    htmlMinimal(status, reponse);
                });
            } else {
                htmlMinimal(status, reponse);
            }
            
            return;
        }
        
        let url = url_ou_httpStatus;
            
        Fs.access(Path.normalize(__dirname) + '/../web' + url.pathname, Fs.constants.R_OK, (err) => {
            if (err) {
                // erreur
                console.log('404 Not Found');
                this.servirStatique(requete, reponse, 404);
            } else {
                // c'est effectivement un fichier statique
                console.log('Fichier statique servit');
                this.fichiersStatiques.serveFile(url.pathname, 200, {}, requete, reponse);
            }
        });
    }
    
    invoquerControleur(requete, reponse, route) {
        try {
          const controleur = require(Path.join(__dirname, '../src/controleurs/', route.controleur + '.js'));
          (new controleur)[route.methode + 'Action'](requete, reponse, route.params);
        } catch (e) {
            console.log(e);
            this.servirStatique(requete, reponse, 500);
        }
    }
}

module.exports = HttpKernel;