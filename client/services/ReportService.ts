import { ManagerRequest } from '../grpc/report_pb.js';
import { ReportServiceClient } from '../grpc/report_grpc_web_pb.js';
import { useRuntimeConfig } from 'nuxt/app';

const client = new ReportServiceClient(
  'http://localhost:8080', 
  null,
  null 
);

const config = useRuntimeConfig()

/**
 * Calls the GetManagerReport gRPC method and processes the Base64 PDF response.
 * @param {number} managerId 
 */
export function getReportPDF(managerId: any) {
  return new Promise((resolve, reject) => {
    const request = new ManagerRequest();
    request.setManagerId(managerId);

    const metadata = {
      'Authorization': `Bearer ${config.reportServiceApiKey}`
    };

    client.getManagerPDF(request, {}, (err, response) => {
      if (err) {
        console.error('gRPC Error:', err);
        return reject(err);
      }

      // The response.getPdf() returns the Base64 string
      const pdfBase64 = response.getPdf();
      
      if (!pdfBase64) {
          return reject(new Error("No PDF data returned."));
      }

      // 1. Convert Base64 string to a Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
      
      resolve(pdfBlob);
    });
  });
}