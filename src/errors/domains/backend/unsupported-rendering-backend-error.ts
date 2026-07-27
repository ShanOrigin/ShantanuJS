import { ConfigurationError } from "../../core/errors/configuration-error.js";
import { ErrorContext } from "../../core/diagnostics/error-context.js";

/**
 * Error thrown when a requested rendering backend is not supported by the library.
 *
 * This error indicates that the provided backend identifier represents a valid
 * rendering concept, but is not currently implemented or enabled in the
 * library’s rendering system.
 *
 * It reflects a configuration or capability mismatch rather than an invalid
 * input or runtime logic failure.
 */
export class UnsupportedRenderingBackendError extends ConfigurationError {
  /**
   * Creates a new UnsupportedRenderingBackendError instance.
   *
   * @param requestedBackend - The rendering backend requested by the caller.
   * @param supportedBackends - List of rendering backends currently supported.
   * @param source - Logical source indicating where the error originated.
   */
  constructor(
    requestedBackend: string,
    supportedBackends: readonly string[],
    source: string,
  ) {
    super(
      "RENDERING_BACKEND_UNSUPPORTED",
      "Requested rendering backend is not supported.",
      new ErrorContext(requestedBackend, supportedBackends.join(" | "), source),
    );
  }
}
