export type Rating = 1 | 2 | 3 | 4; // otra vez, difícil, bien, fácil

export interface CardState {
  id: string;
  seen: boolean; // ya se mostró al menos una vez
  level: number; // 0 (no la sabe) a 4 (muy segura); desde MASTERED_LEVEL cuenta como dominada
  due: number; // número de respuesta global en el que le toca volver
  reviews: number;
  lapses: number;
  suspended: boolean; // fuera del mazo: no entra en repasos
}
