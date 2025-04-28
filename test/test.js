const fs = require('fs')
const path = require('path')
const vsctm = require('vscode-textmate')
const oniguruma = require('vscode-oniguruma')
const { expect } = require('chai')

const GRAMMAR_PATH = path.join(__dirname, '../grammars/julia_vscode.json')
const GRAMMAR_CONSOLE_PATH = path.join(__dirname, '../grammars/julia-console.json')

/**
 * Utility to read a file as a promise
 */
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => error ? reject(error) : resolve(data))
    })
}

const wasmBin = fs.readFileSync(path.join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm')).buffer
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
    return {
        createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns) },
        createOnigString(s) { return new oniguruma.OnigString(s) }
    }
})

// Create a registry that can create a grammar from a scope name.
const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: (scopeName) => {
        if (scopeName === 'source.julia') {
            return readFile(GRAMMAR_PATH).then(data => vsctm.parseRawGrammar(data.toString(), GRAMMAR_PATH))
        }
        if (scopeName === 'source.julia.console') {
            return readFile(GRAMMAR_CONSOLE_PATH).then(data => vsctm.parseRawGrammar(data.toString(), GRAMMAR_PATH))
        }
        return null
    }
})

function tokenize(grammar, line) {
    const tokens = grammar.tokenizeLine(line).tokens

    return tokens.map((t) => {
        return {
            scopes: t.scopes.filter(s => s !== "source.julia"),
            value: line.slice(t.startIndex, t.endIndex)
        }
    })
};

function compareTokens(actual, expected) {
    expect(actual.length).to.be.greaterThanOrEqual(expected.length)

    for (let i = 0; i < expected.length; i++) {
        expect(actual[i]).to.deep.equal(expected[i])
    }
}

// Load the JavaScript grammar and any other grammars included by it async.
describe('Julia grammar', function () {
    let grammar
    before(async function () {
        grammar = await registry.loadGrammar('source.julia')
    })
    it('parses the grammar', function () {
        expect(grammar).to.be.a('object')
    })
    it("tokenizes element-wise operators", function () {
        const tokens = tokenize(grammar, "A .* B'")
        compareTokens(tokens, [
            {
                value: "A ",
                scopes: []
            },
            {
                value: ".*",
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "B",
                scopes: []
            },
            {
                value: "'",
                scopes: ["keyword.operator.transposed-variable.julia"]
            },
        ])
    })
    it("tokenizes functions and types", function () {
        const tokens = tokenize(grammar, "à_b9!(a::Int64)")
        compareTokens(tokens, [
            {
                value: "à_b9!",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Int64",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes struct definitions", function () {
        const tokens = tokenize(grammar, "struct Foo end")
        compareTokens(tokens, [
            {
                value: "struct",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " Foo ",
                scopes: []
            },
            {
                value: "end",
                scopes: ["keyword.control.end.julia"]
            },
        ])
    })
    it("tokenizes mutable struct definitions", function () {
        const tokens = tokenize(grammar, "mutable  struct Foo end")
        compareTokens(tokens, [
            {
                value: "mutable  struct",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " Foo ",
                scopes: []
            },
            {
                value: "end",
                scopes: ["keyword.control.end.julia"]
            },
        ])
    })
    it("tokenizes abstract type definitions", function () {
        const tokens = tokenize(grammar, "abstract type Foo end")
        compareTokens(tokens, [
            {
                value: "abstract type",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " Foo ",
                scopes: []
            },
            {
                value: "end",
                scopes: ["keyword.control.end.julia"]
            },
        ])
    })
    it("tokenizes primitive type definitions", function () {
        const tokens = tokenize(grammar, "primitive type Foo 64 end")
        compareTokens(tokens, [
            {
                value: "primitive type",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " Foo ",
                scopes: []
            },
            {
                value: "64",
                scopes: ["constant.numeric.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "end",
                scopes: ["keyword.control.end.julia"]
            },
        ])
    })
    it("doesn't tokenize 'mutable', 'abstract' or 'primitive' on their own", function () {
        const tokens = tokenize(grammar, "mutable = 3; abstract = 5; primitive = 11")
        compareTokens(tokens, [
            {
                value: "mutable ",
                scopes: []
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "3",
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ";",
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: " abstract ",
                scopes: []
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "5",
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ";",
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: " primitive ",
                scopes: []
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "11",
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it("tokenizes types ignoring whitespace", function () {
        const tokens = tokenize(grammar, "f(x :: Int, y     ::   Float64, z::Float32, a :: X.Y.Z.A, b ::    X.Y.Z)")
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "x",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "Int",
                scopes: ["support.type.julia"]
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " y",
                scopes: []
            },
            {
                value: "     ",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "   ",
                scopes: []
            },
            {
                value: "Float64",
                scopes: ["support.type.julia"]
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " z",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Float32",
                scopes: ["support.type.julia"]
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " a",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "X.Y.Z.A",
                scopes: ["support.type.julia"]
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " b",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "    ",
                scopes: []
            },
            {
                value: "X.Y.Z",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes `const` as a keyword", function () {
        const tokens = tokenize(grammar, "const Foo")
        compareTokens(tokens, [
            {
                value: "const",
                scopes: ["keyword.storage.modifier.julia"]
            },
            {
                value: " Foo",
                scopes: []
            },
        ])
    })
    it("tokenizes functions and (shallowly nested) parameterized types", function () {
        const tokens = tokenize(grammar, "x{T <: Dict{Any, Tuple{Int, Int}}}(a::T, b::Union{Int, Set{Any}})")
        compareTokens(tokens, [
            {
                value: "x",
                scopes: ["support.function.julia"]
            },
            {
                value: "{T <: Dict{Any, Tuple{Int, Int}}}",
                scopes: ["support.type.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " b",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Union{Int, Set{Any}}",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes functions with return type declarations", function () {
        const tokens = tokenize(grammar, "x{T<:AbstractInteger}(a::T)::Int")
        compareTokens(tokens, [
            {
                value: "x",
                scopes: ["support.function.julia"]
            },
            {
                value: "{T<:AbstractInteger}",
                scopes: ["support.type.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Int",
                scopes: ["support.type.julia"]
            },
        ])
    })
    it("tokenizes function declarations with interpolated type parameters", function () {
        const tokens = tokenize(grammar, "f(x::$foo)=3")
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "x",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "$foo",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: "3",
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it("tokenizes typed arrays and comprehensions", function () {
        const tokens = tokenize(grammar, "Int[x for x=y]")
        compareTokens(tokens, [
            {
                value: "Int",
                scopes: []
            },
            {
                value: "[",
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: "x ",
                scopes: ["meta.array.julia"]
            },
            {
                value: "for",
                scopes: ["meta.array.julia", "keyword.control.julia"]
            },
            {
                value: " x",
                scopes: ["meta.array.julia"]
            },
            {
                value: "=",
                scopes: ["meta.array.julia", "keyword.operator.update.julia"]
            },
            {
                value: "y",
                scopes: ["meta.array.julia"]
            },
            {
                value: "]",
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes begin/end indexing", function () {
        const tokens = tokenize(grammar, "ary[begin:end]")
        compareTokens(tokens, [
            {
                value: "ary",
                scopes: []
            },
            {
                value: "[",
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: "begin",
                scopes: ["meta.array.julia", "constant.numeric.julia"]
            },
            {
                value: ":",
                scopes: ["meta.array.julia", "keyword.operator.range.julia"]
            },
            {
                value: "end",
                scopes: ["meta.array.julia", "constant.numeric.julia"]
            },
            {
                value: "]",
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes qualified names", function () {
        const tokens = tokenize(grammar, "Base.@time")
        compareTokens(tokens, [
            {
                value: "Base",
                scopes: []
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "@time",
                scopes: ["support.function.macro.julia"]
            },
        ])
    })
    it("tokenizes qualified unicode names", function () {
        const tokens = tokenize(grammar, "Ñy_M0d!._àb9!_")
        compareTokens(tokens, [
            {
                value: "Ñy_M0d!",
                scopes: []
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "_àb9!_",
                scopes: []
            },
        ])
    })
    it("tokenizes extension of external methods", function () {
        const tokens = tokenize(grammar, "function Base.start(itr::MyItr)")
        compareTokens(tokens, [
            {
                value: "function",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " Base",
                scopes: []
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "start",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "itr",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "MyItr",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes macro calls", function () {
        const tokens = tokenize(grammar, "@. @elapsed x^2")
        compareTokens(tokens, [
            {
                value: "@.",
                scopes: ["support.function.macro.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "@elapsed",
                scopes: ["support.function.macro.julia"]
            },
            {
                value: " x",
                scopes: []
            },
            {
                value: "^",
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: "2",
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it("tokenizes using statements", function () {
        const tokens = tokenize(grammar, "using Base.Test")
        compareTokens(tokens, [
            {
                value: "using",
                scopes: ["keyword.control.using.julia"]
            },
            {
                value: " Base",
                scopes: []
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "Test",
                scopes: []
            },
        ])
    })
    it("tokenizes import statements", function () {
        const tokens = tokenize(grammar, "import Base.Test")
        compareTokens(tokens, [
            {
                value: "import",
                scopes: ["keyword.control.import.julia"]
            },
            {
                value: " Base",
                scopes: []
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "Test",
                scopes: []
            },
        ])
    })
    it("tokenizes export statements", function () {
        const tokens = tokenize(grammar, "export my_awesome_function")
        compareTokens(tokens, [
            {
                value: "export",
                scopes: ["keyword.control.export.julia"]
            },
            {
                value: " my_awesome_function",
                scopes: []
            },
        ])
    })
    it("tokenizes public statements", function () {
        const tokens = tokenize(grammar, "public some_public_function")
        compareTokens(tokens, [
            {
                value: "public",
                scopes: ["keyword.control.public.julia"]
            },
            {
                value: " some_public_function",
                scopes: []
            },
        ])
    })
    it("does not tokenize public in non-toplevel scopes", function () {
        const tokens = tokenize(grammar, "2 + public")
        compareTokens(tokens, [
            {
                value: "2",
                scopes: ["constant.numeric.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "+",
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: " public",
                scopes: []
            },
        ])
    })
    it("tokenizes symbols", function () {
        const tokens = tokenize(grammar, ":à_b9!")
        compareTokens(tokens, [
            {
                value: ":à_b9!",
                scopes: ["constant.other.symbol.julia"]
            },
        ])
    })
    it("tokenizes regular expressions", function () {
        const tokens = tokenize(grammar, 'r"[jJ]ulia"im')
        compareTokens(tokens, [
            {
                value: "r\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
            },
            {
                value: "[jJ]ulia",
                scopes: ["string.regexp.julia"]
            },
            {
                value: "\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
            },
            {
                value: "im",
                scopes: ["string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]
            },
        ])
    })
    it("tokenizes regular expressions with triple quotes", function () {
        const tokens = tokenize(grammar, 'r"""[jJ]ulia "jl" xyz"""im')
        compareTokens(tokens, [
            {
                value: "r\"\"\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
            },
            {
                value: "[jJ]ulia \"jl\" xyz",
                scopes: ["string.regexp.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
            },
            {
                value: "im",
                scopes: ["string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]
            },
        ])
    })
    it("tokenizes empty regular expressions", function () {
        const tokens = tokenize(grammar, 'r""')
        compareTokens(tokens, [
            {
                value: "r\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
            },
            {
                value: "\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
            },
        ])
    })
    it("tokenizes empty regular expressions with triple quotes", function () {
        const tokens = tokenize(grammar, 'r""""""')
        compareTokens(tokens, [
            {
                value: "r\"\"\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
            },
        ])
    })
    it('tokenizes macro strings with triple quotes', function () {
        const tokens = tokenize(grammar, 'ab"""xyz"""')
        compareTokens(tokens, [
            {
                value: "ab",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "xyz",
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes macro strings juxtaposed to numbers', function () {
        const tokens = tokenize(grammar, '123.2ab"""xyz"""')
        compareTokens(tokens, [
            {
                value: "123.2",
                scopes: ["constant.numeric.julia"]
            },
            {
                value: "ab",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "xyz",
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes triple quotes', function () {
        const tokens = tokenize(grammar, '"""xyz"""')
        compareTokens(tokens, [
            {
                value: "\"\"\"",
                scopes: ["string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
            },
            {
                value: "xyz",
                scopes: ["string.quoted.triple.double.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.quoted.triple.double.julia", "punctuation.definition.string.multiline.end.julia"]
            },
        ])
    })
    it('tokenizes string macro function type constraint', function () {
        const tokens = tokenize(grammar, 'f(x::T) where T <: MIME"text/plain"')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "x",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "where",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " T",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "<:",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "MIME\"text/plain\"",
                scopes: ["support.type.julia"]
            },
        ])
    })
    it('tokenizes empty string macros', function () {
        const tokens = tokenize(grammar, 'foo""')
        compareTokens(tokens, [
            {
                value: "foo",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes string macro in function argument type', function () {
        const tokens = tokenize(grammar, 'f(x::MIME"text/plain")')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "x",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "MIME\"text/plain\"",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it('tokenizes string macro after type operator with weird mime type', function () {
        const tokens = tokenize(grammar, '::MIME"annoying \\"string\\" bla bla"')
        compareTokens(tokens, [
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: 'MIME"annoying \\"string\\" bla bla"',
                scopes: ["support.type.julia"]
            },
        ])
    })
    it('tokenizes string macro after type operator', function () {
        const tokens = tokenize(grammar, '::MIME"text/plain"')
        compareTokens(tokens, [
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "MIME\"text/plain\"",
                scopes: ["support.type.julia"]
            },
        ])
    })
    it('tokenizes string macro after type operator in short form func definiton', function () {
        const tokens = tokenize(grammar, 'f(::MIME"text/plain") = ""')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "MIME\"text/plain\"",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes string macro with escaped quotes after type operator in short form func definiton', function () {
        const tokens = tokenize(grammar, 'f(::MIME"text/pl\\"ain") = ""')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "MIME\"text/pl\\\"ain\"",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "=",
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes macro strings with escaped chars', function () {
        const tokens = tokenize(grammar, 'm"α\\u1234\\\\"')
        compareTokens(tokens, [
            {
                value: "m",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "α",
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: "\\u1234",
                scopes: ["string.quoted.other.julia", "constant.character.escape.julia"]
            },
            {
                value: "\\\\",
                scopes: ["string.quoted.other.julia", "constant.character.escape.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes docstrings", function () {
        const tokens = tokenize(grammar, "@doc doc\"\"\" xx *x* \"\"\" ->")
        compareTokens(tokens, [
            {
                value: "@doc",
                scopes: ["string.docstring.julia", "support.function.macro.julia"]
            },

            {
                value: " ",
                scopes: ["string.docstring.julia",]
            },
            {
                value: "doc\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
        ])
    })
    it("tokenizes void docstrings", function () {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n\"\"\"")
        compareTokens(tokens, [
            {
                value: '"""',
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\ndocstring\n\nfoo bar\n",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes void docstrings with whitespace after the final newline, but before the close-quote", function () {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n    \"\"\"")
        compareTokens(tokens, [
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\ndocstring\n\nfoo bar\n    ",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes docstrings with no linebreak before the ending triple-quotes", function () {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar \"\"\"")
        compareTokens(tokens, [
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\ndocstring\n\nfoo bar ",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes void docstrings that have extra content after ending tripe quote", function () {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n\"\"\" foobar")
        compareTokens(tokens, [
            {
                value: '"""',
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\ndocstring\n\nfoo bar\n",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: " foobar",
                scopes: []
            },
        ])
    })
    it("tokenizes @doc docstrings that have extra content after ending tripe quote", function () {
        const tokens = tokenize(grammar, "@doc \"\"\"\ndocstring\n\nfoo bar\n\"\"\" foobar")
        compareTokens(tokens, [
            {
                value: '@doc',
                scopes: ["string.docstring.julia", "support.function.macro.julia"]
            },
            {
                value: ' ',
                scopes: ["string.docstring.julia"]
            },
            {
                value: '"""',
                scopes: ["string.docstring.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\ndocstring\n\nfoo bar\n",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "\"\"\"",
                scopes: ["string.docstring.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: " ",
                scopes: ["string.docstring.julia"]
            },
            {
                value: "foobar",
                scopes: []
            },
        ])
    })
    it("Doesn't tokenize all triple quotes as docstrings", function () {
        const tokens = tokenize(grammar, "parse(\"\"\"boo\"\"\")")
        compareTokens(tokens, [
            {
                value: 'parse',
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: '"""',
                scopes: ["string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
            },
        ])
    })
    it("tokenizes function calls starting with double quotes", function () {
        const tokens = tokenize(grammar, 'warn("the_key is not a recognized aesthetic. Ignoring.")')
        compareTokens(tokens, [
            {
                value: "warn",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "the_key is not a recognized aesthetic. Ignoring.",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes function calls with unicode in names", function () {
        const tokens = tokenize(grammar, "fooα(bing, bang, boom)")
        compareTokens(tokens, [
            {
                value: "fooα",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "bing",
                scopes: []
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " bang",
                scopes: []
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " boom",
                scopes: []
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes escaped characters within a double quoted string", function () {
        const tokens = tokenize(grammar, '"\\u2200 x \\u2203 y"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\\u2200",
                scopes: ["string.quoted.double.julia", "constant.character.escape.julia"]
            },
            {
                value: " x ",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: "\\u2203",
                scopes: ["string.quoted.double.julia", "constant.character.escape.julia"]
            },
            {
                value: " y",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes escaped characters within a char", function () {
        const tokens = tokenize(grammar, "'\\u2203'")
        compareTokens(tokens, [
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "\\u2203",
                scopes: ["string.quoted.single.julia", "constant.character.escape.julia"]
            },
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("char literals containing a '", function () {
        const tokens = tokenize(grammar, "'''")
        compareTokens(tokens, [
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "'",
                scopes: ["string.quoted.single.julia"]
            },
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("empty char literals", function () {
        const tokens = tokenize(grammar, "''")
        compareTokens(tokens, [
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "'",
                scopes: ["string.quoted.single.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated names in double strings", function () {
        const tokens = tokenize(grammar, '"$_ω!z_.ard!"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$_ω!z_",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: ".ard!",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated names without whitespace", function () {
        const tokens = tokenize(grammar, '"$a$b$(c)"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$a",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "$b",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "c",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated expressions in double strings", function () {
        const tokens = tokenize(grammar, '"x=$(rand())"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "x=",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "rand",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes nested interpolated expressions in double strings", function () {
        const tokens = tokenize(grammar, '"$((true + length("asdf$asf"))*0x0d) is a number."')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "true",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "constant.language.julia"]
            },
            {
                value: " ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "+",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
            },
            {
                value: " ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "length",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "asdf",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia"]
            },
            {
                value: "$asf",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "*",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
            },
            {
                value: "0x0d",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "constant.numeric.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: " is a number.",
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated nested parentheses", function () {
        const tokens = tokenize(grammar, '"$(a(()))"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes escaped double quotes", function () {
        const tokens = tokenize(grammar, 'f("\\""); f("\\"")')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\\"',
                scopes: ["string.quoted.double.julia", "constant.character.escape.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ";",
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\\"',
                scopes: ["string.quoted.double.julia", "constant.character.escape.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes custom string literals", function () {
        const tokens = tokenize(grammar, 'àb9!"asdf"_a9Ñ')
        compareTokens(tokens, [
            {
                value: 'àb9!',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "asdf",
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: '_a9Ñ',
                scopes: ["string.quoted.other.julia", "support.function.macro.julia"]
            },
        ])
    })
    it("tokenizes Cxx.jl multiline string macros", function () {
        const tokens = tokenize(grammar, 'cxx"""\n#include "test.h"\n"""')
        compareTokens(tokens, [
            {
                value: 'cxx',
                scopes: ["embed.cxx.julia", "support.function.macro.julia"]
            },
            {
                value: '"""',
                scopes: ["embed.cxx.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\n#include "test.h"\n',
                scopes: ["embed.cxx.julia", "meta.embedded.inline.cpp"]
            },
            {
                value: '"""',
                scopes: ["embed.cxx.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes PyCall.jl multiline string macros", function () {
        const tokens = tokenize(grammar, 'py"""\nimport numpy as np\n"""')
        compareTokens(tokens, [
            {
                value: 'py',
                scopes: ["embed.python.julia", "support.function.macro.julia"]
            },
            {
                value: '"""',
                scopes: ["embed.python.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\nimport numpy as np\n',
                scopes: ["embed.python.julia"]
            },
            {
                value: '"""',
                scopes: ["embed.python.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes js multiline string macros", function () {
        const tokens = tokenize(grammar, 'js"""\nvar foo = function () {return x}\n"""')
        compareTokens(tokens, [
            {
                value: 'js',
                scopes: ["embed.js.julia", "support.function.macro.julia"]
            },
            {
                value: '"""',
                scopes: ["embed.js.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\nvar foo = function () {return x}\n',
                scopes: ["embed.js.julia", "meta.embedded.inline.javascript"]
            },
            {
                value: '"""',
                scopes: ["embed.js.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes raw multiline string macros", function () {
        const tokens = tokenize(grammar, 'raw"""\na\t\sb\n"""')
        compareTokens(tokens, [
            {
                value: 'raw',
                scopes: ["string.quoted.other.julia", "support.function.macro.julia"]
            },
            {
                value: '"""',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: '\na\t\sb\n',
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '"""',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes raw single line string macros", function () {
        const tokens = tokenize(grammar, 'raw"a\t\sb"')
        compareTokens(tokens, [
            {
                value: 'raw',
                scopes: ["string.quoted.other.julia", "support.function.macro.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'a\t\sb',
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes symbols of `keyword.other`s", function () {
        const tokens = tokenize(grammar, ':type')
        compareTokens(tokens, [
            {
                value: ':type',
                scopes: ["constant.other.symbol.julia"]
            },
        ])
    })
    it("tokenizes variables ending in _type", function () {
        const tokens = tokenize(grammar, 'foo_immutable in')
        compareTokens(tokens, [
            {
                value: 'foo_immutable ',
                scopes: []
            },
            {
                value: 'in',
                scopes: ["keyword.operator.relation.in.julia"]
            },
        ])
    })
    it("tokenizes comments", function () {
        const tokens = tokenize(grammar, '# This is a comment')
        compareTokens(tokens, [
            {
                value: '#',
                scopes: ["comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
            },
            {
                value: ' This is a comment',
                scopes: ["comment.line.number-sign.julia"]
            },
        ])
    })
    it("tokenizes block comments", function () {
        const tokens = tokenize(grammar, '#= begin #= begin end =# end =#')
        compareTokens(tokens, [
            {
                value: "#=",
                scopes: ["comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
            },
            {
                value: " begin ",
                scopes: ["comment.block.number-sign-equals.julia"]
            },
            {
                value: "#=",
                scopes: ["comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
            },
            {
                value: " begin end ",
                scopes: ["comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia"]
            },
            {
                value: "=#",
                scopes: ["comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
            },
            {
                value: " end ",
                scopes: ["comment.block.number-sign-equals.julia"]
            },
            {
                value: "=#",
                scopes: ["comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
            },
        ])
    })
    it("tokenizes the pair assignment operator", function () {
        const tokens = tokenize(grammar, 'Dict(x => x for x in y)')
        compareTokens(tokens, [
            {
                value: 'Dict',
                scopes: ["support.function.julia"]
            },
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: 'x ',
                scopes: []
            },
            {
                value: '=>',
                scopes: ["keyword.operator.arrow.julia"]
            },
            {
                value: ' x ',
                scopes: []
            },
            {
                value: 'for',
                scopes: ["keyword.control.julia"]
            },
            {
                value: ' x ',
                scopes: []
            },
            {
                value: 'in',
                scopes: ["keyword.operator.relation.in.julia"]
            },
            {
                value: ' y',
                scopes: []
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it('tokenizes function definitions with special unicode identifiers', function () {
        const tokens = tokenize(grammar, "f′(xᵢ₊₁) = xᵢ₊₁' + ∇'")
        compareTokens(tokens, [
            {
                value: 'f′',
                scopes: ["entity.name.function.julia"]
            },
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: 'xᵢ₊₁',
                scopes: []
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'xᵢ₊₁',
                scopes: []
            },
            {
                value: "'",
                scopes: ["keyword.operator.transposed-variable.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "+",
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '∇',
                scopes: []
            },
            {
                value: "'",
                scopes: ["keyword.operator.transposed-variable.julia"]
            },
        ])
    })
    it("tokenizes short form function definitions with `where` syntax", function () {
        const tokens = tokenize(grammar, "x(a::T)  where  T<:Integer = ")
        compareTokens(tokens, [
            {
                value: "x",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "  ",
                scopes: []
            },
            {
                value: "where",
                scopes: ["keyword.other.julia"]
            },
            {
                value: "  T",
                scopes: []
            },
            {
                value: "<:",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Integer",
                scopes: ["support.type.julia"]
            },
        ])
    })
    it("tokenizes short form function definitions with multiple `where` args", function () {
        const tokens = tokenize(grammar, "x(a::T)  where {T, E} = ")
        compareTokens(tokens, [
            {
                value: "x",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "  ",
                scopes: []
            },
            {
                value: "where",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "{",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "T",
                scopes: []
            },
            {
                value: ",",
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: " E",
                scopes: []
            },
            {
                value: "}",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes long-form anonymous function definitions without spaces", function () {
        const tokens = tokenize(grammar, "function(a)")
        compareTokens(tokens, [
            {
                value: "function",
                scopes: ["keyword.other.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes long-form anonymous function definitions with spaces", function () {
        const tokens = tokenize(grammar, "function (a)")
        compareTokens(tokens, [
            {
                value: "function",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes long form function definitions with `where` syntax", function () {
        const tokens = tokenize(grammar, "function x(a::T)  where  T<:Integer")
        compareTokens(tokens, [
            {
                value: "function",
                scopes: ["keyword.other.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "x",
                scopes: ["entity.name.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "a",
                scopes: []
            },
            {
                value: "::",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "T",
                scopes: ["support.type.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: "  ",
                scopes: []
            },
            {
                value: "where",
                scopes: ["keyword.other.julia"]
            },
            {
                value: "  T",
                scopes: []
            },
            {
                value: "<:",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: "Integer",
                scopes: ["support.type.julia"]
            },
        ])
    })
    it("tokenizes the function applicator", function () {
        const tokens = tokenize(grammar, '[1:5;] |> x->x.^2 |> sum')
        compareTokens(tokens, [
            {
                value: '[',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: '1',
                scopes: ["meta.array.julia", "constant.numeric.julia"]
            },
            {
                value: ':',
                scopes: ["meta.array.julia", "keyword.operator.range.julia"]
            },
            {
                value: '5',
                scopes: ["meta.array.julia", "constant.numeric.julia"]
            },
            {
                value: ';',
                scopes: ["meta.array.julia", "punctuation.separator.semicolon.julia"]
            },
            {
                value: ']',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '|>',
                scopes: ["keyword.operator.applies.julia"]
            },
            {
                value: ' x',
                scopes: []
            },
            {
                value: '->',
                scopes: ["keyword.operator.arrow.julia"]
            },
            {
                value: 'x',
                scopes: []
            },
            {
                value: '.^',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: '2',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '|>',
                scopes: ["keyword.operator.applies.julia"]
            },
            {
                value: ' sum',
                scopes: []
            },
        ])
    })
    it("tokenizes spelt out infix operators", function () {
        const tokens = tokenize(grammar, 'a isa Int && a in ints')
        compareTokens(tokens, [
            {
                value: 'a ',
                scopes: []
            },
            {
                value: 'isa',
                scopes: ["keyword.operator.isa.julia"]
            },
            {
                value: ' Int ',
                scopes: []
            },
            {
                value: '&&',
                scopes: ["keyword.operator.boolean.julia"]
            },
            {
                value: ' a ',
                scopes: []
            },
            {
                value: 'in',
                scopes: ["keyword.operator.relation.in.julia"]
            },
            {
                value: ' ints',
                scopes: []
            },
        ])
    })
    it("tokenizes everything related to `:` (ranges, symbols, subtyping)", function () {
        const tokens = tokenize(grammar, '1:3; a:b; c: d; e :f; :g: :h; i::J; k():l()')
        compareTokens(tokens, [
            {
                value: '1',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: '3',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' a',
                scopes: []
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: 'b',
                scopes: []
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' c',
                scopes: []
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: ' d',
                scopes: []
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' e ',
                scopes: []
            },
            {
                value: ':f',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: ':g',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: ':h',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' i',
                scopes: []
            },
            {
                value: '::',
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: 'J',
                scopes: ["support.type.julia"]
            },
            {
                value: ';',
                scopes: ["punctuation.separator.semicolon.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'k',
                scopes: ["support.function.julia"]
            },
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: 'l',
                scopes: ["support.function.julia"]
            },
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes dot operators", function () {
        const tokens = tokenize(grammar, 'x .<= y')
        compareTokens(tokens, [
            {
                value: 'x ',
                scopes: []
            },
            {
                value: '.<=',
                scopes: ["keyword.operator.relation.julia"]
            },
            {
                value: ' y',
                scopes: []
            },
        ])
    })
    it("tokenizes type", function () {
        const tokens = tokenize(grammar, 'T>:Interger')
        compareTokens(tokens, [
            {
                value: 'T',
                scopes: []
            },
            {
                value: '>:',
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: 'Interger',
                scopes: ["support.type.julia"]
            },
        ])
    })
    it("tokenizes imaginary unit", function () {
        const tokens = tokenize(grammar, '2im 2img')
        compareTokens(tokens, [
            {
                value: '2im',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '2',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: 'img',
                scopes: []
            },
        ])
    })
    it("tokenizes multiplied mathematical constants", function () {
        const tokens = tokenize(grammar, '2pi 2π')
        compareTokens(tokens, [
            {
                value: '2pi',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '2π',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes for outer loops', function () {
        const tokens = tokenize(grammar, 'for outer i = range')
        compareTokens(tokens, [
            {
                value: 'for',
                scopes: ["keyword.control.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'outer',
                scopes: ["keyword.other.julia"]
            },
            {
                value: ' i ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' range',
                scopes: []
            },
        ])
    })
    it('tokenizes for outer loops with multiple iteration variables', function () {
        const tokens = tokenize(grammar, 'for outer i = range, \n outer j = range\n outer = 3')
        compareTokens(tokens, [
            {
                value: 'for',
                scopes: ["keyword.control.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'outer',
                scopes: ["keyword.other.julia"]
            },
            {
                value: ' i ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' range',
                scopes: []
            },
            {
                value: ',',
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: ' \n ',
                scopes: []
            },
            {
                value: 'outer',
                scopes: ["keyword.other.julia"]
            },
            {
                value: ' j ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' range',
                scopes: []
            },
            {
                value: '\n',
                scopes: []
            },
            {
                value: ' outer ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '3',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('does not tokenize outer by itself as a keyword', function () {
        const tokens = tokenize(grammar, 'outer = foo')
        compareTokens(tokens, [
            {
                value: 'outer ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' foo',
                scopes: []
            },
        ])
    })
    it('tokenizes keywords preceded by dots correctly', function () {
        const tokens = tokenize(grammar, 'foo.module')
        compareTokens(tokens, [
            {
                value: 'foo',
                scopes: []
            },
            {
                value: '.',
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: 'module',
                scopes: []
            },
        ])
    })
    it('tokenizes nothing and missing as keywords', function () {
        const tokens = tokenize(grammar, 'x = nothing, missing')
        compareTokens(tokens, [
            {
                value: 'x ',
                scopes: []
            },
            {
                value: '=',
                scopes: ["keyword.operator.update.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'nothing',
                scopes: ["constant.language.julia"]
            },
            {
                value: ',',
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'missing',
                scopes: ["constant.language.julia"]
            },
        ])
    })
    it('tokenizes identifiers ', function () {
        const tokens = tokenize(grammar, 'b′0 - 2')
        compareTokens(tokens, [
            {
                value: 'b′0 ',
                scopes: []
            },
            {
                value: '-',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '2',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes the ternary operator ', function () {
        const tokens = tokenize(grammar, 'a ? b : c')
        compareTokens(tokens, [
            {
                value: 'a ',
                scopes: []
            },
            {
                value: '?',
                scopes: ["keyword.operator.ternary.julia"]
            },
            {
                value: ' b ',
                scopes: []
            },
            {
                value: ':',
                scopes: ["keyword.operator.ternary.julia"]
            },
            {
                value: ' c',
                scopes: []
            },
        ])
    })
    it('tokenizes Float32s ', function () {
        const tokens = tokenize(grammar, '1f2')
        compareTokens(tokens, [
            {
                value: '1f2',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes identifiers with weird characters and a transpose', function () {
        const tokens = tokenize(grammar, 'k̂\'')
        compareTokens(tokens, [
            {
                value: 'k̂',
                scopes: []
            },
            {
                value: '\'',
                scopes: ["keyword.operator.transposed-variable.julia"]
            },
        ])
    })
    it('tokenizes parentheses with a transpose', function () {
        const tokens = tokenize(grammar, '()\'')
        compareTokens(tokens, [
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: '\'',
                scopes: ["keyword.operator.transpose.julia"]
            },
        ])
    })
    it('tokenizes parentheses with a dot transpose', function () {
        const tokens = tokenize(grammar, '().\'')
        compareTokens(tokens, [
            {
                value: '(',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ')',
                scopes: ["meta.bracket.julia"]
            },
            {
                value: '.\'',
                scopes: ["keyword.operator.transpose.julia"]
            },
        ])
    })
    it('tokenizes brackets with a transpose', function () {
        const tokens = tokenize(grammar, '[]\'')
        compareTokens(tokens, [
            {
                value: '[',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: ']',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: '\'',
                scopes: ["meta.array.julia", "keyword.operator.transpose.julia"]
            },
        ])
    })
    it('tokenizes brackets with a dot transpose', function () {
        const tokens = tokenize(grammar, '[].\'')
        compareTokens(tokens, [
            {
                value: '[',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: ']',
                scopes: ["meta.array.julia", "meta.bracket.julia"]
            },
            {
                value: '.\'',
                scopes: ["meta.array.julia", "keyword.operator.transpose.julia"]
            },
        ])
    })
    it('tokenizes NaN', function () {
        const tokens = tokenize(grammar, 'NaN + NaNMath')
        compareTokens(tokens, [
            {
                value: 'NaN',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '+',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: ' NaNMath',
                scopes: []
            },
        ])
    })
    it('tokenizes numbers with a transpose', function () {
        const tokens = tokenize(grammar, '2im\'+2')
        compareTokens(tokens, [
            {
                value: '2im',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '\'',
                scopes: ["keyword.operator.conjugate-number.julia"]
            },
            {
                value: '+',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: '2',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes ranges of string macros', function () {
        const tokens = tokenize(grammar, 'q"a":r"b":r`c`:var"d"')
        compareTokens(tokens, [
            {
                value: 'q',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'a',
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ':',
                scopes: []
            },
            {
                value: 'r"',
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
            },
            {
                value: 'b',
                scopes: ["string.regexp.julia"]
            },
            {
                value: '"',
                scopes: ["string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
            },
            {
                value: ':',
                scopes: []
            },
            {
                value: 'r',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'c',
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: ':',
                scopes: []
            },
            {
                value: 'var"',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: 'd',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '"',
                scopes: ["constant.other.symbol.julia"]
            },
        ])
    })
    it('tokenizes the var"blah" syntax', function () {
        const tokens = tokenize(grammar, '2var"a"+var"""q"""')
        compareTokens(tokens, [
            {
                value: '2',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: 'var"',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: 'a',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '"',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '+',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: 'var"""',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: 'q',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '"""',
                scopes: ["constant.other.symbol.julia"]
            },
        ])
    })
    it('tokenizes cmd macros', function () {
        const tokens = tokenize(grammar, 'a```b```*c`d`')
        compareTokens(tokens, [
            {
                value: 'a',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'b',
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: '*',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: 'c',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'd',
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes backtick strings', function () {
        const tokens = tokenize(grammar, '```b```*`d`')
        compareTokens(tokens, [
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'b',
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
            {
                value: '*',
                scopes: ["keyword.operator.arithmetic.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'd',
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes interpolated strings', function () {
        const tokens = tokenize(grammar, '$"asd"')
        compareTokens(tokens, [
            {
                value: '$',
                scopes: ["keyword.operator.interpolation.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'asd',
                scopes: ["string.quoted.double.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it('tokenizes interpolated multi-line strings', function () {
        const tokens = tokenize(grammar, '$"""asd"""')
        compareTokens(tokens, [
            {
                value: '$',
                scopes: ["keyword.operator.interpolation.julia"]
            },
            {
                value: '"""',
                scopes: ["string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
            },
            {
                value: 'asd',
                scopes: ["string.quoted.triple.double.julia"]
            },
            {
                value: '"""',
                scopes: ["string.quoted.triple.double.julia", "punctuation.definition.string.multiline.end.julia"]
            },
        ])
    })
    it('tokenizes numbers in combination with ranges', function () {
        let tokens = tokenize(grammar, '123...')
        compareTokens(tokens, [
            {
                value: '123',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '...',
                scopes: ["keyword.operator.dots.julia"]
            },
        ])

        tokens = tokenize(grammar, '123_132.123_123...')
        compareTokens(tokens, [
            {
                value: '123_132.123_123',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '...',
                scopes: ["keyword.operator.dots.julia"]
            },
        ])

        tokens = tokenize(grammar, '1...1')
        compareTokens(tokens, [
            {
                value: '1',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '...',
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: '1',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes multiple !s as a suffix', function () {
        const tokens = tokenize(grammar, 'asd!!!!!!')
        compareTokens(tokens, [
            {
                value: 'asd!!!!!!',
                scopes: []
            },
        ])
    })
    it('tokenizes function calls with a `=` in a comment', function () {
        const tokens = tokenize(grammar, 'f() # = 2')
        compareTokens(tokens, [
            {
                value: "f",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: '#',
                scopes: ["comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
            },
            {
                value: ' = 2',
                scopes: ["comment.line.number-sign.julia"]
            },
        ])
    })
    it('tokenizes number ranges syntax (..)', function () {
        let tokens = tokenize(grammar, '0..1')
        compareTokens(tokens, [
            {
                value: '0',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '..',
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: '1',
                scopes: ["constant.numeric.julia"]
            },
        ])
        tokens = tokenize(grammar, '0.0..1.0')
        compareTokens(tokens, [
            {
                value: '0.0',
                scopes: ["constant.numeric.julia"]
            },
            {
                value: '..',
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: '1.0',
                scopes: ["constant.numeric.julia"]
            },
        ])
    })
    it('tokenizes imports with as syntax', function () {
        let tokens = tokenize(grammar, 'import Foo as Bar')
        compareTokens(tokens, [
            {
                value: 'import',
                scopes: ["keyword.control.import.julia"]
            },
            {
                value: ' Foo ',
                scopes: []
            },
            {
                value: 'as',
                scopes: ["keyword.control.as.julia"]
            },
            {
                value: ' Bar',
                scopes: []
            },
        ])
        tokens = tokenize(grammar, 'import Foo: x as y, z!  as yy')
        compareTokens(tokens, [
            {
                value: 'import',
                scopes: ["keyword.control.import.julia"]
            },
            {
                value: ' Foo',
                scopes: []
            },
            {
                value: ':',
                scopes: ["keyword.operator.range.julia"]
            },
            {
                value: ' x ',
                scopes: []
            },
            {
                value: 'as',
                scopes: ["keyword.control.as.julia"]
            },
            {
                value: ' y',
                scopes: []
            },
            {
                value: ',',
                scopes: ["punctuation.separator.comma.julia"]
            },
            {
                value: ' z!  ',
                scopes: []
            },
            {
                value: 'as',
                scopes: ["keyword.control.as.julia"]
            },
            {
                value: ' yy',
                scopes: []
            },
        ])
    })
    it('tokenizes types with unicode chars', function () {
        const tokens = tokenize(grammar, 'struct ChebyshevLike <: AbstractΔMethod end')
        compareTokens(tokens, [
            {
                value: 'struct',
                scopes: ["keyword.other.julia"]
            },
            {
                value: ' ChebyshevLike',
                scopes: []
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: '<:',
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'AbstractΔMethod',
                scopes: ["support.type.julia"]
            },
            {
                value: ' ',
                scopes: []
            },
            {
                value: 'end',
                scopes: ["keyword.control.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated names in command strings", function () {
        const tokens = tokenize(grammar, '`$_ω!z_.ard!`')
        compareTokens(tokens, [
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$_ω!z_",
                scopes: ["string.interpolated.backtick.julia", "variable.interpolation.julia"]
            },
            {
                value: ".ard!",
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '`',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated names in multi-line command strings", function () {
        const tokens = tokenize(grammar, '```$_ω!z_.ard!```')
        compareTokens(tokens, [
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$_ω!z_",
                scopes: ["string.interpolated.backtick.julia", "variable.interpolation.julia"]
            },
            {
                value: ".ard!",
                scopes: ["string.interpolated.backtick.julia"]
            },
            {
                value: '```',
                scopes: ["string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated generators", function () {
        const tokens = tokenize(grammar, '"$(a for a in a)"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "a ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "for",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.control.julia"]
            },
            {
                value: " a ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "in",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.relation.in.julia"]
            },
            {
                value: " a",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes interpolated nested generators", function () {
        const tokens = tokenize(grammar, '"$((a for a in a()))"')
        compareTokens(tokens, [
            {
                value: '"',
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: "$",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "a ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "for",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.control.julia"]
            },
            {
                value: " a ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "in",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.relation.in.julia"]
            },
            {
                value: " ",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia"]
            },
            {
                value: "a",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
            },
            {
                value: "(",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
            },
            {
                value: "\"",
                scopes: ["string.quoted.double.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes comment annotations in single-line comments", function () {
        const tokens = tokenize(grammar, '# TODO: foo')
        compareTokens(tokens, [
            {
                value: '#',
                scopes: ["comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
            },
            {
                value: " ",
                scopes: ["comment.line.number-sign.julia"]
            },
            {
                value: "TODO",
                scopes: ["comment.line.number-sign.julia", "keyword.other.comment-annotation.julia"]
            },
            {
                value: ': foo',
                scopes: ["comment.line.number-sign.julia"]
            },
        ])
    })
    it("tokenizes comment annotations in block-line comments", function () {
        const tokens = tokenize(grammar, '#= TODO: foo =#')
        compareTokens(tokens, [
            {
                value: '#=',
                scopes: ["comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
            },
            {
                value: " ",
                scopes: ["comment.block.number-sign-equals.julia"]
            },
            {
                value: "TODO",
                scopes: ["comment.block.number-sign-equals.julia", "keyword.other.comment-annotation.julia"]
            },
            {
                value: ': foo ',
                scopes: ["comment.block.number-sign-equals.julia"]
            },
            {
                value: '=#',
                scopes: ["comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
            },
        ])
    })
    it("tokenizes subtype relations with a transpose suffix", function () {
        const tokens = tokenize(grammar, "Bar <: Foo'")
        compareTokens(tokens, [
            {
                value: "Bar",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "<:",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "Foo",
                scopes: ["support.type.julia"]
            },
            {
                value: "'",
                scopes: ["keyword.operator.transpose.julia"]
            },
        ])
    })
    it("tokenizes subtype relations with a transpose suffix and dot access", function () {
        const tokens = tokenize(grammar, "Bar <: Foo'.A()")
        compareTokens(tokens, [
            {
                value: "Bar",
                scopes: []
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "<:",
                scopes: ["keyword.operator.relation.types.julia"]
            },
            {
                value: " ",
                scopes: []
            },
            {
                value: "Foo",
                scopes: ["support.type.julia"]
            },
            {
                value: "'",
                scopes: ["keyword.operator.transpose.julia"]
            },
            {
                value: ".",
                scopes: ["keyword.operator.dots.julia"]
            },
            {
                value: "A",
                scopes: ["support.function.julia"]
            },
            {
                value: "(",
                scopes: ["meta.bracket.julia"]
            },
            {
                value: ")",
                scopes: ["meta.bracket.julia"]
            },
        ])
    })
    it("tokenizes escape codes in raw strings", function () {
        const tokens = tokenize(grammar, 'raw"a\\"b"')
        compareTokens(tokens, [
            {
                value: 'raw',
                scopes: ["string.quoted.other.julia", "support.function.macro.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
            },
            {
                value: 'a',
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '\\"',
                scopes: ["string.quoted.other.julia", "constant.character.escape.julia"]
            },
            {
                value: 'b',
                scopes: ["string.quoted.other.julia"]
            },
            {
                value: '"',
                scopes: ["string.quoted.other.julia", "punctuation.definition.string.end.julia"]
            },
        ])
    })
    it("tokenizes escape codes in var strings", function () {
        const tokens = tokenize(grammar, 'var"a\\"b"')
        compareTokens(tokens, [
            {
                value: 'var"',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: 'a',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '\\"',
                scopes: ["constant.other.symbol.julia", "constant.character.escape.julia"]
            },
            {
                value: 'b',
                scopes: ["constant.other.symbol.julia"]
            },
            {
                value: '"',
                scopes: ["constant.other.symbol.julia"]
            },
        ])
    })
})

describe('Julia-Console', function () {
    let grammar
    before(async function () {
        grammar = await registry.loadGrammar('source.julia.console')
    })
    it('parses the grammar', function () {
        expect(grammar).to.be.a('object')
    })
    it("should highlight multi-line expressions", function () {
        const src = `julia> true
true

julia> begin
       end
        `;
        const tokens = tokenize(grammar, src)
        compareTokens(tokens, [
            {
                value: "julia>",
                scopes: ["source.julia.console", "punctuation.separator.prompt.julia.console"],
            },
            { scopes: [ 'source.julia.console' ], value: ' ' },
            {
                value: "true",
                scopes: ["source.julia.console", "constant.language.julia"],
            },
            { scopes: [ 'source.julia.console' ], value: '\ntrue\n\n' },
            {
                value: "julia>",
                scopes: ["source.julia.console", "punctuation.separator.prompt.julia.console"],
            },
            { scopes: [ 'source.julia.console' ], value: ' ' },
            {
                value: "begin",
                scopes:["source.julia.console", "keyword.control.julia"],
            },
            { scopes: [ "source.julia.console" ], value: "\n       " },
            {
              value: "end",
              scopes: [ "source.julia.console", "keyword.control.end.julia" ],
            },
        ])
    })

    it("should highlight help prompts", function () {
      const src = "help?> begin"
      const tokens = tokenize(grammar, src)
      compareTokens(tokens, [
        {
          scopes: [
            'source.julia.console',
            'punctuation.separator.prompt.help.julia.console'
          ],
          value: 'help?>'
        },
        { scopes: [ 'source.julia.console' ], value: ' ' },
        { scopes: [ 'source.julia.console', 'keyword.control.julia' ], value: 'begin' }
      ])
    })

    it("should highlight shell prompts", function () {
      const src = "shell> echo \"hello\""
      const tokens = tokenize(grammar, src)
      compareTokens(tokens, [
        {
          scopes: [
            'source.julia.console',
            'punctuation.separator.prompt.shell.julia.console'
          ],
          value: 'shell>'
        },
        { scopes: [ 'source.julia.console' ], value: ' ' },
        { scopes: [ 'source.julia.console' ], value: 'echo "hello"' }
      ])
    })
})
