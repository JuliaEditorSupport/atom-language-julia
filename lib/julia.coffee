{CompositeDisposable, Point, Range, TextBuffer} = require 'atom'

module.exports = JuliaFolding =
  subscriptions: null

  activate: (state) ->

    @subscriptions = new CompositeDisposable

    # Register command that toggles the view
    @subscriptions.add atom.commands.add 'atom-workspace', 'language-julia:toggledocstrings': (event) => @toggledocstrings(event)
    @subscriptions.add atom.commands.add 'atom-workspace', 'language-julia:togglealldocstrings': => @togglealldocstrings()

    @foldnext = true

  deactivate: ->
    @subscriptions.dispose()

  isdocstring: (scopes) ->
    for str in scopes.getScopesArray()
      console.log(str)
      if str.match /string\.docstring/
        return true
    return false
    
  toggledocstrings: (event) ->
    editor = atom.workspace.getActiveTextEditor()
    startpos = editor.getCursorBufferPosition()
    startrow = startpos.row
    isdoc = @isdocstring(editor.scopeDescriptorForBufferPosition(startpos))
    if !isdoc
      event.abortKeyBinding()
      return
    shouldunfold = editor.isFoldedAtBufferRow(startrow + 1)
    if shouldunfold
      editor.unfoldBufferRow(startrow)
      return
    row = startrow
    row-- while row >= 0 && @isdocstring(editor.scopeDescriptorForBufferPosition([row, 0]))
    firstrow = row + 1
    row = startrow
    row++ while row < editor.getLastBufferRow() && @isdocstring(editor.scopeDescriptorForBufferPosition([row, 0]))
    lastrow = row - 1
    if lastrow > firstrow
      editor.setSelectedBufferRange(new Range(new Point(firstrow, 0), new Point(lastrow, 0)))
      editor.foldSelectedLines()
      editor.moveUp()

  togglealldocstrings: ->
    editor = atom.workspace.getActiveTextEditor()
    if !@foldnext
      editor.unfoldAll()
      editor.scrollToCursorPosition()
    else # fold
      lookingforfirst = true
      for row in [0..editor.getLastBufferRow()]
        # editor.setCursorBufferPosition([row, 0])
        # isdoc = @isdocstring(editor.scopeDescriptorForBufferPosition(editor.getCursorBufferPosition()))
        isdoc = @isdocstring(editor.scopeDescriptorForBufferPosition([row, 0]))
        if lookingforfirst && isdoc 
            firstrow = row
            lookingforfirst = false
        else if !lookingforfirst && !isdoc
            lookingforfirst = true
            if row > firstrow
              editor.createFold(firstrow, row - 1)
    @foldnext = !@foldnext

