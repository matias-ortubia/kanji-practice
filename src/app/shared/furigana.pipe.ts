import { Pipe, PipeTransform } from '@angular/core';

/** Convierte la sintaxis de Anki "漢字[かんじ]" en <ruby>. Usar con [innerHTML]. */
@Pipe({ name: 'furigana', standalone: true })
export class FuriganaPipe implements PipeTransform {
  transform(value: string): string {
    return (value ?? '').replace(/ ?([^ <>\[\]]+?)\[([^\]]+?)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
  }
}
