import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckService } from './deck.service';
import { FuriganaPipe } from './shared/furigana.pipe';
import { Rating } from './models';

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [FuriganaPipe, RouterLink],
  template: `
    <div class="counts">
      <span><b>{{ deck.counts().new }}</b>sin ver</span>
      <span class="c-learn"><b>{{ deck.counts().learning }}</b>aprendiendo</span>
      <span class="c-rev"><b>{{ deck.counts().mastered }}</b>dominadas</span>
    </div>
    <div class="bar"><i [style.width.%]="deck.counts().pct"></i></div>

    @if (deck.current(); as c) {
      <section class="card" (click)="deck.revealed.set(true)">
        <div class="inner">
          @if (c.front.phrase) { <p class="phrase">{{ c.front.phrase }}</p> }
          @if (c.front.furigana) { <p class="furi" [innerHTML]="c.front.furigana | furigana"></p> }
          @if (c.front.word) { <p class="word" [innerHTML]="c.front.word"></p> }
          @if (c.front.notes) { <p class="notes" [innerHTML]="c.front.notes"></p> }

          @if (deck.revealed()) {
            <hr />
            @if (c.back.fullPhrase) { <p class="phrase" [innerHTML]="c.back.fullPhrase | furigana"></p> }
            @if (c.back.reading) { <p class="reading" [innerHTML]="c.back.reading"></p> }
            @if (c.back.meaning) { <p class="meaning" [innerHTML]="c.back.meaning"></p> }
            @if (c.back.notes) { <p class="notes" [innerHTML]="c.back.notes"></p> }
          }
        </div>
      </section>

      <footer>
        @if (!deck.revealed()) {
          <button class="show" (click)="deck.revealed.set(true)">Mostrar respuesta</button>
        } @else {
          <div class="rates">
            @for (b of buttons; track b.r) {
              <button [class]="'rate ' + b.cls" (click)="deck.answer(b.r)">
                <small>{{ deck.label(b.r) }}</small>{{ b.text }}
              </button>
            }
          </div>
        }
        <button class="aside" (click)="suspend(c.id)">
          {{ confirmId() === c.id ? 'Tocá de nuevo para dejarla fuera del mazo' : 'Dejar fuera del mazo' }}
        </button>
      </footer>
    } @else {
      <section class="empty">
        <p>No hay tarjetas activas en el mazo.</p>
        <a routerLink="/cards">Reactivar desde Tarjetas</a>
      </section>
    }
  `,
  styles: [`
    :host { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .counts { display: flex; gap: 1.25rem; justify-content: center; padding: .4rem; font-size: .8rem; color: var(--muted); }
    .counts b { font-size: 1rem; margin-right: .25rem; }
    .counts b { color: var(--easy); } .c-learn b { color: var(--again); } .c-rev b { color: var(--good); }
    .bar { height: 4px; margin: 0 .75rem .5rem; background: var(--line); border-radius: 2px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--good); transition: width .3s; }
    .card { flex: 1; min-height: 0; overflow: auto; margin: 0 .75rem; padding: 1.25rem; display: flex;
      background: var(--card); border: 1px solid var(--line); border-radius: 14px; text-align: center; cursor: pointer; }
    .inner { margin: auto 0; width: 100%; display: flex; flex-direction: column; gap: .5rem; }
    p { margin: 0; }
    .phrase { font-family: var(--jp); font-weight: 700; font-size: 2.3rem; line-height: 1.6; }
    .furi { font-family: var(--jp); font-size: 1.5rem; }
    .reading { font-family: var(--jp); font-size: 1.4rem; }
    .word { font-size: 1.15rem; }
    .meaning { font-size: 1.2rem; font-weight: 600; }
    .notes { font-size: .9rem; color: var(--muted); }
    hr { width: 100%; border: 0; border-top: 1px solid var(--line); margin: .9rem 0; }
    footer { display: grid; gap: .4rem; padding: .75rem .75rem calc(.5rem + env(safe-area-inset-bottom)); }
    .show { background: var(--ink); color: var(--paper); border: 0; border-radius: 12px; min-height: 56px; font: inherit; font-weight: 600; }
    .rates { display: grid; grid-template-columns: repeat(4, 1fr); gap: .4rem; }
    .rate { border: 0; border-radius: 12px; color: #fff; min-height: 58px; padding: .5rem .2rem; font: inherit;
      font-weight: 600; font-size: .9rem; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .rate small { font-weight: 400; font-size: .72rem; opacity: .85; }
    .again { background: var(--again); } .hard { background: var(--hard); }
    .good { background: var(--good); } .easy { background: var(--easy); }
    .aside { background: none; border: 0; color: var(--muted); font: inherit; font-size: .85rem; padding: .35rem; }
    .empty { margin: auto; text-align: center; display: grid; gap: .5rem; }
    .empty a { color: var(--easy); }
  `],
})
export class StudyComponent {
  readonly deck = inject(DeckService);
  readonly confirmId = signal<string | null>(null);
  readonly buttons: { r: Rating; text: string; cls: string }[] = [
    { r: 1, text: 'Otra vez', cls: 'again' },
    { r: 2, text: 'Difícil', cls: 'hard' },
    { r: 3, text: 'Bien', cls: 'good' },
    { r: 4, text: 'Fácil', cls: 'easy' },
  ];

  /** Primer toque pide confirmación, el segundo la deja fuera. */
  suspend(id: string) {
    if (this.confirmId() !== id) {
      this.confirmId.set(id);
      setTimeout(() => this.confirmId() === id && this.confirmId.set(null), 4000);
      return;
    }
    this.confirmId.set(null);
    this.deck.setSuspended(id, true);
  }
}
