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
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "Int64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes struct definitions", ->
    {tokens} = grammar.tokenizeLine("struct Foo end")
    expect(tokens[0]).toEqual value: "struct", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " Foo ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "end", scopes: ["source.julia", "keyword.control.end.julia"]

  it "tokenizes mutable struct definitions", ->
    {tokens} = grammar.tokenizeLine("mutable  struct Foo end")
    expect(tokens[0]).toEqual value: "mutable  struct", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " Foo ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "end", scopes: ["source.julia", "keyword.control.end.julia"]

  it "tokenizes abstract type definitions", ->
    {tokens} = grammar.tokenizeLine("abstract type Foo end")
    expect(tokens[0]).toEqual value: "abstract type", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " Foo ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "end", scopes: ["source.julia", "keyword.control.end.julia"]

  it "tokenizes primitive type definitions", ->
    {tokens} = grammar.tokenizeLine("primitive type Foo 64 end")
    expect(tokens[0]).toEqual value: "primitive type", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " Foo ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "64", scopes: ["source.julia", "constant.numeric.julia"]
    expect(tokens[3]).toEqual value:  " ", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "end", scopes: ["source.julia", "keyword.control.end.julia"]

  it "doesn't tokenize 'mutable', 'abstract' or 'primitive' on their own", ->
    {tokens} = grammar.tokenizeLine("mutable = 3; abstract = 5; primitive = 11")
    expect(tokens[0]).toEqual value: "mutable ", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[2]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "3", scopes: ["source.julia", "constant.numeric.julia"]
    expect(tokens[4]).toEqual value: ";", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: " abstract ", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[7]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[8]).toEqual value: "5", scopes: ["source.julia", "constant.numeric.julia"]
    expect(tokens[9]).toEqual value: ";", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[10]).toEqual value: " primitive ", scopes: ["source.julia"]
    expect(tokens[11]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[12]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[13]).toEqual value: "11", scopes: ["source.julia", "constant.numeric.julia"]

  it "tokenizes types ignoring whitespace", ->
    {tokens} = grammar.tokenizeLine("f(x :: Int, y     ::   Float64, z::Float32, a :: X.Y.Z.A, b ::    X.Y.Z)")
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[5]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "Int", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[7]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[8]).toEqual value: " y", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: "     ", scopes: ["source.julia"]
    expect(tokens[10]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[11]).toEqual value: "   ", scopes: ["source.julia"]
    expect(tokens[12]).toEqual value: "Float64", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[13]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[14]).toEqual value: " z", scopes: ["source.julia"]
    expect(tokens[15]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[16]).toEqual value: "Float32", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[17]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[18]).toEqual value: " a", scopes: ["source.julia"]
    expect(tokens[19]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[20]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[21]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[22]).toEqual value: "X.Y.Z.A", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[23]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[24]).toEqual value: " b", scopes: ["source.julia"]
    expect(tokens[25]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[26]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[27]).toEqual value: "    ", scopes: ["source.julia"]
    expect(tokens[28]).toEqual value: "X.Y.Z", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[29]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes `const` as a keyword", ->
    {tokens} = grammar.tokenizeLine("const Foo")
    expect(tokens[0]).toEqual value: "const", scopes: ["source.julia", "keyword.storage.modifier.julia"]
    expect(tokens[1]).toEqual value: " Foo", scopes: ["source.julia"]

  it "tokenizes functions and (shallowly nested) parameterized types", ->
    {tokens} = grammar.tokenizeLine("x{T <: Dict{Any, Tuple{Int, Int}}}(a::T, b::Union{Int, Set{Any}})")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "{T <: Dict{Any, Tuple{Int, Int}}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[5]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[6]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[7]).toEqual value: " b", scopes: ["source.julia"]
    expect(tokens[8]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[9]).toEqual value: "Union{Int, Set{Any}}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[10]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes functions with return type declarations", ->
    {tokens} = grammar.tokenizeLine("x{T<:AbstractInteger}(a::T)::Int")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "{T<:AbstractInteger}", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[5]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[6]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[7]).toEqual value: "::", scopes: ["source.julia","keyword.operator.relation.julia"]
    expect(tokens[8]).toEqual value: "Int", scopes: ["source.julia", "support.type.julia"]

  it "tokenizes functiono declarations with interpolated type parameters", ->
    {tokens} = grammar.tokenizeLine("f(x::$foo)=3")
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "$foo", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[7]).toEqual value: "3", scopes: ["source.julia", "constant.numeric.julia"]

  it "tokenizes typed arrays and comprehensions", ->
    {tokens} = grammar.tokenizeLine("Int[x for x=y]")
    expect(tokens[0]).toEqual value: "Int", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: "[", scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "x ", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[3]).toEqual value: "for", scopes: ["source.julia", "meta.array.julia", "keyword.control.julia"]
    expect(tokens[4]).toEqual value: " x", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[5]).toEqual value: "=", scopes: ["source.julia", "meta.array.julia", "keyword.operator.update.julia"]
    expect(tokens[6]).toEqual value: "y", scopes: ["source.julia", "meta.array.julia"]
    expect(tokens[7]).toEqual value: "]", scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]

  it "tokenizes begin/end indexing", ->
    {tokens} = grammar.tokenizeLine("ary[begin:end]")
    expect(tokens[0]).toEqual value: "ary", scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: "[", scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "begin", scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[3]).toEqual value: ":", scopes: ["source.julia", "meta.array.julia", "keyword.operator.range.julia"]
    expect(tokens[4]).toEqual value: "end", scopes: ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[5]).toEqual value: "]", scopes: ["source.julia", "meta.array.julia", "meta.bracket.julia"]

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
    expect(tokens[4]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: "itr", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[7]).toEqual value: "MyItr", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[8]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes macro calls", ->
    {tokens} = grammar.tokenizeLine("@. @elapsed x^2")
    expect(tokens[0]).toEqual value: "@.", scopes: ["source.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: " ",  scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "@elapsed", scopes: ["source.julia", "support.function.macro.julia"]
    expect(tokens[3]).toEqual value: " x", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: "^", scopes: ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[5]).toEqual value: "2", scopes: ["source.julia", "constant.numeric.julia"]

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

  it "tokenizes export statements", ->
    {tokens} = grammar.tokenizeLine("export my_awesome_function")
    expect(tokens[0]).toEqual value: "export", scopes: ["source.julia", "keyword.control.export.julia"]
    expect(tokens[1]).toEqual value: " my_awesome_function", scopes: ["source.julia"]

  it "tokenizes symbols", ->
    {tokens} = grammar.tokenizeLine(":à_b9!")
    expect(tokens[0]).toEqual value: ":à_b9!", scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes regular expressions", ->
    {tokens} = grammar.tokenizeLine('r"[jJ]ulia"im')
    expect(tokens[0]).toEqual value: "r\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "[jJ]ulia", scopes: ["source.julia", "string.regexp.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
    expect(tokens[3]).toEqual value: "im", scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]

  it "tokenizes regular expressions with triple quotes", ->
    {tokens} = grammar.tokenizeLine('r"""[jJ]ulia "jl" xyz"""im')
    expect(tokens[0]).toEqual value: "r\"\"\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "[jJ]ulia \"jl\" xyz", scopes: ["source.julia", "string.regexp.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]
    expect(tokens[3]).toEqual value: "im", scopes: ["source.julia", "string.regexp.julia", "keyword.other.option-toggle.regexp.julia"]

  it "tokenizes empty regular expressions", ->
    {tokens} = grammar.tokenizeLine('r""')
    expect(tokens[0]).toEqual value: "r\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]

  it "tokenizes empty regular expressions with triple quotes", ->
    {tokens} = grammar.tokenizeLine('r""""""')
    expect(tokens[0]).toEqual value: "r\"\"\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.begin.julia"]
    expect(tokens[1]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.regexp.julia", "punctuation.definition.string.regexp.end.julia"]

  it 'tokenizes macro strings with triple quotes', ->
    {tokens} = grammar.tokenizeLine('ab"""xyz"""')
    expect(tokens[0]).toEqual value: "ab", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: "xyz", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[3]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it 'tokenizes macro strings juxtaposed to numbers', ->
    {tokens} = grammar.tokenizeLine('123.2ab"""xyz"""')
    expect(tokens[0]).toEqual value: "123.2", scopes: ["source.julia", "constant.numeric.julia"]
    expect(tokens[1]).toEqual value: "ab", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "xyz", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[4]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it 'tokenizes triple quotes', ->
    {tokens} = grammar.tokenizeLine('"""xyz"""')
    expect(tokens[0]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]
    expect(tokens[1]).toEqual value: "xyz", scopes: ["source.julia", "string.quoted.triple.double.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.end.julia"]

  it 'tokenizes string macro function type constraint', ->
    {tokens} = grammar.tokenizeLine('f(x::T) where T <: MIME"text/plain"')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "where", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[8]).toEqual value: " T", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[10]).toEqual value: "<:", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[11]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[12]).toEqual value: "MIME\"text/plain\"", scopes: ["source.julia", "support.type.julia"]

  it 'tokenizes empty string macros', ->
    {tokens} = grammar.tokenizeLine('foo""')
    expect(tokens[0]).toEqual value: "foo", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it 'tokenizes string macro in function argument type', ->
    {tokens} = grammar.tokenizeLine('f(x::MIME"text/plain")')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "MIME\"text/plain\"", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it 'tokenizes string macro after type operator', ->
    {tokens} = grammar.tokenizeLine('::MIME"annoying \\"string\\" bla bla"')
    expect(tokens[0]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[1]).toEqual value: 'MIME"annoying \\"string\\" bla bla"', scopes: ["source.julia", "support.type.julia"]

  it 'tokenizes string macro after type operator', ->
    {tokens} = grammar.tokenizeLine('::MIME"text/plain"')
    expect(tokens[0]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[1]).toEqual value: "MIME\"text/plain\"", scopes: ["source.julia", "support.type.julia"]

  it 'tokenizes string macro after type operator in short form func definiton', ->
    {tokens} = grammar.tokenizeLine('f(::MIME"text/plain") = ""')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[3]).toEqual value: "MIME\"text/plain\"", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[7]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[8]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[9]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it 'tokenizes string macro with escaped quotes after type operator in short form func definiton', ->
    {tokens} = grammar.tokenizeLine('f(::MIME"text/pl\\"ain") = ""')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[3]).toEqual value: "MIME\"text/pl\\\"ain\"", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[6]).toEqual value: "=", scopes: ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[7]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[8]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[9]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it 'tokenizes macro strings with escaped chars', ->
    {tokens} = grammar.tokenizeLine('m"α\\u1234\\\\"')
    expect(tokens[0]).toEqual value: "m", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: "α", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[3]).toEqual value: "\\u1234", scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: "\\\\", scopes: ["source.julia", "string.quoted.other.julia", "constant.character.escape.julia"]
    expect(tokens[5]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

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
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar\n", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes void docstrings with whitespace after the final newline, but before the close-quote", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
        \"\"\"""")
    expect(tokens[0]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar\n    ", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes docstrings with no linebreak before the ending triple-quotes", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar \"\"\"""")
    expect(tokens[0]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar ", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]


  it "tokenizes void docstrings that have extra content after ending tripe quote", ->
    {tokens} = grammar.tokenizeLine("""\"\"\"
    docstring

    foo bar
    \"\"\" foobar
    """)
    expect(tokens[0]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "\ndocstring\n\nfoo bar\n", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[3]).toEqual value: " foobar", scopes: ["source.julia"]

  it "tokenizes @doc docstrings that have extra content after ending tripe quote", ->
    {tokens} = grammar.tokenizeLine("""@doc \"\"\"
    docstring

    foo bar
    \"\"\" foobar
    """)
    expect(tokens[0]).toEqual value: '@doc', scopes: ["source.julia", "string.docstring.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: ' ', scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[2]).toEqual value: '"""', scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "\ndocstring\n\nfoo bar\n", scopes: ["source.julia", "string.docstring.julia",]
    expect(tokens[4]).toEqual value: "\"\"\"", scopes: ["source.julia", "string.docstring.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: " ", scopes: ["source.julia", "string.docstring.julia"]
    expect(tokens[6]).toEqual value: "foobar", scopes: ["source.julia"]

  it "Doesn't tokenize all triple quotes as docstrings", ->
    {tokens} = grammar.tokenizeLine("""parse(\"\"\"boo\"\"\")""")
    expect(tokens[0]).toEqual value: 'parse', scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: '"""', scopes: ["source.julia", "string.quoted.triple.double.julia", "punctuation.definition.string.multiline.begin.julia"]

  # we don't care about the rest of the tokens -- we just didn't want first """ to be docstring

  # code is a line from Gadfly.jl -- with the interpolation taken out
  it "tokenizes function calls starting with double quotes", ->
    {tokens} = grammar.tokenizeLine('warn("the_key is not a recognized aesthetic. Ignoring.")')
    expect(tokens[0]).toEqual value: "warn", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: "the_key is not a recognized aesthetic. Ignoring.", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[4]).toEqual value: "\"", scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes function calls with unicode in names", ->
    {tokens} = grammar.tokenizeLine("fooα(bing, bang, boom)")
    expect(tokens[0]).toEqual value: "fooα", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "bing", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: " bang", scopes: ["source.julia"]
    expect(tokens[5]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: " boom", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

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

  it "char literals containing a '", ->
    {tokens} = grammar.tokenizeLine("'''")
    expect(tokens[0]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia"]
    expect(tokens[2]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]

  it "empty char literals", ->
    {tokens} = grammar.tokenizeLine("''")
    expect(tokens[0]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1]).toEqual value: "'", scopes: ["source.julia", "string.quoted.single.julia", "punctuation.definition.string.end.julia"]

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
    expect(tokens[4]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
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
    expect(tokens[8]).toEqual value: "(", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
    expect(tokens[9]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[10]).toEqual value: "asdf", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia"]
    expect(tokens[11]).toEqual value: "$asf", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[12]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[13]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "meta.bracket.julia"]
    expect(tokens[14]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[15]).toEqual value: "*", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[16]).toEqual value: "0x0d", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia", "constant.numeric.julia"]
    expect(tokens[17]).toEqual value: ")", scopes: ["source.julia", "string.quoted.double.julia", "variable.interpolation.julia"]
    expect(tokens[18]).toEqual value: " is a number.", scopes: ["source.julia", "string.quoted.double.julia"]
    expect(tokens[19]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes escaped double quotes", ->
    {tokens} = grammar.tokenizeLine('f("\\""); f("\\"")')
    expect(tokens[0]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[3]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[4]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: ";", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[7]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[8]).toEqual value: "f", scopes: ["source.julia", "support.function.julia"]
    expect(tokens[9]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[10]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[11]).toEqual value: '\\"', scopes: ["source.julia", "string.quoted.double.julia", "constant.character.escape.julia"]
    expect(tokens[12]).toEqual value: '"', scopes: ["source.julia", "string.quoted.double.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[13]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes custom string literals", ->
    {tokens} = grammar.tokenizeLine('àb9!"asdf"_a9Ñ')
    expect(tokens[0]).toEqual value: 'àb9!', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: "asdf", scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]
    expect(tokens[4]).toEqual value: '_a9Ñ', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

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

  it "tokenizes PyCall.jl multiline string macros", ->
    tokens = grammar.tokenizeLines('''
    py"""
    import numpy as np
    """
    ''')
    expect(tokens[0][0]).toEqual value: 'py', scopes: ["source.julia", "embed.python.julia", "support.function.macro.julia"]
    expect(tokens[0][1]).toEqual value: '"""', scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1][0]).toEqual value: 'import numpy as np', scopes: ["source.julia", "embed.python.julia", "source.python"]
    expect(tokens[2][0]).toEqual value: '"""', scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes PyCall.jl single line string macros", ->
    {tokens} = grammar.tokenizeLine('py"np.array()"')
    expect(tokens[0]).toEqual value: 'py', scopes: ["source.julia", "embed.python.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: 'np.array()', scopes: ["source.julia", "embed.python.julia", "source.python"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "embed.python.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes js multiline string macros", ->
    tokens = grammar.tokenizeLines('''
    js"""
    var foo = function () {return x}
    """
    ''')
    expect(tokens[0][0]).toEqual value: 'js', scopes: ["source.julia", "embed.js.julia", "support.function.macro.julia"]
    expect(tokens[0][1]).toEqual value: '"""', scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1][0]).toEqual value: 'var foo = function () {return x}', scopes: ["source.julia", "embed.js.julia", "source.js"]
    expect(tokens[2][0]).toEqual value: '"""', scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes js single line string macros", ->
    {tokens} = grammar.tokenizeLine('js"new Promise()"')
    expect(tokens[0]).toEqual value: 'js', scopes: ["source.julia", "embed.js.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: 'new Promise()', scopes: ["source.julia", "embed.js.julia", "source.js"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "embed.js.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes raw multiline string macros", ->
    tokens = grammar.tokenizeLines('''
    raw"""
    a\t\sb
    """
    ''')
    expect(tokens[0][0]).toEqual value: 'raw', scopes: ["source.julia", "string.quoted.other.julia", "support.function.macro.julia"]
    expect(tokens[0][1]).toEqual value: '"""', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1][0]).toEqual value: 'a\t\sb', scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[2][0]).toEqual value: '"""', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes raw single line string macros", ->
    {tokens} = grammar.tokenizeLine('raw"a\t\sb"')
    expect(tokens[0]).toEqual value: 'raw', scopes: ["source.julia", "string.quoted.other.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: 'a\t\sb', scopes: ["source.julia", "string.quoted.other.julia"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "string.quoted.other.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes Markdown multiline string macros", ->
    tokens = grammar.tokenizeLines('''
    md"""
    # hello world
    """
    ''')
    expect(tokens[0][0]).toEqual value: 'md', scopes: ["source.julia", "embed.markdown.julia", "support.function.macro.julia"]
    expect(tokens[0][1]).toEqual value: '"""', scopes: ["source.julia", "embed.markdown.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[1][0]).toEqual value: '# hello world', scopes: ["source.julia", "embed.markdown.julia", "source.gfm"]
    expect(tokens[2][0]).toEqual value: '"""', scopes: ["source.julia", "embed.markdown.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes Markdown single line string macros", ->
    {tokens} = grammar.tokenizeLine('md"hello *world*"')
    expect(tokens[0]).toEqual value: 'md', scopes: ["source.julia", "embed.markdown.julia", "support.function.macro.julia"]
    expect(tokens[1]).toEqual value: '"', scopes: ["source.julia", "embed.markdown.julia", "punctuation.definition.string.begin.julia"]
    expect(tokens[2]).toEqual value: 'hello *world*', scopes: ["source.julia", "embed.markdown.julia", "source.gfm"]
    expect(tokens[3]).toEqual value: '"', scopes: ["source.julia", "embed.markdown.julia", "punctuation.definition.string.end.julia"]

  it "tokenizes symbols of `keyword.other`s", ->
    {tokens} = grammar.tokenizeLine(':type')
    expect(tokens[0]).toEqual value: ':type', scopes: ["source.julia", "constant.other.symbol.julia"]

  it "tokenizes variables ending in _type", ->
    {tokens} = grammar.tokenizeLine('foo_immutable in')
    expect(tokens[0]).toEqual value: 'foo_immutable ', scopes: ["source.julia"]
    expect(tokens[1]).toEqual value: 'in', scopes: ["source.julia", "keyword.operator.relation.in.julia"]

  it "tokenizes comments", ->
    {tokens} = grammar.tokenizeLine('# This is a comment')
    expect(tokens[0]).toEqual value: '#', scopes: ["source.julia", "comment.line.number-sign.julia", "punctuation.definition.comment.julia"]
    expect(tokens[1]).toEqual value: ' This is a comment', scopes: ["source.julia", "comment.line.number-sign.julia"]

  it "tokenizes block comments", ->
    {tokens} = grammar.tokenizeLine('#= begin #= begin end =# end =#')
    expect(tokens[0]).toEqual value: "#=", scopes: ["source.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
    expect(tokens[1]).toEqual value: " begin ", scopes: ["source.julia", "comment.block.number-sign-equals.julia"]
    expect(tokens[2]).toEqual value: "#=", scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.begin.julia"]
    expect(tokens[3]).toEqual value: " begin end ", scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia"]
    expect(tokens[4]).toEqual value: "=#", scopes: ["source.julia", "comment.block.number-sign-equals.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]
    expect(tokens[5]).toEqual value: " end ", scopes: ["source.julia", "comment.block.number-sign-equals.julia"]
    expect(tokens[6]).toEqual value: "=#", scopes: ["source.julia", "comment.block.number-sign-equals.julia", "punctuation.definition.comment.end.julia"]

  it "tokenizes the pair assignment operator", ->
    {tokens} = grammar.tokenizeLine('Dict(x => x for x in y)')
    expect(tokens[0]).toEqual value: 'Dict', scopes:  ["source.julia", "support.function.julia"]
    expect(tokens[1]).toEqual value: '(',    scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: 'x ',   scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: '=>',   scopes:  ["source.julia", "keyword.operator.arrow.julia"]
    expect(tokens[4]).toEqual value: ' x ',  scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: 'for',  scopes:  ["source.julia", "keyword.control.julia"]
    expect(tokens[6]).toEqual value: ' x ',  scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: 'in',   scopes:  ["source.julia", "keyword.operator.relation.in.julia"]
    expect(tokens[8]).toEqual value: ' y',   scopes:  ["source.julia"]
    expect(tokens[9]).toEqual value: ')',    scopes:  ["source.julia", "meta.bracket.julia"]

  it 'tokenizes function definitions with special unicode identifiers', ->
    {tokens} = grammar.tokenizeLine("f′(xᵢ₊₁) = xᵢ₊₁' + ∇'")
    expect(tokens[0]).toEqual value: 'f′',   scopes:  ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: '(',    scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: 'xᵢ₊₁',  scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: ')',    scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: ' ',    scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: '=',    scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[6]).toEqual value: ' ',    scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: 'xᵢ₊₁',  scopes:  ["source.julia"]
    expect(tokens[8]).toEqual value: "'",    scopes:  ["source.julia", "keyword.operator.transposed-variable.julia"]
    expect(tokens[9]).toEqual value: " ",    scopes:  ["source.julia"]
    expect(tokens[10]).toEqual value: "+",   scopes:  ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[11]).toEqual value: ' ',   scopes:  ["source.julia"]
    expect(tokens[12]).toEqual value: '∇',   scopes:  ["source.julia"]
    expect(tokens[13]).toEqual value: "'",   scopes:  ["source.julia", "keyword.operator.transposed-variable.julia"]

  it "tokenizes short form function definitions with `where` syntax", ->
    {tokens} = grammar.tokenizeLine("x(a::T)  where  T<:Integer = ")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: "  ", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "where", scopes: ["source.julia","keyword.other.julia"]
    expect(tokens[8]).toEqual value: "  T", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: "<:", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[10]).toEqual value: "Integer", scopes: ["source.julia", "support.type.julia"]

  it "tokenizes short form function definitions with multiple `where` args", ->
    {tokens} = grammar.tokenizeLine("x(a::T)  where {T, E} = ")
    expect(tokens[0]).toEqual value: "x", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[4]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[6]).toEqual value: "  ", scopes: ["source.julia"]
    expect(tokens[7]).toEqual value: "where", scopes: ["source.julia","keyword.other.julia"]
    expect(tokens[8]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: "{", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[10]).toEqual value: "T", scopes: ["source.julia"]
    expect(tokens[11]).toEqual value: ",", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[12]).toEqual value: " E", scopes: ["source.julia"]
    expect(tokens[13]).toEqual value: "}", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes long-form anonymous function definitions without spaces", ->
    {tokens} = grammar.tokenizeLine("function(a)")
    expect(tokens[0]).toEqual value: "function", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[2]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[3]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes long-form anonymous function definitions with spaces", ->
    {tokens} = grammar.tokenizeLine("function (a)")
    expect(tokens[0]).toEqual value: "function", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[3]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[4]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]

  it "tokenizes long form function definitions with `where` syntax", ->
    {tokens} = grammar.tokenizeLine("function x(a::T)  where  T<:Integer")
    expect(tokens[0]).toEqual value: "function", scopes: ["source.julia", "keyword.other.julia"]
    expect(tokens[1]).toEqual value: " ", scopes: ["source.julia"]
    expect(tokens[2]).toEqual value: "x", scopes: ["source.julia", "entity.name.function.julia"]
    expect(tokens[3]).toEqual value: "(", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: "a", scopes: ["source.julia"]
    expect(tokens[5]).toEqual value: "::", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[6]).toEqual value: "T", scopes: ["source.julia", "support.type.julia"]
    expect(tokens[7]).toEqual value: ")", scopes: ["source.julia", "meta.bracket.julia"]
    expect(tokens[8]).toEqual value: "  ", scopes: ["source.julia"]
    expect(tokens[9]).toEqual value: "where", scopes: ["source.julia","keyword.other.julia"]
    expect(tokens[10]).toEqual value: "  T", scopes: ["source.julia"]
    expect(tokens[11]).toEqual value: "<:", scopes: ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[12]).toEqual value: "Integer", scopes: ["source.julia", "support.type.julia"]

  it "tokenizes the function applicator", ->
    {tokens} = grammar.tokenizeLine('[1:5;] |> x->x.^2 |> sum')
    expect(tokens[0]).toEqual value: '[',    scopes:  ["source.julia", "meta.array.julia", "meta.bracket.julia"]
    expect(tokens[1]).toEqual value: '1',    scopes:  ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[2]).toEqual value: ':',    scopes:  ["source.julia", "meta.array.julia", "keyword.operator.range.julia"]
    expect(tokens[3]).toEqual value: '5',    scopes:  ["source.julia", "meta.array.julia", "constant.numeric.julia"]
    expect(tokens[4]).toEqual value: ';',    scopes:  ["source.julia", "meta.array.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: ']',    scopes:  ["source.julia", "meta.array.julia", "meta.bracket.julia"]
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

  it "tokenizes spelt out infix operators", ->
    {tokens} = grammar.tokenizeLine('a isa Int && a in ints')
    expect(tokens[0]).toEqual value: 'a ',    scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: 'isa',   scopes:  ["source.julia", "keyword.operator.isa.julia"]
    expect(tokens[2]).toEqual value: ' Int ', scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: '&&',    scopes:  ["source.julia", "keyword.operator.boolean.julia"]
    expect(tokens[4]).toEqual value: ' a ',   scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: 'in',    scopes:  ["source.julia", "keyword.operator.relation.in.julia"]
    expect(tokens[6]).toEqual value: ' ints', scopes:  ["source.julia"]

  it "tokenizes everything related to `:` (ranges, symbols, subtyping)", ->
    {tokens} = grammar.tokenizeLine('1:3; a:b; c: d; e :f; :g: :h; i::J; k():l()')
    expect(tokens[0]).toEqual value: '1',      scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[1]).toEqual value: ':',      scopes:  ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[2]).toEqual value: '3',      scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[3]).toEqual value: ';',      scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[4]).toEqual value: ' a',     scopes:  ["source.julia"]
    expect(tokens[5]).toEqual value: ':',      scopes:  ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[6]).toEqual value: 'b',      scopes:  ["source.julia"]
    expect(tokens[7]).toEqual value: ';',      scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[8]).toEqual value: ' c',     scopes:  ["source.julia"]
    expect(tokens[9]).toEqual value: ':',      scopes:  ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[10]).toEqual value: ' d',    scopes:  ["source.julia"]
    expect(tokens[11]).toEqual value: ';',     scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[12]).toEqual value: ' e ',   scopes:  ["source.julia"]
    expect(tokens[13]).toEqual value: ':f',    scopes:  ["source.julia", "constant.other.symbol.julia"]
    expect(tokens[14]).toEqual value: ';',     scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[15]).toEqual value: ' ',     scopes:  ["source.julia"]
    expect(tokens[16]).toEqual value: ':g',    scopes:  ["source.julia", "constant.other.symbol.julia"]
    expect(tokens[17]).toEqual value: ':',     scopes:  ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[18]).toEqual value: ' ',     scopes:  ["source.julia"]
    expect(tokens[19]).toEqual value: ':h',    scopes:  ["source.julia", "constant.other.symbol.julia"]
    expect(tokens[20]).toEqual value: ';',     scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[21]).toEqual value: ' i',   scopes:  ["source.julia"]
    expect(tokens[22]).toEqual value: '::',    scopes:  ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[23]).toEqual value: 'J',     scopes:  ["source.julia", "support.type.julia"]
    expect(tokens[29]).toEqual value: ':',     scopes:  ["source.julia", "keyword.operator.range.julia"]
    expect(tokens[30]).toEqual value: 'l',     scopes:  ["source.julia", "support.function.julia"]

  it "tokenizes dot operators", ->
    {tokens} = grammar.tokenizeLine('x .<= y')
    expect(tokens[0]).toEqual value: 'x ',     scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '.<=',    scopes:  ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[2]).toEqual value: ' y',     scopes:  ["source.julia"]

  it "tokenizes type", ->
    {tokens} = grammar.tokenizeLine('T>:Interger')
    expect(tokens[0]).toEqual value: 'T',     scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '>:',    scopes:  ["source.julia", "keyword.operator.relation.julia"]
    expect(tokens[2]).toEqual value: 'Interger',     scopes: ["source.julia", "support.type.julia"]

  it "tokenizes imaginary unit", ->
    {tokens} = grammar.tokenizeLine('2im 2img')
    expect(tokens[0]).toEqual value: '2im',    scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[1]).toEqual value: ' ',      scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: '2',      scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[3]).toEqual value: 'img',    scopes:  ["source.julia"]

  it 'tokenizes for outer loops', ->
    {tokens} = grammar.tokenizeLine('for outer i = range')
    expect(tokens[0]).toEqual value: 'for',       scopes:  ["source.julia", "keyword.control.julia"]
    expect(tokens[1]).toEqual value: ' ',         scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: 'outer',     scopes:  ["source.julia", "keyword.other.julia"]
    expect(tokens[3]).toEqual value: ' i ',       scopes:  ["source.julia"]
    expect(tokens[4]).toEqual value: '=',         scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[5]).toEqual value: ' range',    scopes:  ["source.julia"]

  it 'tokenizes for outer loops with multiple iteration variables', ->
    {tokens} = grammar.tokenizeLine('for outer i = range, \n outer j = range\n outer = 3')
    expect(tokens[0]).toEqual value: 'for',       scopes:  ["source.julia", "keyword.control.julia"]
    expect(tokens[1]).toEqual value: ' ',         scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: 'outer',     scopes:  ["source.julia", "keyword.other.julia"]
    expect(tokens[3]).toEqual value: ' i ',       scopes:  ["source.julia"]
    expect(tokens[4]).toEqual value: '=',         scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[5]).toEqual value: ' range',    scopes:  ["source.julia"]
    expect(tokens[6]).toEqual value: ',',         scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[7]).toEqual value: ' \n ',      scopes:  ["source.julia"]
    expect(tokens[8]).toEqual value: 'outer',     scopes:  ["source.julia", "keyword.other.julia"]
    expect(tokens[9]).toEqual value: ' j ',       scopes:  ["source.julia"]
    expect(tokens[10]).toEqual value: '=',        scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[11]).toEqual value: ' range',   scopes:  ["source.julia"]
    expect(tokens[12]).toEqual value: '\n',       scopes:  ["source.julia"]
    expect(tokens[13]).toEqual value: ' outer ',  scopes:  ["source.julia"]
    expect(tokens[14]).toEqual value: '=',        scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[15]).toEqual value: ' ',        scopes:  ["source.julia"]
    expect(tokens[16]).toEqual value: '3',        scopes:  ["source.julia", "constant.numeric.julia"]

  it 'does not tokenize outer by itself as a keyword', ->
    {tokens} = grammar.tokenizeLine('outer = foo')
    expect(tokens[0]).toEqual value: 'outer ', scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '=',      scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[2]).toEqual value: ' foo',   scopes:  ["source.julia"]

  it 'tokenizes keywords preceded by dots correctly', ->
    {tokens} = grammar.tokenizeLine('foo.module')
    expect(tokens[0]).toEqual value: 'foo',    scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '.',      scopes:  ["source.julia", "keyword.operator.dots.julia"]
    expect(tokens[2]).toEqual value: 'module', scopes:  ["source.julia"]

  it 'tokenizes nothing and missing as keywords', ->
    {tokens} = grammar.tokenizeLine('x = nothing, missing')
    expect(tokens[0]).toEqual value: 'x ',       scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '=',        scopes:  ["source.julia", "keyword.operator.update.julia"]
    expect(tokens[2]).toEqual value: ' ',        scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: 'nothing',  scopes:  ["source.julia", "constant.language.julia"]
    expect(tokens[4]).toEqual value: ',',        scopes:  ["source.julia", "meta.bracket.julia"]
    expect(tokens[5]).toEqual value: ' ',        scopes:  ["source.julia"]
    expect(tokens[6]).toEqual value: 'missing',  scopes:  ["source.julia", "constant.language.julia"]

  it 'tokenizes identifiers ', ->
    {tokens} = grammar.tokenizeLine('b′0 - 2')
    expect(tokens[0]).toEqual value: 'b′0 ', scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '-',   scopes:  ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[2]).toEqual value: ' ',   scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: '2',   scopes:  ["source.julia", "constant.numeric.julia"]

  it 'tokenizes the ternary operator ', ->
    {tokens} = grammar.tokenizeLine('a ? b : c')
    expect(tokens[0]).toEqual value: 'a ',  scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '?',   scopes:  ["source.julia", "keyword.operator.ternary.julia"]
    expect(tokens[2]).toEqual value: ' b ', scopes:  ["source.julia"]
    expect(tokens[3]).toEqual value: ':',   scopes:  ["source.julia", "keyword.operator.ternary.julia"]
    expect(tokens[4]).toEqual value: ' c',  scopes:  ["source.julia"]

  it 'tokenizes Float32s ', ->
    {tokens} = grammar.tokenizeLine('1f2')
    expect(tokens[0]).toEqual value: '1f2', scopes:  ["source.julia", "constant.numeric.julia"]

  it 'tokenizes identifiers with weird characters and a transpose', ->
    {tokens} = grammar.tokenizeLine('k̂\'')
    expect(tokens[0]).toEqual value: 'k̂',  scopes:  ["source.julia"]
    expect(tokens[1]).toEqual value: '\'', scopes:  ["source.julia", "keyword.operator.transposed-variable.julia"]

  it 'tokenizes NaN', ->
    {tokens} = grammar.tokenizeLine('NaN + NaNMath')
    expect(tokens[0]).toEqual value: 'NaN',      scopes:  ["source.julia", "constant.numeric.julia"]
    expect(tokens[1]).toEqual value: ' ',        scopes:  ["source.julia"]
    expect(tokens[2]).toEqual value: '+',        scopes:  ["source.julia", "keyword.operator.arithmetic.julia"]
    expect(tokens[3]).toEqual value: ' NaNMath', scopes:  ["source.julia"]
