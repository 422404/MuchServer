const Path = require('path');
const Template = require(Path.join(__dirname, 'Template.js'));

class MoteurTemplate {
    static getTemplate(path) {
        return new Template(path);
    }
    
    static compiler(template) {
        return template.compiler();
    }
}

module.exports = MoteurTemplate;