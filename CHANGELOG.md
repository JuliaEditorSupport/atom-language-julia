# Change Log

All notable changes to the Julia grammar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
### Fixed
- new Julia 1.10 keyword `public` is now parsed correctly([#271](https://github.com/JuliaEditorSupport/atom-language-julia/issues/271))

## [0.22.0] - 2021-11-07
### Fixed
- Mathematial constants juxtaposed with numbers are properly highlighted now ([#251](https://github.com/JuliaEditorSupport/atom-language-julia/pull/251))
- Parentheses in string interpolation are now correctly tokenized ([#251](https://github.com/JuliaEditorSupport/atom-language-julia/pull/251))
- `'` after math constants is now correctly tokenized ([#251](https://github.com/JuliaEditorSupport/atom-language-julia/pull/251))

### Changed
- `foo"bar"` macros for foreign languages no longer inject a grammar for that language. No markdown strings are highlighted ([#252](https://github.com/JuliaEditorSupport/atom-language-julia/pull/252))

## [0.21.2] - 2021-07-26
### Fixed
- Number splatting is now correctly tokenized ([#246](https://github.com/JuliaEditorSupport/atom-language-julia/pull/246)).
- Multiple `!`s at the end of an identifier are now correctly tokenized ([#248](https://github.com/JuliaEditorSupport/atom-language-julia/pull/248)).
- Function calls succeded by a commented out `=` are now correctly tokenized ([#250](https://github.com/JuliaEditorSupport/atom-language-julia/pull/250)).

### Changed
- String macro suffixes are now tokenized as macros ([#247](https://github.com/JuliaEditorSupport/atom-language-julia/pull/247)).
- Markdown string content is no longer highlighted as markdown ([#249](https://github.com/JuliaEditorSupport/atom-language-julia/pull/249)).

## [0.21.1] - 2021-04-09
### Fixed
- Interpolation of strings (e.g. `$"string"`) now works ([#243](https://github.com/JuliaEditorSupport/atom-language-julia/pull/243)).

### Changed
- Type relations are now tokenized as `keyword.operator.relation.types.julia` instead of `keyword.operator.relation.julia` ([#239](https://github.com/JuliaEditorSupport/atom-language-julia/pull/239)).

## [0.21.0] - 2021-01-25
### Added
- Support for embedded SQL syntax via the `sql` string macro ([#235](https://github.com/JuliaEditorSupport/atom-language-julia/pull/235)).
- This repo now also contains a VSCode-compatible JSON grammar file ([#236](https://github.com/JuliaEditorSupport/atom-language-julia/pull/236)).
- Added a changelog ([#237](https://github.com/JuliaEditorSupport/atom-language-julia/pull/237)).

### Changed
- Update the readme ([#236](https://github.com/JuliaEditorSupport/atom-language-julia/pull/236)).

## [0.20.2] - 2021-01-13
### Fixed
- `NaNxxx` is no longer erroneously tokenized like `NaN` ([#233](https://github.com/JuliaEditorSupport/atom-language-julia/pull/233)).
- String macros (and `var""`) now properly bind tighter than `:` ([#234](https://github.com/JuliaEditorSupport/atom-language-julia/pull/234)).

### Added
- Support for `var"..."` and `var"""..."""` ([#234](https://github.com/JuliaEditorSupport/atom-language-julia/pull/234)).
- Support for triple-backtick strings ([#234](https://github.com/JuliaEditorSupport/atom-language-julia/pull/234)).
- Support for command string macros in single- and triple-backtick variants both ([#234](https://github.com/JuliaEditorSupport/atom-language-julia/pull/234)).

## [0.20.1] - 2021-11-08
### Fixed
- Restore PCRE compatibility to un-break GitHub rendering.

## [0.20.0] - 2021-10-26
