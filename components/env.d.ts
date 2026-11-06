// Tipagens só para o build; não vão para o dist.

// O jsoneditor não publica tipos; a instância é tratada como `any` internamente.
declare module 'jsoneditor'

// Imports `*.css?inline` do Vite (CSS como string).
declare module '*.css?inline' {
  const css: string
  export default css
}
