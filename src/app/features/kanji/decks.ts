import primera from '../../data/primera.json';
import segunda from '../../data/segunda.json';
import { Card } from '../../features/kanji/kanji.models'

export interface Deck { id: string; name: string; cards: Card[]; }

export const DECKS: Deck[] = [
  { id: 'primera', name: 'Primera mitad', cards: primera as Card[] },
  { id: 'segunda', name: 'Segunda mitad', cards: segunda as Card[] },
];

/** Mazo que se abre la primera vez (después recuerda el último usado). */
export const DEFAULT_DECK_ID = 'segunda';
