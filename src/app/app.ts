import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { StyleService, StyleAnalysis } from './style';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly styleService = inject(StyleService);

  // Reactive Form Control für das Textarea
  protected readonly descriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5)],
  });

  // Signals für UI-State – Angular-Modern-Stil statt Properties
  protected readonly result = signal<StyleAnalysis | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

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
}
