import { Routes } from "@angular/router";
import { ListComponent } from './list/list.component';
import { StudyComponent } from './study/study.component';

export const KANJI_ROUTES: Routes = [
  { path: '', component: StudyComponent },
  { path: 'cards', component: ListComponent },
];