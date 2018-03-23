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
    TEXTE      : 0, // n'est pas compilé, reste intact
    VAR        : 1,
    COM        : 2, // n'est tout simplement pas pushé dans la FIFO
    ECHAP      : 3, // n'est tout simplement pas pushé dans la FIFO
    IF         : 4,
    ENDIF      : 5,
    FOREACH    : 6,
    ENDFOREACH : 7,
    BLOC       : 8  // général
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
        /*
         * Chemin vers la template
         */
        this.path = pathTemplate;
        
        /*
         * Texte de la template
         */
        this.texteTemplate = null;
        
        /* Liste des identificateurs utilisés dans la template
         * Permet d'énumérer les arguments de la fonction résultant
         * de la compilation
         * Permettra aussi d'ajouter des vérifications sur le reseignement
         * ou non de certaines variables à l'invocation
         */
        this.identificateurs = [];
        
        /*
         * Pile FIFO (First In First Out) qui accueillera les éléments qui
         * constituront (après certaines modifications) les strings à
         * concaténer par la fonction compilée de la template
         */
        this.fifoElements = [];
        
        /*
         * Indice de début de bloc
         */
        this.debut = 0;
        
        /*
         * Indice de fin de bloc
         */
        this.fin = 0;
        
        /*
         * Fonction compilée finale
         */
        this.fonctionCompilee = null;
        
        this.texteTemplate = Fs.readFileSync(pathTemplate, 'utf-8');
    }
    
    /**
     * Compile la template en une fonction si elle n'a pas déjà été compilée
     * sinon renvoie juste sa référence
     * @result fonction compilée de la template si aucune erreur
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    compiler() {
        let typeExpr;
        let finExpr;
        let expression;
        let typeEtendu;
        
        while (true) {
            this.debut = this.fin;
            
            // on boucle à la recherche de début d'expression potentielle
            typeExpr = this.prochaineExpression();
            if (typeExpr == null) break;
            
            // on push le texte precèdent l'expression si elle n'est pas en première position
            if (this.debut !== this.texteTemplate.length)
                pushFIFO(this.texteTemplate.substr(0, this.debut), typeExpression.TEXTE);
            
            // on cherche la fin de l'expression
            finExper = this.prochaineFinExpression(typeExpr);
            if (finExpr === false) 
                throw new ExceptionCompilation(
                    'Expression non fermée (char: ' + this.debut + ')'
                );
            
            expression = this.texteTemplate.substring(this.debut, this.fin + 1);
            typEtendu = getTypeEtendu(expression);
            if (typeEtendu === null)
                throw new ExceptionCompilation(
                    'Expression inconnue (char: ' + this.debut + ')'
                );
            
            pushFIFO(expression, typeEtendu);
        }
        
        console.log(this.fifoElements);
        
        // compilation de toutes les expressions dans la FIFO
        
        // Réassemblage et renvoi de la fonction
    }
    
    /**
     * Push un élément dans la FIFO avec des données additionnelles pour la compilation
     * @param elementTexte representation textuelle de l'élément dans la template
     * @param type type de l'élément (voir enum typeExpression)
     */
    pushFIFO(elementTexte, type) {
        
    }
    
    /**
     * Compile les éléments de la FIFO qui ont besoin de l'être
     * N'apporte aucune modification aux autres
     */
    compilerElementsFIFO() {
        
    }
    
    /**
     * Ajoute un identificateur à la liste des identificateurs si il ne s'y
     * trouve pas déjà
     * @param identificateur nom de l'identificateur à rajouter à la liste
     * des identificateurs utilisés en arguments de la fonction compilée
     */
    ajouterIdentificateur(identificateur) {
        
    }
    
    /**
     * Crée la fonction compilée finale
     * @result objet Function de la fonction compilée
     */
    creerFonction() {
        
    }
    
    /**
     * Positionne l'indice de fin au début de la prochaine expression
     * @return typeExpression si une expression est trouvée sinon null
     * @todo finir le code
     */
    prochaineExpression() {
        let matchIndice = this.texteTemplate.indexOf(DELIM_VAR[0], this.debut);
        if (matchIndice !== -1) {
            this.fin = matchIndice;
            return typeExpression.VAR;
        }
        
        matchIndice = this.texteTemplate.indexOf(DELIM_BLOC[0], this.debut);
        if (matchIndice !== -1) {
            this.fin = matchIndice;
            return typeExpression.BLOC;
        }
        
        matchIndice = this.texteTemplate.indexOf(DELIM_COM[0], this.debut);
        if (matchIndice !== -1) {
            this.fin = matchIndice;
            return typeExpression.COM;
        }
        
        matchIndice = this.texteTemplate.indexOf(DELIM_ECHAP[0], this.debut);
        if (matchIndice !== -1) {
            this.fin = matchIndice;
            return typeExpression.ECHAP;
        }
        
        return null;
    }
    
    /**
     * Positionne l'indice de fin au début de la prochaine expression
     * @param type type de fin d'expression à trouver
     * @return true si l'indice a été positionné en début d'expression sinon
     * false
     */
    prochaineFinExpression(type) {
        let match;
        
        switch (type) {
            case typeElement.VAR:
                match = DELIM_VAR[1];
                break;
            
            case typeElement.COM:
                match = DELIM_COM[1];
                break;
            
            case typeElement.BLOC:
                match = DELIM_BLOC[1];
                break;
            
            case typeElement.ECHAP:
                match = DELIM_ECHAP[1];
                break;
            
            default:
                return false;
        }
        
        let indiceFinExpr = this.texteTemplate.indexOf(match, this.fin);
        if (indiceFinExpr == -1) return false;
        
        this.fin = indiceFinExpr;
        
        return true;
    }
    
    /**
     * Donne le type étendu d'un bloc
     * @param expression
     * @return typeExpression si match sinon null
     */
    getTypeEtendu(expression) {
        if (REGEX_VAR.test(expression)) return typeElement.VAR;
        if (REGEX_COM.test(expression)) return typeElement.COM;
        if (REGEX_ECHAP.test(expression)) return typeElement.ECHAP;
        if (REGEX_BLOC_IF.test(expression)) return typeElement.IF;
        if (REGEX_BLOC_ENDIF.test(expression)) return typeElement.BLOC_ENDIF;
        if (REGEX_BLOC_FOREACH.test(expression)) return typeElement.BLOC_FOREACH;
        if (REGEX_BLOC_ENDFOREACH.test(expression)) return typeElement.BLOC_ENDFOREACH;
        
        return null
    }
}

module.exports = Template;