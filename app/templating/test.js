var Template = require('./Template.js');

let template = new Template('../../src/vues/hello.template');
let fn = template.creerFonction();

console.log("\n------------ Test 1 ------------");
try {
    console.log(fn({titre: 'titre ici', a: true, b: 'salut !', liste: ['a', 'b', 'c', 'd']}));
} catch (e) {
    console.log(e);
}
