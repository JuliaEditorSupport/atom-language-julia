# Julia support for Atom

[![Build Status](https://travis-ci.org/JuliaLang/atom-language-julia.svg?branch=master)](https://travis-ci.org/JuliaLang/atom-language-julia)

Atom package for the Julia language. Originally based off of [JuliaLang/julia.tmBundle](https://github.com/JuliaLang/Julia.tmbundle), merged with new ideas from [language-julia](https://github.com/tpoisot/language-julia/blob/master/README.md) package.

## Features:

- Syntax highlighting
- Snippets for common Julia keywords and constructs (see `snippets/language-julia.cson`)
- Snippets for all emoji supported at the REPL

## Installation

Installation happens normally either through `apm install language-julia` or through the install section of the settings tab within Atom.

Note: if you already have a different version of language-julia plugin installed (e.g. [this one](https://github.com/tpoisot/language-julia)), you would need to remove it first using `apm uninstall language-julia`

# Recommended Extras

* The [Latex Completions](https://github.com/JunoLab/atom-latex-completions)
  package provides support for unicode characters similarly to the Julia REPL.
* Additional settings: we recommend following the [contributor guidelines](https://github.com/JuliaLang/julia/blob/b414076bc4e9b77f983524540f0d8ad9498f1aa1/CONTRIBUTING.md#general-formatting-guidelines-for-julia-code-contributions) with resepct to whitespace. Atom can help you with this. To have atom automatically replace spaces with 4 tabs, you should click the checkbox for the `Soft Tabs` option on the settings page and add the following to your `settings.cson` file:

```coffeescript
".julia.source":
  editor:
    tabLength: 4
```

## Contributors:

- Everyone who has helped with the [tmBundle](https://github.com/JuliaLang/Julia.tmbundle)
- [Timothée Poisot](mailto:tim@poisotlab.io "tim@poisotlab.io")
- [Spencer Lyon](mailto:spencer.lyon@stern.nyu.edu "spencer.lyon@stern.nyu.edu")
