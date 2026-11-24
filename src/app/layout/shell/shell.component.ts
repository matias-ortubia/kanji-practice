import { Component, inject } from '@angular/core';
import { DeckService } from '../../features/kanji/deck.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <span class="logo">漢字</span>
      <nav>
        <a routerLink="/kanji" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Estudiar</a>
        <a routerLink="/kanji/cards" routerLinkActive="on">Tarjetas</a>
      </nav>
    </header>
    <div class="decks" role="tablist">
      @for (d of deck.decks; track d.id) {
        <button role="tab" [attr.aria-selected]="deck.deckId() === d.id" [class.on]="deck.deckId() === d.id" (click)="deck.select(d.id)">{{ d.name }}</button>
      }
    </div>
    <router-outlet />
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly deck = inject(DeckService);
}
