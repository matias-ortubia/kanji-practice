import { Component, inject } from '@angular/core';
import { DeckService } from './deck.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <span class="logo">漢字</span>
      <nav>
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Estudiar</a>
        <a routerLink="/cards" routerLinkActive="on">Tarjetas</a>
      </nav>
    </header>
    <div class="decks" role="tablist">
      @for (d of deck.decks; track d.id) {
        <button role="tab" [attr.aria-selected]="deck.deckId() === d.id" [class.on]="deck.deckId() === d.id" (click)="deck.select(d.id)">{{ d.name }}</button>
      }
    </div>
    <router-outlet />
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100dvh; }
    header { display: flex; align-items: center; justify-content: space-between; padding: .6rem .9rem; padding-top: calc(.6rem + env(safe-area-inset-top)); }
    .logo { font-family: var(--jp); font-weight: 700; font-size: 1.3rem; }
    nav { display: flex; gap: 1rem; }
    a { color: var(--muted); text-decoration: none; padding: .3rem 0; border-bottom: 2px solid transparent; }
    a.on { color: var(--ink); border-bottom-color: var(--ink); }
    .decks { display: grid; grid-template-columns: 1fr 1fr; margin: 0 .9rem .5rem; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
    .decks button { font: inherit; font-size: .9rem; padding: .45rem; border: 0; background: none; color: var(--muted); }
    .decks .on { background: var(--ink); color: var(--paper); }
  `],
})
export class ShellComponent {
  readonly deck = inject(DeckService);
}
