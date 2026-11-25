import { Component, computed, inject, signal } from '@angular/core';
import { DeckService } from '../deck.service';
import { FuriganaPipe } from '../../../shared/furigana.pipe';
import { Card } from '../kanji.models'
import { MASTERED_LEVEL } from '../../../core/srs/scheduler';

type Filter = 'all' | 'active' | 'off';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [FuriganaPipe],
  styleUrl: './list.component.scss',
  template: `
    <div class="tools">
      <input type="search" placeholder="Buscar" [value]="q()" (input)="q.set($any($event.target).value)" />
      <!-- TODO: descomentar cuando los filtros sean necesarios
      <select [value]="activeTag()" (change)="tag.set($any($event.target).value)">
        <option value="">Todas las etiquetas</option>
        @for (t of tags(); track t) { <option [value]="t">{{ t }}</option> }
      </select>
      <div class="chips">
        <button [class.on]="filter() === 'all'" (click)="filter.set('all')">Todas</button>
        <button [class.on]="filter() === 'active'" (click)="filter.set('active')">En el mazo</button>
        <button [class.on]="filter() === 'off'" (click)="filter.set('off')">Fuera del mazo ({{ offCount() }})</button>
      </div> -->
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
  `
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
