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
declare class StorageError extends Error {
    readonly code: "OBJECT_CHECKSUM_MISMATCH" | "OBJECT_NOT_FOUND" | "STORAGE_UNAVAILABLE";
    constructor(code: "OBJECT_CHECKSUM_MISMATCH" | "OBJECT_NOT_FOUND" | "STORAGE_UNAVAILABLE", message: string);
}

export { type ObjectMetadata, type ObjectStorage, type PutObjectInput, type SignedAccess, type StorageAdapterKind, StorageError };
