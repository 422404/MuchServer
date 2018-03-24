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
     * @return fonction compilée de la template si aucune erreur
     * @throws ExeptionCompilation si une erreur est levée lors de la compilation
     */
    compiler() {
        if (this.fonctionCompilee) return this.fonctionCompilee;
        
        while (true) {
            this.debut = this.fin;
            
            
        }
    }
    
    /**
     * Push un élément dans la FIFO avec des données additionnelles pour la compilation
     * @param elementTexte representation textuelle de l'élément dans la template
     * @param type type de l'élément (voir enum typeExpression)
     */
    pushFIFO(elementTexte, type) {
    }
    
    /**
     * Compile les éléments de la FIFO 
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
     * @return objet Function de la fonction compilée
     */
    creerFonction() {
    }
    
    /**
     * Positionne les indices autours de la prochaine experession
     * @return typeExpression si une expression est trouvée sinon null
     */
    prochaineExpression() {
        // plus de caractères
        if (this.debut === this.texteTemplate.length) {
            return null;
        }
        
        let debutExpr = this.texteTemplate.substr(this.debut, 2);
        
        // il ne reste que 1 caractère
        if (debutExpr.length === 1) {
            this.fin++;
            return typeExpression.TEXTE;
        }
        
        let finExpr = null;
        
        switch (debutExpr) {
            case DELIM_VAR[0] :
            case DELIM_COM[0] :
            case DELIM_ECHAP[0] :
            case DELIM_BLOC[0] :
        }
        
        return null; //stub
    }
    
    /**
     * Positionne l'indice de fin au début de la prochaine expression
     * @param type type de fin d'expression à trouver
     * @return true si l'indice a été positionné en début d'expression sinon
     * false
     */
    prochaineFinExpression(type) {
    }
    
    /**
     * Donne le type de l'expression courante
     * @return typeExpression si match sinon typeExpression.TEXTE
     */
    getType() {
        let expression = this.texteTemplate.substring(this.debut, this.fin);
        
        if (REGEX_VAR.test(expression)) return typeElement.VAR;
        if (REGEX_COM.test(expression)) return typeElement.COM;
        if (REGEX_ECHAP.test(expression)) return typeElement.ECHAP;
        if (REGEX_BLOC_IF.test(expression)) return typeElement.IF;
        if (REGEX_BLOC_ENDIF.test(expression)) return typeElement.BLOC_ENDIF;
        if (REGEX_BLOC_FOREACH.test(expression)) return typeElement.BLOC_FOREACH;
        if (REGEX_BLOC_ENDFOREACH.test(expression)) return typeElement.BLOC_ENDFOREACH;
        
        return typeElement.TEXTE;
    }
}

module.exports = Template;