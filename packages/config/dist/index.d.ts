import { Edition, RuntimeMode } from '@hymui/contracts';

type ServiceName = "api" | "worker";
type DatabaseDriver = "pglite" | "postgresql" | "mysql" | "mariadb" | "mssql";
type StorageDriver = "filesystem" | "gcs" | "s3";
interface RuntimeConfig {
    readonly apiHost: string;
    readonly apiPort: number;
    readonly apiUrl: string;
    readonly databaseDriver: DatabaseDriver;
    readonly databaseUrl: string | undefined;
    readonly edition: Edition;
    readonly internalToken: string;
    readonly mode: RuntimeMode;
    readonly service: ServiceName;
    readonly storageDriver: StorageDriver;
    readonly storagePath: string | undefined;
    readonly workerHost: string;
    readonly workerPort: number;
    readonly workerUrl: string;
}
declare function loadRuntimeConfig(service: ServiceName, env?: Readonly<Record<string, string | undefined>>): RuntimeConfig;

export { type DatabaseDriver, type RuntimeConfig, type ServiceName, type StorageDriver, loadRuntimeConfig };
