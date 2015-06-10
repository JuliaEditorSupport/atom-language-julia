function write_symbolln(buf::IOBuffer, k, v)
    write(buf, "'$(strip(k, ':'))':\n    ")
    write(buf, "prefix: '\\\\$k'\n    ")
    write(buf, "body: '$v'")
    write(buf, "\n  ")
end

@doc doc"""
write_snippet_file(d::Dict, fn::String)

Write the symbols in the dict `d` to s file named `fn` as snippets.
The keys of  the dict will  be the prefix and name for the snippets and
the dict values will be the snippet body.
""" ->
function write_snippet_file(d::Dict, fn::String)
    buf = IOBuffer()
    write(buf, "'.source.julia':\n  ")

    for k in keys(d)
        k1 = strip(k, '\\')
        v = d[k]
        write_symbolln(buf, k1, v)
    end

    open(fn, "w") do f
        write(f, bytestring(buf))
    end
end


function main()
    dicts = (Base.REPLCompletions.latex_symbols,
             Base.REPLCompletions.emoji_symbols)
    file_names = ("latex_symbols.cson", "emoji_symbols.cson")
    map(write_snippet_file, dicts, file_names)
    nothing
end

main()
