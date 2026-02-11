import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

let initialized = false;

/**
 * Lazily initialize OpenTelemetry tracing with Dynatrace OTLP exporter.
 * Safe to call multiple times — only initializes once.
 * Uses SimpleSpanProcessor for Edge runtime compatibility (no batching).
 */
export function ensureTracing(): void {
  if (initialized) return;

  const dynatraceUrl = process.env.DYNATRACE_URL;
  const dynatraceToken = process.env.DYNATRACE_API_TOKEN;

  if (!dynatraceUrl || !dynatraceToken) {
    initialized = true; // Don't retry if env vars are missing
    return;
  }

  const exporter = new OTLPTraceExporter({
    url: `${dynatraceUrl}/api/v2/otlp/v1/traces`,
    headers: {
      Authorization: `Api-Token ${dynatraceToken}`,
    },
  });

  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'social-transformer',
      [ATTR_SERVICE_VERSION]: '1.0.0',
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  trace.setGlobalTracerProvider(provider);
  initialized = true;
}

/**
 * Get the application tracer instance.
 * Must call ensureTracing() before using this.
 */
export function getTracer() {
  return trace.getTracer('social-transformer');
}

export { SpanStatusCode };
export type { Span };
