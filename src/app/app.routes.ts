import { Routes } from '@angular/router';
import { ListComponent } from './list.component';
import { ShellComponent } from './layout/shell/shell.component';
import { StudyComponent } from './features/kanji/study/study.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', component: StudyComponent },
      { path: 'cards', component: ListComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
