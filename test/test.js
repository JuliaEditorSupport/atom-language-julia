const fs = require('fs');
const path = require('path');
const vsctm = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');
const { expect } = require('chai');

const GRAMMAR_PATH = path.join(__dirname, '../grammars/julia_vscode.json')

/**
 * Utility to read a file as a promise
 */
function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => error ? reject(error) : resolve(data));
    })
}

const wasmBin = fs.readFileSync(path.join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
    return {
        createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
        createOnigString(s) { return new oniguruma.OnigString(s); }
    };
});

// Create a registry that can create a grammar from a scope name.
const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: (scopeName) => {
        if (scopeName === 'source.julia') {
            return readFile(GRAMMAR_PATH).then(data => vsctm.parseRawGrammar(data.toString(), GRAMMAR_PATH))
        }
        return null;
    }
});

function tokenize(grammar, line) {
    const tokens = grammar.tokenizeLine(line).tokens;

    return tokens.map((t) => {
        return {
            scopes: t.scopes,
            value: line.slice(t.startIndex, t.endIndex)
        }
    })
};

// Load the JavaScript grammar and any other grammars included by it async.
describe('Julia grammar', function() {
    let grammar
    before(async function () {
        grammar = await registry.loadGrammar('source.julia')
    })
    it('parses the grammar', function() {
        expect(grammar).to.be.a('object')
    })
    it("tokenizes element-wise operators", function() {
        const tokens = tokenize(grammar, "A .* B'");
        expect(tokens[0]).to.deep.equal({
            value: "A ",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ".*",
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "B",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "keyword.operator.transposed-variable.julia"]
        });
    });
    it("tokenizes functions and types", function() {
        const tokens = tokenize(grammar, "à_b9!(a::Int64)");
        expect(tokens[0]).to.deep.equal({
            value: "à_b9!",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "Int64",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes struct definitions", function() {
        const tokens = tokenize(grammar, "struct Foo end");
        expect(tokens[0]).to.deep.equal({
            value: "struct",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Foo ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "end",
            scopes: ["source.julia", "keyword.control.end.julia"]
        });
    });
    it("tokenizes mutable struct definitions", function() {
        const tokens = tokenize(grammar, "mutable  struct Foo end");
        expect(tokens[0]).to.deep.equal({
            value: "mutable  struct",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Foo ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "end",
            scopes: ["source.julia", "keyword.control.end.julia"]
        });
    });
    it("tokenizes abstract type definitions", function() {
        const tokens = tokenize(grammar, "abstract type Foo end");
        expect(tokens[0]).to.deep.equal({
            value: "abstract type",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Foo ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "end",
            scopes: ["source.julia", "keyword.control.end.julia"]
        });
    });
    it("tokenizes primitive type definitions", function() {
        const tokens = tokenize(grammar, "primitive type Foo 64 end");
        expect(tokens[0]).to.deep.equal({
            value: "primitive type",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Foo ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "64",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "end",
            scopes: ["source.julia", "keyword.control.end.julia"]
        });
    });
    it("doesn't tokenize 'mutable', 'abstract' or 'primitive' on their own", function() {
        const tokens = tokenize(grammar, "mutable = 3; abstract = 5; primitive = 11");
        expect(tokens[0]).to.deep.equal({
            value: "mutable ",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "3",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ";",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " abstract ",
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "5",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: ";",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: " primitive ",
            scopes: ["source.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: "11",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it("tokenizes types ignoring whitespace", function() {
        const tokens = tokenize(grammar, "f(x :: Int, y     ::   Float64, z::Float32, a :: X.Y.Z.A, b ::    X.Y.Z)");
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "Int",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: " y",
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "     ",
            scopes: ["source.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: "   ",
            scopes: ["source.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: "Float64",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: " z",
            scopes: ["source.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[16]).to.deep.equal({
            value: "Float32",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[17]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[18]).to.deep.equal({
            value: " a",
            scopes: ["source.julia"]
        });
        expect(tokens[19]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[20]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[21]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[22]).to.deep.equal({
            value: "X.Y.Z.A",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[23]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[24]).to.deep.equal({
            value: " b",
            scopes: ["source.julia"]
        });
        expect(tokens[25]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[26]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[27]).to.deep.equal({
            value: "    ",
            scopes: ["source.julia"]
        });
        expect(tokens[28]).to.deep.equal({
            value: "X.Y.Z",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[29]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes `const` as a keyword", function() {
        const tokens = tokenize(grammar, "const Foo");
        expect(tokens[0]).to.deep.equal({
            value: "const",
            scopes: ["source.julia", "keyword.storage.modifier.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Foo",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes functions and (shallowly nested) parameterized types", function() {
        const tokens = tokenize(grammar, "x{T <: Dict{Any, Tuple{Int, Int}}}(a::T, b::Union{Int, Set{Any}})");
        expect(tokens[0]).to.deep.equal({
            value: "x",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "{T <: Dict{Any, Tuple{Int, Int}}}",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: " b",
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "Union{Int, Set{Any}}",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes functions with return type declarations", function() {
        const tokens = tokenize(grammar, "x{T<:AbstractInteger}(a::T)::Int");
        expect(tokens[0]).to.deep.equal({
            value: "x",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "{T<:AbstractInteger}",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "Int",
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it("tokenizes function declarations with interpolated type parameters", function() {
        const tokens = tokenize(grammar, "f(x::$foo)=3");
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "$foo",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "3",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it("tokenizes typed arrays and comprehensions", function() {
        const tokens = tokenize(grammar, "Int[x for x=y]");
        expect(tokens[0]).to.deep.equal({
            value: "Int",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "[",
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x ",
            scopes: ["source.julia", "meta.array.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "for",
            scopes: ["source.julia", "meta.array.julia", "keyword.control.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: " x",
            scopes: ["source.julia", "meta.array.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "meta.array.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "y",
            scopes: ["source.julia", "meta.array.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "]",
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes begin/end indexing", function() {
        const tokens = tokenize(grammar, "ary[begin:end]");
        expect(tokens[0]).to.deep.equal({
            value: "ary",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "[",
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "begin",
            scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ":",
            scopes: ["source.julia", "meta.array.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "end",
            scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "]",
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes qualified names", function() {
        const tokens = tokenize(grammar, "Base.@time");
        expect(tokens[0]).to.deep.equal({
            value: "Base",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ".",
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "@time",
            scopes: ["source.julia", "support.function.macro.julia"]
        });
    });
    it("tokenizes qualified unicode names", function() {
        const tokens = tokenize(grammar, "Ñy_M0d!._àb9!_");
        expect(tokens[0]).to.deep.equal({
            value: "Ñy_M0d!",
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ".",
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "_àb9!_",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes extension of external methods", function() {
        const tokens = tokenize(grammar, "function Base.start(itr::MyItr)");
        expect(tokens[0]).to.deep.equal({
            value: "function",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Base",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".",
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "start",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "itr",
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "MyItr",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes macro calls", function() {
        const tokens = tokenize(grammar, "@. @elapsed x^2");
        expect(tokens[0]).to.deep.equal({
            value: "@.",
            scopes: ["source.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "@elapsed",
            scopes: ["source.julia", "support.function.macro.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " x",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "^",
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "2",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it("tokenizes using statements", function() {
        const tokens = tokenize(grammar, "using Base.Test");
        expect(tokens[0]).to.deep.equal({
            value: "using",
            scopes: ["source.julia", "keyword.control.using.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Base",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".",
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "Test",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes import statements", function() {
        const tokens = tokenize(grammar, "import Base.Test");
        expect(tokens[0]).to.deep.equal({
            value: "import",
            scopes: ["source.julia", "keyword.control.import.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " Base",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".",
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "Test",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes export statements", function() {
        const tokens = tokenize(grammar, "export my_awesome_function");
        expect(tokens[0]).to.deep.equal({
            value: "export",
            scopes: ["source.julia", "keyword.control.export.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " my_awesome_function",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes symbols", function() {
        const tokens = tokenize(grammar, ":à_b9!");
        expect(tokens[0]).to.deep.equal({
            value: ":à_b9!",
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
    });
    it("tokenizes regular expressions", function() {
        const tokens = tokenize(grammar, 'r"[jJ]ulia"im');
        expect(tokens[0]).to.deep.equal({
            value: "r\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "[jJ]ulia",
            scopes: ["source.julia", "string.regexp.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "im",
            scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]
        });
    });
    it("tokenizes regular expressions with triple quotes", function() {
        const tokens = tokenize(grammar, 'r"""[jJ]ulia "jl" xyz"""im');
        expect(tokens[0]).to.deep.equal({
            value: "r\"\"\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "[jJ]ulia \"jl\" xyz",
            scopes: ["source.julia", "string.regexp.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "im",
            scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]
        });
    });
    it("tokenizes empty regular expressions", function() {
        const tokens = tokenize(grammar, 'r""');
        expect(tokens[0]).to.deep.equal({
            value: "r\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
        });
    });
    it("tokenizes empty regular expressions with triple quotes", function() {
        const tokens = tokenize(grammar, 'r""""""');
        expect(tokens[0]).to.deep.equal({
            value: "r\"\"\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
        });
    });
    it('tokenizes macro strings with triple quotes', function() {
        const tokens = tokenize(grammar, 'ab"""xyz"""');
        expect(tokens[0]).to.deep.equal({
            value: "ab",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "xyz",
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes macro strings juxtaposed to numbers', function() {
        const tokens = tokenize(grammar, '123.2ab"""xyz"""');
        expect(tokens[0]).to.deep.equal({
            value: "123.2",
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "ab",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "xyz",
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes triple quotes', function() {
        const tokens = tokenize(grammar, '"""xyz"""');
        expect(tokens[0]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "xyz",
            scopes: ["source.julia", "string.quoted.triple.double.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.end.julia"]
        });
    });
    it('tokenizes string macro function type constraint', function() {
        const tokens = tokenize(grammar, 'f(x::T) where T <: MIME"text/plain"');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "where",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: " T",
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "<:",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: "MIME\"text/plain\"",
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it('tokenizes empty string macros', function() {
        const tokens = tokenize(grammar, 'foo""');
        expect(tokens[0]).to.deep.equal({
            value: "foo",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes string macro in function argument type', function() {
        const tokens = tokenize(grammar, 'f(x::MIME"text/plain")');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "MIME\"text/plain\"",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it('tokenizes string macro after type operator', function() {
        const tokens = tokenize(grammar, '::MIME"annoying \\"string\\" bla bla"');
        expect(tokens[0]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: 'MIME"annoying \\"string\\" bla bla"',
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it('tokenizes string macro after type operator', function() {
        const tokens = tokenize(grammar, '::MIME"text/plain"');
        expect(tokens[0]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "MIME\"text/plain\"",
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it('tokenizes string macro after type operator in short form func definiton', function() {
        const tokens = tokenize(grammar, 'f(::MIME"text/plain") = ""');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "MIME\"text/plain\"",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes string macro with escaped quotes after type operator in short form func definiton', function() {
        const tokens = tokenize(grammar, 'f(::MIME"text/pl\\"ain") = ""');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "MIME\"text/pl\\\"ain\"",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "=",
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes macro strings with escaped chars', function() {
        const tokens = tokenize(grammar, 'm"α\\u1234\\\\"');
        expect(tokens[0]).to.deep.equal({
            value: "m",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "α",
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "\\u1234",
            scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "\\\\",
            scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes docstrings", function() {
        const tokens = tokenize(grammar, "@doc doc\"\"\" xx *x* \"\"\" ->");
        expect(tokens[0]).to.deep.equal({
            value: "@doc",
            scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "doc\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
    });
    it("tokenizes void docstrings", function() {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n\"\"\"");
        expect(tokens[0]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\ndocstring\n\nfoo bar\n",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes void docstrings with whitespace after the final newline, but before the close-quote", function() {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n    \"\"\"");
        expect(tokens[0]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\ndocstring\n\nfoo bar\n    ",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes docstrings with no linebreak before the ending triple-quotes", function() {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar \"\"\"");
        expect(tokens[0]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\ndocstring\n\nfoo bar ",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes void docstrings that have extra content after ending tripe quote", function() {
        const tokens = tokenize(grammar, "\"\"\"\ndocstring\n\nfoo bar\n\"\"\" foobar");
        expect(tokens[0]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\ndocstring\n\nfoo bar\n",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " foobar",
            scopes: ["source.julia"]
        });
    });
    it("tokenizes @doc docstrings that have extra content after ending tripe quote", function() {
        const tokens = tokenize(grammar, "@doc \"\"\"\ndocstring\n\nfoo bar\n\"\"\" foobar");
        expect(tokens[0]).to.deep.equal({
            value: '@doc',
            scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "\ndocstring\n\nfoo bar\n",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "\"\"\"",
            scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " ",
            scopes: ["source.julia", "string.docstring.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "foobar",
            scopes: ["source.julia"]
        });
    });
    it("Doesn't tokenize all triple quotes as docstrings", function() {
        const tokens = tokenize(grammar, "parse(\"\"\"boo\"\"\")");
        expect(tokens[0]).to.deep.equal({
            value: 'parse',
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
        });
    });
    it("tokenizes function calls starting with double quotes", function() {
        const tokens = tokenize(grammar, 'warn("the_key is not a recognized aesthetic. Ignoring.")');
        expect(tokens[0]).to.deep.equal({
            value: "warn",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "the_key is not a recognized aesthetic. Ignoring.",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes function calls with unicode in names", function() {
        const tokens = tokenize(grammar, "fooα(bing, bang, boom)");
        expect(tokens[0]).to.deep.equal({
            value: "fooα",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "bing",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: " bang",
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: " boom",
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes escaped characters within a double quoted string", function() {
        const tokens = tokenize(grammar, '"\\u2200 x \\u2203 y"');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\\u2200",
            scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: " x ",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "\\u2203",
            scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: " y",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes escaped characters within a char", function() {
        const tokens = tokenize(grammar, "'\\u2203'");
        expect(tokens[0]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "\\u2203",
            scopes: ["source.julia", "string.quoted.single.julia", "constant.character.escape.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("char literals containing a '", function() {
        const tokens = tokenize(grammar, "'''");
        expect(tokens[0]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("empty char literals", function() {
        const tokens = tokenize(grammar, "''");
        expect(tokens[0]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes interpolated names in double strings", function() {
        const tokens = tokenize(grammar, '"$_ω!z_.ard!"');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$_ω!z_",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".ard!",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes interpolated expressions in double strings", function() {
        const tokens = tokenize(grammar, '"x=$(rand())"');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "x=",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "$(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "rand",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes nested interpolated expressions in double strings", function() {
        const tokens = tokenize(grammar, '"$((true + length("asdf$asf"))*0x0d) is a number."');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "true",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "constant.language.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: " ",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "+",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: " ",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "length",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "asdf",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: "$asf",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: "*",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[16]).to.deep.equal({
            value: "0x0d",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "constant.numeric.julia"]
        });
        expect(tokens[17]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[18]).to.deep.equal({
            value: " is a number.",
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[19]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes interpolated nested parentheses", function() {
        const tokens = tokenize(grammar, '"$(a(()))"');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes escaped double quotes", function() {
        const tokens = tokenize(grammar, 'f("\\""); f("\\"")');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '\\"',
            scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ";",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: '\\"',
            scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes custom string literals", function() {
        const tokens = tokenize(grammar, 'àb9!"asdf"_a9Ñ');
        expect(tokens[0]).to.deep.equal({
            value: 'àb9!',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "asdf",
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '_a9Ñ',
            scopes: ["source.julia", "string.quoted.other.julia", "support.function.macro.julia"]
        });
    });
    it("tokenizes Cxx.jl multiline string macros", function() {
        const tokens = tokenize(grammar, 'cxx"""\n#include "test.h"\n"""');
        expect(tokens[0]).to.deep.equal({
            value: 'cxx',
            scopes: ["source.julia", "embed.cxx.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\n#include "test.h"\n',
            scopes: ["source.julia", "embed.cxx.julia", "meta.embedded.inline.cpp"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes PyCall.jl multiline string macros", function() {
        const tokens = tokenize(grammar, 'py"""\nimport numpy as np\n"""');
        expect(tokens[0]).to.deep.equal({
            value: 'py',
            scopes: ["source.julia", "embed.python.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\nimport numpy as np\n',
            scopes: ["source.julia", "embed.python.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes js multiline string macros", function() {
        const tokens = tokenize(grammar, 'js"""\nvar foo = function () {return x}\n"""');
        expect(tokens[0]).to.deep.equal({
            value: 'js',
            scopes: ["source.julia", "embed.js.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\nvar foo = function () {return x}\n',
            scopes: ["source.julia", "embed.js.julia", "meta.embedded.inline.javascript"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes raw multiline string macros", function() {
        const tokens = tokenize(grammar, 'raw"""\na\t\sb\n"""');
        expect(tokens[0]).to.deep.equal({
            value: 'raw',
            scopes: ["source.julia", "string.quoted.other.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\na\t\sb\n',
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes raw single line string macros", function() {
        const tokens = tokenize(grammar, 'raw"a\t\sb"');
        expect(tokens[0]).to.deep.equal({
            value: 'raw',
            scopes: ["source.julia", "string.quoted.other.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'a\t\sb',
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes symbols of `keyword.other`s", function() {
        const tokens = tokenize(grammar, ':type');
        expect(tokens[0]).to.deep.equal({
            value: ':type',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
    });
    it("tokenizes variables ending in _type", function() {
        const tokens = tokenize(grammar, 'foo_immutable in');
        expect(tokens[0]).to.deep.equal({
            value: 'foo_immutable ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: 'in',
            scopes: ["source.julia", "keyword.operator.relation.in.julia"]
        });
    });
    it("tokenizes comments", function() {
        const tokens = tokenize(grammar, '# This is a comment');
        expect(tokens[0]).to.deep.equal({
            value: '#',
            scopes: ["source.julia", "comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' This is a comment',
            scopes: ["source.julia", "comment.line.number-sign.julia"]
        });
    });
    it("tokenizes block comments", function() {
        const tokens = tokenize(grammar, '#= begin #= begin end =# end =#');
        expect(tokens[0]).to.deep.equal({
            value: "#=",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " begin ",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "#=",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " begin end ",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "=#",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: " end ",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "=#",
            scopes: ["source.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
        });
    });
    it("tokenizes the pair assignment operator", function() {
        const tokens = tokenize(grammar, 'Dict(x => x for x in y)');
        expect(tokens[0]).to.deep.equal({
            value: 'Dict',
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '(',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'x ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '=>',
            scopes: ["source.julia", "keyword.operator.arrow.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' x ',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'for',
            scopes: ["source.julia", "keyword.control.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ' x ',
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: 'in',
            scopes: ["source.julia", "keyword.operator.relation.in.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: ' y',
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: ')',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it('tokenizes function definitions with special unicode identifiers', function() {
        const tokens = tokenize(grammar, "f′(xᵢ₊₁) = xᵢ₊₁' + ∇'");
        expect(tokens[0]).to.deep.equal({
            value: 'f′',
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '(',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'xᵢ₊₁',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ')',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: 'xᵢ₊₁',
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "keyword.operator.transposed-variable.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "+",
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '∇',
            scopes: ["source.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: "'",
            scopes: ["source.julia", "keyword.operator.transposed-variable.julia"]
        });
    });
    it("tokenizes short form function definitions with `where` syntax", function() {
        const tokens = tokenize(grammar, "x(a::T)  where  T<:Integer = ");
        expect(tokens[0]).to.deep.equal({
            value: "x",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "  ",
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "where",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "  T",
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "<:",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "Integer",
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it("tokenizes short form function definitions with multiple `where` args", function() {
        const tokens = tokenize(grammar, "x(a::T)  where {T, E} = ");
        expect(tokens[0]).to.deep.equal({
            value: "x",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "  ",
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: "where",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "{",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "T",
            scopes: ["source.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: ",",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: " E",
            scopes: ["source.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: "}",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes long-form anonymous function definitions without spaces", function() {
        const tokens = tokenize(grammar, "function(a)");
        expect(tokens[0]).to.deep.equal({
            value: "function",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes long-form anonymous function definitions with spaces", function() {
        const tokens = tokenize(grammar, "function (a)");
        expect(tokens[0]).to.deep.equal({
            value: "function",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
    });
    it("tokenizes long form function definitions with `where` syntax", function() {
        const tokens = tokenize(grammar, "function x(a::T)  where  T<:Integer");
        expect(tokens[0]).to.deep.equal({
            value: "function",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "x",
            scopes: ["source.julia", "entity.name.function.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: "a",
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "::",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: "T",
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "  ",
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: "where",
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: "  T",
            scopes: ["source.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: "<:",
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: "Integer",
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it("tokenizes the function applicator", function() {
        const tokens = tokenize(grammar, '[1:5;] |> x->x.^2 |> sum');
        expect(tokens[0]).to.deep.equal({
            value: '[',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '1',
            scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "meta.array.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '5',
            scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ']',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: '|>',
            scopes: ["source.julia", "keyword.operator.applies.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: ' x',
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: '->',
            scopes: ["source.julia", "keyword.operator.arrow.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: 'x',
            scopes: ["source.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: '.^',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: '|>',
            scopes: ["source.julia", "keyword.operator.applies.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: ' sum',
            scopes: ["source.julia"]
        });
    });
    it("tokenizes spelt out infix operators", function() {
        const tokens = tokenize(grammar, 'a isa Int && a in ints');
        expect(tokens[0]).to.deep.equal({
            value: 'a ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: 'isa',
            scopes: ["source.julia", "keyword.operator.isa.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' Int ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '&&',
            scopes: ["source.julia", "keyword.operator.boolean.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' a ',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'in',
            scopes: ["source.julia", "keyword.operator.relation.in.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ' ints',
            scopes: ["source.julia"]
        });
    });
    it("tokenizes everything related to `:` (ranges, symbols, subtyping)", function() {
        const tokens = tokenize(grammar, '1:3; a:b; c: d; e :f; :g: :h; i::J; k():l()');
        expect(tokens[0]).to.deep.equal({
            value: '1',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '3',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' a',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: 'b',
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: ' c',
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: ' d',
            scopes: ["source.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: ' e ',
            scopes: ["source.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ':f',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[16]).to.deep.equal({
            value: ':g',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[17]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[18]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[19]).to.deep.equal({
            value: ':h',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[20]).to.deep.equal({
            value: ';',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[21]).to.deep.equal({
            value: ' i',
            scopes: ["source.julia"]
        });
        expect(tokens[22]).to.deep.equal({
            value: '::',
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[23]).to.deep.equal({
            value: 'J',
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[29]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[30]).to.deep.equal({
            value: 'l',
            scopes: ["source.julia", "support.function.julia"]
        });
    });
    it("tokenizes dot operators", function() {
        const tokens = tokenize(grammar, 'x .<= y');
        expect(tokens[0]).to.deep.equal({
            value: 'x ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '.<=',
            scopes: ["source.julia", "keyword.operator.relation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' y',
            scopes: ["source.julia"]
        });
    });
    it("tokenizes type", function() {
        const tokens = tokenize(grammar, 'T>:Interger');
        expect(tokens[0]).to.deep.equal({
            value: 'T',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '>:',
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'Interger',
            scopes: ["source.julia", "support.type.julia"]
        });
    });
    it("tokenizes imaginary unit", function() {
        const tokens = tokenize(grammar, '2im 2img');
        expect(tokens[0]).to.deep.equal({
            value: '2im',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: 'img',
            scopes: ["source.julia"]
        });
    });
    it("tokenizes multiplied mathematical constants", function() {
        const tokens = tokenize(grammar, '2pi 2π');
        expect(tokens[0]).to.deep.equal({
            value: '2pi',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '2π',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes for outer loops', function() {
        const tokens = tokenize(grammar, 'for outer i = range');
        expect(tokens[0]).to.deep.equal({
            value: 'for',
            scopes: ["source.julia", "keyword.control.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'outer',
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ' i ',
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ' range',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes for outer loops with multiple iteration variables', function() {
        const tokens = tokenize(grammar, 'for outer i = range, \n outer j = range\n outer = 3');
        expect(tokens[0]).to.deep.equal({
            value: 'for',
            scopes: ["source.julia", "keyword.control.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'outer',
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ' i ',
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ' range',
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ',',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ' \n ',
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: 'outer',
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: ' j ',
            scopes: ["source.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: ' range',
            scopes: ["source.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '\n',
            scopes: ["source.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ' outer ',
            scopes: ["source.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[16]).to.deep.equal({
            value: '3',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('does not tokenize outer by itself as a keyword', function() {
        const tokens = tokenize(grammar, 'outer = foo');
        expect(tokens[0]).to.deep.equal({
            value: 'outer ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' foo',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes keywords preceded by dots correctly', function() {
        const tokens = tokenize(grammar, 'foo.module');
        expect(tokens[0]).to.deep.equal({
            value: 'foo',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '.',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'module',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes nothing and missing as keywords', function() {
        const tokens = tokenize(grammar, 'x = nothing, missing');
        expect(tokens[0]).to.deep.equal({
            value: 'x ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '=',
            scopes: ["source.julia", "keyword.operator.update.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: 'nothing',
            scopes: ["source.julia", "constant.language.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ',',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: 'missing',
            scopes: ["source.julia", "constant.language.julia"]
        });
    });
    it('tokenizes identifiers ', function() {
        const tokens = tokenize(grammar, 'b′0 - 2');
        expect(tokens[0]).to.deep.equal({
            value: 'b′0 ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '-',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes the ternary operator ', function() {
        const tokens = tokenize(grammar, 'a ? b : c');
        expect(tokens[0]).to.deep.equal({
            value: 'a ',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '?',
            scopes: ["source.julia", "keyword.operator.ternary.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' b ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.ternary.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' c',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes Float32s ', function() {
        const tokens = tokenize(grammar, '1f2');
        expect(tokens[0]).to.deep.equal({
            value: '1f2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes identifiers with weird characters and a transpose', function() {
        const tokens = tokenize(grammar, 'k̂\'');
        expect(tokens[0]).to.deep.equal({
            value: 'k̂',
            scopes: ["source.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '\'',
            scopes: ["source.julia", "keyword.operator.transposed-variable.julia"]
        });
    });
    it('tokenizes parentheses with a transpose', function() {
        const tokens = tokenize(grammar, '()\'');
        expect(tokens[0]).to.deep.equal({
            value: '(',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ')',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\'',
            scopes: ["source.julia", "keyword.operator.transpose.julia"]
        });
    });
    it('tokenizes parentheses with a dot transpose', function() {
        const tokens = tokenize(grammar, '().\'');
        expect(tokens[0]).to.deep.equal({
            value: '(',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ')',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '.\'',
            scopes: ["source.julia", "keyword.operator.transpose.julia"]
        });
    });
    it('tokenizes brackets with a transpose', function() {
        const tokens = tokenize(grammar, '[]\'');
        expect(tokens[0]).to.deep.equal({
            value: '[',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ']',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '\'',
            scopes: ["source.julia", "meta.array.julia", "keyword.operator.transpose.julia"]
        });
    });
    it('tokenizes brackets with a dot transpose', function() {
        const tokens = tokenize(grammar, '[].\'');
        expect(tokens[0]).to.deep.equal({
            value: '[',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ']',
            scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '.\'',
            scopes: ["source.julia", "meta.array.julia", "keyword.operator.transpose.julia"]
        });
    });
    it('tokenizes NaN', function() {
        const tokens = tokenize(grammar, 'NaN + NaNMath');
        expect(tokens[0]).to.deep.equal({
            value: 'NaN',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '+',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ' NaNMath',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes numbers with a transpose', function() {
        const tokens = tokenize(grammar, '2im\'+2');
        expect(tokens[0]).to.deep.equal({
            value: '2im',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '\'',
            scopes: ["source.julia", "keyword.operator.conjugate-number.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '+',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes ranges of string macros', function() {
        const tokens = tokenize(grammar, 'q"a":r"b":r`c`:var"d"');
        expect(tokens[0]).to.deep.equal({
            value: 'q',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'a',
            scopes: ["source.julia", "string.quoted.other.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ':',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'r"',
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: 'b',
            scopes: ["source.julia", "string.regexp.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: ':',
            scopes: ["source.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: 'r',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[10]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[11]).to.deep.equal({
            value: 'c',
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[12]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[13]).to.deep.equal({
            value: ':',
            scopes: ["source.julia"]
        });
        expect(tokens[14]).to.deep.equal({
            value: 'var"',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[15]).to.deep.equal({
            value: 'd',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[16]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
    });
    it('tokenizes the var"blah" syntax', function() {
        const tokens = tokenize(grammar, '2var"a"+var"""q"""');
        expect(tokens[0]).to.deep.equal({
            value: '2',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: 'var"',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'a',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '+',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'var"""',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: 'q',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "constant.other.symbol.julia"]
        });
    });
    it('tokenizes cmd macros', function() {
        const tokens = tokenize(grammar, 'a```b```*c`d`');
        expect(tokens[0]).to.deep.equal({
            value: 'a',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'b',
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '*',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'c',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: 'd',
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes backtick strings', function() {
        const tokens = tokenize(grammar, '```b```*`d`');
        expect(tokens[0]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: 'b',
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '*',
            scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'd',
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes interpolated strings', function() {
        const tokens = tokenize(grammar, '$"asd"');
        expect(tokens[0]).to.deep.equal({
            value: '$',
            scopes: ["source.julia", "keyword.operator.interpolation.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'asd',
            scopes: ["source.julia", "string.quoted.double.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it('tokenizes interpolated multi-line strings', function() {
        const tokens = tokenize(grammar, '$"""asd"""');
        expect(tokens[0]).to.deep.equal({
            value: '$',
            scopes: ["source.julia", "keyword.operator.interpolation.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'asd',
            scopes: ["source.julia", "string.quoted.triple.double.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '"""',
            scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.end.julia"]
        });
    });
    it('tokenizes numbers in combination with ranges', function() {
        let tokens = tokenize(grammar, '123...');
        expect(tokens[0]).to.deep.equal({
            value: '123',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '...',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });

        tokens = tokenize(grammar, '123_132.123_123...');
        expect(tokens[0]).to.deep.equal({
            value: '123_132.123_123',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '...',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });

        tokens = tokenize(grammar, '1...1');
        expect(tokens[0]).to.deep.equal({
            value: '1',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '...',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '1',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes multiple !s as a suffix', function() {
        const tokens = tokenize(grammar, 'asd!!!!!!');
        expect(tokens[0]).to.deep.equal({
            value: 'asd!!!!!!',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes function calls with a `=` in a comment', function() {
        const tokens = tokenize(grammar, 'f() # = 2');
        expect(tokens[0]).to.deep.equal({
            value: "f",
            scopes: ["source.julia", "support.function.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "(",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: " ",
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: '#',
            scopes: ["source.julia", "comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ' = 2',
            scopes: ["source.julia", "comment.line.number-sign.julia"]
        });
    });
    it('tokenizes number ranges syntax (..)', function() {
        let tokens = tokenize(grammar, '0..1');
        expect(tokens[0]).to.deep.equal({
            value: '0',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '..',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '1',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        tokens = tokenize(grammar, '0.0..1.0');
        expect(tokens[0]).to.deep.equal({
            value: '0.0',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: '..',
            scopes: ["source.julia", "keyword.operator.dots.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: '1.0',
            scopes: ["source.julia", "constant.numeric.julia"]
        });
    });
    it('tokenizes imports with as syntax', function() {
        let tokens = tokenize(grammar, 'import Foo as Bar');
        expect(tokens[0]).to.deep.equal({
            value: 'import',
            scopes: ["source.julia", "keyword.control.import.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' Foo ',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: 'as',
            scopes: ["source.julia", "keyword.control.as.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ' Bar',
            scopes: ["source.julia"]
        });
        tokens = tokenize(grammar, 'import Foo: x as y, z as yy');
        expect(tokens[0]).to.deep.equal({
            value: 'import',
            scopes: ["source.julia", "keyword.control.import.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' Foo',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ':',
            scopes: ["source.julia", "keyword.operator.range.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: ' x ',
            scopes: ["source.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: 'as',
            scopes: ["source.julia", "keyword.control.as.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: ' y',
            scopes: ["source.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ',',
            scopes: ["source.julia", "meta.bracket.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ' z ',
            scopes: ["source.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: 'as',
            scopes: ["source.julia", "keyword.control.as.julia"]
        });
        expect(tokens[9]).to.deep.equal({
            value: ' yy',
            scopes: ["source.julia"]
        });
    });
    it('tokenizes types with unicode chars', function() {
        const tokens = tokenize(grammar, 'struct ChebyshevLike <: AbstractΔMethod end');
        expect(tokens[0]).to.deep.equal({
            value: 'struct',
            scopes: ["source.julia", "keyword.other.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: ' ChebyshevLike',
            scopes: ["source.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '<:',
            scopes: ["source.julia", "keyword.operator.relation.types.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: 'AbstractΔMethod',
            scopes: ["source.julia", "support.type.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: ' ',
            scopes: ["source.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: 'end',
            scopes: ["source.julia", "keyword.control.end.julia"]
        });
    });
    it("tokenizes interpolated names in command strings", function() {
        const tokens = tokenize(grammar, '`$_ω!z_.ard!`');
        expect(tokens[0]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$_ω!z_",
            scopes: ["source.julia", "string.interpolated.backtick.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".ard!",
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '`',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes interpolated names in multi-line command strings", function() {
        const tokens = tokenize(grammar, '```$_ω!z_.ard!```');
        expect(tokens[0]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$_ω!z_",
            scopes: ["source.julia", "string.interpolated.backtick.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: ".ard!",
            scopes: ["source.julia", "string.interpolated.backtick.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: '```',
            scopes: ["source.julia", "string.interpolated.backtick.julia", "punctuation.definition.string.end.julia"]
        });
    });
    it("tokenizes interpolated generators", function() {
        const tokens = tokenize(grammar, '"$(a for a in a)"');
        expect(tokens[0]).to.deep.equal({
            value: '"',
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
        });
        expect(tokens[1]).to.deep.equal({
            value: "$(",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[2]).to.deep.equal({
            value: "a ",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[3]).to.deep.equal({
            value: "for",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.control.julia"]
        });
        expect(tokens[4]).to.deep.equal({
            value: " a ",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[5]).to.deep.equal({
            value: "in",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.relation.in.julia"]
        });
        expect(tokens[6]).to.deep.equal({
            value: " a",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[7]).to.deep.equal({
            value: ")",
            scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
        });
        expect(tokens[8]).to.deep.equal({
            value: "\"",
            scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
        });
    });
})
