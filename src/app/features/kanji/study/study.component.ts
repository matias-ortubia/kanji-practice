import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckService } from '../../../features/kanji/deck.service';
import { FuriganaPipe } from '../../../shared/furigana.pipe';
import { Rating } from '../../../core/srs/srs.models';
import { WritingPadComponent } from '../writingPad/writingPad.component';

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [FuriganaPipe, RouterLink, WritingPadComponent],
  styleUrl: './study.component.scss',
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

      @if (true) {
        <app-writing-pad [cardId]="c.id" />
      }

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
