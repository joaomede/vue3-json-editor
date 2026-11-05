// Tipagem dos imports `*.css?inline` do Vite (CSS como string). Só para o build; não vai para o dist.
declare module '*.css?inline' {
  const css: string
  export default css
}
