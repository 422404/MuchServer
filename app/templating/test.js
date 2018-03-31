var Template = require('./Template.js');

let template = new Template('../../src/vues/hello.template');

console.log("\n------------ Test 1 ------------");
let fn = template.creerFonction();
try {
    console.log(fn());
} catch (e) {
    console.log('OK');
}

console.log("\n------------ Test 2 ------------");
fn = template.creerFonction();
try {
    console.log(fn({variable: "salut!"}));
} catch (e) {
    console.log(e);
}
