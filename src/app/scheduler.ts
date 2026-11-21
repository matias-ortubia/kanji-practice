import { CardState, Rating } from './models';

// Sin tiempo: todo se mide en "cantidad de tarjetas respondidas" (tick).
// Una tarjeta con gap N vuelve después de responder N tarjetas más.
const GAP = [5, 12, 30, 70, 150]; // gap según el nivel
const AGAIN_GAP = 2;
const LEVEL_STEP: Record<Rating, number> = { 1: 0, 2: -1, 3: 1, 4: 2 };

export const MAX_LEVEL = GAP.length - 1;
export const MASTERED_LEVEL = 3; // dominada, pero igual sigue volviendo (cada vez más espaciada)
export const WORKING_SET = 8; // máximo de tarjetas "aprendiendo" a la vez antes de sumar nuevas

export function newState(id: string): CardState {
  return { id, seen: false, level: 0, due: 0, reviews: 0, lapses: 0, suspended: false };
}

/** `tick` es el número de esta respuesta (ya incrementado). */
export function rate(s: CardState, r: Rating, tick: number): CardState {
  const c: CardState = { ...s, seen: true, reviews: s.reviews + 1 };
  if (r === 1) {
    c.level = 0;
    c.lapses = s.seen ? s.lapses + 1 : s.lapses;
    c.due = tick + AGAIN_GAP;
  } else {
    c.level = Math.min(MAX_LEVEL, Math.max(0, s.level + LEVEL_STEP[r]));
    c.due = tick + GAP[c.level];
  }
  return c;
}

export function previewGap(s: CardState, r: Rating, tick: number): number {
  return rate(s, r, tick).due - tick;
}

export function pickNext(
  ids: string[], states: Record<string, CardState>, tick: number, avoid?: string,
): string | null {
  const active = ids.filter(id => !states[id].suspended);
  const seen = active.filter(id => states[id].seen);
  const unseen = active.filter(id => !states[id].seen);
  const rnd = (a: string[]) => {
    const pool = avoid && a.length > 1 ? a.filter(id => id !== avoid) : a;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // 1. las que ya les toca volver
  const due = seen.filter(id => states[id].due <= tick);
  if (due.length) return rnd(due);

  // 2. una nueva, si no hay demasiadas en aprendizaje a la vez
  const learning = seen.filter(id => states[id].level < MASTERED_LEVEL).length;
  if (unseen.length && (learning < WORKING_SET || !seen.length)) return rnd(unseen);

  // 3. nada vencido: la que esté más cerca de volver (nunca se queda sin tarjetas)
  const byDue = [...seen].sort((a, b) => states[a].due - states[b].due);
  const next = byDue.find(id => id !== avoid) ?? byDue[0];
  return next ?? (unseen.length ? rnd(unseen) : null);
}
