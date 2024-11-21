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

  loadData(url: string, lang: string, backendData: any): Observable<any> {
    this.setLocaleLanguage(lang);

    // Fetch JSON data from the given URL
    return this.http.get(url, { responseType: 'json' }).pipe(
      switchMap(response => this.translateJson(response, lang, backendData))
    );
  }

  translateJson(frontendData: any, lang: string, backendData: any): Observable<any> {
    const stringMap = new Map<string, string>();

    const joinData = {
      backendData: { ...backendData }, // Create a shallow copy to avoid mutating the original object
      frontendData: { ...frontendData }, // Create a shallow copy
    };

    // console.log('Raw joinData before translation:', joinData);

    // Step 1: Collect all strings from the JSON
    const collectStrings = (obj: any): void => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'string') {
          stringMap.set(value, value); // Collect strings for translation
        } else if (typeof value === 'object' && value !== null) {
          collectStrings(value); // Recursively collect strings
        }
      });
    };

    collectStrings(joinData.backendData);
    collectStrings(joinData.frontendData);

    // console.log('Collected strings for translation:', Array.from(stringMap.keys()));

    // Step 2: Translate strings
    const strings = Array.from(stringMap.keys());
    const observables = strings.map((text) => this.translate(text, lang));

    return forkJoin(observables).pipe(
      map((translations: string[]) => {
        // Map translations back to the stringMap
        strings.forEach((original, index) => {
          stringMap.set(original, translations[index]);
        });

        // console.log('String map after translation:', stringMap);

        // Step 3: Apply translations back to the JSON
        const applyTranslations = (obj: any): any => {
          const clonedObj = { ...obj }; // Clone the object to avoid mutating it
          Object.keys(clonedObj).forEach((key) => {
            const value = clonedObj[key];
            if (typeof value === 'string') {
              clonedObj[key] = stringMap.get(value) || value; // Apply translations
            } else if (typeof value === 'object' && value !== null) {
              clonedObj[key] = applyTranslations(value); // Recursively apply translations
            }
          });
          return clonedObj;
        };

        const translatedBackendData = applyTranslations(joinData.backendData);
        const translatedFrontendData = applyTranslations(joinData.frontendData);

        // console.log('Translated Backend Data:', translatedBackendData);
        // console.log('Translated Frontend Data:', translatedFrontendData);

        return {
          backendData: translatedBackendData,
          frontendData: translatedFrontendData,
        };
      })
    );
  }

}
