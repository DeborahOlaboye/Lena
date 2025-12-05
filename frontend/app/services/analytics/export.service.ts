import { AnalyticsQueryParams } from '@/types/analytics';

export type ExportFormat = 'csv' | 'json';
export type ExportType = 'raw' | 'aggregated';

export interface ExportRequest extends AnalyticsQueryParams {
  format: ExportFormat;
  type: ExportType;
  metrics?: string[];
  timezone?: string;
}

export interface ExportStatus {
  exportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

class ExportService {
  private static instance: ExportService;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '';

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Request a new data export
   */
  public async requestExport(request: ExportRequest): Promise<{ exportId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to request export');
      }

      return await response.json();
    } catch (error) {
      console.error('Export request failed:', error);
      throw error;
    }
  }

  /**
   * Get the status of an export
   */
  public async getExportStatus(exportId: string): Promise<ExportStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/analytics/export?exportId=${exportId}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get export status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get export status:', error);
      throw error;
    }
  }

  /**
   * Poll the export status until it's completed or failed
   */
  public async waitForExport(
    exportId: string,
    interval = 2000,
    timeout = 300000 // 5 minutes
  ): Promise<ExportStatus> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const status = await this.getExportStatus(exportId);

          if (status.status === 'completed') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(status.error || 'Export failed'));
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Export timed out'));
            return;
          }

          // Check again after interval
          setTimeout(checkStatus, interval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * Download an export file
   */
  public downloadExport(downloadUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const exportService = ExportService.getInstance();
