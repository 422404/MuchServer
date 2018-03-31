var Template = require('./Template.js');

let template = new Template('../../src/vues/hello.template');
let fn = template.creerFonction();

console.log("\n------------ Test 1 ------------");
try {
    console.log(fn());
} catch (e) {
    console.log(e);
}

console.log("\n------------ Test 2 ------------");
try {
    console.log(fn({variable: "salut!"}));
} catch (e) {
    console.log(e);
}

console.log("\n------------ Test 3 ------------");
try {
    console.log(fn({variable: "hey!", a: 10, c: 10}));
} catch (e) {
    console.log(e);
}

console.log("\n------------ Test 4 ------------");
try {
    console.log(fn({variable: "salut!", a: 'hello', c: 10}));
} catch (e) {
    console.log(e);
}
