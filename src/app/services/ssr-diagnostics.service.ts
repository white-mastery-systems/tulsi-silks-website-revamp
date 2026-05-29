import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

interface SsrTimingMark {
  label: string;
  ms: number;
}

/**
 * Lightweight SSR timing marks (server-only). Enable with SSR_DIAG=1 in Node env.
 * Logs a single summary line per request when the home component finishes layout.
 */
@Injectable({ providedIn: 'root' })
export class SsrDiagnosticsService {
  private readonly enabled: boolean;
  private readonly marks: SsrTimingMark[] = [];
  private startedAt = 0;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env;
    const diag = env?.['SSR_DIAG'];
    this.enabled =
      isPlatformServer(platformId) && (diag === '1' || diag === 'true');
  }

  reset(): void {
    if (!this.enabled) return;
    this.marks.length = 0;
    this.startedAt = Date.now();
  }

  mark(label: string): void {
    if (!this.enabled) return;
    this.marks.push({ label, ms: Date.now() - this.startedAt });
  }

  summary(context: string, extra?: Record<string, unknown>): void {
    if (!this.enabled) return;
    const parts = this.marks.map((m) => `${m.label}@${m.ms}ms`).join(', ');
    console.log(`[SSR:diag] ${context} | ${parts}`, extra ?? '');
  }
}
