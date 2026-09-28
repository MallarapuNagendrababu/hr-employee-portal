/// <reference types="vite/client" />

declare module '*.css';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.png';
declare module '*.svg';

declare module 'react' {
  export const useEffect: any;
  export const useMemo: any;
  export const useState: any;
  export type FormEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

