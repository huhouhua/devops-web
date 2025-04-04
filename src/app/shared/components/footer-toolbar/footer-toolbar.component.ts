import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';

import type { BooleanInput, NzSafeAny } from 'ng-zorro-antd/core/types';
import { InputBoolean } from 'ng-zorro-antd/core/util';

const CLSBODY = 'footer-toolbar__body';

@Component({
  selector: 'footer-toolbar',
  exportAs: 'footerToolbar',
  templateUrl: './footer-toolbar.component.html',
  styleUrls: ['./footer-toolbar.component.less'],
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FooterToolbarComponent implements OnInit, OnDestroy {
  static ngAcceptInputType_errorCollect: BooleanInput;

  @Input() @InputBoolean() errorCollect = false;
  @Input() extra?: string | TemplateRef<void>;

  constructor(private el: ElementRef, private renderer: Renderer2, @Inject(DOCUMENT) private doc: NzSafeAny) {}

  private get bodyCls(): DOMTokenList {
    return (this.doc.querySelector('body') as HTMLElement).classList;
  }

  ngOnInit(): void {
    this.renderer.addClass(this.el.nativeElement, 'footer-toolbar');
    this.bodyCls.add(CLSBODY);
  }

  ngOnDestroy(): void {
    this.bodyCls.remove(CLSBODY);
  }
}