import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'kanji' },
      { path: 'kanji', loadChildren: () => import('./features/kanji/kanji.routes').then(m => m.KANJI_ROUTES) },
      // { path: 'gramatica', loadChildren: ... } más adelante
    ],
  },
  { path: '**', redirectTo: '' },
];