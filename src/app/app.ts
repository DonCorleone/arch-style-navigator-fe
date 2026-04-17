import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { StyleService, StyleAnalysis } from './style';

type Mode = 'text' | 'foto';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly styleService = inject(StyleService);

  // Reactive Form Controls
  protected readonly descriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });

  protected readonly commentControl = new FormControl('', { nonNullable: true });

  // Signals für UI-State
  protected readonly mode = signal<Mode>('text');
  protected readonly result = signal<StyleAnalysis | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);

  private imageBase64 = '';
  private imageMediaType = '';

  protected setMode(m: Mode): void {
    this.mode.set(m);
    this.result.set(null);
    this.error.set(null);
    this.imagePreview.set(null);
    this.imageBase64 = '';
    this.imageMediaType = '';
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.result.set(null);
    this.error.set(null);

    this.scaleImage(file, 1024).then(({ base64, mediaType }) => {
      this.imageBase64 = base64;
      this.imageMediaType = mediaType;
      this.imagePreview.set(`data:${mediaType};base64,${base64}`);
    });
  }

  protected analyze(): void {
    if (this.descriptionControl.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.styleService.analyze(this.descriptionControl.value).subscribe({
      next: (analysis) => {
        this.result.set(analysis);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler bei der Analyse. Ist das Backend erreichbar?');
        this.loading.set(false);
        console.error('API Fehler:', err);
      },
    });
  }

  protected analyzeImage(): void {
    if (!this.imageBase64) {
      this.error.set('Bitte zuerst ein Bild auswählen.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const comment = this.commentControl.value || undefined;

    this.styleService.analyzeImage(this.imageBase64, this.imageMediaType, comment).subscribe({
      next: (analysis) => {
        this.result.set(analysis);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler bei der Analyse. Ist das Backend erreichbar?');
        this.loading.set(false);
        console.error('API Fehler:', err);
      },
    });
  }

  // Skaliert das Bild auf max. 1024px – spart Token-Kosten
  private scaleImage(file: File, maxSize: number): Promise<{ base64: string; mediaType: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
          resolve({ base64, mediaType: 'image/jpeg' });
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}
