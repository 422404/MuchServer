var debutTemplate = 'return "';
var finTemplate = '";'

class Template {
    constructor(texte) {
        this.texte = '' + texte;
        this.compile = '';
    }
    
    compiler() {
        let token;
        let index;
        let texteRemplacage;
        
        // on echappe les fins de lignes
        this.compile = this.texte.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n')
                .replace(/'/g, '\\\'').replace(/"/g, '\\\"');
        
        while ((index = this.compile.indexOf('[[')) !== -1) {
            // un peu de vaudou avec cet index de fin
            token = this.compile.substring(index, this.compile.indexOf(']]') + 2);
            console.log(token);
            texteRemplacage = this.traiterToken(token);
            
            if (texteRemplacage !== null) {
                // on replace le prochain token par son code equivalant javascript
                this.compile = this.compile.replace(token, texteRemplacage);
            }
        }
            
        // on ajoute la fonction englobant le code traduit
        this.compile = debutTemplate +  this.compile + finTemplate;
        
        // on rattache la methode cree a l'objet courant
        console.log(this.compile);
        this._getRendu = new Function('params', this.compile);
    }
    
    getRendu(params) {
        try {
            return this._getRendu(params);
        } catch(e) {    
            throw 'Pas de rendu, ou erreur dans le rendu';
        }
    }
    
    traiterToken(expression) {
        if (expression.match(/\[\[\ if\ /) !== null) {
            // token if
            return Template.compilerIf(expression);
        } else if (expression.match(/\[\[\ endif\ /) !== null) {
            // token endif
            return Template.compilerEndif();
        } else {
           // variable
           return Template.compilerAffichageValeur(expression);
        }
    }
    
    static compilerIf(expression) { // TODO check si les variables sont undefined
        let _if = expression.replace('[[', '').trim();       
        _if = _if.replace('if', '" + (function () { if (');
        _if = _if.replace(']]', ') {');
        // [[ if ... ]] --> " + (function () { if (...) {
        
        let tmp = _if.substring(_if.indexOf('(', 20) + 1, _if.indexOf(')', 20));
        // on recolte le nom des variables avec match() et on remplace dans la string originale
       
        let variables = [... new Set(tmp.match(/[ ]+[^'"][a-z_$][a-z0-9_$]+/gi))]; // on force l'unicité
        for (let variable of variables) {
            if (variable !== 'false'
                    && variable !== 'true'
                    && variable !== 'null'
                    && variable !== 'undefined'
                    && variable !== 'typeof') {
                _if = _if.replace(new RegExp(variable, 'g'), 'params.' + variable);
            }
        }
        
        _if += ' return "';
        
        return _if.replace(/\\'/g, '\'').replace(/\\"/g, '\'');
    }
    
    static compilerAffichageValeur(expression) {
        let variable = expression.replace('[[', '').replace(']]', '').trim();
        
        return '" + (function () { ' +
                 'if (!\'' + variable + '\' in params) ' +
                   'throw new ErreurCompilation(\'variable ' + variable + ' non définie\');' +
                 'else return params.' + variable + ';' +
               '}) + "';
    }
    
    static compilerEndif() {
        return '"; } else { return ""; }})() + "';
    }
}

module.exports = Template;