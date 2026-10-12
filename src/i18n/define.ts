/**
 * A namespace of interface strings in both languages. The English half must
 * have exactly the Turkish half's keys, and phrases with parameters keep their
 * signature, so a missing or mismatched translation is a type error.
 *
 *   export const menu = defineStrings({
 *     newGame: 'YENİ OYUN',
 *     continueHint: (chapter: string, realm: string) => `${chapter} · ${realm}`,
 *   }, {
 *     newGame: 'NEW GAME',
 *     continueHint: (chapter, realm) => `${chapter} · ${realm}`,
 *   })
 */
export type Phrase = string | ((...args: never[]) => string)

export type Translation<T extends Record<string, Phrase>> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string ? (...args: A) => string : string
}

export function defineStrings<T extends Record<string, Phrase>>(tr: T, en: Translation<T>) {
  return { tr: tr as unknown as Translation<T>, en }
}
