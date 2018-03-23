/**
 * Exception levée durant la phase de compilation d'une template
 */
class ExceptionCompilation {
    /**
     * @param message expliquant la cause de l'exception
     */
    constructor(msg) {
        this.msg = msg;
    }
    
    toString() {
        return this.msg;
    }
}

module.exports = ExceptionCompilation;