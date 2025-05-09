import { Direction, Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewEncapsulation
} from '@angular/core';
import { interval, Subject, takeUntil } from 'rxjs';


import type { NzSafeAny } from 'ng-zorro-antd/core/types';
import { InputNumber } from 'ng-zorro-antd/core/util';

@Component({
  selector: 'error-collect, [error-collect]',
  exportAs: 'errorCollect',
  template: `
    <i nz-icon nzType="exclamation-circle"></i>
    <span class="error-collect__count">{{ count }}</span>
  `,
  host: {
    '[class.error-collect]': 'true',
    '[class.error-collect-rtl]': `dir === 'rtl'`,
    '[class.d-none]': '_hiden',
    '(click)': '_click()'
  },
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ErrorCollectComponent implements OnInit, OnDestroy {
  private formEl: HTMLFormElement | null = null;
  private destroy$ = new Subject<void>();

  _hiden = true;
  count = 0;
  dir: Direction = 'ltr';

  @Input() @InputNumber() freq!: number;
  @Input() @InputNumber() offsetTop!: number;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private doc: NzSafeAny,
    @Optional() private directionality: Directionality,
    private platform: Platform
  ) {
  }

  private get errEls(): NodeListOf<HTMLElement> {
    return this.formEl!.querySelectorAll('.ant-form-item-has-error');
  }

  private update(): void {
    const count = this.errEls.length;
    if (count === this.count) return;
    this.count = count;
    this._hiden = count === 0;
    this.cdr.markForCheck();
  }

  _click(): boolean {
    if (this.count === 0) return false;
    // nz-form-control
    const els = this.errEls;
    const formItemEl = this.findParent(els[0], '[nz-form-control]') || els[0];
    formItemEl.scrollIntoView(true);
    // fix header height
    this.doc.documentElement.scrollTop -= this.offsetTop;
    return true;
  }

  private install(): void {
    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
      this.dir = direction;
    });
    interval(this.freq)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.update());
    this.update();
  }

  private findParent(el: Element, selector: string): HTMLFormElement | null {
    let retEl: HTMLFormElement | null = null;
    while (el) {
      if (el.querySelector(selector)) {
        retEl = el as HTMLFormElement;
        break;
      }
      el = el.parentElement as HTMLFormElement;
    }
    return retEl;
  }

  ngOnInit(): void {
    if (!this.platform.isBrowser) return;

    this.formEl = this.findParent(this.el.nativeElement, 'form');
    if (this.formEl === null) throw new Error('No found form element');
    this.install();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}