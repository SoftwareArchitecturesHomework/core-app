import { Code, ConnectError } from "@bufbuild/connect";

const reportServiceUrl = process.env.REPORT_SERVICE_URL
const reportServiceApiKey = process.env.REPORT_SERVICE_API_KEY

export class ReportRestClient {

    constructor() {
        if (!reportServiceUrl || !reportServiceApiKey) {
            throw new Error("ReportRestClient must be initialized with a baseUrl and apiKey.");
        }
    }

    private getHeaders(token: string): HeadersInit {
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json, text/html, application/pdf',
        };
    }

    /**
     * Helper to make the authenticated fetch request.
     * @param urlPath The path appended to the baseUrl.
     * @param token The Bearer token (API Key).
     * @param expectedType The expected MIME type for the response blob.
     * @returns Promise<Blob>
     */
    private async makeAuthenticatedFetch(urlPath: string, token: string): Promise<Response> {
        const url = `${reportServiceUrl}${urlPath}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(token),
        });

        if (response.status === 401) {
            throw new ConnectError("Authentication Failed: Invalid API Key/Token.", Code.Unauthenticated);
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new ConnectError(`HTTP Error ${response.status}: ${errorText}`, Code.Internal);
        }

        return response;
    }

    /**
     * Calls the PDF endpoint, streams the binary data, and returns it as a Blob.
     * @param managerId ID of the manager.
     * @returns Promise<Blob> A Blob of type application/pdf.
     */
    public async getManagerPDF(managerId: number): Promise<Blob> {
        const token = reportServiceApiKey;
        const urlPath = `/reports/manager/${managerId}/pdf`;
        
        const response = await this.makeAuthenticatedFetch(urlPath, token!);

        const pdfBlob = await response.blob();
        
        return pdfBlob;
    }

    /**
     * Calls the HTML endpoint, gets the response text, and returns it as a Blob.
     * @param managerId ID of the manager.
     * @returns Promise<Blob> A Blob of type text/html.
     */
    public async getManagerHTML(managerId: number): Promise<Blob> {
        const token = reportServiceApiKey;
        const urlPath = `/reports/manager/${managerId}/html`;
        
        const response = await this.makeAuthenticatedFetch(urlPath, token!);
        
        const htmlText = await response.text();
        
        // Return as a Blob for consistent handling (e.g., using URL.createObjectURL)
        return new Blob([htmlText], { type: 'text/html' });
    }
}