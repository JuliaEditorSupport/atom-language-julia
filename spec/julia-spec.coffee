describe "Julia grammar", ->
  grammar = null
  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-julia")
    runs ->
      grammar = atom.grammars.grammarForScopeName("source.julia")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.julia"

  it "tokenizes functions and types", ->
    {tokens} = grammar.tokenizeLine("x(a::Int64)")
    console.log(tokens)
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::Int64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes macros", ->
    {tokens} = grammar.tokenizeLine("@elapsed x^2")
    expect(tokens[0]).toEqual value: "@elapsed", scopes: ["source.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: " x", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "^", scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[3]).toEqual value: "2", scopes: ["source.julia", "constant.numeric.julia"]

  it "tokenizes symbols", ->
    {tokens} = grammar.tokenizeLine(":foobar")
    expect(tokens[0]).toEqual value: ":", scopes: ["source.julia", "keyword.operator.ternary.julia"]
    expect(tokens[1]).toEqual value: "foobar", scopes: ["source.julia", "constant.other.symbol.julia"]


  it "tokenizes docstrings", ->
    {tokens} = grammar.tokenizeLine("@doc doc\"\"\" xx *x* \"\"\" ->")
    expect(tokens[0]).toEqual value: "@doc", scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
    expect(tokens[2]).toEqual value: "doc\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
