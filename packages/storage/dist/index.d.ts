type StorageAdapterKind = "filesystem" | "gcs" | "s3";
interface ObjectMetadata {
    readonly byteLength: number;
    readonly checksum: string;
    readonly contentType: string;
    readonly createdAt: Date;
    readonly key: string;
}
interface PutObjectInput {
    readonly body: AsyncIterable<Uint8Array>;
    readonly contentType: string;
    readonly key: string;
}
type SignedAccess = {
    readonly expiresAt: Date;
    readonly kind: "url";
    readonly url: URL;
} | {
    readonly kind: "unsupported";
};
interface ObjectStorage {
    readonly kind: StorageAdapterKind;
    delete(key: string): Promise<void>;
    get(key: string): Promise<{
        body: AsyncIterable<Uint8Array>;
        metadata: ObjectMetadata;
    } | null>;
    put(input: PutObjectInput): Promise<ObjectMetadata>;
    signedAccess(key: string, expiresAt: Date): Promise<SignedAccess | null>;
    stat(key: string): Promise<ObjectMetadata | null>;
}
type StorageErrorCode = "OBJECT_CHECKSUM_MISMATCH" | "OBJECT_KEY_INVALID" | "OBJECT_NOT_FOUND" | "STORAGE_UNAVAILABLE";
declare class StorageError extends Error {
    readonly code: StorageErrorCode;
    constructor(code: StorageErrorCode, message: string);
}

interface FilesystemStorageOptions {
    readonly clock?: () => Date;
    readonly rootDirectory: string;
}
declare function createFilesystemObjectStorage(options: FilesystemStorageOptions): Promise<ObjectStorage>;

export { type FilesystemStorageOptions, type ObjectMetadata, type ObjectStorage, type PutObjectInput, type SignedAccess, type StorageAdapterKind, StorageError, type StorageErrorCode, createFilesystemObjectStorage };
