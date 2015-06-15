# Julia support for Atom

[![Build Status](https://travis-ci.org/JuliaLang/atom-language-julia.svg?branch=master)](https://travis-ci.org/JuliaLang/atom-language-julia)

Atom package for the Julia language. Originally based off of [JuliaLang/julia.tmBundle](https://github.com/JuliaLang/Julia.tmbundle), merged with new ideas from  [language-julia](https://github.com/tpoisot/language-julia/blob/master/README.md) package.

## Features:

- Syntax highlighting
- Snippets for common Julia keywords and constructs (see `snippets/language-julia.cson`)
- Snippets to replace LaTex-like greek characters with their unicode equivalent (exact same behavior as at the Julia REPL, i.e. `\alpha[TAB]` → `α`)
- Snippets for all emoji supported at the REPL

## Installation

Installation happens normally either through `apm install language-julia` or through the install section of the settings tab within Atom.

## Contributors:

- Everyone who has helped with the [tmBundle](https://github.com/JuliaLang/Julia.tmbundle)
- [Timothée Poisot](mailto:tim@poisotlab.io "tim@poisotlab.io")
- [Spencer Lyon](mailto:spencer.lyon@stern.nyu.edu "spencer.lyon@stern.nyu.edu")
