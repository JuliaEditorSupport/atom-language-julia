const CSON = require('cson')
const fs = require('fs')
const path = require('path')

const outdir = path.join(__dirname, '..', 'grammars')
const grammar = JSON.parse(fs.readFileSync(path.join(outdir, 'julia.json')))

// write normal JSON grammar
fs.writeFileSync(path.join(outdir, 'julia.cson'), CSON.stringify(grammar, null, 2))

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
fs.writeFileSync(path.join(outdir, 'julia_vscode.json'), JSON.stringify(grammar, null, 2))
