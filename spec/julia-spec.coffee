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

  it "tokenizes element-wise operators", ->
    {tokens} = grammar.tokenizeLine("A .* B'")
    expect(tokens[0]).toEqual value: "A ", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: ".*", scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[2]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "B", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "'", scopes: ["source.julia", "keyword.operator.transposed-variable.julia"]

  it "tokenizes functions and types", ->
    {tokens} = grammar.tokenizeLine("à_b9!(a::Int64)")
    expect(tokens[0]).toEqual value: "à_b9!", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::Int64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes types ignoring whitespace", ->
    {tokens} = grammar.tokenizeLine("f(x :: Int, y     ::   Float64, z::Float32, a :: X.Y.Z.A, b ::    X.Y.Z)")
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: " :: Int", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: " y", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "     ::   Float64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[8]).toEqual value: " z", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: "::Float32", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[11]).toEqual value: " a", scopes: ["source.julia"]
    expect(tokens[12]).toEqual value: " :: X.Y.Z.A", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[14]).toEqual value: " b", scopes: ["source.julia"]
    expect(tokens[15]).toEqual value: " ::    X.Y.Z", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[16]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes functions and (shallowly nested) parameterized types", ->
    {tokens} = grammar.tokenizeLine("x{T <: Dict{Any, Tuple{Int, Int}}}(a::T, b::Union{Int, Set{Any}})")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "{T <: Dict{Any, Tuple{Int, Int}}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: " b", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "::Union{Int, Set{Any}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[8]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes functions with return type declarations", ->
    {tokens} = grammar.tokenizeLine("x{T<:AbstractInteger}(a::T)::Int")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "{T<:AbstractInteger}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "::Int", scopes: ["source.julia", "support.type.julia"]

  it "tokenizes typed arrays and comprehensions", ->
    {tokens} = grammar.tokenizeLine("Int[x for x=y]")
    expect(tokens[0]).toEqual value: "Int", scopes: ["source.julia"]
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
    expect(tokens[2]).toEqual value: "@time", scopes: ["source.julia", "support.function.macro.julia"]

  it "tokenizes qualified unicode names", ->
    {tokens} = grammar.tokenizeLine("Ñy_M0d!._àb9!_")
    expect(tokens[0]).toEqual value: "Ñy_M0d!", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[2]).toEqual value: "_àb9!_", scopes: ["source.julia"]

  it "tokenizes extension of external methods", ->
    {tokens} = grammar.tokenizeLine("function Base.start(itr::MyItr)")
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

  it "tokenizes using statements", ->
    {tokens} = grammar.tokenizeLine("using Base.Test")
    expect(tokens[0]).toEqual value: "using", scopes: ["source.julia", "keyword.control.using.julia"]
    expect(tokens[1]).toEqual value: " Base", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[3]).toEqual value: "Test", scopes: ["source.julia"]

  it "tokenizes import statements", ->
    {tokens} = grammar.tokenizeLine("import Base.Test")
    expect(tokens[0]).toEqual value: "import", scopes: ["source.julia", "keyword.control.import.julia"]
    expect(tokens[1]).toEqual value: " Base", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[3]).toEqual value: "Test", scopes: ["source.julia"]

  it "tokenizes importall statements", ->
    {tokens} = grammar.tokenizeLine("importall Base.Test")
    expect(tokens[0]).toEqual value: "importall", scopes: ["source.julia", "keyword.control.importall.julia"]
    expect(tokens[1]).toEqual value: " Base", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: ".", scopes: ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[3]).toEqual value: "Test", scopes: ["source.julia"]

  it "tokenizes export statements", ->
    {tokens} = grammar.tokenizeLine("export my_awesome_function")
    expect(tokens[0]).toEqual value: "export", scopes: ["source.julia", "keyword.control.export.julia"]
    expect(tokens[1]).toEqual value: " my_awesome_function", scopes: ["source.julia"]

  it "tokenizes symbols", ->
    {tokens} = grammar.tokenizeLine(":à_b9!")
    expect(tokens[0]).toEqual value: ":", scopes: ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[1]).toEqual value: "à_b9!", scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes regular expressions", ->
    {tokens} = grammar.tokenizeLine('r"[jJ]ulia"im')
    expect(tokens[0]).toEqual value: "r\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "[jJ]ulia", scopes: ["source.julia", "string.regexp.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
    expect(tokens[3]).toEqual value: "im", scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]

  it 'tokenizes macro strings with escaped chars', ->
    {tokens} = grammar.tokenizeLine('m"α\\u1234\\\\"')
    expect(tokens[0]).toEqual value: "m\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "α", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[2]).toEqual value: "\\u1234", scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
    expect(tokens[3]).toEqual value: "\\\\", scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]


  it "tokenizes docstrings", ->
    {tokens} = grammar.tokenizeLine("@doc doc\"\"\" xx *x* \"\"\" ->")
    expect(tokens[0]).toEqual value: "@doc", scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
    expect(tokens[2]).toEqual value: "doc\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]

  it "tokenizes void docstrings", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
    \"\"\"""")
    expect(tokens[0]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar", scopes: ["source.julia", "string.docstring.julia", "source.gfm"]
    expect(tokens[3]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes void docstrings with whitespace after the final newline, but before the close-quote", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
        \"\"\"""")
    expect(tokens[0]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar", scopes: ["source.julia", "string.docstring.julia", "source.gfm"]
    expect(tokens[3]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes void docstrings that have extra content after ending tripe quote", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
    \"\"\" foobar
    """)
    expect(tokens[0]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar", scopes: ["source.julia", "string.docstring.julia", "source.gfm"]
    expect(tokens[3]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[4]).toEqual value: " ", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[5]).toEqual value: "foobar", scopes: ["source.julia"]

  it "tokenizes @doc docstrings that have extra content after ending tripe quote", ->
    {tokens} = grammar.tokenizeLine("""@doc \"\"\"
    docstring

    foo bar
    \"\"\" foobar
    """)
    expect(tokens[0]).toEqual value: '@doc', scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: ' ', scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "\ndocstring\n\nfoo bar\n", scopes: ["source.julia", "string.docstring.julia", "source.gfm"]
    expect(tokens[4]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: " ", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[6]).toEqual value: "foobar", scopes: ["source.julia"]

  it "Doesn't tokenize all triple quotes as docstrings", ->
    {tokens} = grammar.tokenizeLine("""parse(\"\"\"boo\"\"\")""")
    expect(tokens[0]).toEqual value: 'parse', scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: '"""', scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]

  # we don't care about the rest of the tokens -- we just didn't want first """ to be docstring

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

  it "tokenizes interpolated names in double strings", ->
    {tokens} = grammar.tokenizeLine('"$_ω!z_.ard!"')
    expect(tokens[0]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "$_ω!z_", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[2]).toEqual value: ".ard!", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes interpolated expressions in double strings", ->
    {tokens} = grammar.tokenizeLine('"x=$(rand())"')
    expect(tokens[0]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "x=", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[2]).toEqual value: "$(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[3]).toEqual value: "rand", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
    expect(tokens[4]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[6]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[7]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes nested interpolated expressions in double strings", ->
    {tokens} = grammar.tokenizeLine('"$((true + length("asdf$asf"))*0x0d) is a number."')
    expect(tokens[0]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "$(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[3]).toEqual value: "true", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "constant.language.julia"]
    expect(tokens[4]).toEqual value: " ", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[5]).toEqual value: "+", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[6]).toEqual value: " ", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[7]).toEqual value: "length", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "support.function.julia"]
    expect(tokens[8]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[9]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[10]).toEqual value: "asdf", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia"]
    expect(tokens[11]).toEqual value: "$asf", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[12]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[13]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[14]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[15]).toEqual value: "*", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[16]).toEqual value: "0x0d", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "constant.numeric.julia"]
    expect(tokens[17]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[18]).toEqual value: " is a number.", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[19]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes escaped double quotes", ->
    {tokens} = grammar.tokenizeLine('f("\\""); f("\\"")')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "; ", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[8]).toEqual value: "(", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[10]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[11]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[12]).toEqual value: ")", scopes: ["source.julia"]

  it "tokenizes custom string literals", ->
    {tokens} = grammar.tokenizeLine('àb9!"asdf"_a9Ñ')
    expect(tokens[0]).toEqual value: 'àb9!"', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "asdf", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[2]).toEqual value: '"_a9Ñ', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes Cxx.jl multiline string macros", ->
    tokens = grammar.tokenizeLines('''
    cxx"""
    #include "test.h"
    """
    ''')
    expect(tokens[0][0]).toEqual value: 'cxx', scopes: ["source.julia", "embed.cxx.julia", "support.function.macro.julia"]
    expect(tokens[0][1]).toEqual value: '"""', scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1][0]).toEqual value: '#include "test.h"', scopes: ["source.julia", "embed.cxx.julia", "source.cpp"]
    expect(tokens[2][0]).toEqual value: '"""', scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes Cxx.jl single lin string macros", ->
    {tokens} = grammar.tokenizeLine('vcpp"std::string"')
    expect(tokens[0]).toEqual value: 'vcpp', scopes: ["source.julia", "embed.cxx.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: 'std::string', scopes: ["source.julia", "embed.cxx.julia", "source.cpp"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "embed.cxx.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes symbols of `keyword.other`s", ->
    {tokens} = grammar.tokenizeLine(':type')
    expect(tokens[0]).toEqual value: ':', scopes: ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[1]).toEqual value: 'type', scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes symbols of `storage.modifier`s", ->
    {tokens} = grammar.tokenizeLine(':using')
    expect(tokens[0]).toEqual value: ':', scopes: ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[1]).toEqual value: 'using', scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes symbols of `keyword.control`s", ->
    {tokens} = grammar.tokenizeLine(':else')
    expect(tokens[0]).toEqual value: ':', scopes: ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[1]).toEqual value: 'else', scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes variables ending in _type", ->
    {tokens} = grammar.tokenizeLine('foo_immutable in')
    expect(tokens[0]).toEqual value: 'foo_immutable ', scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: 'in', scopes: ["source.julia", "keyword.control.julia"]

  it "tokenizes comments", ->
    {tokens} = grammar.tokenizeLine('# This is a comment')
    expect(tokens[0]).toEqual value: '#', scopes: ["source.julia", "comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
    expect(tokens[1]).toEqual value: ' This is a comment', scopes: ["source.julia", "comment.line.number-sign.julia"]

  it "tokenizes the pair assignment operator", ->
    {tokens} = grammar.tokenizeLine('Dict(x => x for x in y)')
    expect(tokens[0]).toEqual value: 'Dict', scopes:  ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: '(',    scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: 'x ',   scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: '=>',   scopes:  ["source.julia", "keyword.operator.arrow.julia"]
    expect(tokens[4]).toEqual value: ' x ',  scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: 'for',  scopes:  ["source.julia", "keyword.control.julia"]
    expect(tokens[6]).toEqual value: ' x ',  scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: 'in',   scopes:  ["source.julia", "keyword.control.julia"]
    expect(tokens[8]).toEqual value: ' y',   scopes:  ["source.julia"]
    expect(tokens[9]).toEqual value: ')',    scopes:  ["source.julia"]

  it 'tokenizes function definitions with special unicode identifiers', ->
    {tokens} = grammar.tokenizeLine("f′(xᵢ₊₁) = xᵢ₊₁'")
    expect(tokens[0]).toEqual value: 'f′',   scopes:  ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: '(',    scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: 'xᵢ₊₁', scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: ')',    scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: ' ',    scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: '=',    scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[6]).toEqual value: ' ',    scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: 'xᵢ₊₁', scopes:  ["source.julia"]
    expect(tokens[8]).toEqual value: "'",    scopes:  ["source.julia", "keyword.operator.transposed-variable.julia"]

  it "tokenizes the function applicator", ->
    {tokens} = grammar.tokenizeLine('[1:5;] |> x->x.^2 |> sum')
    expect(tokens[0]).toEqual value: '[',    scopes:  ["source.julia", "meta.array.julia"]
    expect(tokens[1]).toEqual value: '1',    scopes:  ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[2]).toEqual value: ':',    scopes:  ["source.julia", "meta.array.julia", "keyword.operator.range.julia"]
    expect(tokens[3]).toEqual value: '5',    scopes:  ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[4]).toEqual value: ';',    scopes:  ["source.julia", "meta.array.julia"]
    expect(tokens[5]).toEqual value: ']',    scopes:  ["source.julia", "meta.array.julia"]
    expect(tokens[6]).toEqual value: ' ',    scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: '|>',   scopes:  ["source.julia", "keyword.operator.applies.julia"]
    expect(tokens[8]).toEqual value: ' x',   scopes:  ["source.julia"]
    expect(tokens[9]).toEqual value: '->',   scopes:  ["source.julia", "keyword.operator.arrow.julia"]
    expect(tokens[10]).toEqual value: 'x',   scopes:  ["source.julia"]
    expect(tokens[11]).toEqual value: '.^',  scopes:  ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[12]).toEqual value: '2',   scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[13]).toEqual value: ' ',   scopes:  ["source.julia"]
    expect(tokens[14]).toEqual value: '|>',  scopes:  ["source.julia", "keyword.operator.applies.julia"]
    expect(tokens[15]).toEqual value: ' sum', scopes:  ["source.julia"]
