# ngx-translatehub

“ngx-TranslateHub is an Angular library designed to simplify language translation and localization in Angular applications. It provides a seamless way to load, manage, and apply translations dynamically using modern Angular features like signals and reactive programming. The library integrates with translation APIs, such as LibreTranslate, enabling automatic string translation, and includes utilities for managing supported languages, setting default languages, and persisting user preferences. With Ngx-TranslateHub, developers can enhance the multilingual capabilities of their applications with minimal setup.”

![Static Badge](https://img.shields.io/badge/build-passing-brightgreen)
![GitHub Repo stars](https://img.shields.io/github/stars/johnkirathe/ngx-translatehub)
![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/johnkirathe/ngx-translatehub/main)

## Usage

### 1. Install

```
npm install ngx-translatehub --save
```

### 2. Service Integration

Integrate NgxtranslatehubService into your Angular application:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { map, Observable, switchMap, forkJoin } from "rxjs";
import { Languages } from "./languages";

const libreTranslateUrl = 'https://translate.fedilab.app/'; // Default URL

@Injectable({
  providedIn: 'root'
})
export class NgxtranslatehubService {
  http = inject(HttpClient);

  constructor() {
    const selectedLanguage = this.getLocaleLanguage();
    console.log(`Current selected language: ${selectedLanguage}`);
  }

  getLocaleLanguage(): string {
    if (typeof localStorage !== 'undefined') {
      const storedLanguage = localStorage.getItem('lang');
      if (storedLanguage) {
        return storedLanguage;
      }

      const browserLanguage = navigator.language.split('-')[0];
      localStorage.setItem('lang', browserLanguage);
      return browserLanguage;
    }

    return 'en'; // Fallback language
  }

  setLocaleLanguage(language: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lang', language);
    }
  }

  getLocaleDate() {
    return new Date().toLocaleDateString();
  }

  getLanguages(): Observable<Languages[]> {
    return this.http.get<Languages[]>(libreTranslateUrl + 'languages');
  }

  translate(text: string, targetLanguage: string): Observable<string> {
    const params = new HttpParams()
      .set('q', text)
      .set('source', "auto")
      .set('target', targetLanguage);

    return this.http.post(libreTranslateUrl + 'translate', null, { params }).pipe(
      map((response: any) => response.translatedText)
    );
  }

  loadData(url: string, lang: string): Observable<any> {
    this.setLocaleLanguage(lang);

    // Fetch JSON data from the given URL
    return this.http.get(url, { responseType: 'json' }).pipe(
      switchMap(response => this.translateJson(response, lang))
    );
  }

  translateJson(data: any, lang: string): Observable<any> {
    const stringMap = new Map<string, string>();

    // Step 1: Collect all strings from the JSON
    const collectStrings = (obj: any): void => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'string') {
          stringMap.set(value, value);
        } else if (typeof value === 'object' && value !== null) {
          collectStrings(value);
        }
      });
    };

    collectStrings(data);

    // Step 2: Translate strings
    const strings = Array.from(stringMap.keys());
    const observables = strings.map((text) =>
      this.translate(text, lang)
    );

    return forkJoin(observables).pipe(
      map((translations: string[]) => {
        // Map translations back to the stringMap
        strings.forEach((original, index) => {
          stringMap.set(original, translations[index]);
        });

        // Step 3: Apply translations back to the JSON
        const applyTranslations = (obj: any): void => {
          Object.keys(obj).forEach((key) => {
            const value = obj[key];
            if (typeof value === 'string') {
              obj[key] = stringMap.get(value) || value;
            } else if (typeof value === 'object' && value !== null) {
              applyTranslations(value);
            }
          });
        };

        applyTranslations(data);
        return data;
      })
    );
  }
}


```

### 3、your service Setup
```typescript
@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  translatedJson: any = {};
  private language = signal('');
  currentDate: any;
  private readonly destroyRef = inject(DestroyRef);
  private readonly translationService = inject(NgxtranslatehubService);
  private readonly http = inject(HttpClient);

  getDefaultLanguage(): string {
    this.language.set(this.translationService.getLocaleLanguage());
    return this.language();
  }

  setDefaultLanguage(language: string): void {
    this.language.set(language);
    this.translationService.setLocaleLanguage(language);
  }

  getLanguages(): Languages[] {
    let languages: Languages[] = [];
    this.translationService.getLanguages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: Languages[]) => {
        languages = response;
      });
    return languages;
  }

  loadData(url: string, lang: string): Observable<any> {
    return this.translationService.loadData(url, lang);
  }

}
```

### 3、your Component Setup

```typescript
@Component({
  selector: 'app-header',
  standalone: true,
  providers: [],
  imports: [
    RouterLink,
    MatOption,
    MatSelect,
    MatError,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    NgxtranslatehubDirective
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  form: FormGroup = {} as FormGroup;
  fb = inject(FormBuilder);
  translationService = inject(TranslationService);
  languages = signal<Languages[]>([]);
  language = signal<string>('');
  translatedData: any = {};
  private readonly url = 'assets/i18n/header.json';

  ngOnInit(): void {
    this.getLanguages();
    this.language.set(this.translationService.getDefaultLanguage());
    this.loadTranslatedData();
    this.form = this.fb.group({
      lang: [this.language()]
    });
  }

  loadTranslatedData(): void {
    this.translationService.loadData(this.url, this.language()).subscribe(
      (translatedData) => {
        this.translatedData = translatedData;
        console.log('Translated Data:', this.translatedData);
      },
      (error) => {
        console.error('Error while translating:', error);
      }
    );
  }

  getLanguages() {
    this.languages.set(this.translationService.getLanguages());
  }

  getLanguage() {
    this.language.set(this.form.value.lang); // Set the current language
    this.loadTranslatedData();
  }
}

```

### template

```html
<header class="header" libRtlSupportDirective [currentLang]="language()">
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark p-2 d-flex justify-content-between align-items-center">
    <a i18n class="navbar-brand magenta-color" routerLink="">TT</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item active">
          <a i18n class="nav-link" routerLink="">{{ translatedData?.home }}</a>
        </li>
        <li i18n class="nav-item">
          <a class="nav-link" routerLink="tasks">{{ translatedData?.tasks }}</a>
        </li>
      </ul>
    </div>
    <mat-form-field [formGroup]="form" appearance="outline" class="lang">
      <mat-label>{{ translatedData?.languages }}</mat-label>
      <mat-select (selectionChange)="getLanguage()" formControlName="lang" class="text-dark-emphasis">
        @for (language of languages(); track $index) {
        <mat-option [value]="language.code">
          {{ language.name }}
        </mat-option>
        }
      </mat-select>
    </mat-form-field>

  </nav>
</header>

```

#### CSS
You can use this css to support on right-to-left and vice versa
```css
.rtl {
  direction: rtl;
  text-align: start; /* 'start' will align text to the right in RTL mode */
}

/* Other styles to adjust padding, margins, etc., for RTL layout */
.rtl .some-class {
  padding-right: 15px;
  padding-left: 0;
}
```
#### Usage

This is how to use the directive
```html
<div libRtlSupportDirective [currentLang]="selectedLanguage"></div>
```
### 4、RtlSupportDirectiveDirective

```typescript
import {Directive, ElementRef, Input, OnChanges, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[libRtlSupportDirective]',
  standalone: true
})
export class RtlSupportDirectiveDirective implements OnInit, OnChanges {
  @Input() currentLang = 'en';

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.adjustLayoutForRtl();
  }

  ngOnInit(): void {
    console.log('currentLang: ',this.currentLang);
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

```
The RtlSupportDirectiveDirective is a pivotal feature of the NgxTranslatekit library, designed to enhance the user experience for languages that are read from right to left. This directive dynamically adjusts the layout of an Angular application based on the current language selection, ensuring that text and other elements are correctly aligned for languages such as Arabic, Hebrew, Persian, and Urdu.

Here’s a brief overview of its functionality:

#### Dynamic Layout Adjustment:
It listens for changes in the language and automatically applies the ‘rtl’ class to elements, flipping the layout to match the reading direction of RTL languages.
#### Language Support:
By default, it supports a set of RTL languages but can be easily extended to include more languages as needed.
#### Ease of Use:
With simple input binding, the directive can be applied to any element that requires RTL support, making it a versatile tool for developers.
#### Seamless Integration:
As a standalone directive, it can be imported and used independently, allowing for modular and clean code architecture.

### 5、Content to translate
This is the JSON file to translate

```json
{
  "home": "home",
  "tasks": "tasks",
  "languages": "languages"
}

```

### 6、DOM
This is how the translated page will look like:
# Translator
Microservice architecture is a very popular approach in designing and implementing highly scalable web applications. Communication within a monolithic application between components is usually based on method or function calls within the same process. A microservices‑based application, on the other hand, is a distributed system running on multiple machines.

# Translated Section {Persian [ fa ]}

```jade
Ngx-Translate کتابخانه کیت برای توسعه دهندگان
Ngx-Translate کیت یک کتابخانه جامع برای برنامه های Angular است که تسهیل بین المللی سازی با اجازه دادن به توسعه دهندگان به راحتی ترجمه برنامه های خود را به چندین زبان است. این یک سرویس ترجمه قدرتمند، همراه با یک لوله و دستورالعمل، برای مدیریت ترجمه ها و فایل های زبان به طور پویا بارگذاری از سرور فراهم می کند. کتابخانه از معماری مدولار Angular پشتیبانی می کند، توسعه دهندگان را قادر می سازد تا آن را در ماژول ریشه با TranslateModule.ForRoot() برای استفاده در سراسر برنامه یا ماژول های ویژگی با استفاده از TranslateModule.forChild وارد کنند. با ngx-Translatekit، توسعه دهندگان می توانند دسترسی جهانی برنامه های خود را با ارائه یک تجربه کاربری محلی افزایش دهند
```

Supported Languages
English [ en ]

Arabic [ ar ]

Azerbaijani [ az ]

Catalan [ ca ]

Chinese [ zh ]

Czech [ cs ]

Danish [ da ]

Dutch [ nl ]

Esperanto [ eo ]

Finnish [ fi ]

French [ fr ]

German [ de ]

Greek [ el ]

Hebrew [ he ]

Hindi [ hi ]

Hungarian [ hu ]

Indonesian [ id ]

Irish [ ga ]

Italian [ it ]

Japanese [ ja ]

Korean [ ko ]

Persian [ fa ]

Polish [ pl ]

Portuguese [ pt ]

Russian [ ru ]

Slovak [ sk ]

Spanish [ es ]

Swedish [ sv ]

Thai [ th ]

Turkish [ tr ]

Ukranian [ uk ]

Vietnamese [ vi ]



## Troubleshooting

Please follow this guidelines when reporting bugs and feature requests:

1. Use [GitHub Issues](https://github.com/johnkirathe/ngx-translatehub/issues) board to report bugs and feature requests (not our email address)
2. Please **always** write steps to reproduce the error. That way we can focus on fixing the bug, not scratching our heads trying to reproduce it.

Thanks for understanding!

### License

The MIT License (see the [LICENSE](https://github.com/johnkirathe/ngx-translatehub/blob/main/LICENSE) file for the full text)
