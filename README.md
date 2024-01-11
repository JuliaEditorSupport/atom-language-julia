# Julia Grammar

[![Build Status](https://github.com/JuliaEditorSupport/atom-language-julia/workflows/CI/badge.svg)](https://github.com/JuliaEditorSupport/atom-language-julia/actions?query=workflow%3ACI+branch%3Amaster)

Julia grammar definition for Atom, VS Code, and GitHub.

The source of truth in this repo is `grammars/julia.json`; `julia.cson` and `julia_vscode.json` are automatically generated in a pre-commit hook.

## Contributing

We love contributors. Here are the steps we have taken to develop on this package:

0. Install prerequisites: [Node.js](https://nodejs.org/) and `npm` (comes bundled with Node). We recommend using a [Node version manager](https://github.com/search?q=node+version+manager+archived%3Afalse&type=repositories&ref=advsearch). LTS is recommended, but any node version newer than 14 should do.
1. Clone this repo and `cd` into it
2. Run `npm ci`
3. Open `grammars/julia.json` in your favourite editor and fix a bug or implement additional highlighting rules
4. Add corresponding tests at the bottom of `test/test.js`
5. Run the updated tests with `npm run test`
6. Once tests pass and you're happy with your changes, commit them and open a PR against this repo. This should automatically run a pre-commit hook that generates derivative grammars for VS Code and Atom from `julia.json`.

### Testing the updated grammar in VS Code
Follow the [julia-vscode developer instructions](https://github.com/julia-vscode/julia-vscode/blob/main/CONTRIBUTING.md) to get the extension setup. Afterwards, simply copy the updated `julia_vscode.json` from this repo into `julia-vscode/syntaxes` and you should see your changes in the debug editor after reloading it.

## Contributor list

- Everyone who has helped with the [tmBundle](https://github.com/JuliaLang/Julia.tmbundle)
- [See contributors](https://github.com/JuliaEditorSupport/atom-language-julia/graphs/contributors)

## Atom package
<details>
<summary>Atom package (sunset end of 2022)</summary>

This is also an Atom package to provide Julia syntax highlighting, snippets, and docstring folding. Originally based off of [JuliaLang/julia.tmBundle](https://github.com/JuliaLang/Julia.tmbundle), merged with new ideas from [language-julia](https://github.com/tpoisot/language-julia/blob/master/README.md).

### Features:

- Syntax highlighting
- Snippets for common Julia keywords and constructs (see `snippets/language-julia.cson`)
- Toggle folding of docstrings

### Installation

Installation happens normally either through `apm install language-julia` or through the install section of the settings tab within Atom.

Note: if you already have a different version of language-julia plugin installed (e.g. [this one](https://github.com/tpoisot/language-julia)), you would need to remove it first using `apm uninstall language-julia`

### Recommended Extras

* The [LaTeX Completions](https://github.com/JunoLab/atom-latex-completions)
  package provides support for unicode characters similarly to the Julia REPL.
* The [Indent Detective](https://github.com/JunoLab/atom-indent-detective) package will help you keep to the style guidelines when working on Base or packages.
* Install [language-markdown](https://atom.io/packages/language-markdown) for syntax highlighting in docstrings.
* Install [atom-language-r](https://atom.io/packages/atom-language-r) for syntax highlighting of R string macros.

### Toggling docstrings

Two Atom commands are provided to toggle all docstrings or the docstring under the cursor: `language-julia:toggle-docstrings` and `language-julia:toggle-all-docstrings`. These are not assigned keys. Here is one example of adding these to keymaps using org-mode style keys:

```
'atom-text-editor[data-grammar="source julia"]:not([mini])':
  'tab':       'language-julia:toggle-docstrings'
  'shift-tab': 'language-julia:toggle-all-docstrings'
```

</details>
