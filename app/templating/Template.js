const Fs = require('fs');
const Path = require('path');
const ExceptionCompilation = require(Path.join(__dirname, 'ExceptionCompilation.js'));

/* Expressions :
 * - affichage de variable : [[ maVariable ]]
 * 
 * - commentaires : [# ceci est un commentaire #]
 * 
 * - échappement de code : [! code échappé : [[ maVariable ]] !]
 * 
 * - début bloc if : [% if a == b %]
 * 
 * - fin bloc if : [% endif %]
 * 
 * - début bloc foreach : [% foreach item in liste %] ou [% foreach i in 0..10 %]
 * 
 * - fin bloc foreach : [% endforeach %]
 */

const DELIM_VAR   = ['[[', ']]'];
const DELIM_BLOC  = ['[%', '%]'];
const DELIM_COM   = ['[#', '#]'];
const DELIM_ECHAP = ['[!', '!]'];

const REGEX_COM = /\[#.*#\]/;
const REGEX_ECHAP = /\[!.*!\]/;
const REGEX_VAR = /\[\[ *[a-zA-Z_$][0-9a-zA-Z_$]* *\]\]/;
const REGEX_BLOC_IF = /^\[% *if +.+ *%\]$/;
const REGEX_BLOC_ENDIF = /^\[% *endif *%\]$/;
const REGEX_BLOC_FOREACH = /^\[% *foreach +[a-zA-Z_$][0-9a-zA-Z_$]* +in +([a-zA-Z_$][0-9a-zA-Z_$]*|[0-9]+\.\.[0-9]+) *%\]$/;
const REGEX_BLOC_ENDFOREACH = /^\[% *endforeach *%\]$/;

const typeExpression = {
    TEXTE      : 0,
    VAR        : 1,
    COM        : 2, // n'est tout simplement pas pushé dans la FIFO
    ECHAP      : 3,
    IF         : 4,
    ENDIF      : 5,
    FOREACH    : 6,
    ENDFOREACH : 7
};

/**
 * Template non compilée
 */
class Template {
    /**
     * Charge le fichier rattaché au chemin donné et renvoie une instance 
     * de Template
     * @param pathTemplate chemin vers le fichier template à lire
     */
    constructor(pathTemplate) {
        /**
         * Chemin vers la template
         */
        this.path = pathTemplate;
        
        /**
         * Texte de la template
         */
        this.texteTemplate = null;
        
        /* *
         * Liste des paramètres utilisés dans la template
         * Permet d'énumérer les arguments de la fonction résultant
         * de la compilation
         */
        this.parametres = [];
        
        /**
         * Pile FIFO (First In First Out) qui accueillera les éléments qui
         * constituront (après certaines modifications) les strings à
         * concaténer par la fonction compilée de la template
         */
        this.fifoElements = [];
        
        /**
         * Indice de début de bloc
         */
        this.debut = 0;
        
        /**
         * Indice de fin de bloc
         */
        this.fin = 0;
        
        /**
         * Fonction compilée finale
         */
        this.fonctionCompilee = null;
        
        /**
         * Texte de la template
         */
        this.texteTemplate = Fs.readFileSync(pathTemplate, 'utf-8');
    }
    
    /**
     * Compile la template en une fonction
     * @return fonction compilée de la template si aucune erreur
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    compiler() {
        while (true) {
            if (!this.prochaineExpression()) break;
            
            let type = this.getType();
            console.log('Expression trouvée | type : ' + type);
            if (type !== typeExpression.COM) {
                this.pushFIFO(
                    this.texteTemplate.substring(this.debut, this.fin),
                    type
                );
            }
            this.debut = this.fin;
        }
        
        console.log();
        console.log(this.fifoElements);
    }
    
    /**
     * Push un élément dans la FIFO avec des données additionnelles pour la compilation
     * @param elementTexte representation textuelle de l'élément dans la template
     * @param type type de l'élément (voir enum typeExpression)
     */
    pushFIFO(elementTexte, type) {
        this.fifoElements.push(
            {
                texte: elementTexte,
                type : type
            }
        );
    }
    
    /**
     * Compile les éléments de la FIFO et renvoie le code compilé
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    compilerElementsFIFO() {
        let code = "";
        
        for (let e of this.fifoElements) {
            switch (e.type) {
                case typeExpression.TEXTE:
                    code += '__res += "' 
                            + e.texte
                                // on échappe les guillemets et accolades
                                .replace(/'/g, "\\\'")
                                .replace(/"/g, "\\\"")
                                // on échappe les \n, \r, et \t
                                .replace(/\n/g, "\\n")
                                .replace(/\r/g, "\\r")
                                .replace(/\t/g, "\\t")
                            + '";';
                    break;
                
                case typeExpression.ECHAP:
                    code += '__res += "'
                            + e.texte
                                // on retire les ouvertures et fermetures d'expressions
                                .substring(2, e.texte.length - 2)
                                .trim()
                                // on échappe les guillemets et accolades
                                .replace(/'/g, "\\\'")
                                .replace(/"/g, "\\\"")
                                // on échappe les \n, \r, et \t
                                .replace(/\n/g, "\\n")
                                .replace(/\r/g, "\\r")
                                .replace(/\t/g, "\\t")
                            + '";';
                    break;
                
                case typeExpression.VAR:
                    let nomVar = 'params.' 
                                 + e.texte
                                       // on retire les ouvertures et fermetures d'expressions
                                       .substring(2, e.texte.length - 2)
                                       .trim();
                    // this.ajouterParametre(nomVar);
                    code += 'if (typeof ' + nomVar + ' === \'undefined\')'
                            + 'throw \'Variable "' + nomVar + '" non définie.\';'
                            + '__res += ' + nomVar + ';';
                    break;
            }
        }
        
        return code;
    }
    
    /**
     * Construit une vérification de l'existance des paramètres de la fonction
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    /*compilerVerifParams() {
        return '';
    }*/
    
    /**
     * Ajoute un paramètre à la liste des paramètres si il ne s'y
     * trouve pas déjà
     * @param parametre nom du paramètre à rajouter à la liste
     * des paramètres de la fonction compilée
     */
    /*ajouterParametre(parametre) {
        for (let p of this.parametres) {
            if (p === parametre) return;
        }
        this.parametres.push(parametre);
    }*/
    
    /**
     * Crée la fonction compilée finale si elle n'a pas déjà été compilée
     * sinon renvoie juste sa référence
     * @return objet Function de la fonction compilée
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    creerFonction() {
        if (this.fonctionCompilee) return this.fonctionCompilee;
        this.compiler();
        
        // le nom d'identificateur __res est réservé
        const variableRes = 'let __res = "";';
        const retourRes = 'return __res;';
        // const verifParams = this.compilerVerifParams();
        const code = this.compilerElementsFIFO();
        
        console.log();
        // console.log(this.parametres);
        console.log(code);
        return this.fonctionCompilee = new Function(
            'params',
            variableRes
            // + verifParams
            + code
            + retourRes
        );
    }
    
    /**
     * Positionne les indices autours de la prochaine experession
     * @return retourne true quand une expression a été détectée
     * @throws ExceptionCompilation
     */
    prochaineExpression() {
        // plus de caractères
        if (this.debut === this.texteTemplate.length) {
            return false;
        }
        
        let type = null;
        let debutExpr = this.texteTemplate.substr(this.debut, 2);
        
        // il ne reste que 1 caractère
        if (debutExpr.length === 1) {
            this.fin++; // = this.texteTemplate.length
            return true;
        }
        
        let finExpr = null;
        
        switch (debutExpr) {
            case DELIM_VAR[0] :
                finExpr = DELIM_VAR[1];
                type = 'var';
                break;
                
            case DELIM_COM[0] :
                finExpr = DELIM_COM[1];
                type = 'com';
                break;
                
            case DELIM_ECHAP[0] :
                finExpr = DELIM_ECHAP[1];
                type = 'echap';
                break;
                
            case DELIM_BLOC[0] :
                finExpr = DELIM_BLOC[1];
                type = 'bloc';
                break;
            
            default:
                type = 'texte';
        }
        
        // on cherche le début de la prochaine expression pour connaitre la fin
        // du texte
        if (type === 'texte') {
            let offset = this.debut;
            // tant que l'on ne trouve pas l'ouverture d'une prochaine expression
            // on boucle
            while (offset != this.texteTemplate.length) {
                let candidat = this.texteTemplate.indexOf('[', offset);
                if (candidat === -1) {
                    break;
                }
                
                let debutAutreExpr = this.texteTemplate.substr(candidat, 2);
                if (debutAutreExpr === DELIM_VAR[0]
                        || debutAutreExpr === DELIM_BLOC[0]
                        || debutAutreExpr === DELIM_COM[0]
                        || debutAutreExpr === DELIM_ECHAP[0]) {
                    this.fin = candidat;
                    return true;
                }
                
                offset = candidat + 1;
            }
            
            this.fin = this.texteTemplate.length;
            return true;
        }
        
        let indiceFinExpr = this.texteTemplate.indexOf(finExpr, this.debut);
        if (indiceFinExpr === -1) { // l'expression n'a pas de fermeture
            throw new ExceptionCompilation(
                "L'expression à l'indice ${this.debut} est malformé.\n" 
                + "Il manque la fermeture de la balise: '" + finExper + "'."
            );
        }
        this.fin = indiceFinExpr + 2; // on veut pointer après l'expression
        
        return true;
    }
    
    /**
     * Vérifie qu'il y ait le même nombre d'ouvertures de blocs que de fermetures
     * @return true si tout va bien sinon false
     */
    nbBlocsOuvertsEgalNbBlocsFermes() {
    }
    
    /**
     * Donne le type de l'expression courante
     * @return typeExpression si match sinon typeExpression.TEXTE
     */
    getType() {
        let expression = this.texteTemplate.substring(this.debut, this.fin);
        
        if (REGEX_VAR.test(expression)) return typeExpression.VAR;
        if (REGEX_COM.test(expression)) return typeExpression.COM;
        if (REGEX_ECHAP.test(expression)) return typeExpression.ECHAP;
        if (REGEX_BLOC_IF.test(expression)) return typeExpression.IF;
        if (REGEX_BLOC_ENDIF.test(expression)) return typeExpression.ENDIF;
        if (REGEX_BLOC_FOREACH.test(expression)) return typeExpression.FOREACH;
        if (REGEX_BLOC_ENDFOREACH.test(expression)) return typeExpression.ENDFOREACH;
        
        return typeExpression.TEXTE;
    }
}

module.exports = Template;