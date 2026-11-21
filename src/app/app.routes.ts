import { Routes } from '@angular/router';
import { ListComponent } from './list.component';
import { ShellComponent } from './shell.component';
import { StudyComponent } from './study.component';

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
