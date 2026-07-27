import { DiagnosticJob, DiagnosticJobRequest } from '@hymui/contracts';

interface Clock {
    now(): Date;
}
interface IdGenerator {
    next(): string;
}
interface JobTransport {
    cancel(id: string, correlationId: string): Promise<DiagnosticJob>;
    create(request: DiagnosticJobRequest, correlationId: string): Promise<DiagnosticJob>;
    get(id: string, correlationId: string): Promise<DiagnosticJob | null>;
}
declare const systemClock: Clock;
declare const uuidGenerator: IdGenerator;
declare function resolveCorrelationId(value: string | string[] | undefined): string;

export { type Clock, type IdGenerator, type JobTransport, resolveCorrelationId, systemClock, uuidGenerator };
