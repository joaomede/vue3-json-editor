# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/joaomede/vue3-json-editor/compare/v1.2.0...v1.2.1) (2026-11-06)

### Upgrade notes

* **Changing the `mode` prop after the editor is mounted now switches the mode.** Before, the change was ignored. If your app passes `mode` and changes it later, the editor now follows it. Setting `mode` to the mode the editor is already in (for example from a `@mode-change` handler) does nothing, and if the content is invalid JSON the editor stays in its current mode and emits `has-error`.

### Bug Fixes

* an unsupported `lang` (e.g. `"pt"`) with `show-btns` crashed the render with `Cannot read properties of undefined (reading 'save')`; it now falls back to English ([33c816e](https://github.com/joaomede/vue3-json-editor/commit/33c816e))
* the `mode` prop is applied after the editor is mounted ([af0b4de](https://github.com/joaomede/vue3-json-editor/commit/af0b4de))

### Documentation

* README rewritten: full props and events reference, examples, builds and environments, compatibility and limitations ([763800e](https://github.com/joaomede/vue3-json-editor/commit/763800e))

## [1.2.0](https://github.com/joaomede/vue3-json-editor/compare/v1.1.5...v1.2.0) (2026-11-06)

First release since 1.1.5. The public API is unchanged: same props, defaults, events, exports, `dist` file paths and CSS classes. Everything new is opt-in. It also includes the changes of an unpublished 1.1.6 entry, listed below.

### Upgrade notes

Things you may notice after upgrading:

* **jsoneditor 5.5 → 10.4.3** ([#17](https://github.com/joaomede/vue3-json-editor/issues/17)). The editor looks slightly different (new toolbar buttons such as sort and transform). jsoneditor 10's navigation bar and status bar are turned off by default to keep the previous layout; turn them on with the new `options` prop. The errors passed to `has-error` come from jsoneditor 10 and may be worded differently.
* **`v-model` now updates your variable on every edit** ([#24](https://github.com/joaomede/vue3-json-editor/issues/24)). Before, it only went from parent to editor. If you bind `v-model` to a `computed` without a setter, Vue will warn in development that the value is readonly.
* **`@input` only receives the JSON value.** Before, it also received the browser's native `InputEvent`s while typing in the editor.
* **`vue` is now a peer dependency (`^3.2.0`)** instead of a dependency, so the component always uses your app's Vue ([#18](https://github.com/joaomede/vue3-json-editor/issues/18), [#29](https://github.com/joaomede/vue3-json-editor/issues/29)).
* **The bundles target ES2015** (1.1.5 was compiled to ES5) and no longer embed `core-js` ([#21](https://github.com/joaomede/vue3-json-editor/issues/21)). Every browser that runs Vue 3 supports ES2015.
* **`jsoneditor` is a regular npm dependency.** The ESM and CommonJS builds import it from `node_modules` (and load it when the editor mounts); the UMD build still bundles it.

### Features

* `height` prop: a fixed editor height in every mode, as a number (px) or any CSS value ([#32](https://github.com/joaomede/vue3-json-editor/issues/32)) ([8a40d67](https://github.com/joaomede/vue3-json-editor/commit/8a40d67))
* `options` prop: pass any [jsoneditor option](https://github.com/josdejong/jsoneditor/blob/master/docs/api.md#configuration-options) to the editor ([480ca4e](https://github.com/joaomede/vue3-json-editor/commit/480ca4e))
* `mode-change` event, emitted with the new mode when the user switches modes ([#27](https://github.com/joaomede/vue3-json-editor/pull/27), by [solarcellsky](https://github.com/solarcellsky)) ([833ec2d](https://github.com/joaomede/vue3-json-editor/commit/833ec2d))
* `provide-editor` event, emitted with the jsoneditor instance once the editor is created ([#30](https://github.com/joaomede/vue3-json-editor/issues/30); [#20](https://github.com/joaomede/vue3-json-editor/pull/20), by [NaumovEvgeniy](https://github.com/NaumovEvgeniy)) ([01f4726](https://github.com/joaomede/vue3-json-editor/commit/01f4726))
* jsoneditor 10 from npm ([#17](https://github.com/joaomede/vue3-json-editor/issues/17)) ([480ca4e](https://github.com/joaomede/vue3-json-editor/commit/480ca4e))

### Bug Fixes

* `v-model` is two-way: the component also emits `update:modelValue` ([#24](https://github.com/joaomede/vue3-json-editor/issues/24)) ([bb3dca5](https://github.com/joaomede/vue3-json-editor/commit/bb3dca5))
* `@input` no longer receives native DOM events ([3d56a34](https://github.com/joaomede/vue3-json-editor/commit/3d56a34))
* code mode: no more "Could not load worker" warning, and syntax errors are marked in the editor ([#18](https://github.com/joaomede/vue3-json-editor/issues/18), [#23](https://github.com/joaomede/vue3-json-editor/issues/23), [#28](https://github.com/joaomede/vue3-json-editor/issues/28), [#31](https://github.com/joaomede/vue3-json-editor/issues/31)) ([480ca4e](https://github.com/joaomede/vue3-json-editor/commit/480ca4e))
* the editor not rendering, or `Cannot read properties of null (reading 'expandAll')`, when the app had a different Vue copy than the package ([#18](https://github.com/joaomede/vue3-json-editor/issues/18), [#29](https://github.com/joaomede/vue3-json-editor/issues/29)) ([480ca4e](https://github.com/joaomede/vue3-json-editor/commit/480ca4e), [4eac156](https://github.com/joaomede/vue3-json-editor/commit/4eac156))
* `Invalid or unexpected token` in production builds, caused by the bundled `core-js` ([#21](https://github.com/joaomede/vue3-json-editor/issues/21)) ([f1f9dc8](https://github.com/joaomede/vue3-json-editor/commit/f1f9dc8))
* typing Chinese and other IME input in code mode ([#25](https://github.com/joaomede/vue3-json-editor/issues/25)) ([480ca4e](https://github.com/joaomede/vue3-json-editor/commit/480ca4e))

### Under the hood

* Build moved from Vue CLI / Rollup 2 to Vite.
* TypeScript declarations rewritten and checked against Vue 3.2, 3.3 and 3.5.
* New contract test suite (Playwright, real browser) that installs the packed package like a user would and runs against Vue 3.2.0, 3.2.47, 3.3 and 3.5.

### [1.1.5](https://github.com/joaomede/vue3-json-editor/compare/v1.1.4...v1.1.5) (2022-03-16)


### Bug Fixes

* 🐛 changed uid method to internal component id ([4a3e663](https://github.com/joaomede/vue3-json-editor/commit/4a3e6632d13fc3531dbc1929ded48ead88953d71))

### [1.1.4](https://github.com/joaomede/vue3-json-editor/compare/v1.1.3...v1.1.4) (2022-01-22)

### [1.1.3](https://github.com/joaomede/vue3-json-editor/compare/v1.1.2...v1.1.3) (2021-08-01)


### Bug Fixes

* 🐛 fixed expandOnStart (error includes) ([07a2d12](https://github.com/joaomede/vue3-json-editor/commit/07a2d1241ce651661411014410be6c74972a00ae))

### [1.1.2](https://github.com/joaomede/vue3-json-editor/compare/v1.1.1...v1.1.2) (2021-06-29)


### Bug Fixes

* 🐛 fixed ESM module compatibility ([abb32df](https://github.com/joaomede/vue3-json-editor/commit/abb32dfe7ffea6fd7624027a8e82bc2b004e72f2))

### [1.1.1](https://github.com/joaomede/vue3-json-editor/compare/v1.1.0...v1.1.1) (2021-06-28)


### Bug Fixes

* 🐛 svg file loading fix ([21c0da6](https://github.com/joaomede/vue3-json-editor/commit/21c0da6d35c7e7661b9c1381cdf7ee28f9f42715))

## 1.1.0 (2021-05-26)


### Features

* 🎸 init ([a448533](https://github.com/joaomede/vue3-json-editor/commit/a448533e4f7e2e95861cda92f3c110a804b69927))
