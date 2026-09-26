import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs"

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
const isNodeRuntime = process.env.NEXT_RUNTIME === "nodejs"

export const loggerProvider =
  isNodeRuntime && projectToken && host
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "beton-industrie" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${host.replace(/\/$/, "")}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${projectToken}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : null

// This logger is intentionally not registered globally: only logs added by this integration are exported.
export const posthogLogExporterLogger = loggerProvider?.getLogger(
  "posthog-log-exporter"
)

export function register() {
  if (!isNodeRuntime || loggerProvider) return

  if (process.env.NODE_ENV === "development") {
    const missingVariable = projectToken
      ? "NEXT_PUBLIC_POSTHOG_HOST"
      : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"

    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    )
  }

  // Do not install a global provider: existing application loggers must not be exported by this integration.
}
