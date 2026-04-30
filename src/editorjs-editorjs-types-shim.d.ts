/**
 * Minimal types so editorjs-html's bundled .d.ts can resolve `@editorjs/editorjs`.
 * Avoid installing @editorjs/editorjs in TS 4.6 projects — newer Editor.js typings use `export type *`.
 */
declare module '@editorjs/editorjs' {
  export interface OutputBlockData {
    id?: string;
    type: string;
    data: Record<string, unknown>;
  }

  export interface OutputData {
    blocks?: OutputBlockData[];
    time?: number;
    version?: string;
  }
}
