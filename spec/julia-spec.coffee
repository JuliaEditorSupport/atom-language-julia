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
    {tokens} = grammar.tokenizeLine("à_b9!(a::Int64)")
    console.log(tokens)
    expect(tokens[0]).toEqual value: "à_b9!", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::Int64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes functions and (shallowly nested) parameterized types", ->
    {tokens} = grammar.tokenizeLine("x{T <: Dict{Any, Tuple{Int, Int}}}(a::T, b::Union{Int, Set{Any}})")
    console.log(tokens)
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "{T <: Dict{Any, Tuple{Int, Int}}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: " b", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "::Union{Int, Set{Any}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[8]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes typed arrays and comprehensions", ->
    {tokens} = grammar.tokenizeLine("Tuple{Int, Int}[x for x=y]")
    console.log(tokens)
    expect(tokens[0]).toEqual value: "Tuple{Int, Int}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[1]).toEqual value: "[", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[2]).toEqual value: "x ", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[3]).toEqual value: "for", scopes: ["source.julia", "meta.array.julia", "keyword.control.julia"]
    expect(tokens[4]).toEqual value: " x", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[5]).toEqual value: "=", scopes: ["source.julia", "meta.array.julia", "keyword.operator.update.julia"]
    expect(tokens[6]).toEqual value: "y", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[7]).toEqual value: "]", scopes: ["source.julia", "meta.array.julia"]

  it "tokenizes qualified names", ->
    {tokens} = grammar.tokenizeLine("Base.@time")
    expect(tokens[0]).toEqual value: "Base", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[2]).toEqual value: "@time", scopes: ["source.julia"]

  it "tokenizes qualified unicode names", ->
    {tokens} = grammar.tokenizeLine("Ñy_M0d!._àb9!_")
    expect(tokens[0]).toEqual value: "Ñy_M0d!", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[2]).toEqual value: "_àb9!_", scopes: ["source.julia"]

  it "tokenizes extension of external methods", ->
    {tokens} = grammar.tokenizeLine("function Base.start(itr::MyItr)")
    console.log(tokens)
    expect(tokens[0]).toEqual value: "function", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " Base", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[3]).toEqual value: "start", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[4]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[5]).toEqual value: "itr", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "::MyItr", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[7]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes macro calls", ->
    {tokens} = grammar.tokenizeLine("@elapsed x^2")
    expect(tokens[0]).toEqual value: "@elapsed", scopes: ["source.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: " x", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "^", scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[3]).toEqual value: "2", scopes: ["source.julia", "constant.numeric.julia"]

  it "tokenizes symbols", ->
    {tokens} = grammar.tokenizeLine(":à_b9!")
    expect(tokens[0]).toEqual value: ":", scopes: ["source.julia", "keyword.operator.ternary.julia"]
    expect(tokens[1]).toEqual value: "à_b9!", scopes: ["source.julia", "constant.other.symbol.julia"]

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

  # code is a line from Gadfly.jl -- with the interpolation taken out
  it "tokenizes function calls starting with double quotes", ->
    {tokens} = grammar.tokenizeLine('warn("the_key is not a recognized aesthetic. Ignoring.")')
    expect(tokens[0]).toEqual value: "warn", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "the_key is not a recognized aesthetic. Ignoring.", scopes: ["source.julia", "string.quoted.double.julia"]
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

  it "tokenizes escaped characters within a double quoted string", ->
    {tokens} = grammar.tokenizeLine('"\\u2200 x \\u2203 y"')
    expect(tokens[0]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\\u2200", scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[2]).toEqual value: " x ", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[3]).toEqual value: "\\u2203", scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: " y", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[5]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes escaped characters within a char", ->
    {tokens} = grammar.tokenizeLine("'\\u2203'")
    expect(tokens[0]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\\u2203", scopes: ["source.julia", "string.quoted.single.julia", "constant.character.escape.julia"]
    expect(tokens[2]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes dollar-sign interpolation in double strings", ->
    {tokens} = grammar.tokenizeLine('"x=$(rand())"')
    expect(tokens[0]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "x=", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[2]).toEqual value: "$", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia", "keyword.operator.dollar-sign.julia"]
    expect(tokens[3]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia"]
    expect(tokens[4]).toEqual value: "rand", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia", "support.function.julia"]
    expect(tokens[5]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia"]
    expect(tokens[6]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia"]
    expect(tokens[7]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "string.interpolated.dollar-sign.julia"]
    expect(tokens[8]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes escaped double quotes", ->
    {tokens} = grammar.tokenizeLine('f("\\""); f("\\"")')
    expect(tokens[0]).toEqual value: 'f', scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: ')', scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: '; ', scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: 'f', scopes: ["source.julia", "support.function.julia"]
    expect(tokens[8]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[10]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[11]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[12]).toEqual value: ')', scopes: ["source.julia"]
