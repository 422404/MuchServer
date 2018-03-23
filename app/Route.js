const Path = require('path');
const routes = require(Path.join(__dirname, '../config/routes.json'));

class Route {
    constructor(ressource, route) {
        let infosControleur = route.controleur.split(':');
        if (infosControleur.length != 2
                || infosControleur[0].trim().length == 0
                || infosControleur[1].trim().length == 0) {
            throw "Erreur ";
        }
        
        this.controleur = infosControleur[0].trim();
        this.methode = infosControleur[1].trim();
        
        // ex : "/index/10/salut/"
        //              ^
        let substrDebut = ressource.indexOf('/', 1) + 1;
        // ex : "/index/10/salut/" --> ["10", "12"]
        let ressourceParams = ressource
            .substr(substrDebut, ressource.length + 1)
            .split('/');
        
        // ex : "/index/{id}/{@txt}/" --> ["{id}", "{@txt}"]
        let routeParams = route.path
            .substr(substrDebut, route.path.length + 1)
            .split('/');
        let params = {};
        
        // console.log(ressourceParams);
        // console.log(routeParams);
        
        // ex : ["{id}", "{@txt}"] et ["10", "salut"]
        //      --> {id : 10, txt : "salut"}
        for (let i = 0; i < routeParams.length; i++) {
            if (routeParams[i].match(/\{[A-Za-z][A-Za-z0-9]*\}/g) !== null) {
                // si nombre
                params[routeParams[i].replace(/\{|\}/g, '')] = parseInt(ressourceParams[i]);
            } else if (routeParams[i].match(/\{\@[A-Za-z][A-Za-z0-9]*\}/g) !== null) {
                // sinon si string
                params[routeParams[i].replace(/\{|\@|\}/g, '')] = ressourceParams[i];
            }
        }
        
        this.params = params;
    }
    
    static getRoute(ressource) {
        try {
            for (let route of routes) {
                if (ressource.match(Route.path2Regex(route.path)) !== null) 
                    return new Route(ressource, route);
            }
        } catch (e) {}
        
        return null;
    }
    
    // ex : "/index/{id}/{@txt}/" --> /\/index\/[0-9]+\/[A-Za-z-_]+\//g
    static path2Regex(path) {
        // regex pour chaine de caracteres           "[A-Za-z\-_]+"
        // regex pour nombre                         "[0-9]+"
        // regex pour paramètre nombre               "\{[A-Za-z][A-Za-z0-9]*\}"
        // regex pour paramètre chaine de caractères "\{\@[A-Za-z][A-Za-z0-9]*\}"
        
        path = path.replace(/\{[A-Za-z][A-Za-z0-9]*\}/g, "[0-9]+"); // on place les regex pour les id/nombres
        path = path.replace(/\{\@[A-Za-z][A-Za-z0-9]*\}/g, "[A-Za-z\-_]+"); // on place les regex pour les strings
        
        return new RegExp('^' + path.replace(/\//g, '\\/') + '$', 'g');
    }
}

module.exports = Route;