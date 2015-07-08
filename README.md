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

## Contributing

We love contributors. Here are the steps we have taken to develop on this pacakge:

1. Remove the official install of the package: `apm uninstall language-julia`
2. Clone the repository somewhere we can remember: `git clone git@github.com:JuliaLang/atom-language-julia.git`
3. Link the cloned package to `~/.atom` (enter the following from the root of the repo directory): `apm link .`
4. Hack away!

When new features are added, you should write specs to show that the package is behaving as expected. To run the specs you need to do the following:

- Make sure you have the library's folder open in the current atom project.
- Then open the command pallete and select `Window: Run package specs`. On OSX this key-binding is `ctrl+cmd+option+p`.

This should open up a new window with the spec results.

#### Contributor list

- Everyone who has helped with the [tmBundle](https://github.com/JuliaLang/Julia.tmbundle)
- [Timothée Poisot](mailto:tim@poisotlab.io "tim@poisotlab.io")
- [Spencer Lyon](mailto:spencer.lyon@stern.nyu.edu "spencer.lyon@stern.nyu.edu")
