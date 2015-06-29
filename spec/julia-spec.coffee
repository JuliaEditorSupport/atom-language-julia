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

  it "tokenizes regular expressions", ->
    {tokens} = grammar.tokenizeLine('r"[jJ]ulia"im')
    expect(tokens[0]).toEqual value: "r\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "[jJ]ulia", scopes: ["source.julia", "string.regexp.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
    expect(tokens[3]).toEqual value: "im", scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]

  it "tokenizes docstrings", ->
    {tokens} = grammar.tokenizeLine("@doc doc\"\"\" xx *x* \"\"\" ->")
    expect(tokens[0]).toEqual value: "@doc", scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
    expect(tokens[2]).toEqual value: "doc\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]

  it "tokenizes void docstrings", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
    \"\"\"
    """)
    expect(tokens[0]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar", scopes: ["source.julia", "string.docstring.julia", "source.gfm"]
    expect(tokens[3]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]

  # code is a line from Gadfly.jl
  it "tokenizes function calls starting with double quotes", ->
    {tokens} = grammar.tokenizeLine("warn(\"$(string(key)) is not a recognized aesthetic. Ignoring.\")")
    expect(tokens[0]).toEqual value: "warn", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "$(string(key)) is not a recognized aesthetic. Ignoring.", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[4]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes function calls with unicode in names", ->
    {tokens} = grammar.tokenizeLine("fooα(bing, bang, boom)")
    expect(tokens[0]).toEqual value: "fooα", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "bing", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: " bang", scopes: ["source.julia"]
    expect(tokens[5]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: " boom", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: ")", scopes: ["source.julia"]
