import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Spiegelt das JSON-Format das Claude zurückgibt (laut System Prompt)
export interface StyleAnalysis {
  stil: string;
  epoche: string;
  merkmale: string[];
  referenzen: string[];
  verwandte_stile: string[];
  konfidenz?: 'hoch' | 'mittel' | 'niedrig';
}

@Injectable({
  providedIn: 'root',
})
export class StyleService {
  // inject() statt Constructor-Injection – Angular-Modern-Stil
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:5144/api/style';

  // Gibt ein Observable zurück – der AppComponent subscribed darauf
  analyze(description: string): Observable<StyleAnalysis> {
    return this.http.post<StyleAnalysis>(`${this.api}/analyze`, { description });
  }

  analyzeImage(imageBase64: string, mediaType: string, comment?: string): Observable<StyleAnalysis> {
    return this.http.post<StyleAnalysis>(`${this.api}/analyze-image`, { imageBase64, mediaType, comment });
  }
}
