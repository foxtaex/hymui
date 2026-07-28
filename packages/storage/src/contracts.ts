export type StorageAdapterKind = "filesystem" | "gcs" | "s3";

export interface ObjectMetadata {
  readonly byteLength: number;
  readonly checksum: string;
  readonly contentType: string;
  readonly createdAt: Date;
  readonly key: string;
}

export interface PutObjectInput {
  readonly body: AsyncIterable<Uint8Array>;
  readonly contentType: string;
  readonly key: string;
}

export type SignedAccess =
  | { readonly expiresAt: Date; readonly kind: "url"; readonly url: URL }
  | { readonly kind: "unsupported" };

export interface ObjectStorage {
  readonly kind: StorageAdapterKind;
  delete(key: string): Promise<void>;
  get(key: string): Promise<{ body: AsyncIterable<Uint8Array>; metadata: ObjectMetadata } | null>;
  put(input: PutObjectInput): Promise<ObjectMetadata>;
  signedAccess(key: string, expiresAt: Date): Promise<SignedAccess | null>;
  stat(key: string): Promise<ObjectMetadata | null>;
}

export type StorageErrorCode =
  "OBJECT_CHECKSUM_MISMATCH" | "OBJECT_KEY_INVALID" | "OBJECT_NOT_FOUND" | "STORAGE_UNAVAILABLE";

export class StorageError extends Error {
  public constructor(
    public readonly code: StorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}
