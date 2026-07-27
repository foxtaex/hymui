// src/index.ts
var StorageError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "StorageError";
  }
  code;
};
export {
  StorageError
};
