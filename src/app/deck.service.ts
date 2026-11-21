import { Injectable, computed, signal } from '@angular/core';
import { DECKS, DEFAULT_DECK_ID } from './decks';
import { Card, CardState, Rating } from './models';
import { MASTERED_LEVEL, newState, pickNext, previewGap, rate } from './scheduler';

const ACTIVE_KEY = 'srs:active';
const progressKey = (deckId: string) => `srs:${deckId}:v2`;

@Injectable({ providedIn: 'root' })
export class DeckService {
  readonly decks = DECKS;
  readonly deckId = signal(this.initialDeck());
  readonly cards = computed(() => this.decks.find(d => d.id === this.deckId())!.cards);
  private readonly byId = computed(() => new Map(this.cards().map(c => [c.id, c])));

  readonly states = signal<Record<string, CardState>>({});
  readonly current = signal<Card | null>(null);
  readonly revealed = signal(false);
  private readonly tick = signal(0); // cantidad de respuestas dadas en este mazo

  readonly counts = computed(() => {
    const s = this.states();
    let fresh = 0, learning = 0, mastered = 0;
    for (const c of this.cards()) {
      const st = s[c.id];
      if (!st || st.suspended) continue;
      if (!st.seen) fresh++;
      else if (st.level >= MASTERED_LEVEL) mastered++;
      else learning++;
    }
    const total = fresh + learning + mastered;
    return { new: fresh, learning, mastered, total, pct: total ? (100 * mastered) / total : 0 };
  });

  constructor() {
    this.load();
    this.next();
  }

  /** Cambia de mazo; cada mazo conserva su propio progreso. */
  select(id: string) {
    if (id === this.deckId() || !this.decks.some(d => d.id === id)) return;
    this.deckId.set(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* sin storage */ }
    this.load();
    this.next();
  }

  next(avoid?: string) {
    const id = pickNext(this.cards().map(c => c.id), this.states(), this.tick(), avoid);
    this.current.set(id ? this.byId().get(id)! : null);
    this.revealed.set(false);
  }

  answer(r: Rating) {
    const card = this.current();
    if (!card) return;
    const t = this.tick() + 1;
    this.tick.set(t);
    this.states.update(s => ({ ...s, [card.id]: rate(s[card.id], r, t) }));
    this.save();
    this.next(card.id);
  }

  /** Texto de cada botón: dentro de cuántas tarjetas vuelve. */
  label(r: Rating): string {
    const c = this.current();
    return c ? `en ${previewGap(this.states()[c.id], r, this.tick() + 1)}` : '';
  }

  /** Deja la tarjeta fuera del mazo (o la reactiva). No borra su progreso. */
  setSuspended(id: string, value: boolean) {
    this.states.update(s => ({ ...s, [id]: { ...s[id], suspended: value } }));
    this.save();
    if (this.current()?.id === id || (!this.current() && !value)) this.next();
  }

  private initialDeck(): string {
    let id: string | null = null;
    try { id = localStorage.getItem(ACTIVE_KEY); } catch { /* sin storage */ }
    return DECKS.some(d => d.id === id) ? id! : DEFAULT_DECK_ID;
  }

  private load() {
    let saved: { states?: Record<string, CardState>; tick?: number } = {};
    try { saved = JSON.parse(localStorage.getItem(progressKey(this.deckId())) ?? '{}'); } catch { /* vacío o corrupto */ }
    const states: Record<string, CardState> = {};
    for (const c of this.cards()) states[c.id] = { ...newState(c.id), ...saved.states?.[c.id] };
    this.states.set(states);
    this.tick.set(saved.tick ?? 0);
  }

  private save() {
    try {
      localStorage.setItem(progressKey(this.deckId()), JSON.stringify({ states: this.states(), tick: this.tick() }));
    } catch { /* modo privado o sin espacio */ }
  }
}
