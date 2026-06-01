import { randomUUID } from 'crypto';
import type { ContactFormPayload, ContactMailErrorCode } from './contact-mail';
import { sendContactEmail, getContactMailErrorResponse } from './contact-mail';

export type ContactQueueJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type ContactQueueErrorCode = 'QUEUE_FULL';

export class ContactQueueError extends Error {
  code: ContactQueueErrorCode;

  constructor(code: ContactQueueErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ContactQueueError';
    this.code = code;
  }
}

interface ContactQueueJob {
  id: string;
  payload: ContactFormPayload;
  status: ContactQueueJobStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  errorCode?: ContactMailErrorCode;
  errorMessage?: string;
}

export interface ContactQueueSnapshot {
  id: string;
  status: ContactQueueJobStatus;
  queuePosition: number | null;
  errorCode?: ContactMailErrorCode;
  errorMessage?: string;
}

const jobs = new Map<string, ContactQueueJob>();
const queue: string[] = [];
let workerActive = false;
let processingJobId: string | null = null;

function getQueueLimit(): number {
  const parsed = Number.parseInt(process.env.CONTACT_QUEUE_MAX_SIZE ?? '100', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

function getRetentionMs(): number {
  const parsed = Number.parseInt(process.env.CONTACT_QUEUE_RETENTION_MS ?? String(30 * 60 * 1000), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30 * 60 * 1000;
}

function getPendingCount(): number {
  return queue.length + (processingJobId ? 1 : 0);
}

function pruneJobs(): void {
  const now = Date.now();
  const retentionMs = getRetentionMs();

  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'queued' || job.status === 'processing') continue;
    if (!job.finishedAt) continue;
    if (now - job.finishedAt < retentionMs) continue;
    jobs.delete(jobId);
  }
}

async function processQueue(): Promise<void> {
  if (workerActive) return;
  workerActive = true;

  while (queue.length > 0) {
    const jobId = queue.shift();
    if (!jobId) continue;

    const job = jobs.get(jobId);
    if (!job) continue;

    processingJobId = jobId;
    job.status = 'processing';
    job.startedAt = Date.now();
    job.errorCode = undefined;
    job.errorMessage = undefined;

    try {
      await sendContactEmail(job.payload);
      job.status = 'completed';
      job.finishedAt = Date.now();
      console.log(`[contact-queue] completed job=${job.id}`);
    } catch (error) {
      const response = getContactMailErrorResponse(error);
      job.status = 'failed';
      job.finishedAt = Date.now();
      job.errorCode = response.code;
      job.errorMessage = response.message;
      console.error(`[contact-queue] ${response.code} job=${job.id}`, error);
    } finally {
      processingJobId = null;
      pruneJobs();
    }
  }

  workerActive = false;
  if (queue.length > 0) {
    void processQueue();
  }
}

export function enqueueContactJob(payload: ContactFormPayload): { jobId: string; queuePosition: number } {
  pruneJobs();

  if (getPendingCount() >= getQueueLimit()) {
    throw new ContactQueueError('QUEUE_FULL', 'Contact queue is full. Try again shortly.');
  }

  const jobId = randomUUID();
  jobs.set(jobId, {
    id: jobId,
    payload,
    status: 'queued',
    createdAt: Date.now(),
  });
  queue.push(jobId);
  const queuePosition = queue.length;
  void processQueue();
  return { jobId, queuePosition };
}

export function getContactQueueJob(jobId: string): ContactQueueSnapshot | null {
  pruneJobs();
  const job = jobs.get(jobId);
  if (!job) return null;

  const queuePosition = job.status === 'queued'
    ? Math.max(1, queue.indexOf(job.id) + 1)
    : null;

  return {
    id: job.id,
    status: job.status,
    queuePosition,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
  };
}
