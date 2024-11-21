import {Directive, ElementRef, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[libRtlSupportDirective]',
  standalone: true
})
export class NgxtranslatehubDirective implements OnInit, OnChanges {
  @Input() currentLang = 'en';

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.adjustLayoutForRtl();
  }

  ngOnInit(): void {
    this.adjustLayoutForRtl()
  }

  ngOnChanges() {
    this.adjustLayoutForRtl(); // React to changes in currentLang
  }

  adjustLayoutForRtl() {
    if (this.isRtlLanguage(this.currentLang)) {
      this.renderer.addClass(this.el.nativeElement, 'rtl');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'rtl');
    }
  }

  isRtlLanguage(lang: string): boolean {
    // Add all RTL languages you want to support
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']; // arabic | hebrew | persian | urdu
    return rtlLanguages.includes(lang);
  }
}
