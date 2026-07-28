// src/index.ts
import { randomUUID } from "crypto";
var systemClock = {
  now: () => /* @__PURE__ */ new Date()
};
var uuidGenerator = {
  next: () => randomUUID()
};
function resolveCorrelationId(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(candidate)) {
    return candidate;
  }
  return randomUUID();
}
export {
  resolveCorrelationId,
  systemClock,
  uuidGenerator
};
