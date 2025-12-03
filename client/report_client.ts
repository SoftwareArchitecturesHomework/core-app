
/**
 * Custom Error class to handle authenticated HTTP failures gracefully.
 */
class RestClientError extends Error {
  public readonly statusCode: number
  public readonly isAuthError: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'RestClientError'
    this.statusCode = statusCode
    this.isAuthError = statusCode === 401
  }
}

/**
 * Implements the core functions for the REST report endpoints.
 */
export class ReportRestClient {

  private reportServiceUrl : string
  private reportServiceApiKey : string

  constructor() {
    const config = useRuntimeConfig();

    this.reportServiceUrl = config.public.reportServiceUrl
    this.reportServiceApiKey = config.public.reportServiceApiKey
    if (!this.reportServiceUrl || !this.reportServiceApiKey) {
      throw new Error(
        'ReportRestClient must have REPORT_SERVICE_URL and REPORT_SERVICE_API_KEY set in the runtime environment.',
      )
    }
  }

  private getHeaders(token: string): HeadersInit {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * Helper to make the authenticated fetch request.
   * @param urlPath The path appended to the baseUrl.
   * @param token The Bearer token (API Key).
   * @returns Promise<Response>
   */
  private async makeAuthenticatedFetch(
    urlPath: string,
    token: string,
  ): Promise<Response> {
    const baseUrl = this.reportServiceUrl as string
    const url = `${baseUrl}${urlPath}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(token),
    })

    if (response.status === 401) {
      throw new RestClientError(
        'Authentication Failed: Invalid API Key/Token.',
        401,
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new RestClientError(
        `HTTP Error ${response.status}: ${errorText}`,
        response.status,
      )
    }

    return response
  }

  /**
   * Calls the PDF endpoint, streams the binary data, and returns it as a Blob.
   * @param managerId ID of the manager.
   * @returns Promise<Blob> A Blob of type application/pdf.
   */
  public async getManagerPDF(managerId: number): Promise<Blob> {
    const token = this.reportServiceApiKey as string
    const urlPath = `/reports/manager/${managerId}/pdf`

    const response = await this.makeAuthenticatedFetch(urlPath, token)

    // Stream the binary data
    const pdfBlob = await response.blob()

    return pdfBlob
  }

  /**
   * Calls the HTML endpoint, gets the response text, and returns it as a Blob.
   * @param managerId ID of the manager.
   * @returns Promise<Blob> A Blob of type text/html.
   */
  public async getManagerHTML(managerId: number): Promise<Blob> {
    const token = this.reportServiceApiKey as string
    const urlPath = `/reports/manager/${managerId}/html`

    const response = await this.makeAuthenticatedFetch(urlPath, token)

    const htmlText = await response.text()

    // Return as a Blob for consistent handling
    return new Blob([htmlText], { type: 'text/html' })
  }
}
