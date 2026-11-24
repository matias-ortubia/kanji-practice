import { Component, computed, inject, signal } from '@angular/core';
import { DeckService } from './deck.service';
import { FuriganaPipe } from './shared/furigana.pipe';
import { Card } from './models';
import { MASTERED_LEVEL } from './scheduler';

type Filter = 'all' | 'active' | 'off';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [FuriganaPipe],
  template: `
    <div class="tools">
      <input type="search" placeholder="Buscar" [value]="q()" (input)="q.set($any($event.target).value)" />
      <select [value]="activeTag()" (change)="tag.set($any($event.target).value)">
        <option value="">Todas las etiquetas</option>
        @for (t of tags(); track t) { <option [value]="t">{{ t }}</option> }
      </select>
      <div class="chips">
        <button [class.on]="filter() === 'all'" (click)="filter.set('all')">Todas</button>
        <button [class.on]="filter() === 'active'" (click)="filter.set('active')">En el mazo</button>
        <button [class.on]="filter() === 'off'" (click)="filter.set('off')">Fuera del mazo ({{ offCount() }})</button>
      </div>
      <p class="total">{{ rows().length }} tarjetas</p>
    </div>

    <ul>
      @for (c of rows(); track c.id) {
        <li [class.off]="deck.states()[c.id].suspended">
          <div class="text">
            <span class="title">{{ c.front.phrase || c.front.word }}</span>
            <span class="sub" [innerHTML]="sub(c) | furigana"></span>
            <span class="status">{{ status(c.id) }}</span>
          </div>
          <button (click)="deck.setSuspended(c.id, !deck.states()[c.id].suspended)">
            {{ deck.states()[c.id].suspended ? 'Reactivar' : 'Dejar fuera' }}
          </button>
        </li>
      } @empty {
        <li class="none">No hay tarjetas con ese filtro.</li>
      }
    </ul>
  `,
  styles: [`
    :host { flex: 1; min-height: 0; overflow: auto; padding: .75rem; }
    .tools { display: grid; gap: .5rem; }
    input, select { font: inherit; padding: .6rem .7rem; border-radius: 10px; border: 1px solid var(--line); background: var(--card); color: var(--ink); }
    .chips { display: flex; gap: .4rem; flex-wrap: wrap; }
    .chips button { font: inherit; font-size: .85rem; padding: .35rem .7rem; border-radius: 99px; border: 1px solid var(--line); background: none; color: var(--ink); }
    .chips .on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
    .total { margin: 0; font-size: .8rem; color: var(--muted); }
    ul { list-style: none; margin: .5rem 0 0; padding: 0; display: grid; gap: .5rem; }
    li { display: flex; gap: .75rem; align-items: center; justify-content: space-between; padding: .7rem .8rem;
      background: var(--card); border: 1px solid var(--line); border-radius: 12px; }
    li.off { opacity: .6; }
    .text { display: grid; min-width: 0; }
    .title { font-family: var(--jp); font-weight: 700; font-size: 1.3rem; }
    .sub { font-size: .9rem; color: var(--muted); }
    .status { font-size: .75rem; color: var(--muted); }
    li button { flex: none; font: inherit; font-size: .85rem; padding: .45rem .7rem; border-radius: 10px; border: 1px solid var(--line); background: none; color: var(--ink); }
    .none { justify-content: center; color: var(--muted); }
  `],
})
export class ListComponent {
  readonly deck = inject(DeckService);
  readonly q = signal('');
  readonly tag = signal('');
  readonly filter = signal<Filter>('all');

  readonly tags = computed(() => [...new Set(this.deck.cards().flatMap(c => c.tags))].sort());
  /** Si cambiás de mazo y la etiqueta elegida no existe ahí, se ignora. */
  readonly activeTag = computed(() => (this.tags().includes(this.tag()) ? this.tag() : ''));
  readonly offCount = computed(() => Object.values(this.deck.states()).filter(s => s.suspended).length);
  readonly rows = computed(() => {
    const q = this.q().trim().toLowerCase(), f = this.filter(), t = this.activeTag(), s = this.deck.states();
    return this.deck.cards().filter(c => {
      const off = s[c.id].suspended;
      if ((f === 'active' && off) || (f === 'off' && !off)) return false;
      if (t && !c.tags.includes(t)) return false;
      return !q || [c.front.phrase, c.front.word, c.back.reading, c.back.meaning, ...c.tags].join(' ').toLowerCase().includes(q);
    });
  });

  sub(c: Card) {
    return [c.back.reading, c.back.meaning].filter(Boolean).join(' - ');
  }

  status(id: string) {
    const s = this.deck.states()[id];
    if (s.suspended) return 'Fuera del mazo';
    if (!s.seen) return 'Sin ver';
    if (s.level >= MASTERED_LEVEL) return 'Dominada';
    return 'Aprendiendo';
  }
}
