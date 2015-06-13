# Julia support for Atom

Atom package for the Julia language. Originally based off of [JuliaLang/julia.tmBundle](https://github.com/JuliaLang/Julia.tmbundle), merged with new ideas from  [language-julia](https://github.com/tpoisot/language-julia/blob/master/README.md) package.

## Features:

- Syntax highlighting
- Snippets for common Julia keywords and constructs (see `snippets/language-julia.cson`)
- Snippets to replace LaTex-like greek characters with their unicode equivalent (exact same behavior as at the Julia REPL, i.e. `\alpha[TAB]` → `α`)
- Snippets for all emoji supported at the REPL


## Installation
Until atom-language-julia is listed in the Atom Package Manager, installation is a manual process:

```
apm uninstall language-julia    # remove existing package
cd SOMEWHERE_TO_STORE_REPO      # pick a directory to store this git repository
git clone git@github.com:JuliaLang/atom-language-julia.git  # clone the repo
apm link atom-language-julia    # create a symlink to ~/.atom/packages.
```

All commands should be entered at a UNIX shell, and `SOMEWHERE_TO_STORE_REPO` should be changed to a directory of your choosing.

## Contributors:

- Everyone who has helped with the [tmBundle](https://github.com/JuliaLang/Julia.tmbundle)
- [Timothée Poisot](mailto:tim@poisotlab.io "tim@poisotlab.io")
- [Spencer Lyon](mailto:spencer.lyon@stern.nyu.edu "spencer.lyon@stern.nyu.edu")
