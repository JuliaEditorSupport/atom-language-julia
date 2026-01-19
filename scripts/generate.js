const CSON = require('cson')
const fs = require('fs')
const path = require('path')

const outdir = path.join(__dirname, '..', 'grammars')
const variantdir = path.join(__dirname, '..', 'variants')

const consoleGrammar = JSON.parse(fs.readFileSync(path.join(outdir, 'julia-console.json')))
fs.writeFileSync(path.join(outdir, 'julia-console.cson'), CSON.stringify(consoleGrammar, null, 2))

let grammar = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'template', 'julia.json')))

const templateRules = {
    '{{id}}': '(?:[[:alpha:]_\\\\p{Lu}\\\\p{Ll}\\\\p{Lt}\\\\p{Lm}\\\\p{Lo}\\\\p{Nl}\\\\p{Sc}⅀-⅄∿⊾⊿⊤⊥∂∅-∇∎∏∐∑∞∟∫-∳⋀-⋃◸-◿♯⟘⟙⟀⟁⦰-⦴⨀-⨆⨉-⨖⨛⨜𝛁𝛛𝛻𝜕𝜵𝝏𝝯𝞉𝞩𝟃ⁱ-⁾₁-₎∠-∢⦛-⦯℘℮゛-゜𝟎-𝟡]|[^\\\\P{So}←-⇿])(?:[[:word:]_!\\\\p{Lu}\\\\p{Ll}\\\\p{Lt}\\\\p{Lm}\\\\p{Lo}\\\\p{Nl}\\\\p{Sc}⅀-⅄∿⊾⊿⊤⊥∂∅-∇∎∏∐∑∞∟∫-∳⋀-⋃◸-◿♯⟘⟙⟀⟁⦰-⦴⨀-⨆⨉-⨖⨛⨜𝛁𝛛𝛻𝜕𝜵𝝏𝝯𝞉𝞩𝟃ⁱ-⁾₁-₎∠-∢⦛-⦯℘℮゛-゜𝟎-𝟡]|[^\\\\P{Mn}\\u0001-¡]|[^\\\\P{Mc}\\u0001-¡]|[^\\\\P{Nd}\\u0001-¡]|[^\\\\P{Pc}\\u0001-¡]|[^\\\\P{Sk}\\u0001-¡]|[^\\\\P{Me}\\u0001-¡]|[^\\\\P{No}\\u0001-¡]|[′-‷⁗]|[^\\\\P{So}←-⇿])*',
}

// recurse through grammar and replace values:
function recurseAndReplace(obj, key, val, replacement) {
    for (const objKey of Object.keys(obj)) {
        if (objKey === key && obj[objKey] === val) {
            obj[objKey] = replacement
        } else if (obj[objKey] instanceof Array || obj[objKey] instanceof Object) {
            recurseAndReplace(obj[objKey], key, val, replacement)
        }
    }
}

// templating
let grammarString = JSON.stringify(grammar)
for (const [k, v] of Object.entries(templateRules)) {
    grammarString = grammarString.replaceAll(k, v)
}
grammar = JSON.parse(grammarString)

// write normal JSON grammar
fs.writeFileSync(path.join(outdir, 'julia.json'), JSON.stringify(grammar, null, 2))

// write normal CSON grammar
fs.writeFileSync(path.join(outdir, 'julia.cson'), CSON.stringify(grammar, null, 2))

// fix markdown
recurseAndReplace(grammar, 'include', 'source.gfm', 'text.html.markdown.julia')

// Skip over-zealous top-level production in `source.cpp`. See offending pattern here:
// https://github.com/microsoft/vscode/blob/c3fe2d8acde04e579880413ae4622a1f551efdcc/extensions/cpp/syntaxes/cpp.tmLanguage.json#L745
recurseAndReplace(grammar, 'include', 'source.cpp', 'source.cpp#root_context')

//  Choose content names consistent with the vscode conventions for embedded code. Cf.:
//  https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide#embedded-languages
recurseAndReplace(grammar, 'contentName', 'source.cpp', 'meta.embedded.inline.cpp')
recurseAndReplace(grammar, 'contentName', 'source.gfm', 'meta.embedded.inline.markdown')
recurseAndReplace(grammar, 'contentName', 'source.js', 'meta.embedded.inline.javascript')
recurseAndReplace(grammar, 'contentName', 'source.r', 'meta.embedded.inline.r')
recurseAndReplace(grammar, 'contentName', 'source.python', 'meta.embedded.inline.python')

// write VSCode compatible JSON grammar
fs.writeFileSync(path.join(variantdir, 'julia_vscode.json'), JSON.stringify(grammar, null, 2))
