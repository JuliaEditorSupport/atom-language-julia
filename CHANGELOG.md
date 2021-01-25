# Change Log

All notable changes to the Julia grammar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
