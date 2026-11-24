import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, effect, input, signal, untracked } from '@angular/core';

type Pt = { x: number; y: number };

@Component({
  selector: 'app-writing-pad',
  standalone: true,
  template: `
    <div class="backdrop" [class.on]="open()" (click)="open.set(false)"></div>
    <div class="sheet" [class.open]="open()">
      <button class="tab" (click)="toggle()" [attr.aria-expanded]="open()">
        {{ open() ? 'Ocultar' : 'Escribir' }}
      </button>
      <div class="body" [attr.inert]="open() ? null : ''">
        <canvas #cv (pointerdown)="down($event)" (pointermove)="move($event)"
                (pointerup)="up()" (pointercancel)="up()"></canvas>
        <div class="actions">
          <button (click)="undo()">Deshacer</button>
          <button (click)="clear()">Borrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 19; /* debajo del panel, que tiene 20 */
      background: rgba(0, 0, 0, .25); opacity: 0; pointer-events: none;
      transition: opacity .3s;
    }
    .backdrop.on { opacity: 1; pointer-events: auto; }
    .sheet {
      --peek: calc(2.25rem + env(safe-area-inset-bottom, 0px));
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
      display: flex; flex-direction: column; align-items: flex-start;
      transform: translateY(calc(100% - var(--peek)));
      transition: transform .3s cubic-bezier(.2, .8, .2, 1);
      pointer-events: none; /* el contenedor no bloquea toques; solo la solapa y el cuerpo */
    }
    .sheet.open { transform: translateY(0); }
    .tab {
      pointer-events: auto; display: flex; align-items: flex-start; height: var(--peek);
      padding: .5rem 1.4rem 0; font: inherit; font-size: .85rem; color: var(--ink); background: var(--ink); color: var(--paper); font-weight: 700;
      border: 1px solid var(--line); border-bottom: 0; border-radius: 12px 12px 0 0; margin-left: .75rem;
    }
    .body {
      pointer-events: auto; width: 100%; background: var(--card); border-top: 1px solid var(--line);
      padding: .75rem .75rem calc(.75rem + env(safe-area-inset-bottom, 0px));
      box-shadow: 0 -8px 24px rgba(0, 0, 0, .25);
    }
    canvas { display: block; margin: 0 auto; width: min(100%, 38dvh); aspect-ratio: 1; color: var(--ink);
      touch-action: none; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; }
    .actions { display: flex; gap: .5rem; justify-content: center; margin-top: .6rem; }
    .actions button { font: inherit; font-size: .85rem; padding: .4rem .8rem; border-radius: 10px;
      border: 1px solid var(--line); background: none; color: var(--ink); }
    @media (prefers-reduced-motion: reduce) { .sheet { transition: none; } .backdrop { transition: none; }}
  `],
})
export class WritingPadComponent implements AfterViewInit {
  readonly cardId = input.required<string>();
  readonly open = signal(false);
  @ViewChild('cv') cv!: ElementRef<HTMLCanvasElement>;

  private strokes: Pt[][] = [];
  private drawing = false;
  private g?: CanvasRenderingContext2D;

  constructor() {
    // Tarjeta nueva: se borra el dibujo y el panel baja.
    effect(() => {
      this.cardId();
      untracked(() => { this.strokes = []; this.open.set(false); this.redraw(); });
    });
  }

  ngAfterViewInit() { this.redraw(); }
  @HostListener('window:resize') onResize() { this.redraw(); }

  toggle() { this.open.update(v => !v); }

  down(e: PointerEvent) {
    this.cv.nativeElement.setPointerCapture(e.pointerId);
    this.drawing = true;
    const p = this.pt(e);
    this.strokes.push([p]);
    this.seg(p, { x: p.x + 0.1, y: p.y }); // un toque deja un punto
  }

  move(e: PointerEvent) {
    if (!this.drawing) return;
    const s = this.strokes[this.strokes.length - 1];
    const p = this.pt(e);
    this.seg(s[s.length - 1], p);
    s.push(p);
  }

  up() { this.drawing = false; }
  undo() { this.strokes.pop(); this.redraw(); }
  clear() { this.strokes = []; this.redraw(); }

  private pt(e: PointerEvent): Pt {
    const r = this.cv.nativeElement.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private seg(a: Pt, b: Pt) {
    const g = this.g!;
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }

  private redraw() {
    const c = this.cv?.nativeElement;
    const r = c?.getBoundingClientRect();
    if (!c || !r?.width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr; // reasignar el tamaño también limpia el lienzo
    const g = (this.g = c.getContext('2d')!);
    g.scale(dpr, dpr);
    g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = getComputedStyle(c).color;
    for (const s of this.strokes) {
      g.beginPath();
      s.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      if (s.length === 1) g.lineTo(s[0].x + 0.1, s[0].y);
      g.stroke();
    }
  }
}