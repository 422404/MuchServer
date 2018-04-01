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

const REGEX_COM = /^\[#.*#\]$/;
const REGEX_ECHAP = /^\[!.*!\]$/;
const REGEX_VAR = /^\[\[ *[a-zA-Z_$][0-9a-zA-Z_$]* *\]\]$/;
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
                    code += this.compilerTexte(e.texte);
                    break;
                
                case typeExpression.ECHAP:
                    code += this.compilerEchap(e.texte);
                    break;
                
                case typeExpression.VAR:
                    code += this.compilerVar(e.texte);
                    break;
                
                case typeExpression.IF:
                    code += this.compilerIf(e.texte);
                    break;
                    
                case typeExpression.FOREACH:
                    code += this.compilerForeach(e.texte);
                    break;
                
                case typeExpression.ENDIF:
                case typeExpression.ENDFOREACH:
                    code += ' } ';
                    break;
            }
        }
        
        return code;
    }
    
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
        const verifParams = 'if (typeof params === \'undefined\') params = {};';
        const retourRes = 'return __res;';
        const code = this.compilerElementsFIFO();
        
        console.log();
        console.log(code);
        return this.fonctionCompilee = new Function(
            'params',
            variableRes
            + verifParams
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
                "L'expression à l'indice " + this.debut + " est malformé.\n" 
                + "Il manque la fermeture de la balise: '" + finExper + "'."
            );
        }
        this.fin = indiceFinExpr + 2; // on veut pointer après l'expression
        
        return true;
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
    
    /**
     * Compile une expression d'affichage de variable
     * @param exp expression à compiler
     */
    compilerVar(exp) {
        // on retire les ouvertures et fermetures d'expressions
        let nomVar = exp.substring(2, exp.length - 2).trim();
        
        return codeVerif(nomVar) + '__res += ' + 'typeof params.' 
                + nomVar + ' !== \'undefined\' ? params.'+ nomVar 
                + ' : ' + nomVar + ';';
    }
    
    /**
     * Compile une expression d'échappement
     * @param exp expression à compiler
     */
    compilerEchap(exp) {
        return '__res += "' + echap(
                    exp
                    // on retire les ouvertures et fermetures d'expressions
                    .substring(2, exp.length - 2)
                    .trim()
                ) + '";';
    }
    
    /**
     * Compile une expression texte
     * @param exp expression à compiler
     */
    compilerTexte(exp) {
        return '__res += "' + echap(exp) + '";';
    }
    
    /**
     * Compile une expression if
     * @param exp expression à compiler
     */
    compilerIf(exp) {
        let code = '';
        
        // permet de valider et récupérer les conditions du if
        const COND_REGEX = /(((typeof *|instanceof *)?[a-zA-Z_$][0-9a-zA-Z_$]* *(% *[0-9]+ *)?(===|==|!==|!=|<=|>=|<|>|in) *([a-zA-Z_$][0-9a-zA-Z_$]*|\"[^\"]*\"|\'[^\']*\'|[0-9]+) *(&&|\|\|)? *)+)/;
        
        let conditionsArray = exp.match(COND_REGEX);
        if (conditionsArray === null)
            throw new ExceptionCompilation('Une ou plusieurs condition d\'un if sont invalides.');
        
        let conditions = conditionsArray[0];
        
        /* tout identificateur qui n'est pas un mot reservé pour les conditions
         * est prefixé avec le nom de  l'objet qui passe les paramètres 'params.'
         * Mot réservés : typeof, instanceof, true, false, null
         */
        // on récupère les left values et les right values des conditions
        let tmp = conditions.split(/(&&|\|\||===|==|!==|!=|<=|>=|<|>|%)/g);
        let identificateursNonUniques = [];
        let conditionsModifies = '';
        
        for (let c of tmp) { // on récupère les identificateurs
            c = c.trim();
            if (!/(&&|\|\||===|==|!==|!=|<=|>=|<|>|%|instanceof|typeof|true|false|null)/g.test(c)
                    && c[0] !== '\'' && c[0] !== '"' && !/[0-9]+/.test(c)) {
                identificateursNonUniques.push(c);
                conditionsModifies += 'params.' + c;
            } else {
                conditionsModifies += c;
            }
        }
        
        // on enlève les doublons
        let identificateurs = new Set(identificateursNonUniques);
        // on ajoute les vérifications de l'existance des variables
        for (let i of identificateurs) {
            code += codeVerif(i);
        }
        
        return code + 'if (' + conditionsModifies + ') { ';
    }
    
    /**
     * Compile une expression foreach
     * @param exp expression à compiler
     */
    compilerForeach(exp) {
        let code = '';
        let tokens = exp.substring(exp.indexOf('for') + 3, exp.length - 2)
                .trim().split(/ +/g);
        
        let nomItem = tokens[1]
        let liste = tokens[3];
        
        if (/^[0-9]+\.\.[0-9]+$/.test(liste)) {
            let bornes = liste.match(/[0-9]+/g);
            bornes[0] = Number(bornes[0]);
            bornes[1] = Number(bornes[1]);
            let dec = bornes[0] > bornes[1]; // 0..2 on incrémente, 2..0 on décrémente
            let tab = [];
            
            if (dec) {
                for (let i = bornes[0]; i >= bornes[1]; i--)
                    tab.push(i);
            } else {
                for (let i = bornes[0]; i <= bornes[1]; i++)
                    tab.push(i);
            }
            
            console.log(tab);
            
            // on sérialize le tableau
            liste = JSON.stringify(tab);
        } else {
            code += codeVerif(liste);
            liste = 'params.' + liste;
        }
        
        return code + 'for (let ' + nomItem + ' of ' + liste + ') { ';
    }
}

/**
 * Revoie le code de vérification de la définition d'une variable
 * @param nomVar nom de la variable
 */
function codeVerif(nomVar) {
    return 'if (typeof params.' + nomVar + ' === \'undefined\' '
            + '&& typeof '+ nomVar + ' === \'undefined\') '
            + 'throw \'Variable "' + nomVar + '" non définie.\';'
}

/**
 * Echappe les accolades, guillemets, \n, \r et \t
 * @param texte texte à échapper
 */
function echap(texte) {
    return texte
            // on échappe les guillemets et accolades
            .replace(/'/g, "\\\'")
            .replace(/"/g, "\\\"")
            // on échappe les \n, \r, et \t
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
}

module.exports = Template;
