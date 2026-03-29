import http from 'http';

export interface SenderOptions {
  endpoint: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class Sender {
  private endpoint: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(options: SenderOptions) {
    this.endpoint = options.endpoint;
    this.timeout = options.timeout ?? 30000;
    this.headers = options.headers ?? {};
  }

  async send(data: Buffer, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.endpoint);
      const fullUrl = `${url.protocol}//${url.host}${url.pathname}`;
      
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Content-Length': data.length,
          ...this.headers,
        },
      }, res => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            reject(new Error(`OTLP request to ${fullUrl} failed with status ${res.statusCode}${body ? ': ' + body.substring(0, 200) : ''}`));
          });
        }
      });
      
      req.on('error', (err) => {
        reject(new Error(`Failed to connect to OTLP endpoint ${fullUrl}: ${err.message}. Make sure the OTEL collector is running and accessible.`));
      });
      
      req.setTimeout(this.timeout, () => {
        req.destroy();
        reject(new Error(`OTLP request to ${fullUrl} timed out after ${this.timeout}ms`));
      });
      
      req.write(data);
      req.end();
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.send(Buffer.from('{}'), '/v1/traces');
      return true;
    } catch {
      return false;
    }
  }
}

export default Sender;