import {
  C,
  F,
  L,
  P,
  R,
  T,
  U,
  Vr,
  ce,
  h,
  or,
  u,
  ur,
  x
} from "./chunk-O57GPHJY.js";

// ../../packages/config/src/index.ts
var editions = /* @__PURE__ */ new Set(["local", "self-hosted", "hosted"]);
var modes = /* @__PURE__ */ new Set(["development", "test", "local", "self-hosted", "hosted"]);
var databaseDrivers = /* @__PURE__ */ new Set([
  "pglite",
  "postgresql",
  "mysql",
  "mariadb",
  "mssql"
]);
var storageDrivers = /* @__PURE__ */ new Set(["filesystem", "gcs", "s3"]);
function parseEnum(name2, value, fallback, allowed) {
  const candidate = value ?? fallback;
  if (!allowed.has(candidate)) {
    throw new Error(`${name2} must be one of: ${[...allowed].join(", ")}`);
  }
  return candidate;
}
function parsePort(name2, value, fallback) {
  if (value === void 0) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`${name2} must be an integer between 0 and 65535`);
  }
  return port;
}
function loadRuntimeConfig(service, env = process.env) {
  const nodeMode = env.NODE_ENV === "test" ? "test" : "development";
  const mode = parseEnum("HYMUI_MODE", env.HYMUI_MODE, nodeMode, modes);
  const edition = parseEnum("HYMUI_EDITION", env.HYMUI_EDITION, "local", editions);
  const apiHost = env.HYMUI_API_HOST ?? "127.0.0.1";
  const apiPort = parsePort("HYMUI_API_PORT", env.HYMUI_API_PORT, 4e3);
  const apiUrl = env.HYMUI_API_URL ?? `http://${apiHost === "0.0.0.0" ? "127.0.0.1" : apiHost}:${apiPort}`;
  const databaseDriver = parseEnum(
    "HYMUI_DATABASE_DRIVER",
    env.HYMUI_DATABASE_DRIVER,
    edition === "local" ? "pglite" : "postgresql",
    databaseDrivers
  );
  const storageDriver = parseEnum(
    "HYMUI_STORAGE_DRIVER",
    env.HYMUI_STORAGE_DRIVER,
    edition === "local" ? "filesystem" : edition === "hosted" ? "gcs" : "s3",
    storageDrivers
  );
  const workerHost = env.HYMUI_WORKER_HOST ?? "127.0.0.1";
  const workerPort = parsePort("HYMUI_WORKER_PORT", env.HYMUI_WORKER_PORT, 4001);
  const workerUrl = env.HYMUI_WORKER_URL ?? `http://${workerHost === "0.0.0.0" ? "127.0.0.1" : workerHost}:${workerPort}`;
  const internalToken = env.HYMUI_INTERNAL_TOKEN ?? (edition === "local" ? "hymui-local-development-token" : void 0);
  try {
    new URL(apiUrl);
    new URL(workerUrl);
  } catch {
    throw new Error("HYMUI_API_URL and HYMUI_WORKER_URL must be valid absolute URLs");
  }
  if (!internalToken || internalToken.length < 24) {
    throw new Error("HYMUI_INTERNAL_TOKEN must contain at least 24 characters");
  }
  return Object.freeze({
    apiHost,
    apiPort,
    apiUrl,
    databaseDriver,
    databaseUrl: env.HYMUI_DATABASE_URL,
    edition,
    internalToken,
    mode,
    service,
    storageDriver,
    storagePath: env.HYMUI_STORAGE_PATH,
    workerHost,
    workerPort,
    workerUrl
  });
}

// src/app.ts
import { randomUUID as randomUUID6 } from "crypto";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

// ../../packages/contracts/src/index.ts
import { Type } from "@sinclair/typebox";
var ApiVersion = "v1";
var HymuiVersion = "6.0.0-dev.0";
var UuidSchema = Type.String({
  pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
});
var DateTimeSchema = Type.String({
  pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{3})?Z"
});
var EditionSchema = Type.Union([
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted")
]);
var RuntimeModeSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("test"),
  Type.Literal("local"),
  Type.Literal("self-hosted"),
  Type.Literal("hosted")
]);
var ServiceStateSchema = Type.Union([
  Type.Literal("ready"),
  Type.Literal("degraded"),
  Type.Literal("unavailable")
]);
var HealthResponseSchema = Type.Object(
  {
    apiVersion: Type.Literal(ApiVersion),
    correlationId: UuidSchema,
    edition: EditionSchema,
    mode: RuntimeModeSchema,
    service: Type.Literal("api"),
    state: ServiceStateSchema,
    timestamp: DateTimeSchema,
    version: Type.Literal(HymuiVersion),
    worker: ServiceStateSchema
  },
  { additionalProperties: false }
);
var JobStatusSchema = Type.Union([
  Type.Literal("queued"),
  Type.Literal("running"),
  Type.Literal("completed"),
  Type.Literal("failed"),
  Type.Literal("cancelled")
]);
var DiagnosticJobRequestSchema = Type.Object(
  {
    message: Type.String({ minLength: 1, maxLength: 160 })
  },
  { additionalProperties: false }
);
var DiagnosticJobSchema = Type.Object(
  {
    completedAt: Type.Union([DateTimeSchema, Type.Null()]),
    correlationId: UuidSchema,
    createdAt: DateTimeSchema,
    id: UuidSchema,
    message: Type.String(),
    result: Type.Union([Type.String(), Type.Null()]),
    status: JobStatusSchema,
    updatedAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var WorkerClaimRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    workerId: UuidSchema
  },
  { additionalProperties: false }
);
var DiagnosticJobClaimSchema = Type.Object(
  {
    attempt: Type.Integer({ minimum: 1 }),
    job: DiagnosticJobSchema,
    leaseExpiresAt: DateTimeSchema,
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var WorkerHeartbeatRequestSchema = Type.Object(
  {
    leaseSeconds: Type.Integer({ maximum: 300, minimum: 1 }),
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var WorkerCompleteRequestSchema = Type.Object(
  {
    leaseToken: Type.String({ minLength: 32 }),
    result: Type.String({ maxLength: 2e3, minLength: 1 })
  },
  { additionalProperties: false }
);
var WorkerFailRequestSchema = Type.Object(
  {
    error: Type.String({ maxLength: 2e3, minLength: 1 }),
    leaseToken: Type.String({ minLength: 32 })
  },
  { additionalProperties: false }
);
var ErrorResponseSchema = Type.Object(
  {
    code: Type.String({ pattern: "^[A-Z0-9_]+$" }),
    correlationId: UuidSchema,
    message: Type.String()
  },
  { additionalProperties: false }
);
var CorrelationIdHeader = "x-hymui-correlation-id";
var UsernameSchema = Type.String({
  maxLength: 32,
  minLength: 3,
  pattern: "^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$"
});
var ActorSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    id: UuidSchema,
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var AuthSessionSchema = Type.Object(
  {
    actor: ActorSchema,
    expiresAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var RegisterRequestSchema = Type.Object(
  {
    displayName: Type.String({ maxLength: 80, minLength: 1 }),
    password: Type.String({ maxLength: 256, minLength: 12 }),
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var LoginRequestSchema = Type.Object(
  {
    password: Type.String({ maxLength: 256, minLength: 1 }),
    username: UsernameSchema
  },
  { additionalProperties: false }
);
var ProjectSchema = Type.Object(
  {
    archived: Type.Boolean(),
    createdAt: DateTimeSchema,
    description: Type.String({ maxLength: 2e3 }),
    id: UuidSchema,
    name: Type.String({ maxLength: 120, minLength: 1 }),
    ownerId: UuidSchema,
    revision: Type.Integer({ minimum: 1 }),
    updatedAt: DateTimeSchema
  },
  { additionalProperties: false }
);
var ProjectListSchema = Type.Object(
  {
    projects: Type.Array(ProjectSchema)
  },
  { additionalProperties: false }
);
var CreateProjectRequestSchema = Type.Object(
  {
    description: Type.Optional(Type.String({ maxLength: 2e3 })),
    name: Type.String({ maxLength: 120, minLength: 1 })
  },
  { additionalProperties: false }
);
var UpdateProjectRequestSchema = Type.Object(
  {
    archived: Type.Optional(Type.Boolean()),
    description: Type.Optional(Type.String({ maxLength: 2e3 })),
    name: Type.Optional(Type.String({ maxLength: 120, minLength: 1 })),
    revision: Type.Integer({ minimum: 1 })
  },
  { additionalProperties: false }
);

// ../../packages/core/src/index.ts
import { randomUUID } from "crypto";
function resolveCorrelationId(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(candidate)) {
    return candidate;
  }
  return randomUUID();
}

// ../../packages/db/src/pglite.ts
import { createHash, randomUUID as randomUUID2 } from "crypto";

// ../../node_modules/.pnpm/@electric-sql+pglite@0.3.8/node_modules/@electric-sql/pglite/dist/chunk-M6G2OE44.js
var hn = {};
F(hn, { ABSTIME: () => Et, ACLITEM: () => Vt, BIT: () => jt, BOOL: () => be, BPCHAR: () => _e, BYTEA: () => ge, CHAR: () => gt, CID: () => St, CIDR: () => Tt, CIRCLE: () => Ut, DATE: () => He, FLOAT4: () => Qe, FLOAT8: () => We, GTSVECTOR: () => rn, INET: () => kt, INT2: () => ve, INT4: () => Ge, INT8: () => we, INTERVAL: () => vt, JSON: () => Ae, JSONB: () => Ye, MACADDR: () => Ot, MACADDR8: () => Nt, MONEY: () => Lt, NUMERIC: () => Wt, OID: () => je, PATH: () => Mt, PG_DEPENDENCIES: () => en, PG_LSN: () => Xt, PG_NDISTINCT: () => Zt, PG_NODE_TREE: () => Bt, POLYGON: () => Rt, REFCURSOR: () => _t, REGCLASS: () => Yt, REGCONFIG: () => sn, REGDICTIONARY: () => an, REGNAMESPACE: () => on, REGOPER: () => Ht, REGOPERATOR: () => qt, REGPROC: () => wt, REGPROCEDURE: () => zt, REGROLE: () => un, REGTYPE: () => $t, RELTIME: () => Ct, SMGR: () => It, TEXT: () => V, TID: () => At, TIME: () => Ft, TIMESTAMP: () => qe, TIMESTAMPTZ: () => xe, TIMETZ: () => Gt, TINTERVAL: () => Pt, TSQUERY: () => nn, TSVECTOR: () => tn, TXID_SNAPSHOT: () => Jt, UUID: () => Kt, VARBIT: () => Qt, VARCHAR: () => ze, XID: () => xt, XML: () => Dt, arrayParser: () => yn, arraySerializer: () => Ke, parseType: () => ue, parsers: () => ln, serializers: () => cn, types: () => $e });
u();
var ht = globalThis.JSON.parse;
var bt = globalThis.JSON.stringify;
var be = 16;
var ge = 17;
var gt = 18;
var we = 20;
var ve = 21;
var Ge = 23;
var wt = 24;
var V = 25;
var je = 26;
var At = 27;
var xt = 28;
var St = 29;
var Ae = 114;
var Dt = 142;
var Bt = 194;
var It = 210;
var Mt = 602;
var Rt = 604;
var Tt = 650;
var Qe = 700;
var We = 701;
var Et = 702;
var Ct = 703;
var Pt = 704;
var Ut = 718;
var Nt = 774;
var Lt = 790;
var Ot = 829;
var kt = 869;
var Vt = 1033;
var _e = 1042;
var ze = 1043;
var He = 1082;
var Ft = 1083;
var qe = 1114;
var xe = 1184;
var vt = 1186;
var Gt = 1266;
var jt = 1560;
var Qt = 1562;
var Wt = 1700;
var _t = 1790;
var zt = 2202;
var Ht = 2203;
var qt = 2204;
var Yt = 2205;
var $t = 2206;
var Kt = 2950;
var Jt = 2970;
var Xt = 3220;
var Zt = 3361;
var en = 3402;
var tn = 3614;
var nn = 3615;
var rn = 3642;
var sn = 3734;
var an = 3769;
var Ye = 3802;
var on = 4089;
var un = 4096;
var $e = { string: { to: V, from: [V, ze, _e], serialize: (e) => {
  if (typeof e == "string") return e;
  if (typeof e == "number") return e.toString();
  throw new Error("Invalid input for string type");
}, parse: (e) => e }, number: { to: 0, from: [ve, Ge, je, Qe, We], serialize: (e) => e.toString(), parse: (e) => +e }, bigint: { to: we, from: [we], serialize: (e) => e.toString(), parse: (e) => {
  let t2 = BigInt(e);
  return t2 < Number.MIN_SAFE_INTEGER || t2 > Number.MAX_SAFE_INTEGER ? t2 : Number(t2);
} }, json: { to: Ae, from: [Ae, Ye], serialize: (e) => typeof e == "string" ? e : bt(e), parse: (e) => ht(e) }, boolean: { to: be, from: [be], serialize: (e) => {
  if (typeof e != "boolean") throw new Error("Invalid input for boolean type");
  return e ? "t" : "f";
}, parse: (e) => e === "t" }, date: { to: xe, from: [He, qe, xe], serialize: (e) => {
  if (typeof e == "string") return e;
  if (typeof e == "number") return new Date(e).toISOString();
  if (e instanceof Date) return e.toISOString();
  throw new Error("Invalid input for date type");
}, parse: (e) => new Date(e) }, bytea: { to: ge, from: [ge], serialize: (e) => {
  if (!(e instanceof Uint8Array)) throw new Error("Invalid input for bytea type");
  return "\\x" + Array.from(e).map((t2) => t2.toString(16).padStart(2, "0")).join("");
}, parse: (e) => {
  let t2 = e.slice(2);
  return Uint8Array.from({ length: t2.length / 2 }, (n, r) => parseInt(t2.substring(r * 2, (r + 1) * 2), 16));
} } };
var Se = pn($e);
var ln = Se.parsers;
var cn = Se.serializers;
function ue(e, t2, n) {
  if (e === null) return null;
  let r = n?.[t2] ?? Se.parsers[t2];
  return r ? r(e, t2) : e;
}
function pn(e) {
  return Object.keys(e).reduce(({ parsers: t2, serializers: n }, r) => {
    let { to: i2, from: a, serialize: u2, parse: d2 } = e[r];
    return n[i2] = u2, n[r] = u2, t2[r] = d2, Array.isArray(a) ? a.forEach((c) => {
      t2[c] = d2, n[c] = u2;
    }) : (t2[a] = d2, n[a] = u2), { parsers: t2, serializers: n };
  }, { parsers: {}, serializers: {} });
}
var dn = /\\/g;
var fn = /"/g;
function mn(e) {
  return e.replace(dn, "\\\\").replace(fn, '\\"');
}
function Ke(e, t2, n) {
  if (Array.isArray(e) === false) return e;
  if (!e.length) return "{}";
  let r = e[0], i2 = n === 1020 ? ";" : ",";
  return Array.isArray(r) ? `{${e.map((a) => Ke(a, t2, n)).join(i2)}}` : `{${e.map((a) => (a === void 0 && (a = null), a === null ? "null" : '"' + mn(t2 ? t2(a) : a.toString()) + '"')).join(i2)}}`;
}
var he = { i: 0, char: null, str: "", quoted: false, last: 0, p: null };
function yn(e, t2, n) {
  return he.i = he.last = 0, Je(he, e, t2, n)[0];
}
function Je(e, t2, n, r) {
  let i2 = [], a = r === 1020 ? ";" : ",";
  for (; e.i < t2.length; e.i++) {
    if (e.char = t2[e.i], e.quoted) e.char === "\\" ? e.str += t2[++e.i] : e.char === '"' ? (i2.push(n ? n(e.str) : e.str), e.str = "", e.quoted = t2[e.i + 1] === '"', e.last = e.i + 2) : e.str += e.char;
    else if (e.char === '"') e.quoted = true;
    else if (e.char === "{") e.last = ++e.i, i2.push(Je(e, t2, n, r));
    else if (e.char === "}") {
      e.quoted = false, e.last < e.i && i2.push(n ? n(t2.slice(e.last, e.i)) : t2.slice(e.last, e.i)), e.last = e.i + 1;
      break;
    } else e.char === a && e.p !== "}" && e.p !== '"' && (i2.push(n ? n(t2.slice(e.last, e.i)) : t2.slice(e.last, e.i)), e.last = e.i + 1);
    e.p = e.char;
  }
  return e.last < e.i && i2.push(n ? n(t2.slice(e.last, e.i + 1)) : t2.slice(e.last, e.i + 1)), i2;
}
var wn = {};
F(wn, { parseDescribeStatementResults: () => De, parseResults: () => bn });
u();
function bn(e, t2, n, r) {
  let i2 = [], a = { rows: [], fields: [] }, u2 = 0, d2 = { ...t2, ...n?.parsers };
  return e.forEach((c) => {
    switch (c.name) {
      case "rowDescription": {
        let k = c;
        a.fields = k.fields.map((T3) => ({ name: T3.name, dataTypeID: T3.dataTypeID }));
        break;
      }
      case "dataRow": {
        if (!a) break;
        let k = c;
        n?.rowMode === "array" ? a.rows.push(k.fields.map((T3, ie2) => ue(T3, a.fields[ie2].dataTypeID, d2))) : a.rows.push(Object.fromEntries(k.fields.map((T3, ie2) => [a.fields[ie2].name, ue(T3, a.fields[ie2].dataTypeID, d2)])));
        break;
      }
      case "commandComplete": {
        u2 += gn(c), i2.push({ ...a, affectedRows: u2, ...r ? { blob: r } : {} }), a = { rows: [], fields: [] };
        break;
      }
    }
  }), i2.length === 0 && i2.push({ affectedRows: 0, rows: [], fields: [] }), i2;
}
function gn(e) {
  let t2 = e.text.split(" ");
  switch (t2[0]) {
    case "INSERT":
      return parseInt(t2[2], 10);
    case "UPDATE":
    case "DELETE":
    case "COPY":
    case "MERGE":
      return parseInt(t2[1], 10);
    default:
      return 0;
  }
}
function De(e) {
  let t2 = e.find((n) => n.name === "parameterDescription");
  return t2 ? t2.dataTypeIDs : [];
}
var Ue = {};
F(Ue, { AuthenticationCleartextPassword: () => v, AuthenticationMD5Password: () => G, AuthenticationOk: () => F2, AuthenticationSASL: () => j, AuthenticationSASLContinue: () => Q, AuthenticationSASLFinal: () => W, BackendKeyDataMessage: () => K, CommandCompleteMessage: () => Z, CopyDataMessage: () => _, CopyResponse: () => z, DataRowMessage: () => ee, DatabaseError: () => E, Field: () => H, NoticeMessage: () => te, NotificationResponseMessage: () => J, ParameterDescriptionMessage: () => Y, ParameterStatusMessage: () => $, ReadyForQueryMessage: () => X, RowDescriptionMessage: () => q, bindComplete: () => Ie, closeComplete: () => Me, copyDone: () => Pe, emptyQuery: () => Ce, noData: () => Re, parseComplete: () => Be, portalSuspended: () => Te, replicationStart: () => Ee });
u();
var Be = { name: "parseComplete", length: 5 };
var Ie = { name: "bindComplete", length: 5 };
var Me = { name: "closeComplete", length: 5 };
var Re = { name: "noData", length: 5 };
var Te = { name: "portalSuspended", length: 5 };
var Ee = { name: "replicationStart", length: 4 };
var Ce = { name: "emptyQuery", length: 4 };
var Pe = { name: "copyDone", length: 4 };
var F2 = class {
  constructor(t2) {
    this.length = t2;
    this.name = "authenticationOk";
  }
};
var v = class {
  constructor(t2) {
    this.length = t2;
    this.name = "authenticationCleartextPassword";
  }
};
var G = class {
  constructor(t2, n) {
    this.length = t2;
    this.salt = n;
    this.name = "authenticationMD5Password";
  }
};
var j = class {
  constructor(t2, n) {
    this.length = t2;
    this.mechanisms = n;
    this.name = "authenticationSASL";
  }
};
var Q = class {
  constructor(t2, n) {
    this.length = t2;
    this.data = n;
    this.name = "authenticationSASLContinue";
  }
};
var W = class {
  constructor(t2, n) {
    this.length = t2;
    this.data = n;
    this.name = "authenticationSASLFinal";
  }
};
var E = class extends Error {
  constructor(n, r, i2) {
    super(n);
    this.length = r;
    this.name = i2;
  }
};
var _ = class {
  constructor(t2, n) {
    this.length = t2;
    this.chunk = n;
    this.name = "copyData";
  }
};
var z = class {
  constructor(t2, n, r, i2) {
    this.length = t2;
    this.name = n;
    this.binary = r;
    this.columnTypes = new Array(i2);
  }
};
var H = class {
  constructor(t2, n, r, i2, a, u2, d2) {
    this.name = t2;
    this.tableID = n;
    this.columnID = r;
    this.dataTypeID = i2;
    this.dataTypeSize = a;
    this.dataTypeModifier = u2;
    this.format = d2;
  }
};
var q = class {
  constructor(t2, n) {
    this.length = t2;
    this.fieldCount = n;
    this.name = "rowDescription";
    this.fields = new Array(this.fieldCount);
  }
};
var Y = class {
  constructor(t2, n) {
    this.length = t2;
    this.parameterCount = n;
    this.name = "parameterDescription";
    this.dataTypeIDs = new Array(this.parameterCount);
  }
};
var $ = class {
  constructor(t2, n, r) {
    this.length = t2;
    this.parameterName = n;
    this.parameterValue = r;
    this.name = "parameterStatus";
  }
};
var K = class {
  constructor(t2, n, r) {
    this.length = t2;
    this.processID = n;
    this.secretKey = r;
    this.name = "backendKeyData";
  }
};
var J = class {
  constructor(t2, n, r, i2) {
    this.length = t2;
    this.processId = n;
    this.channel = r;
    this.payload = i2;
    this.name = "notification";
  }
};
var X = class {
  constructor(t2, n) {
    this.length = t2;
    this.status = n;
    this.name = "readyForQuery";
  }
};
var Z = class {
  constructor(t2, n) {
    this.length = t2;
    this.text = n;
    this.name = "commandComplete";
  }
};
var ee = class {
  constructor(t2, n) {
    this.length = t2;
    this.fields = n;
    this.name = "dataRow";
    this.fieldCount = n.length;
  }
};
var te = class {
  constructor(t2, n) {
    this.length = t2;
    this.message = n;
    this.name = "notice";
  }
};
var zn = {};
F(zn, { Parser: () => ye, messages: () => Ue, serialize: () => O });
u();
u();
u();
u();
function C2(e) {
  let t2 = e.length;
  for (let n = e.length - 1; n >= 0; n--) {
    let r = e.charCodeAt(n);
    r > 127 && r <= 2047 ? t2++ : r > 2047 && r <= 65535 && (t2 += 2), r >= 56320 && r <= 57343 && n--;
  }
  return t2;
}
var b;
var g;
var U2;
var ce2;
var N;
var x2;
var le;
var P2;
var Xe;
var R2 = class {
  constructor(t2 = 256) {
    this.size = t2;
    R(this, x2);
    R(this, b);
    R(this, g, 5);
    R(this, U2, false);
    R(this, ce2, new TextEncoder());
    R(this, N, 0);
    x(this, b, T(this, x2, le).call(this, t2));
  }
  addInt32(t2) {
    return T(this, x2, P2).call(this, 4), h(this, b).setInt32(h(this, g), t2, h(this, U2)), x(this, g, h(this, g) + 4), this;
  }
  addInt16(t2) {
    return T(this, x2, P2).call(this, 2), h(this, b).setInt16(h(this, g), t2, h(this, U2)), x(this, g, h(this, g) + 2), this;
  }
  addCString(t2) {
    return t2 && this.addString(t2), T(this, x2, P2).call(this, 1), h(this, b).setUint8(h(this, g), 0), U(this, g)._++, this;
  }
  addString(t2 = "") {
    let n = C2(t2);
    return T(this, x2, P2).call(this, n), h(this, ce2).encodeInto(t2, new Uint8Array(h(this, b).buffer, h(this, g))), x(this, g, h(this, g) + n), this;
  }
  add(t2) {
    return T(this, x2, P2).call(this, t2.byteLength), new Uint8Array(h(this, b).buffer).set(new Uint8Array(t2), h(this, g)), x(this, g, h(this, g) + t2.byteLength), this;
  }
  flush(t2) {
    let n = T(this, x2, Xe).call(this, t2);
    return x(this, g, 5), x(this, b, T(this, x2, le).call(this, this.size)), new Uint8Array(n);
  }
};
b = /* @__PURE__ */ new WeakMap(), g = /* @__PURE__ */ new WeakMap(), U2 = /* @__PURE__ */ new WeakMap(), ce2 = /* @__PURE__ */ new WeakMap(), N = /* @__PURE__ */ new WeakMap(), x2 = /* @__PURE__ */ new WeakSet(), le = function(t2) {
  return new DataView(new ArrayBuffer(t2));
}, P2 = function(t2) {
  if (h(this, b).byteLength - h(this, g) < t2) {
    let r = h(this, b).buffer, i2 = r.byteLength + (r.byteLength >> 1) + t2;
    x(this, b, T(this, x2, le).call(this, i2)), new Uint8Array(h(this, b).buffer).set(new Uint8Array(r));
  }
}, Xe = function(t2) {
  if (t2) {
    h(this, b).setUint8(h(this, N), t2);
    let n = h(this, g) - (h(this, N) + 1);
    h(this, b).setInt32(h(this, N) + 1, n, h(this, U2));
  }
  return h(this, b).buffer.slice(t2 ? 0 : 5, h(this, g));
};
var m = new R2();
var An = (e) => {
  m.addInt16(3).addInt16(0);
  for (let r of Object.keys(e)) m.addCString(r).addCString(e[r]);
  m.addCString("client_encoding").addCString("UTF8");
  let t2 = m.addCString("").flush(), n = t2.byteLength + 4;
  return new R2().addInt32(n).add(t2).flush();
};
var xn = () => {
  let e = new DataView(new ArrayBuffer(8));
  return e.setInt32(0, 8, false), e.setInt32(4, 80877103, false), new Uint8Array(e.buffer);
};
var Sn = (e) => m.addCString(e).flush(112);
var Dn = (e, t2) => (m.addCString(e).addInt32(C2(t2)).addString(t2), m.flush(112));
var Bn = (e) => m.addString(e).flush(112);
var In = (e) => m.addCString(e).flush(81);
var Mn = [];
var Rn = (e) => {
  let t2 = e.name ?? "";
  t2.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", t2, t2.length), console.error("This can cause conflicts and silent errors executing queries"));
  let n = m.addCString(t2).addCString(e.text).addInt16(e.types?.length ?? 0);
  return e.types?.forEach((r) => n.addInt32(r)), m.flush(80);
};
var L2 = new R2();
var Tn = (e, t2) => {
  for (let n = 0; n < e.length; n++) {
    let r = t2 ? t2(e[n], n) : e[n];
    if (r === null) m.addInt16(0), L2.addInt32(-1);
    else if (r instanceof ArrayBuffer || ArrayBuffer.isView(r)) {
      let i2 = ArrayBuffer.isView(r) ? r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength) : r;
      m.addInt16(1), L2.addInt32(i2.byteLength), L2.add(i2);
    } else m.addInt16(0), L2.addInt32(C2(r)), L2.addString(r);
  }
};
var En = (e = {}) => {
  let t2 = e.portal ?? "", n = e.statement ?? "", r = e.binary ?? false, i2 = e.values ?? Mn, a = i2.length;
  return m.addCString(t2).addCString(n), m.addInt16(a), Tn(i2, e.valueMapper), m.addInt16(a), m.add(L2.flush()), m.addInt16(r ? 1 : 0), m.flush(66);
};
var Cn = new Uint8Array([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
var Pn = (e) => {
  if (!e || !e.portal && !e.rows) return Cn;
  let t2 = e.portal ?? "", n = e.rows ?? 0, r = C2(t2), i2 = 4 + r + 1 + 4, a = new DataView(new ArrayBuffer(1 + i2));
  return a.setUint8(0, 69), a.setInt32(1, i2, false), new TextEncoder().encodeInto(t2, new Uint8Array(a.buffer, 5)), a.setUint8(r + 5, 0), a.setUint32(a.byteLength - 4, n, false), new Uint8Array(a.buffer);
};
var Un = (e, t2) => {
  let n = new DataView(new ArrayBuffer(16));
  return n.setInt32(0, 16, false), n.setInt16(4, 1234, false), n.setInt16(6, 5678, false), n.setInt32(8, e, false), n.setInt32(12, t2, false), new Uint8Array(n.buffer);
};
var Ne = (e, t2) => {
  let n = new R2();
  return n.addCString(t2), n.flush(e);
};
var Nn = m.addCString("P").flush(68);
var Ln = m.addCString("S").flush(68);
var On = (e) => e.name ? Ne(68, `${e.type}${e.name ?? ""}`) : e.type === "P" ? Nn : Ln;
var kn = (e) => {
  let t2 = `${e.type}${e.name ?? ""}`;
  return Ne(67, t2);
};
var Vn = (e) => m.add(e).flush(100);
var Fn = (e) => Ne(102, e);
var pe = (e) => new Uint8Array([e, 0, 0, 0, 4]);
var vn = pe(72);
var Gn = pe(83);
var jn = pe(88);
var Qn = pe(99);
var O = { startup: An, password: Sn, requestSsl: xn, sendSASLInitialResponseMessage: Dn, sendSCRAMClientFinalMessage: Bn, query: In, parse: Rn, bind: En, execute: Pn, describe: On, close: kn, flush: () => vn, sync: () => Gn, end: () => jn, copyData: Vn, copyDone: () => Qn, copyFail: Fn, cancel: Un };
u();
u();
var Le = { text: 0, binary: 1 };
u();
var Wn = new ArrayBuffer(0);
var M;
var w;
var fe;
var me;
var ne;
var de = class {
  constructor(t2 = 0) {
    R(this, M, new DataView(Wn));
    R(this, w);
    R(this, fe, "utf-8");
    R(this, me, new TextDecoder(h(this, fe)));
    R(this, ne, false);
    x(this, w, t2);
  }
  setBuffer(t2, n) {
    x(this, w, t2), x(this, M, new DataView(n));
  }
  int16() {
    let t2 = h(this, M).getInt16(h(this, w), h(this, ne));
    return x(this, w, h(this, w) + 2), t2;
  }
  byte() {
    let t2 = h(this, M).getUint8(h(this, w));
    return U(this, w)._++, t2;
  }
  int32() {
    let t2 = h(this, M).getInt32(h(this, w), h(this, ne));
    return x(this, w, h(this, w) + 4), t2;
  }
  string(t2) {
    return h(this, me).decode(this.bytes(t2));
  }
  cstring() {
    let t2 = h(this, w), n = t2;
    for (; h(this, M).getUint8(n++) !== 0; ) ;
    let r = this.string(n - t2 - 1);
    return x(this, w, n), r;
  }
  bytes(t2) {
    let n = h(this, M).buffer.slice(h(this, w), h(this, w) + t2);
    return x(this, w, h(this, w) + t2), new Uint8Array(n);
  }
};
M = /* @__PURE__ */ new WeakMap(), w = /* @__PURE__ */ new WeakMap(), fe = /* @__PURE__ */ new WeakMap(), me = /* @__PURE__ */ new WeakMap(), ne = /* @__PURE__ */ new WeakMap();
var Oe = 1;
var _n = 4;
var Ze = Oe + _n;
var et = new ArrayBuffer(0);
var A;
var S;
var D;
var o;
var l;
var tt;
var nt;
var rt;
var st;
var it;
var at;
var ot;
var ke;
var ut;
var lt;
var ct;
var pt;
var dt;
var ft;
var mt;
var yt;
var Ve;
var ye = class {
  constructor() {
    R(this, l);
    R(this, A, new DataView(et));
    R(this, S, 0);
    R(this, D, 0);
    R(this, o, new de());
  }
  parse(t2, n) {
    T(this, l, tt).call(this, ArrayBuffer.isView(t2) ? t2.buffer.slice(t2.byteOffset, t2.byteOffset + t2.byteLength) : t2);
    let r = h(this, D) + h(this, S), i2 = h(this, D);
    for (; i2 + Ze <= r; ) {
      let a = h(this, A).getUint8(i2), u2 = h(this, A).getUint32(i2 + Oe, false), d2 = Oe + u2;
      if (d2 + i2 <= r) {
        let c = T(this, l, nt).call(this, i2 + Ze, a, u2, h(this, A).buffer);
        n(c), i2 += d2;
      } else break;
    }
    i2 === r ? (x(this, A, new DataView(et)), x(this, S, 0), x(this, D, 0)) : (x(this, S, r - i2), x(this, D, i2));
  }
};
A = /* @__PURE__ */ new WeakMap(), S = /* @__PURE__ */ new WeakMap(), D = /* @__PURE__ */ new WeakMap(), o = /* @__PURE__ */ new WeakMap(), l = /* @__PURE__ */ new WeakSet(), tt = function(t2) {
  if (h(this, S) > 0) {
    let n = h(this, S) + t2.byteLength;
    if (n + h(this, D) > h(this, A).byteLength) {
      let i2;
      if (n <= h(this, A).byteLength && h(this, D) >= h(this, S)) i2 = h(this, A).buffer;
      else {
        let a = h(this, A).byteLength * 2;
        for (; n >= a; ) a *= 2;
        i2 = new ArrayBuffer(a);
      }
      new Uint8Array(i2).set(new Uint8Array(h(this, A).buffer, h(this, D), h(this, S))), x(this, A, new DataView(i2)), x(this, D, 0);
    }
    new Uint8Array(h(this, A).buffer).set(new Uint8Array(t2), h(this, D) + h(this, S)), x(this, S, n);
  } else x(this, A, new DataView(t2)), x(this, D, 0), x(this, S, t2.byteLength);
}, nt = function(t2, n, r, i2) {
  switch (n) {
    case 50:
      return Ie;
    case 49:
      return Be;
    case 51:
      return Me;
    case 110:
      return Re;
    case 115:
      return Te;
    case 99:
      return Pe;
    case 87:
      return Ee;
    case 73:
      return Ce;
    case 68:
      return T(this, l, dt).call(this, t2, r, i2);
    case 67:
      return T(this, l, st).call(this, t2, r, i2);
    case 90:
      return T(this, l, rt).call(this, t2, r, i2);
    case 65:
      return T(this, l, ut).call(this, t2, r, i2);
    case 82:
      return T(this, l, yt).call(this, t2, r, i2);
    case 83:
      return T(this, l, ft).call(this, t2, r, i2);
    case 75:
      return T(this, l, mt).call(this, t2, r, i2);
    case 69:
      return T(this, l, Ve).call(this, t2, r, i2, "error");
    case 78:
      return T(this, l, Ve).call(this, t2, r, i2, "notice");
    case 84:
      return T(this, l, lt).call(this, t2, r, i2);
    case 116:
      return T(this, l, pt).call(this, t2, r, i2);
    case 71:
      return T(this, l, at).call(this, t2, r, i2);
    case 72:
      return T(this, l, ot).call(this, t2, r, i2);
    case 100:
      return T(this, l, it).call(this, t2, r, i2);
    default:
      return new E("received invalid response: " + n.toString(16), r, "error");
  }
}, rt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).string(1);
  return new X(n, i2);
}, st = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).cstring();
  return new Z(n, i2);
}, it = function(t2, n, r) {
  let i2 = r.slice(t2, t2 + (n - 4));
  return new _(n, new Uint8Array(i2));
}, at = function(t2, n, r) {
  return T(this, l, ke).call(this, t2, n, r, "copyInResponse");
}, ot = function(t2, n, r) {
  return T(this, l, ke).call(this, t2, n, r, "copyOutResponse");
}, ke = function(t2, n, r, i2) {
  h(this, o).setBuffer(t2, r);
  let a = h(this, o).byte() !== 0, u2 = h(this, o).int16(), d2 = new z(n, i2, a, u2);
  for (let c = 0; c < u2; c++) d2.columnTypes[c] = h(this, o).int16();
  return d2;
}, ut = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int32(), a = h(this, o).cstring(), u2 = h(this, o).cstring();
  return new J(n, i2, a, u2);
}, lt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int16(), a = new q(n, i2);
  for (let u2 = 0; u2 < i2; u2++) a.fields[u2] = T(this, l, ct).call(this);
  return a;
}, ct = function() {
  let t2 = h(this, o).cstring(), n = h(this, o).int32(), r = h(this, o).int16(), i2 = h(this, o).int32(), a = h(this, o).int16(), u2 = h(this, o).int32(), d2 = h(this, o).int16() === 0 ? Le.text : Le.binary;
  return new H(t2, n, r, i2, a, u2, d2);
}, pt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int16(), a = new Y(n, i2);
  for (let u2 = 0; u2 < i2; u2++) a.dataTypeIDs[u2] = h(this, o).int32();
  return a;
}, dt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int16(), a = new Array(i2);
  for (let u2 = 0; u2 < i2; u2++) {
    let d2 = h(this, o).int32();
    a[u2] = d2 === -1 ? null : h(this, o).string(d2);
  }
  return new ee(n, a);
}, ft = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).cstring(), a = h(this, o).cstring();
  return new $(n, i2, a);
}, mt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int32(), a = h(this, o).int32();
  return new K(n, i2, a);
}, yt = function(t2, n, r) {
  h(this, o).setBuffer(t2, r);
  let i2 = h(this, o).int32();
  switch (i2) {
    case 0:
      return new F2(n);
    case 3:
      return new v(n);
    case 5:
      return new G(n, h(this, o).bytes(4));
    case 10: {
      let a = [];
      for (; ; ) {
        let u2 = h(this, o).cstring();
        if (u2.length === 0) return new j(n, a);
        a.push(u2);
      }
    }
    case 11:
      return new Q(n, h(this, o).string(n - 8));
    case 12:
      return new W(n, h(this, o).string(n - 8));
    default:
      throw new Error("Unknown authenticationOk message type " + i2);
  }
}, Ve = function(t2, n, r, i2) {
  h(this, o).setBuffer(t2, r);
  let a = {}, u2 = h(this, o).string(1);
  for (; u2 !== "\0"; ) a[u2] = h(this, o).cstring(), u2 = h(this, o).string(1);
  let d2 = a.M, c = i2 === "notice" ? new te(n, d2) : new E(d2, n, i2);
  return c.severity = a.S, c.code = a.C, c.detail = a.D, c.hint = a.H, c.position = a.P, c.internalPosition = a.p, c.internalQuery = a.q, c.where = a.W, c.schema = a.s, c.table = a.t, c.column = a.c, c.dataType = a.d, c.constraint = a.n, c.file = a.F, c.line = a.L, c.routine = a.R, c;
};
u();
var Fe = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var se;
async function Rr() {
  if (Fe || se) return;
  let e = new URL("./pglite.wasm", import.meta.url);
  se = fetch(e);
}
var re;
async function Tr(e, t2) {
  if (t2 || re) return { instance: await WebAssembly.instantiate(t2 || re, e), module: t2 || re };
  let n = new URL("./pglite.wasm", import.meta.url);
  if (Fe) {
    let i2 = await (await import("fs/promises")).readFile(n), { module: a, instance: u2 } = await WebAssembly.instantiate(i2, e);
    return re = a, { instance: u2, module: a };
  } else {
    se || (se = fetch(n));
    let r = await se, { module: i2, instance: a } = await WebAssembly.instantiateStreaming(r, e);
    return re = i2, { instance: a, module: i2 };
  }
}
async function Er() {
  let e = new URL("./pglite.data", import.meta.url);
  return Fe ? (await (await import("fs/promises")).readFile(e)).buffer : (await fetch(e)).arrayBuffer();
}
function Nr(e) {
  let t2;
  return e.startsWith('"') && e.endsWith('"') ? t2 = e.substring(1, e.length - 1) : t2 = e.toLowerCase(), t2;
}

// ../../node_modules/.pnpm/@electric-sql+pglite@0.3.8/node_modules/@electric-sql/pglite/dist/chunk-STOZMFXW.js
u();
var o2 = { part: "part", container: "container" };
function s(t2, r, ...e) {
  let a = t2.length - 1, p2 = e.length - 1;
  if (p2 !== -1) {
    if (p2 === 0) {
      t2[a] = t2[a] + e[0] + r;
      return;
    }
    t2[a] = t2[a] + e[0], t2.push(...e.slice(1, p2)), t2.push(e[p2] + r);
  }
}
function y(t2, ...r) {
  let e = [t2[0]];
  e.raw = [t2.raw[0]];
  let a = [];
  for (let p2 = 0; p2 < r.length; p2++) {
    let n = r[p2], i2 = p2 + 1;
    if (n?._templateType === o2.part) {
      s(e, t2[i2], n.str), s(e.raw, t2.raw[i2], n.str);
      continue;
    }
    if (n?._templateType === o2.container) {
      s(e, t2[i2], ...n.strings), s(e.raw, t2.raw[i2], ...n.strings.raw), a.push(...n.values);
      continue;
    }
    e.push(t2[i2]), e.raw.push(t2.raw[i2]), a.push(n);
  }
  return { _templateType: "container", strings: e, values: a };
}
function g2(t2, ...r) {
  let { strings: e, values: a } = y(t2, ...r);
  return { query: [e[0], ...a.flatMap((p2, n) => [`$${n + 1}`, e[n + 1]])].join(""), params: a };
}

// ../../node_modules/.pnpm/@electric-sql+pglite@0.3.8/node_modules/@electric-sql/pglite/dist/chunk-HWTMPVRX.js
u();
u();
function E2(h2) {
  let s2 = h2.e;
  return s2.query = h2.query, s2.params = h2.params, s2.queryOptions = h2.options, s2;
}
var d;
var p;
var t;
var y2;
var x3;
var m2;
var O2;
var F3 = class {
  constructor() {
    R(this, t);
    this.serializers = { ...cn };
    this.parsers = { ...ln };
    R(this, d, false);
    R(this, p, false);
  }
  async _initArrayTypes({ force: s2 = false } = {}) {
    if (h(this, d) && !s2) return;
    x(this, d, true);
    let e = await this.query(`
      SELECT b.oid, b.typarray
      FROM pg_catalog.pg_type a
      LEFT JOIN pg_catalog.pg_type b ON b.oid = a.typelem
      WHERE a.typcategory = 'A'
      GROUP BY b.oid, b.typarray
      ORDER BY b.oid
    `);
    for (let r of e.rows) this.serializers[r.typarray] = (n) => Ke(n, this.serializers[r.oid], r.typarray), this.parsers[r.typarray] = (n) => yn(n, this.parsers[r.oid], r.typarray);
  }
  async refreshArrayTypes() {
    await this._initArrayTypes({ force: true });
  }
  async query(s2, e, r) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => await T(this, t, x3).call(this, s2, e, r));
  }
  async sql(s2, ...e) {
    let { query: r, params: n } = g2(s2, ...e);
    return await this.query(r, n);
  }
  async exec(s2, e) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => await T(this, t, m2).call(this, s2, e));
  }
  async describeQuery(s2, e) {
    try {
      await T(this, t, y2).call(this, O.parse({ text: s2, types: e?.paramTypes }), e);
      let r = await T(this, t, y2).call(this, O.describe({ type: "S" }), e), n = r.messages.find((c) => c.name === "parameterDescription"), i2 = r.messages.find((c) => c.name === "rowDescription"), o3 = n?.dataTypeIDs.map((c) => ({ dataTypeID: c, serializer: this.serializers[c] })) ?? [], u2 = i2?.fields.map((c) => ({ name: c.name, dataTypeID: c.dataTypeID, parser: this.parsers[c.dataTypeID] })) ?? [];
      return { queryParams: o3, resultFields: u2 };
    } catch (r) {
      throw r instanceof E ? E2({ e: r, options: e, params: void 0, query: s2 }) : r;
    } finally {
      await T(this, t, y2).call(this, O.sync(), e);
    }
  }
  async transaction(s2) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => {
      await T(this, t, m2).call(this, "BEGIN"), x(this, p, true);
      let e = false, r = () => {
        if (e) throw new Error("Transaction is closed");
      }, n = { query: async (i2, o3, u2) => (r(), await T(this, t, x3).call(this, i2, o3, u2)), sql: async (i2, ...o3) => {
        let { query: u2, params: c } = g2(i2, ...o3);
        return await T(this, t, x3).call(this, u2, c);
      }, exec: async (i2, o3) => (r(), await T(this, t, m2).call(this, i2, o3)), rollback: async () => {
        r(), await T(this, t, m2).call(this, "ROLLBACK"), e = true;
      }, listen: async (i2, o3) => (r(), await this.listen(i2, o3, n)), get closed() {
        return e;
      } };
      try {
        let i2 = await s2(n);
        return e || (e = true, await T(this, t, m2).call(this, "COMMIT")), x(this, p, false), i2;
      } catch (i2) {
        throw e || await T(this, t, m2).call(this, "ROLLBACK"), x(this, p, false), i2;
      }
    });
  }
  async runExclusive(s2) {
    return await this._runExclusiveQuery(s2);
  }
};
d = /* @__PURE__ */ new WeakMap(), p = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakSet(), y2 = async function(s2, e = {}) {
  return await this.execProtocol(s2, { ...e, syncToFs: false });
}, x3 = async function(s2, e = [], r) {
  return await this._runExclusiveQuery(async () => {
    T(this, t, O2).call(this, "runQuery", s2, e, r), await this._handleBlob(r?.blob);
    let n;
    try {
      let { messages: o3 } = await T(this, t, y2).call(this, O.parse({ text: s2, types: r?.paramTypes }), r), u2 = De((await T(this, t, y2).call(this, O.describe({ type: "S" }), r)).messages), c = e.map((g3, S2) => {
        let D2 = u2[S2];
        if (g3 == null) return null;
        let Q3 = r?.serializers?.[D2] ?? this.serializers[D2];
        return Q3 ? Q3(g3) : g3.toString();
      });
      n = [...o3, ...(await T(this, t, y2).call(this, O.bind({ values: c }), r)).messages, ...(await T(this, t, y2).call(this, O.describe({ type: "P" }), r)).messages, ...(await T(this, t, y2).call(this, O.execute({}), r)).messages];
    } catch (o3) {
      throw o3 instanceof E ? E2({ e: o3, options: r, params: e, query: s2 }) : o3;
    } finally {
      await T(this, t, y2).call(this, O.sync(), r);
    }
    await this._cleanupBlob(), h(this, p) || await this.syncToFs();
    let i2 = await this._getWrittenBlob();
    return bn(n, this.parsers, r, i2)[0];
  });
}, m2 = async function(s2, e) {
  return await this._runExclusiveQuery(async () => {
    T(this, t, O2).call(this, "runExec", s2, e), await this._handleBlob(e?.blob);
    let r;
    try {
      r = (await T(this, t, y2).call(this, O.query(s2), e)).messages;
    } catch (i2) {
      throw i2 instanceof E ? E2({ e: i2, options: e, params: void 0, query: s2 }) : i2;
    } finally {
      await T(this, t, y2).call(this, O.sync(), e);
    }
    this._cleanupBlob(), h(this, p) || await this.syncToFs();
    let n = await this._getWrittenBlob();
    return bn(r, this.parsers, e, n);
  });
}, O2 = function(...s2) {
  this.debug > 0 && console.log(...s2);
};

// ../../node_modules/.pnpm/@electric-sql+pglite@0.3.8/node_modules/@electric-sql/pglite/dist/index.js
u();
u();
u();
var et2 = new Error("timeout while waiting for mutex to become available");
var tt2 = new Error("mutex already locked");
var Ke2 = new Error("request for lock canceled");
var Ye2 = function(e, t2, r, a) {
  function o3(s2) {
    return s2 instanceof r ? s2 : new r(function(l2) {
      l2(s2);
    });
  }
  return new (r || (r = Promise))(function(s2, l2) {
    function _2(p2) {
      try {
        m3(a.next(p2));
      } catch (d2) {
        l2(d2);
      }
    }
    function n(p2) {
      try {
        m3(a.throw(p2));
      } catch (d2) {
        l2(d2);
      }
    }
    function m3(p2) {
      p2.done ? s2(p2.value) : o3(p2.value).then(_2, n);
    }
    m3((a = a.apply(e, t2 || [])).next());
  });
};
var fe2 = class {
  constructor(t2, r = Ke2) {
    this._value = t2, this._cancelError = r, this._weightedQueues = [], this._weightedWaiters = [];
  }
  acquire(t2 = 1) {
    if (t2 <= 0) throw new Error(`invalid weight ${t2}: must be positive`);
    return new Promise((r, a) => {
      this._weightedQueues[t2 - 1] || (this._weightedQueues[t2 - 1] = []), this._weightedQueues[t2 - 1].push({ resolve: r, reject: a }), this._dispatch();
    });
  }
  runExclusive(t2, r = 1) {
    return Ye2(this, void 0, void 0, function* () {
      let [a, o3] = yield this.acquire(r);
      try {
        return yield t2(a);
      } finally {
        o3();
      }
    });
  }
  waitForUnlock(t2 = 1) {
    if (t2 <= 0) throw new Error(`invalid weight ${t2}: must be positive`);
    return new Promise((r) => {
      this._weightedWaiters[t2 - 1] || (this._weightedWaiters[t2 - 1] = []), this._weightedWaiters[t2 - 1].push(r), this._dispatch();
    });
  }
  isLocked() {
    return this._value <= 0;
  }
  getValue() {
    return this._value;
  }
  setValue(t2) {
    this._value = t2, this._dispatch();
  }
  release(t2 = 1) {
    if (t2 <= 0) throw new Error(`invalid weight ${t2}: must be positive`);
    this._value += t2, this._dispatch();
  }
  cancel() {
    this._weightedQueues.forEach((t2) => t2.forEach((r) => r.reject(this._cancelError))), this._weightedQueues = [];
  }
  _dispatch() {
    var t2;
    for (let r = this._value; r > 0; r--) {
      let a = (t2 = this._weightedQueues[r - 1]) === null || t2 === void 0 ? void 0 : t2.shift();
      if (!a) continue;
      let o3 = this._value, s2 = r;
      this._value -= r, r = this._value + 1, a.resolve([o3, this._newReleaser(s2)]);
    }
    this._drainUnlockWaiters();
  }
  _newReleaser(t2) {
    let r = false;
    return () => {
      r || (r = true, this.release(t2));
    };
  }
  _drainUnlockWaiters() {
    for (let t2 = this._value; t2 > 0; t2--) this._weightedWaiters[t2 - 1] && (this._weightedWaiters[t2 - 1].forEach((r) => r()), this._weightedWaiters[t2 - 1] = []);
  }
};
var Je2 = function(e, t2, r, a) {
  function o3(s2) {
    return s2 instanceof r ? s2 : new r(function(l2) {
      l2(s2);
    });
  }
  return new (r || (r = Promise))(function(s2, l2) {
    function _2(p2) {
      try {
        m3(a.next(p2));
      } catch (d2) {
        l2(d2);
      }
    }
    function n(p2) {
      try {
        m3(a.throw(p2));
      } catch (d2) {
        l2(d2);
      }
    }
    function m3(p2) {
      p2.done ? s2(p2.value) : o3(p2.value).then(_2, n);
    }
    m3((a = a.apply(e, t2 || [])).next());
  });
};
var X2 = class {
  constructor(t2) {
    this._semaphore = new fe2(1, t2);
  }
  acquire() {
    return Je2(this, void 0, void 0, function* () {
      let [, t2] = yield this._semaphore.acquire();
      return t2;
    });
  }
  runExclusive(t2) {
    return this._semaphore.runExclusive(() => t2());
  }
  isLocked() {
    return this._semaphore.isLocked();
  }
  waitForUnlock() {
    return this._semaphore.waitForUnlock();
  }
  release() {
    this._semaphore.isLocked() && this._semaphore.release();
  }
  cancel() {
    return this._semaphore.cancel();
  }
};
u();
var Pe2 = L(or(), 1);
async function xe2(e) {
  if (Fe) {
    let t2 = await import("fs"), r = await import("zlib"), { Writable: a } = await import("stream"), { pipeline: o3 } = await import("stream/promises");
    if (!t2.existsSync(e)) throw new Error(`Extension bundle not found: ${e}`);
    let s2 = r.createGunzip(), l2 = [];
    return await o3(t2.createReadStream(e), s2, new a({ write(_2, n, m3) {
      l2.push(_2), m3();
    } })), new Blob(l2);
  } else {
    let t2 = await fetch(e.toString());
    if (!t2.ok || !t2.body) return null;
    if (t2.headers.get("Content-Encoding") === "gzip") return t2.blob();
    {
      let r = new DecompressionStream("gzip");
      return new Response(t2.body.pipeThrough(r)).blob();
    }
  }
}
async function ke2(e, t2) {
  for (let r in e.pg_extensions) {
    let a;
    try {
      a = await e.pg_extensions[r];
    } catch (o3) {
      console.error("Failed to fetch extension:", r, o3);
      continue;
    }
    if (a) {
      let o3 = new Uint8Array(await a.arrayBuffer());
      Qe2(e, r, o3, t2);
    } else console.error("Could not get binary data for extension:", r);
  }
}
function Qe2(e, t2, r, a) {
  Pe2.default.untar(r).forEach((s2) => {
    if (!s2.name.startsWith(".")) {
      let l2 = e.WASM_PREFIX + "/" + s2.name;
      if (s2.name.endsWith(".so")) {
        let _2 = (...m3) => {
          a("pgfs:ext OK", l2, m3);
        }, n = (...m3) => {
          a("pgfs:ext FAIL", l2, m3);
        };
        e.FS.createPreloadedFile($e2(l2), s2.name.split("/").pop().slice(0, -3), s2.data, true, true, _2, n, false);
      } else e.FS.writeFile(l2, s2.data);
    }
  });
}
function $e2(e) {
  let t2 = e.lastIndexOf("/");
  return t2 > 0 ? e.slice(0, t2) : e;
}
u();
u();
var ee2 = class extends ur {
  async init(t2, r) {
    return this.pg = t2, { emscriptenOpts: { ...r, preRun: [...r.preRun || [], (o3) => {
      let s2 = o3.FS.filesystems.IDBFS;
      o3.FS.mkdir("/pglite"), o3.FS.mkdir(`/pglite/${this.dataDir}`), o3.FS.mount(s2, {}, `/pglite/${this.dataDir}`), o3.FS.symlink(`/pglite/${this.dataDir}`, C);
    }] } };
  }
  initialSyncFs() {
    return new Promise((t2, r) => {
      this.pg.Module.FS.syncfs(true, (a) => {
        a ? r(a) : t2();
      });
    });
  }
  syncToFs(t2) {
    return new Promise((r, a) => {
      this.pg.Module.FS.syncfs(false, (o3) => {
        o3 ? a(o3) : r();
      });
    });
  }
  async closeFs() {
    let t2 = this.pg.Module.FS.filesystems.IDBFS.dbs[this.dataDir];
    t2 && t2.close(), this.pg.Module.FS.quit();
  }
};
u();
var te2 = class extends ur {
  async closeFs() {
    this.pg.Module.FS.quit();
  }
};
function Ae2(e) {
  let t2;
  if (e?.startsWith("file://")) {
    if (e = e.slice(7), !e) throw new Error("Invalid dataDir, must be a valid path");
    t2 = "nodefs";
  } else e?.startsWith("idb://") ? (e = e.slice(6), t2 = "idbfs") : e?.startsWith("opfs-ahp://") ? (e = e.slice(11), t2 = "opfs-ahp") : !e || e?.startsWith("memory://") ? t2 = "memoryfs" : t2 = "nodefs";
  return { dataDir: e, fsType: t2 };
}
async function Te2(e, t2) {
  let r;
  if (e && t2 === "nodefs") {
    let { NodeFS: a } = await import("./nodefs-FQQBIAZQ.js");
    r = new a(e);
  } else if (e && t2 === "idbfs") r = new ee2(e);
  else if (e && t2 === "opfs-ahp") {
    let { OpfsAhpFS: a } = await import("./opfs-ahp-NJG66H4N.js");
    r = new a(e);
  } else r = new te2();
  return r;
}
u();
u();
var Ze2 = (() => {
  var _scriptName = import.meta.url;
  return async function(moduleArg = {}) {
    var moduleRtn, Module = moduleArg, readyPromiseResolve, readyPromiseReject, readyPromise = new Promise((e, t2) => {
      readyPromiseResolve = e, readyPromiseReject = t2;
    }), ENVIRONMENT_IS_WEB = typeof window == "object", ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope < "u", ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
    if (ENVIRONMENT_IS_NODE) {
      let { createRequire: e } = await import("module"), t2 = import.meta.url;
      t2.startsWith("data:") && (t2 = "/");
      var require = e(t2);
    }
    Module.expectedDataFileDownloads ?? (Module.expectedDataFileDownloads = 0), Module.expectedDataFileDownloads++, (() => {
      var e = typeof ENVIRONMENT_IS_PTHREAD < "u" && ENVIRONMENT_IS_PTHREAD, t2 = typeof ENVIRONMENT_IS_WASM_WORKER < "u" && ENVIRONMENT_IS_WASM_WORKER;
      if (e || t2) return;
      var r = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
      function a(o3) {
        var s2 = "";
        typeof window == "object" ? s2 = window.encodeURIComponent(window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/") : typeof process > "u" && typeof location < "u" && (s2 = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/"));
        var l2 = "/tmp/sdk/dist/pglite-web/pglite.data", _2 = "pglite.data", n = Module.locateFile ? Module.locateFile(_2, "") : _2, m3 = o3.remote_package_size;
        function p2(c, w2, v2, S2) {
          if (r) {
            require("fs").readFile(c, (x4, y3) => {
              x4 ? S2(x4) : v2(y3.buffer);
            });
            return;
          }
          Module.dataFileDownloads ?? (Module.dataFileDownloads = {}), fetch(c).catch((x4) => Promise.reject(new Error(`Network Error: ${c}`, { cause: x4 }))).then((x4) => {
            if (!x4.ok) return Promise.reject(new Error(`${x4.status}: ${x4.url}`));
            if (!x4.body && x4.arrayBuffer) return x4.arrayBuffer().then(v2);
            let y3 = x4.body.getReader(), M2 = () => y3.read().then(W2).catch((D2) => Promise.reject(new Error(`Unexpected error while handling : ${x4.url} ${D2}`, { cause: D2 }))), E3 = [], b2 = x4.headers, U3 = Number(b2.get("Content-Length") ?? w2), z2 = 0, W2 = ({ done: D2, value: N2 }) => {
              if (D2) {
                let P3 = new Uint8Array(E3.map((k) => k.length).reduce((k, Le2) => k + Le2, 0)), R3 = 0;
                for (let k of E3) P3.set(k, R3), R3 += k.length;
                v2(P3.buffer);
              } else {
                E3.push(N2), z2 += N2.length, Module.dataFileDownloads[c] = { loaded: z2, total: U3 };
                let P3 = 0, R3 = 0;
                for (let k of Object.values(Module.dataFileDownloads)) P3 += k.loaded, R3 += k.total;
                return Module.setStatus?.(`Downloading data... (${P3}/${R3})`), M2();
              }
            };
            return Module.setStatus?.("Downloading data..."), M2();
          });
        }
        function d2(c) {
          console.error("package error:", c);
        }
        var g3 = null, u2 = Module.getPreloadedPackage ? Module.getPreloadedPackage(n, m3) : null;
        u2 || p2(n, m3, (c) => {
          g3 ? (g3(c), g3 = null) : u2 = c;
        }, d2);
        function f(c) {
          function w2(M2, E3) {
            if (!M2) throw E3 + new Error().stack;
          }
          c.FS_createPath("/", "home", true, true), c.FS_createPath("/home", "web_user", true, true), c.FS_createPath("/", "tmp", true, true), c.FS_createPath("/tmp", "pglite", true, true), c.FS_createPath("/tmp/pglite", "bin", true, true), c.FS_createPath("/tmp/pglite", "lib", true, true), c.FS_createPath("/tmp/pglite/lib", "postgresql", true, true), c.FS_createPath("/tmp/pglite/lib/postgresql", "pgxs", true, true), c.FS_createPath("/tmp/pglite/lib/postgresql/pgxs", "config", true, true), c.FS_createPath("/tmp/pglite/lib/postgresql/pgxs", "src", true, true), c.FS_createPath("/tmp/pglite/lib/postgresql/pgxs/src", "makefiles", true, true), c.FS_createPath("/tmp/pglite", "share", true, true), c.FS_createPath("/tmp/pglite/share", "postgresql", true, true), c.FS_createPath("/tmp/pglite/share/postgresql", "extension", true, true), c.FS_createPath("/tmp/pglite/share/postgresql", "timezone", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Africa", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "America", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Argentina", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Indiana", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Kentucky", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "North_Dakota", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Antarctica", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Arctic", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Asia", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Atlantic", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Australia", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Brazil", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Canada", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Chile", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Etc", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Europe", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Indian", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Mexico", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Pacific", true, true), c.FS_createPath("/tmp/pglite/share/postgresql/timezone", "US", true, true), c.FS_createPath("/tmp/pglite/share/postgresql", "timezonesets", true, true), c.FS_createPath("/tmp/pglite/share/postgresql", "tsearch_data", true, true);
          function v2(M2, E3, b2) {
            this.start = M2, this.end = E3, this.audio = b2;
          }
          v2.prototype = { requests: {}, open: function(M2, E3) {
            this.name = E3, this.requests[E3] = this, c.addRunDependency(`fp ${this.name}`);
          }, send: function() {
          }, onload: function() {
            var M2 = this.byteArray.subarray(this.start, this.end);
            this.finish(M2);
          }, finish: function(M2) {
            var E3 = this;
            c.FS_createDataFile(this.name, null, M2, true, true, true), c.removeRunDependency(`fp ${E3.name}`), this.requests[this.name] = null;
          } };
          for (var S2 = o3.files, x4 = 0; x4 < S2.length; ++x4) new v2(S2[x4].start, S2[x4].end, S2[x4].audio || 0).open("GET", S2[x4].filename);
          function y3(M2) {
            w2(M2, "Loading data file failed."), w2(M2.constructor.name === ArrayBuffer.name, "bad input to processPackageData");
            var E3 = new Uint8Array(M2);
            v2.prototype.byteArray = E3;
            for (var b2 = o3.files, U3 = 0; U3 < b2.length; ++U3) v2.prototype.requests[b2[U3].filename].onload();
            c.removeRunDependency("datafile_/tmp/sdk/dist/pglite-web/pglite.data");
          }
          c.addRunDependency("datafile_/tmp/sdk/dist/pglite-web/pglite.data"), c.preloadResults ?? (c.preloadResults = {}), c.preloadResults[l2] = { fromCache: false }, u2 ? (y3(u2), u2 = null) : g3 = y3;
        }
        Module.calledRun ? f(Module) : (Module.preRun ?? (Module.preRun = [])).push(f);
      }
      a({ files: [{ filename: "/home/web_user/.pgpass", start: 0, end: 204 }, { filename: "/tmp/pglite/bin/initdb", start: 204, end: 204 }, { filename: "/tmp/pglite/bin/postgres", start: 204, end: 204 }, { filename: "/tmp/pglite/lib/postgresql/cyrillic_and_mic.so", start: 204, end: 4698 }, { filename: "/tmp/pglite/lib/postgresql/dict_snowball.so", start: 4698, end: 577992 }, { filename: "/tmp/pglite/lib/postgresql/euc2004_sjis2004.so", start: 577992, end: 580075 }, { filename: "/tmp/pglite/lib/postgresql/euc_cn_and_mic.so", start: 580075, end: 581016 }, { filename: "/tmp/pglite/lib/postgresql/euc_jp_and_sjis.so", start: 581016, end: 588301 }, { filename: "/tmp/pglite/lib/postgresql/euc_kr_and_mic.so", start: 588301, end: 589252 }, { filename: "/tmp/pglite/lib/postgresql/euc_tw_and_big5.so", start: 589252, end: 593830 }, { filename: "/tmp/pglite/lib/postgresql/latin2_and_win1250.so", start: 593830, end: 595236 }, { filename: "/tmp/pglite/lib/postgresql/latin_and_mic.so", start: 595236, end: 596257 }, { filename: "/tmp/pglite/lib/postgresql/libpqwalreceiver.so", start: 596257, end: 716720 }, { filename: "/tmp/pglite/lib/postgresql/pgoutput.so", start: 716720, end: 730234 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/config/install-sh", start: 730234, end: 744231 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/config/missing", start: 744231, end: 745579 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.global", start: 745579, end: 781844 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.port", start: 781844, end: 782396 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.shlib", start: 782396, end: 797698 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/makefiles/pgxs.mk", start: 797698, end: 812609 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/nls-global.mk", start: 812609, end: 819477 }, { filename: "/tmp/pglite/lib/postgresql/plpgsql.so", start: 819477, end: 971490 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_big5.so", start: 971490, end: 1086238 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_cyrillic.so", start: 1086238, end: 1092212 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc2004.so", start: 1092212, end: 1297144 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_cn.so", start: 1297144, end: 1372324 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_jp.so", start: 1372324, end: 1523552 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_kr.so", start: 1523552, end: 1626408 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_tw.so", start: 1626408, end: 1825964 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_gb18030.so", start: 1825964, end: 2088341 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_gbk.so", start: 2088341, end: 2234873 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_iso8859.so", start: 2234873, end: 2258544 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_iso8859_1.so", start: 2258544, end: 2259516 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_johab.so", start: 2259516, end: 2421220 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_sjis.so", start: 2421220, end: 2502880 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_sjis2004.so", start: 2502880, end: 2629512 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_uhc.so", start: 2629512, end: 2796784 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_win.so", start: 2796784, end: 2823383 }, { filename: "/tmp/pglite/password", start: 2823383, end: 2823392 }, { filename: "/tmp/pglite/share/postgresql/errcodes.txt", start: 2823392, end: 2856784 }, { filename: "/tmp/pglite/share/postgresql/extension/plpgsql--1.0.sql", start: 2856784, end: 2857442 }, { filename: "/tmp/pglite/share/postgresql/extension/plpgsql.control", start: 2857442, end: 2857635 }, { filename: "/tmp/pglite/share/postgresql/information_schema.sql", start: 2857635, end: 2973158 }, { filename: "/tmp/pglite/share/postgresql/pg_hba.conf.sample", start: 2973158, end: 2978783 }, { filename: "/tmp/pglite/share/postgresql/pg_ident.conf.sample", start: 2978783, end: 2981423 }, { filename: "/tmp/pglite/share/postgresql/pg_service.conf.sample", start: 2981423, end: 2982027 }, { filename: "/tmp/pglite/share/postgresql/postgres.bki", start: 2982027, end: 3935295 }, { filename: "/tmp/pglite/share/postgresql/postgresql.conf.sample", start: 3935295, end: 3965957 }, { filename: "/tmp/pglite/share/postgresql/psqlrc.sample", start: 3965957, end: 3966235 }, { filename: "/tmp/pglite/share/postgresql/snowball_create.sql", start: 3966235, end: 4010411 }, { filename: "/tmp/pglite/share/postgresql/sql_features.txt", start: 4010411, end: 4046144 }, { filename: "/tmp/pglite/share/postgresql/system_constraints.sql", start: 4046144, end: 4055039 }, { filename: "/tmp/pglite/share/postgresql/system_functions.sql", start: 4055039, end: 4079342 }, { filename: "/tmp/pglite/share/postgresql/system_views.sql", start: 4079342, end: 4131036 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Abidjan", start: 4131036, end: 4131184 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Accra", start: 4131184, end: 4131332 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Addis_Ababa", start: 4131332, end: 4131597 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Algiers", start: 4131597, end: 4132332 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Asmara", start: 4132332, end: 4132597 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Asmera", start: 4132597, end: 4132862 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bamako", start: 4132862, end: 4133010 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bangui", start: 4133010, end: 4133245 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Banjul", start: 4133245, end: 4133393 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bissau", start: 4133393, end: 4133587 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Blantyre", start: 4133587, end: 4133736 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Brazzaville", start: 4133736, end: 4133971 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bujumbura", start: 4133971, end: 4134120 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Cairo", start: 4134120, end: 4136519 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Casablanca", start: 4136519, end: 4138948 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ceuta", start: 4138948, end: 4141e3 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Conakry", start: 4141e3, end: 4141148 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Dakar", start: 4141148, end: 4141296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Dar_es_Salaam", start: 4141296, end: 4141561 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Djibouti", start: 4141561, end: 4141826 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Douala", start: 4141826, end: 4142061 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/El_Aaiun", start: 4142061, end: 4144356 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Freetown", start: 4144356, end: 4144504 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Gaborone", start: 4144504, end: 4144653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Harare", start: 4144653, end: 4144802 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Johannesburg", start: 4144802, end: 4145048 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Juba", start: 4145048, end: 4145727 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kampala", start: 4145727, end: 4145992 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Khartoum", start: 4145992, end: 4146671 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kigali", start: 4146671, end: 4146820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kinshasa", start: 4146820, end: 4147055 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lagos", start: 4147055, end: 4147290 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Libreville", start: 4147290, end: 4147525 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lome", start: 4147525, end: 4147673 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Luanda", start: 4147673, end: 4147908 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lubumbashi", start: 4147908, end: 4148057 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lusaka", start: 4148057, end: 4148206 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Malabo", start: 4148206, end: 4148441 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Maputo", start: 4148441, end: 4148590 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Maseru", start: 4148590, end: 4148836 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Mbabane", start: 4148836, end: 4149082 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Mogadishu", start: 4149082, end: 4149347 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Monrovia", start: 4149347, end: 4149555 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Nairobi", start: 4149555, end: 4149820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ndjamena", start: 4149820, end: 4150019 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Niamey", start: 4150019, end: 4150254 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Nouakchott", start: 4150254, end: 4150402 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ouagadougou", start: 4150402, end: 4150550 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Porto-Novo", start: 4150550, end: 4150785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Sao_Tome", start: 4150785, end: 4151039 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Timbuktu", start: 4151039, end: 4151187 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Tripoli", start: 4151187, end: 4151812 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Tunis", start: 4151812, end: 4152501 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Windhoek", start: 4152501, end: 4153456 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Adak", start: 4153456, end: 4155812 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Anchorage", start: 4155812, end: 4158183 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Anguilla", start: 4158183, end: 4158429 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Antigua", start: 4158429, end: 4158675 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Araguaina", start: 4158675, end: 4159559 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Buenos_Aires", start: 4159559, end: 4160635 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Catamarca", start: 4160635, end: 4161711 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/ComodRivadavia", start: 4161711, end: 4162787 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Cordoba", start: 4162787, end: 4163863 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Jujuy", start: 4163863, end: 4164911 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/La_Rioja", start: 4164911, end: 4166001 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Mendoza", start: 4166001, end: 4167077 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Rio_Gallegos", start: 4167077, end: 4168153 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Salta", start: 4168153, end: 4169201 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/San_Juan", start: 4169201, end: 4170291 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/San_Luis", start: 4170291, end: 4171393 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Tucuman", start: 4171393, end: 4172497 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Ushuaia", start: 4172497, end: 4173573 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Aruba", start: 4173573, end: 4173819 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Asuncion", start: 4173819, end: 4175477 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Atikokan", start: 4175477, end: 4175659 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Atka", start: 4175659, end: 4178015 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bahia", start: 4178015, end: 4179039 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bahia_Banderas", start: 4179039, end: 4180139 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Barbados", start: 4180139, end: 4180575 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Belem", start: 4180575, end: 4181151 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Belize", start: 4181151, end: 4182765 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Blanc-Sablon", start: 4182765, end: 4183011 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Boa_Vista", start: 4183011, end: 4183643 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bogota", start: 4183643, end: 4183889 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Boise", start: 4183889, end: 4186299 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Buenos_Aires", start: 4186299, end: 4187375 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cambridge_Bay", start: 4187375, end: 4189629 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Campo_Grande", start: 4189629, end: 4191073 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cancun", start: 4191073, end: 4191937 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Caracas", start: 4191937, end: 4192201 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Catamarca", start: 4192201, end: 4193277 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cayenne", start: 4193277, end: 4193475 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cayman", start: 4193475, end: 4193657 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Chicago", start: 4193657, end: 4197249 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Chihuahua", start: 4197249, end: 4198351 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ciudad_Juarez", start: 4198351, end: 4199889 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Coral_Harbour", start: 4199889, end: 4200071 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cordoba", start: 4200071, end: 4201147 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Costa_Rica", start: 4201147, end: 4201463 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Coyhaique", start: 4201463, end: 4203603 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Creston", start: 4203603, end: 4203963 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cuiaba", start: 4203963, end: 4205379 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Curacao", start: 4205379, end: 4205625 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Danmarkshavn", start: 4205625, end: 4206323 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dawson", start: 4206323, end: 4207937 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dawson_Creek", start: 4207937, end: 4208987 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Denver", start: 4208987, end: 4211447 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Detroit", start: 4211447, end: 4213677 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dominica", start: 4213677, end: 4213923 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Edmonton", start: 4213923, end: 4216255 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Eirunepe", start: 4216255, end: 4216911 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/El_Salvador", start: 4216911, end: 4217135 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ensenada", start: 4217135, end: 4219593 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fort_Nelson", start: 4219593, end: 4221833 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fort_Wayne", start: 4221833, end: 4223515 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fortaleza", start: 4223515, end: 4224231 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Glace_Bay", start: 4224231, end: 4226423 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Godthab", start: 4226423, end: 4228326 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Goose_Bay", start: 4228326, end: 4231536 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Grand_Turk", start: 4231536, end: 4233370 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Grenada", start: 4233370, end: 4233616 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guadeloupe", start: 4233616, end: 4233862 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guatemala", start: 4233862, end: 4234142 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guayaquil", start: 4234142, end: 4234388 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guyana", start: 4234388, end: 4234650 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Halifax", start: 4234650, end: 4238074 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Havana", start: 4238074, end: 4240490 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Hermosillo", start: 4240490, end: 4240878 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Indianapolis", start: 4240878, end: 4242560 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Knox", start: 4242560, end: 4245004 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Marengo", start: 4245004, end: 4246742 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Petersburg", start: 4246742, end: 4248662 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Tell_City", start: 4248662, end: 4250362 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Vevay", start: 4250362, end: 4251792 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Vincennes", start: 4251792, end: 4253502 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Winamac", start: 4253502, end: 4255296 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indianapolis", start: 4255296, end: 4256978 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Inuvik", start: 4256978, end: 4259052 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Iqaluit", start: 4259052, end: 4261254 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Jamaica", start: 4261254, end: 4261736 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Jujuy", start: 4261736, end: 4262784 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Juneau", start: 4262784, end: 4265137 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kentucky/Louisville", start: 4265137, end: 4267925 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kentucky/Monticello", start: 4267925, end: 4270293 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Knox_IN", start: 4270293, end: 4272737 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kralendijk", start: 4272737, end: 4272983 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/La_Paz", start: 4272983, end: 4273215 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Lima", start: 4273215, end: 4273621 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Los_Angeles", start: 4273621, end: 4276473 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Louisville", start: 4276473, end: 4279261 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Lower_Princes", start: 4279261, end: 4279507 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Maceio", start: 4279507, end: 4280251 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Managua", start: 4280251, end: 4280681 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Manaus", start: 4280681, end: 4281285 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Marigot", start: 4281285, end: 4281531 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Martinique", start: 4281531, end: 4281763 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Matamoros", start: 4281763, end: 4283181 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mazatlan", start: 4283181, end: 4284241 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mendoza", start: 4284241, end: 4285317 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Menominee", start: 4285317, end: 4287591 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Merida", start: 4287591, end: 4288595 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Metlakatla", start: 4288595, end: 4290018 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mexico_City", start: 4290018, end: 4291240 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Miquelon", start: 4291240, end: 4292906 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Moncton", start: 4292906, end: 4296060 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Monterrey", start: 4296060, end: 4297174 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montevideo", start: 4297174, end: 4298684 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montreal", start: 4298684, end: 4302178 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montserrat", start: 4302178, end: 4302424 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nassau", start: 4302424, end: 4305918 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/New_York", start: 4305918, end: 4309470 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nipigon", start: 4309470, end: 4312964 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nome", start: 4312964, end: 4315331 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Noronha", start: 4315331, end: 4316047 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/Beulah", start: 4316047, end: 4318443 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/Center", start: 4318443, end: 4320839 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/New_Salem", start: 4320839, end: 4323235 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nuuk", start: 4323235, end: 4325138 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ojinaga", start: 4325138, end: 4326662 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Panama", start: 4326662, end: 4326844 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Pangnirtung", start: 4326844, end: 4329046 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Paramaribo", start: 4329046, end: 4329308 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Phoenix", start: 4329308, end: 4329668 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Port-au-Prince", start: 4329668, end: 4331102 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Port_of_Spain", start: 4331102, end: 4331348 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Porto_Acre", start: 4331348, end: 4331976 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Porto_Velho", start: 4331976, end: 4332552 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Puerto_Rico", start: 4332552, end: 4332798 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Punta_Arenas", start: 4332798, end: 4334714 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rainy_River", start: 4334714, end: 4337582 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rankin_Inlet", start: 4337582, end: 4339648 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Recife", start: 4339648, end: 4340364 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Regina", start: 4340364, end: 4341344 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Resolute", start: 4341344, end: 4343410 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rio_Branco", start: 4343410, end: 4344038 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rosario", start: 4344038, end: 4345114 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santa_Isabel", start: 4345114, end: 4347572 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santarem", start: 4347572, end: 4348174 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santiago", start: 4348174, end: 4350703 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santo_Domingo", start: 4350703, end: 4351161 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Sao_Paulo", start: 4351161, end: 4352605 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Scoresbysund", start: 4352605, end: 4354554 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Shiprock", start: 4354554, end: 4357014 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Sitka", start: 4357014, end: 4359343 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Barthelemy", start: 4359343, end: 4359589 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Johns", start: 4359589, end: 4363244 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Kitts", start: 4363244, end: 4363490 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Lucia", start: 4363490, end: 4363736 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Thomas", start: 4363736, end: 4363982 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Vincent", start: 4363982, end: 4364228 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Swift_Current", start: 4364228, end: 4364788 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tegucigalpa", start: 4364788, end: 4365040 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Thule", start: 4365040, end: 4366542 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Thunder_Bay", start: 4366542, end: 4370036 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tijuana", start: 4370036, end: 4372494 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Toronto", start: 4372494, end: 4375988 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tortola", start: 4375988, end: 4376234 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Vancouver", start: 4376234, end: 4379126 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Virgin", start: 4379126, end: 4379372 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Whitehorse", start: 4379372, end: 4380986 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Winnipeg", start: 4380986, end: 4383854 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Yakutat", start: 4383854, end: 4386159 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Yellowknife", start: 4386159, end: 4388491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Casey", start: 4388491, end: 4388928 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Davis", start: 4388928, end: 4389225 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/DumontDUrville", start: 4389225, end: 4389411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Macquarie", start: 4389411, end: 4391671 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Mawson", start: 4391671, end: 4391870 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/McMurdo", start: 4391870, end: 4394307 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Palmer", start: 4394307, end: 4395725 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Rothera", start: 4395725, end: 4395889 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/South_Pole", start: 4395889, end: 4398326 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Syowa", start: 4398326, end: 4398491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Troll", start: 4398491, end: 4399653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Vostok", start: 4399653, end: 4399880 }, { filename: "/tmp/pglite/share/postgresql/timezone/Arctic/Longyearbyen", start: 4399880, end: 4402178 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aden", start: 4402178, end: 4402343 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Almaty", start: 4402343, end: 4403340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Amman", start: 4403340, end: 4404787 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Anadyr", start: 4404787, end: 4405975 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aqtau", start: 4405975, end: 4406958 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aqtobe", start: 4406958, end: 4407969 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ashgabat", start: 4407969, end: 4408588 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ashkhabad", start: 4408588, end: 4409207 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Atyrau", start: 4409207, end: 4410198 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Baghdad", start: 4410198, end: 4411181 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bahrain", start: 4411181, end: 4411380 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Baku", start: 4411380, end: 4412607 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bangkok", start: 4412607, end: 4412806 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Barnaul", start: 4412806, end: 4414027 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Beirut", start: 4414027, end: 4416181 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bishkek", start: 4416181, end: 4417164 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Brunei", start: 4417164, end: 4417647 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Calcutta", start: 4417647, end: 4417932 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chita", start: 4417932, end: 4419153 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Choibalsan", start: 4419153, end: 4420044 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chongqing", start: 4420044, end: 4420605 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chungking", start: 4420605, end: 4421166 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Colombo", start: 4421166, end: 4421538 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dacca", start: 4421538, end: 4421875 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Damascus", start: 4421875, end: 4423762 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dhaka", start: 4423762, end: 4424099 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dili", start: 4424099, end: 4424370 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dubai", start: 4424370, end: 4424535 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dushanbe", start: 4424535, end: 4425126 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Famagusta", start: 4425126, end: 4427154 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Gaza", start: 4427154, end: 4430998 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Harbin", start: 4430998, end: 4431559 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hebron", start: 4431559, end: 4435431 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ho_Chi_Minh", start: 4435431, end: 4435782 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hong_Kong", start: 4435782, end: 4437015 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hovd", start: 4437015, end: 4437906 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Irkutsk", start: 4437906, end: 4439149 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Istanbul", start: 4439149, end: 4441096 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jakarta", start: 4441096, end: 4441479 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jayapura", start: 4441479, end: 4441700 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jerusalem", start: 4441700, end: 4444088 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kabul", start: 4444088, end: 4444296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kamchatka", start: 4444296, end: 4445462 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Karachi", start: 4445462, end: 4445841 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kashgar", start: 4445841, end: 4446006 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kathmandu", start: 4446006, end: 4446218 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Katmandu", start: 4446218, end: 4446430 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Khandyga", start: 4446430, end: 4447701 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kolkata", start: 4447701, end: 4447986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Krasnoyarsk", start: 4447986, end: 4449193 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuala_Lumpur", start: 4449193, end: 4449608 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuching", start: 4449608, end: 4450091 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuwait", start: 4450091, end: 4450256 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Macao", start: 4450256, end: 4451483 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Macau", start: 4451483, end: 4452710 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Magadan", start: 4452710, end: 4453932 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Makassar", start: 4453932, end: 4454186 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Manila", start: 4454186, end: 4454608 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Muscat", start: 4454608, end: 4454773 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Nicosia", start: 4454773, end: 4456775 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Novokuznetsk", start: 4456775, end: 4457940 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Novosibirsk", start: 4457940, end: 4459161 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Omsk", start: 4459161, end: 4460368 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Oral", start: 4460368, end: 4461373 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Phnom_Penh", start: 4461373, end: 4461572 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Pontianak", start: 4461572, end: 4461925 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Pyongyang", start: 4461925, end: 4462162 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qatar", start: 4462162, end: 4462361 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qostanay", start: 4462361, end: 4463400 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qyzylorda", start: 4463400, end: 4464425 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Rangoon", start: 4464425, end: 4464693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Riyadh", start: 4464693, end: 4464858 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Saigon", start: 4464858, end: 4465209 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Sakhalin", start: 4465209, end: 4466411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Samarkand", start: 4466411, end: 4466988 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Seoul", start: 4466988, end: 4467605 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Shanghai", start: 4467605, end: 4468166 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Singapore", start: 4468166, end: 4468581 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Srednekolymsk", start: 4468581, end: 4469789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Taipei", start: 4469789, end: 4470550 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tashkent", start: 4470550, end: 4471141 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tbilisi", start: 4471141, end: 4472176 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tehran", start: 4472176, end: 4473438 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tel_Aviv", start: 4473438, end: 4475826 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Thimbu", start: 4475826, end: 4476029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Thimphu", start: 4476029, end: 4476232 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tokyo", start: 4476232, end: 4476541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tomsk", start: 4476541, end: 4477762 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ujung_Pandang", start: 4477762, end: 4478016 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ulaanbaatar", start: 4478016, end: 4478907 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ulan_Bator", start: 4478907, end: 4479798 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Urumqi", start: 4479798, end: 4479963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ust-Nera", start: 4479963, end: 4481215 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Vientiane", start: 4481215, end: 4481414 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Vladivostok", start: 4481414, end: 4482622 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yakutsk", start: 4482622, end: 4483829 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yangon", start: 4483829, end: 4484097 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yekaterinburg", start: 4484097, end: 4485340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yerevan", start: 4485340, end: 4486491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Azores", start: 4486491, end: 4489947 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Bermuda", start: 4489947, end: 4492343 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Canary", start: 4492343, end: 4494240 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Cape_Verde", start: 4494240, end: 4494510 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Faeroe", start: 4494510, end: 4496325 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Faroe", start: 4496325, end: 4498140 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Jan_Mayen", start: 4498140, end: 4500438 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Madeira", start: 4500438, end: 4503815 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Reykjavik", start: 4503815, end: 4503963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/South_Georgia", start: 4503963, end: 4504127 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/St_Helena", start: 4504127, end: 4504275 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Stanley", start: 4504275, end: 4505489 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/ACT", start: 4505489, end: 4507679 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Adelaide", start: 4507679, end: 4509887 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Brisbane", start: 4509887, end: 4510306 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Broken_Hill", start: 4510306, end: 4512535 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Canberra", start: 4512535, end: 4514725 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Currie", start: 4514725, end: 4517083 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Darwin", start: 4517083, end: 4517408 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Eucla", start: 4517408, end: 4517878 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Hobart", start: 4517878, end: 4520236 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/LHI", start: 4520236, end: 4522096 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Lindeman", start: 4522096, end: 4522571 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Lord_Howe", start: 4522571, end: 4524431 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Melbourne", start: 4524431, end: 4526621 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/NSW", start: 4526621, end: 4528811 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/North", start: 4528811, end: 4529136 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Perth", start: 4529136, end: 4529582 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Queensland", start: 4529582, end: 4530001 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/South", start: 4530001, end: 4532209 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Sydney", start: 4532209, end: 4534399 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Tasmania", start: 4534399, end: 4536757 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Victoria", start: 4536757, end: 4538947 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/West", start: 4538947, end: 4539393 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Yancowinna", start: 4539393, end: 4541622 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/Acre", start: 4541622, end: 4542250 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/DeNoronha", start: 4542250, end: 4542966 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/East", start: 4542966, end: 4544410 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/West", start: 4544410, end: 4545014 }, { filename: "/tmp/pglite/share/postgresql/timezone/CET", start: 4545014, end: 4547947 }, { filename: "/tmp/pglite/share/postgresql/timezone/CST6CDT", start: 4547947, end: 4551539 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Atlantic", start: 4551539, end: 4554963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Central", start: 4554963, end: 4557831 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Eastern", start: 4557831, end: 4561325 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Mountain", start: 4561325, end: 4563657 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Newfoundland", start: 4563657, end: 4567312 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Pacific", start: 4567312, end: 4570204 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Saskatchewan", start: 4570204, end: 4571184 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Yukon", start: 4571184, end: 4572798 }, { filename: "/tmp/pglite/share/postgresql/timezone/Chile/Continental", start: 4572798, end: 4575327 }, { filename: "/tmp/pglite/share/postgresql/timezone/Chile/EasterIsland", start: 4575327, end: 4577560 }, { filename: "/tmp/pglite/share/postgresql/timezone/Cuba", start: 4577560, end: 4579976 }, { filename: "/tmp/pglite/share/postgresql/timezone/EET", start: 4579976, end: 4582238 }, { filename: "/tmp/pglite/share/postgresql/timezone/EST", start: 4582238, end: 4582420 }, { filename: "/tmp/pglite/share/postgresql/timezone/EST5EDT", start: 4582420, end: 4585972 }, { filename: "/tmp/pglite/share/postgresql/timezone/Egypt", start: 4585972, end: 4588371 }, { filename: "/tmp/pglite/share/postgresql/timezone/Eire", start: 4588371, end: 4591863 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT", start: 4591863, end: 4591977 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+0", start: 4591977, end: 4592091 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+1", start: 4592091, end: 4592207 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+10", start: 4592207, end: 4592324 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+11", start: 4592324, end: 4592441 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+12", start: 4592441, end: 4592558 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+2", start: 4592558, end: 4592674 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+3", start: 4592674, end: 4592790 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+4", start: 4592790, end: 4592906 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+5", start: 4592906, end: 4593022 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+6", start: 4593022, end: 4593138 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+7", start: 4593138, end: 4593254 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+8", start: 4593254, end: 4593370 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+9", start: 4593370, end: 4593486 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-0", start: 4593486, end: 4593600 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-1", start: 4593600, end: 4593717 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-10", start: 4593717, end: 4593835 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-11", start: 4593835, end: 4593953 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-12", start: 4593953, end: 4594071 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-13", start: 4594071, end: 4594189 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-14", start: 4594189, end: 4594307 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-2", start: 4594307, end: 4594424 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-3", start: 4594424, end: 4594541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-4", start: 4594541, end: 4594658 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-5", start: 4594658, end: 4594775 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-6", start: 4594775, end: 4594892 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-7", start: 4594892, end: 4595009 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-8", start: 4595009, end: 4595126 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-9", start: 4595126, end: 4595243 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT0", start: 4595243, end: 4595357 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Greenwich", start: 4595357, end: 4595471 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/UCT", start: 4595471, end: 4595585 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/UTC", start: 4595585, end: 4595699 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Universal", start: 4595699, end: 4595813 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Zulu", start: 4595813, end: 4595927 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Amsterdam", start: 4595927, end: 4598860 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Andorra", start: 4598860, end: 4600602 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Astrakhan", start: 4600602, end: 4601767 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Athens", start: 4601767, end: 4604029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Belfast", start: 4604029, end: 4607693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Belgrade", start: 4607693, end: 4609613 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Berlin", start: 4609613, end: 4611911 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Bratislava", start: 4611911, end: 4614212 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Brussels", start: 4614212, end: 4617145 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Bucharest", start: 4617145, end: 4619329 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Budapest", start: 4619329, end: 4621697 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Busingen", start: 4621697, end: 4623606 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Chisinau", start: 4623606, end: 4625996 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Copenhagen", start: 4625996, end: 4628294 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Dublin", start: 4628294, end: 4631786 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Gibraltar", start: 4631786, end: 4634854 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Guernsey", start: 4634854, end: 4638518 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Helsinki", start: 4638518, end: 4640418 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Isle_of_Man", start: 4640418, end: 4644082 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Istanbul", start: 4644082, end: 4646029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Jersey", start: 4646029, end: 4649693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kaliningrad", start: 4649693, end: 4651186 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kiev", start: 4651186, end: 4653306 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kirov", start: 4653306, end: 4654491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kyiv", start: 4654491, end: 4656611 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Lisbon", start: 4656611, end: 4660138 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Ljubljana", start: 4660138, end: 4662058 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/London", start: 4662058, end: 4665722 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Luxembourg", start: 4665722, end: 4668655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Madrid", start: 4668655, end: 4671269 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Malta", start: 4671269, end: 4673889 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Mariehamn", start: 4673889, end: 4675789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Minsk", start: 4675789, end: 4677110 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Monaco", start: 4677110, end: 4680072 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Moscow", start: 4680072, end: 4681607 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Nicosia", start: 4681607, end: 4683609 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Oslo", start: 4683609, end: 4685907 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Paris", start: 4685907, end: 4688869 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Podgorica", start: 4688869, end: 4690789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Prague", start: 4690789, end: 4693090 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Riga", start: 4693090, end: 4695288 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Rome", start: 4695288, end: 4697929 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Samara", start: 4697929, end: 4699144 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/San_Marino", start: 4699144, end: 4701785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Sarajevo", start: 4701785, end: 4703705 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Saratov", start: 4703705, end: 4704888 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Simferopol", start: 4704888, end: 4706357 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Skopje", start: 4706357, end: 4708277 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Sofia", start: 4708277, end: 4710354 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Stockholm", start: 4710354, end: 4712652 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tallinn", start: 4712652, end: 4714800 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tirane", start: 4714800, end: 4716884 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tiraspol", start: 4716884, end: 4719274 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Ulyanovsk", start: 4719274, end: 4720541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Uzhgorod", start: 4720541, end: 4722661 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vaduz", start: 4722661, end: 4724570 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vatican", start: 4724570, end: 4727211 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vienna", start: 4727211, end: 4729411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vilnius", start: 4729411, end: 4731573 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Volgograd", start: 4731573, end: 4732766 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Warsaw", start: 4732766, end: 4735420 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zagreb", start: 4735420, end: 4737340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zaporozhye", start: 4737340, end: 4739460 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zurich", start: 4739460, end: 4741369 }, { filename: "/tmp/pglite/share/postgresql/timezone/Factory", start: 4741369, end: 4741485 }, { filename: "/tmp/pglite/share/postgresql/timezone/GB", start: 4741485, end: 4745149 }, { filename: "/tmp/pglite/share/postgresql/timezone/GB-Eire", start: 4745149, end: 4748813 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT", start: 4748813, end: 4748927 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT+0", start: 4748927, end: 4749041 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT-0", start: 4749041, end: 4749155 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT0", start: 4749155, end: 4749269 }, { filename: "/tmp/pglite/share/postgresql/timezone/Greenwich", start: 4749269, end: 4749383 }, { filename: "/tmp/pglite/share/postgresql/timezone/HST", start: 4749383, end: 4749712 }, { filename: "/tmp/pglite/share/postgresql/timezone/Hongkong", start: 4749712, end: 4750945 }, { filename: "/tmp/pglite/share/postgresql/timezone/Iceland", start: 4750945, end: 4751093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Antananarivo", start: 4751093, end: 4751358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Chagos", start: 4751358, end: 4751557 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Christmas", start: 4751557, end: 4751756 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Cocos", start: 4751756, end: 4752024 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Comoro", start: 4752024, end: 4752289 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Kerguelen", start: 4752289, end: 4752488 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mahe", start: 4752488, end: 4752653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Maldives", start: 4752653, end: 4752852 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mauritius", start: 4752852, end: 4753093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mayotte", start: 4753093, end: 4753358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Reunion", start: 4753358, end: 4753523 }, { filename: "/tmp/pglite/share/postgresql/timezone/Iran", start: 4753523, end: 4754785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Israel", start: 4754785, end: 4757173 }, { filename: "/tmp/pglite/share/postgresql/timezone/Jamaica", start: 4757173, end: 4757655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Japan", start: 4757655, end: 4757964 }, { filename: "/tmp/pglite/share/postgresql/timezone/Kwajalein", start: 4757964, end: 4758280 }, { filename: "/tmp/pglite/share/postgresql/timezone/Libya", start: 4758280, end: 4758905 }, { filename: "/tmp/pglite/share/postgresql/timezone/MET", start: 4758905, end: 4761838 }, { filename: "/tmp/pglite/share/postgresql/timezone/MST", start: 4761838, end: 4762198 }, { filename: "/tmp/pglite/share/postgresql/timezone/MST7MDT", start: 4762198, end: 4764658 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/BajaNorte", start: 4764658, end: 4767116 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/BajaSur", start: 4767116, end: 4768176 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/General", start: 4768176, end: 4769398 }, { filename: "/tmp/pglite/share/postgresql/timezone/NZ", start: 4769398, end: 4771835 }, { filename: "/tmp/pglite/share/postgresql/timezone/NZ-CHAT", start: 4771835, end: 4773903 }, { filename: "/tmp/pglite/share/postgresql/timezone/Navajo", start: 4773903, end: 4776363 }, { filename: "/tmp/pglite/share/postgresql/timezone/PRC", start: 4776363, end: 4776924 }, { filename: "/tmp/pglite/share/postgresql/timezone/PST8PDT", start: 4776924, end: 4779776 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Apia", start: 4779776, end: 4780388 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Auckland", start: 4780388, end: 4782825 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Bougainville", start: 4782825, end: 4783093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Chatham", start: 4783093, end: 4785161 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Chuuk", start: 4785161, end: 4785347 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Easter", start: 4785347, end: 4787580 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Efate", start: 4787580, end: 4788118 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Enderbury", start: 4788118, end: 4788352 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Fakaofo", start: 4788352, end: 4788552 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Fiji", start: 4788552, end: 4789130 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Funafuti", start: 4789130, end: 4789296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Galapagos", start: 4789296, end: 4789534 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Gambier", start: 4789534, end: 4789698 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Guadalcanal", start: 4789698, end: 4789864 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Guam", start: 4789864, end: 4790358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Honolulu", start: 4790358, end: 4790687 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Johnston", start: 4790687, end: 4791016 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kanton", start: 4791016, end: 4791250 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kiritimati", start: 4791250, end: 4791488 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kosrae", start: 4791488, end: 4791839 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kwajalein", start: 4791839, end: 4792155 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Majuro", start: 4792155, end: 4792321 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Marquesas", start: 4792321, end: 4792494 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Midway", start: 4792494, end: 4792669 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Nauru", start: 4792669, end: 4792921 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Niue", start: 4792921, end: 4793124 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Norfolk", start: 4793124, end: 4794004 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Noumea", start: 4794004, end: 4794308 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pago_Pago", start: 4794308, end: 4794483 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Palau", start: 4794483, end: 4794663 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pitcairn", start: 4794663, end: 4794865 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pohnpei", start: 4794865, end: 4795031 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Ponape", start: 4795031, end: 4795197 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Port_Moresby", start: 4795197, end: 4795383 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Rarotonga", start: 4795383, end: 4795986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Saipan", start: 4795986, end: 4796480 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Samoa", start: 4796480, end: 4796655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tahiti", start: 4796655, end: 4796820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tarawa", start: 4796820, end: 4796986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tongatapu", start: 4796986, end: 4797358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Truk", start: 4797358, end: 4797544 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Wake", start: 4797544, end: 4797710 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Wallis", start: 4797710, end: 4797876 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Yap", start: 4797876, end: 4798062 }, { filename: "/tmp/pglite/share/postgresql/timezone/Poland", start: 4798062, end: 4800716 }, { filename: "/tmp/pglite/share/postgresql/timezone/Portugal", start: 4800716, end: 4804243 }, { filename: "/tmp/pglite/share/postgresql/timezone/ROC", start: 4804243, end: 4805004 }, { filename: "/tmp/pglite/share/postgresql/timezone/ROK", start: 4805004, end: 4805621 }, { filename: "/tmp/pglite/share/postgresql/timezone/Singapore", start: 4805621, end: 4806036 }, { filename: "/tmp/pglite/share/postgresql/timezone/Turkey", start: 4806036, end: 4807983 }, { filename: "/tmp/pglite/share/postgresql/timezone/UCT", start: 4807983, end: 4808097 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Alaska", start: 4808097, end: 4810468 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Aleutian", start: 4810468, end: 4812824 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Arizona", start: 4812824, end: 4813184 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Central", start: 4813184, end: 4816776 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/East-Indiana", start: 4816776, end: 4818458 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Eastern", start: 4818458, end: 4822010 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Hawaii", start: 4822010, end: 4822339 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Indiana-Starke", start: 4822339, end: 4824783 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Michigan", start: 4824783, end: 4827013 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Mountain", start: 4827013, end: 4829473 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Pacific", start: 4829473, end: 4832325 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Samoa", start: 4832325, end: 4832500 }, { filename: "/tmp/pglite/share/postgresql/timezone/UTC", start: 4832500, end: 4832614 }, { filename: "/tmp/pglite/share/postgresql/timezone/Universal", start: 4832614, end: 4832728 }, { filename: "/tmp/pglite/share/postgresql/timezone/W-SU", start: 4832728, end: 4834263 }, { filename: "/tmp/pglite/share/postgresql/timezone/WET", start: 4834263, end: 4837790 }, { filename: "/tmp/pglite/share/postgresql/timezone/Zulu", start: 4837790, end: 4837904 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Africa.txt", start: 4837904, end: 4844877 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/America.txt", start: 4844877, end: 4855884 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Antarctica.txt", start: 4855884, end: 4857018 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Asia.txt", start: 4857018, end: 4865329 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Atlantic.txt", start: 4865329, end: 4868862 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Australia", start: 4868862, end: 4869997 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Australia.txt", start: 4869997, end: 4873381 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Default", start: 4873381, end: 4900595 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Etc.txt", start: 4900595, end: 4901845 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Europe.txt", start: 4901845, end: 4910591 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/India", start: 4910591, end: 4911184 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Indian.txt", start: 4911184, end: 4912445 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Pacific.txt", start: 4912445, end: 4916213 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/danish.stop", start: 4916213, end: 4916637 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/dutch.stop", start: 4916637, end: 4917090 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/english.stop", start: 4917090, end: 4917712 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/finnish.stop", start: 4917712, end: 4919291 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/french.stop", start: 4919291, end: 4920096 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/german.stop", start: 4920096, end: 4921445 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hungarian.stop", start: 4921445, end: 4922672 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample.affix", start: 4922672, end: 4922915 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_long.affix", start: 4922915, end: 4923548 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_long.dict", start: 4923548, end: 4923646 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_num.affix", start: 4923646, end: 4924108 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_num.dict", start: 4924108, end: 4924237 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/ispell_sample.affix", start: 4924237, end: 4924702 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/ispell_sample.dict", start: 4924702, end: 4924783 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/italian.stop", start: 4924783, end: 4926437 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/nepali.stop", start: 4926437, end: 4930698 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/norwegian.stop", start: 4930698, end: 4931549 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/portuguese.stop", start: 4931549, end: 4932816 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/russian.stop", start: 4932816, end: 4934051 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/spanish.stop", start: 4934051, end: 4936229 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/swedish.stop", start: 4936229, end: 4936788 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/synonym_sample.syn", start: 4936788, end: 4936861 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/thesaurus_sample.ths", start: 4936861, end: 4937334 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/turkish.stop", start: 4937334, end: 4937594 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/unaccent.rules", start: 4937594, end: 4947597 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/xsyn_sample.rules", start: 4947597, end: 4947736 }], remote_package_size: 4947736 });
    })();
    var moduleOverrides = Object.assign({}, Module), arguments_ = [], thisProgram = "./this.program", quit_ = (e, t2) => {
      throw t2;
    }, scriptDirectory = "";
    function locateFile(e) {
      return Module.locateFile ? Module.locateFile(e, scriptDirectory) : scriptDirectory + e;
    }
    var readAsync, readBinary;
    if (ENVIRONMENT_IS_NODE) {
      var fs = require("fs"), nodePath = require("path");
      import.meta.url.startsWith("data:") || (scriptDirectory = nodePath.dirname(require("url").fileURLToPath(import.meta.url)) + "/"), readBinary = (e) => {
        e = isFileURI(e) ? new URL(e) : e;
        var t2 = fs.readFileSync(e);
        return t2;
      }, readAsync = async (e, t2 = true) => {
        e = isFileURI(e) ? new URL(e) : e;
        var r = fs.readFileSync(e, t2 ? void 0 : "utf8");
        return r;
      }, !Module.thisProgram && process.argv.length > 1 && (thisProgram = process.argv[1].replace(/\\/g, "/")), arguments_ = process.argv.slice(2), quit_ = (e, t2) => {
        throw process.exitCode = e, t2;
      };
    } else (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && (ENVIRONMENT_IS_WORKER ? scriptDirectory = self.location.href : typeof document < "u" && document.currentScript && (scriptDirectory = document.currentScript.src), _scriptName && (scriptDirectory = _scriptName), scriptDirectory.startsWith("blob:") ? scriptDirectory = "" : scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1), readAsync = async (e) => {
      var t2 = await fetch(e, { credentials: "same-origin" });
      if (t2.ok) return t2.arrayBuffer();
      throw new Error(t2.status + " : " + t2.url);
    });
    var out = Module.print || console.log.bind(console), err = Module.printErr || console.error.bind(console);
    Object.assign(Module, moduleOverrides), moduleOverrides = null, Module.arguments && (arguments_ = Module.arguments), Module.thisProgram && (thisProgram = Module.thisProgram);
    var dynamicLibraries = Module.dynamicLibraries || [], wasmBinary = Module.wasmBinary;
    function intArrayFromBase64(e) {
      if (typeof ENVIRONMENT_IS_NODE < "u" && ENVIRONMENT_IS_NODE) {
        var t2 = Buffer.from(e, "base64");
        return new Uint8Array(t2.buffer, t2.byteOffset, t2.length);
      }
      for (var r = atob(e), a = new Uint8Array(r.length), o3 = 0; o3 < r.length; ++o3) a[o3] = r.charCodeAt(o3);
      return a;
    }
    var wasmMemory, ABORT = false, EXITSTATUS;
    function assert(e, t2) {
      e || abort(t2);
    }
    var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
    function updateMemoryViews() {
      var e = wasmMemory.buffer;
      Module.HEAP8 = HEAP8 = new Int8Array(e), Module.HEAP16 = HEAP16 = new Int16Array(e), Module.HEAPU8 = HEAPU8 = new Uint8Array(e), Module.HEAPU16 = HEAPU16 = new Uint16Array(e), Module.HEAP32 = HEAP32 = new Int32Array(e), Module.HEAPU32 = HEAPU32 = new Uint32Array(e), Module.HEAPF32 = HEAPF32 = new Float32Array(e), Module.HEAPF64 = HEAPF64 = new Float64Array(e), Module.HEAP64 = HEAP64 = new BigInt64Array(e), Module.HEAPU64 = HEAPU64 = new BigUint64Array(e);
    }
    if (Module.wasmMemory) wasmMemory = Module.wasmMemory;
    else {
      var INITIAL_MEMORY = Module.INITIAL_MEMORY || 16777216;
      wasmMemory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: 32768 });
    }
    updateMemoryViews();
    var __ATPRERUN__ = [], __ATINIT__ = [], __ATMAIN__ = [], __ATPOSTRUN__ = [], __RELOC_FUNCS__ = [], runtimeInitialized = false;
    function preRun() {
      if (Module.preRun) for (typeof Module.preRun == "function" && (Module.preRun = [Module.preRun]); Module.preRun.length; ) addOnPreRun(Module.preRun.shift());
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true, callRuntimeCallbacks(__RELOC_FUNCS__), !Module.noFSInit && !FS.initialized && FS.init(), FS.ignorePermissions = false, TTY.init(), SOCKFS.root = FS.mount(SOCKFS, {}, null), PIPEFS.root = FS.mount(PIPEFS, {}, null), callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
      callRuntimeCallbacks(__ATMAIN__);
    }
    function postRun() {
      if (Module.postRun) for (typeof Module.postRun == "function" && (Module.postRun = [Module.postRun]); Module.postRun.length; ) addOnPostRun(Module.postRun.shift());
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(e) {
      __ATPRERUN__.unshift(e);
    }
    function addOnInit(e) {
      __ATINIT__.unshift(e);
    }
    function addOnPostRun(e) {
      __ATPOSTRUN__.unshift(e);
    }
    var runDependencies = 0, dependenciesFulfilled = null;
    function getUniqueRunDependency(e) {
      return e;
    }
    function addRunDependency(e) {
      runDependencies++, Module.monitorRunDependencies?.(runDependencies);
    }
    function removeRunDependency(e) {
      if (runDependencies--, Module.monitorRunDependencies?.(runDependencies), runDependencies == 0 && dependenciesFulfilled) {
        var t2 = dependenciesFulfilled;
        dependenciesFulfilled = null, t2();
      }
    }
    function abort(e) {
      Module.onAbort?.(e), e = "Aborted(" + e + ")", err(e), ABORT = true, e += ". Build with -sASSERTIONS for more info.";
      var t2 = new WebAssembly.RuntimeError(e);
      throw readyPromiseReject(t2), t2;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,", isDataURI = (e) => e.startsWith(dataURIPrefix), isFileURI = (e) => e.startsWith("file://");
    function findWasmBinary() {
      if (Module.locateFile) {
        var e = "pglite.wasm";
        return isDataURI(e) ? e : locateFile(e);
      }
      return new URL("pglite.wasm", import.meta.url).href;
    }
    var wasmBinaryFile;
    function getBinarySync(e) {
      if (e == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
      if (readBinary) return readBinary(e);
      throw "both async and sync fetching of the wasm failed";
    }
    async function getWasmBinary(e) {
      if (!wasmBinary) try {
        var t2 = await readAsync(e);
        return new Uint8Array(t2);
      } catch {
      }
      return getBinarySync(e);
    }
    async function instantiateArrayBuffer(e, t2) {
      try {
        var r = await getWasmBinary(e), a = await WebAssembly.instantiate(r, t2);
        return a;
      } catch (o3) {
        err(`failed to asynchronously prepare wasm: ${o3}`), abort(o3);
      }
    }
    async function instantiateAsync(e, t2, r) {
      if (!e && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(t2) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") try {
        var a = fetch(t2, { credentials: "same-origin" }), o3 = await WebAssembly.instantiateStreaming(a, r);
        return o3;
      } catch (s2) {
        err(`wasm streaming compile failed: ${s2}`), err("falling back to ArrayBuffer instantiation");
      }
      return instantiateArrayBuffer(t2, r);
    }
    function getWasmImports() {
      return { env: wasmImports, wasi_snapshot_preview1: wasmImports, "GOT.mem": new Proxy(wasmImports, GOTHandler), "GOT.func": new Proxy(wasmImports, GOTHandler) };
    }
    async function createWasm() {
      function e(o3, s2) {
        wasmExports = o3.exports, wasmExports = relocateExports(wasmExports, 12582912);
        var l2 = getDylinkMetadata(s2);
        return l2.neededDynlibs && (dynamicLibraries = l2.neededDynlibs.concat(dynamicLibraries)), mergeLibSymbols(wasmExports, "main"), LDSO.init(), loadDylibs(), addOnInit(wasmExports.__wasm_call_ctors), __RELOC_FUNCS__.push(wasmExports.__wasm_apply_data_relocs), removeRunDependency("wasm-instantiate"), wasmExports;
      }
      addRunDependency("wasm-instantiate");
      function t2(o3) {
        e(o3.instance, o3.module);
      }
      var r = getWasmImports();
      if (Module.instantiateWasm) try {
        return Module.instantiateWasm(r, e);
      } catch (o3) {
        err(`Module.instantiateWasm callback failed with error: ${o3}`), readyPromiseReject(o3);
      }
      wasmBinaryFile ?? (wasmBinaryFile = findWasmBinary());
      try {
        var a = await instantiateAsync(wasmBinary, wasmBinaryFile, r);
        return t2(a), a;
      } catch (o3) {
        readyPromiseReject(o3);
        return;
      }
    }
    var ASM_CONSTS = { 15165628: (e) => {
      Module.is_worker = typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope, Module.FD_BUFFER_MAX = e, Module.emscripten_copy_to = console.warn;
    }, 15165800: () => {
      Module.postMessage = function(t2) {
        console.log("# pg_main_emsdk.c:544: onCustomMessage:", t2);
      };
    }, 15165929: () => {
      if (Module.is_worker) {
        let t2 = function(r) {
          console.log("onCustomMessage:", r);
        };
        var e = t2;
        Module.onCustomMessage = t2;
      } else Module.postMessage = function(r) {
        switch (r.type) {
          case "raw":
            break;
          case "stdin": {
            stringToUTF8(r.data, 1, Module.FD_BUFFER_MAX);
            break;
          }
          case "rcon":
            break;
          default:
            console.warn("custom_postMessage?", r);
        }
      };
    } };
    class ExitStatus {
      constructor(t2) {
        P(this, "name", "ExitStatus");
        this.message = `Program terminated with exit(${t2})`, this.status = t2;
      }
    }
    var GOT = {}, currentModuleWeakSymbols = /* @__PURE__ */ new Set([]), GOTHandler = { get(e, t2) {
      var r = GOT[t2];
      return r || (r = GOT[t2] = new WebAssembly.Global({ value: "i32", mutable: true })), currentModuleWeakSymbols.has(t2) || (r.required = true), r;
    } }, callRuntimeCallbacks = (e) => {
      for (; e.length > 0; ) e.shift()(Module);
    }, UTF8Decoder = typeof TextDecoder < "u" ? new TextDecoder() : void 0, UTF8ArrayToString = (e, t2 = 0, r = NaN) => {
      for (var a = t2 + r, o3 = t2; e[o3] && !(o3 >= a); ) ++o3;
      if (o3 - t2 > 16 && e.buffer && UTF8Decoder) return UTF8Decoder.decode(e.subarray(t2, o3));
      for (var s2 = ""; t2 < o3; ) {
        var l2 = e[t2++];
        if (!(l2 & 128)) {
          s2 += String.fromCharCode(l2);
          continue;
        }
        var _2 = e[t2++] & 63;
        if ((l2 & 224) == 192) {
          s2 += String.fromCharCode((l2 & 31) << 6 | _2);
          continue;
        }
        var n = e[t2++] & 63;
        if ((l2 & 240) == 224 ? l2 = (l2 & 15) << 12 | _2 << 6 | n : l2 = (l2 & 7) << 18 | _2 << 12 | n << 6 | e[t2++] & 63, l2 < 65536) s2 += String.fromCharCode(l2);
        else {
          var m3 = l2 - 65536;
          s2 += String.fromCharCode(55296 | m3 >> 10, 56320 | m3 & 1023);
        }
      }
      return s2;
    }, getDylinkMetadata = (e) => {
      var t2 = 0, r = 0;
      function a() {
        return e[t2++];
      }
      function o3() {
        for (var P3 = 0, R3 = 1; ; ) {
          var k = e[t2++];
          if (P3 += (k & 127) * R3, R3 *= 128, !(k & 128)) break;
        }
        return P3;
      }
      function s2() {
        var P3 = o3();
        return t2 += P3, UTF8ArrayToString(e, t2 - P3, P3);
      }
      function l2(P3, R3) {
        if (P3) throw new Error(R3);
      }
      var _2 = "dylink.0";
      if (e instanceof WebAssembly.Module) {
        var n = WebAssembly.Module.customSections(e, _2);
        n.length === 0 && (_2 = "dylink", n = WebAssembly.Module.customSections(e, _2)), l2(n.length === 0, "need dylink section"), e = new Uint8Array(n[0]), r = e.length;
      } else {
        var m3 = new Uint32Array(new Uint8Array(e.subarray(0, 24)).buffer), p2 = m3[0] == 1836278016;
        l2(!p2, "need to see wasm magic number"), l2(e[8] !== 0, "need the dylink section to be first"), t2 = 9;
        var d2 = o3();
        r = t2 + d2, _2 = s2();
      }
      var g3 = { neededDynlibs: [], tlsExports: /* @__PURE__ */ new Set(), weakImports: /* @__PURE__ */ new Set() };
      if (_2 == "dylink") {
        g3.memorySize = o3(), g3.memoryAlign = o3(), g3.tableSize = o3(), g3.tableAlign = o3();
        for (var u2 = o3(), f = 0; f < u2; ++f) {
          var c = s2();
          g3.neededDynlibs.push(c);
        }
      } else {
        l2(_2 !== "dylink.0");
        for (var w2 = 1, v2 = 2, S2 = 3, x4 = 4, y3 = 256, M2 = 3, E3 = 1; t2 < r; ) {
          var b2 = a(), U3 = o3();
          if (b2 === w2) g3.memorySize = o3(), g3.memoryAlign = o3(), g3.tableSize = o3(), g3.tableAlign = o3();
          else if (b2 === v2) for (var u2 = o3(), f = 0; f < u2; ++f) c = s2(), g3.neededDynlibs.push(c);
          else if (b2 === S2) for (var z2 = o3(); z2--; ) {
            var W2 = s2(), D2 = o3();
            D2 & y3 && g3.tlsExports.add(W2);
          }
          else if (b2 === x4) for (var z2 = o3(); z2--; ) {
            var N2 = s2(), W2 = s2(), D2 = o3();
            (D2 & M2) == E3 && g3.weakImports.add(W2);
          }
          else t2 += U3;
        }
      }
      return g3;
    };
    function getValue(e, t2 = "i8") {
      switch (t2.endsWith("*") && (t2 = "*"), t2) {
        case "i1":
          return HEAP8[e];
        case "i8":
          return HEAP8[e];
        case "i16":
          return HEAP16[e >> 1];
        case "i32":
          return HEAP32[e >> 2];
        case "i64":
          return HEAP64[e >> 3];
        case "float":
          return HEAPF32[e >> 2];
        case "double":
          return HEAPF64[e >> 3];
        case "*":
          return HEAPU32[e >> 2];
        default:
          abort(`invalid type for getValue: ${t2}`);
      }
    }
    var newDSO = (e, t2, r) => {
      var a = { refcount: 1 / 0, name: e, exports: r, global: true };
      return LDSO.loadedLibsByName[e] = a, t2 != null && (LDSO.loadedLibsByHandle[t2] = a), a;
    }, LDSO = { loadedLibsByName: {}, loadedLibsByHandle: {}, init() {
      newDSO("__main__", 0, wasmImports);
    } }, ___heap_base = 15399760, alignMemory = (e, t2) => Math.ceil(e / t2) * t2, getMemory = (e) => {
      if (runtimeInitialized) return _calloc(e, 1);
      var t2 = ___heap_base, r = t2 + alignMemory(e, 16);
      return ___heap_base = r, GOT.__heap_base.value = r, t2;
    }, isInternalSym = (e) => ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js"].includes(e) || e.startsWith("__em_js__"), uleb128Encode = (e, t2) => {
      e < 128 ? t2.push(e) : t2.push(e % 128 | 128, e >> 7);
    }, sigToWasmTypes = (e) => {
      for (var t2 = { i: "i32", j: "i64", f: "f32", d: "f64", e: "externref", p: "i32" }, r = { parameters: [], results: e[0] == "v" ? [] : [t2[e[0]]] }, a = 1; a < e.length; ++a) r.parameters.push(t2[e[a]]);
      return r;
    }, generateFuncType = (e, t2) => {
      var r = e.slice(0, 1), a = e.slice(1), o3 = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 };
      t2.push(96), uleb128Encode(a.length, t2);
      for (var s2 = 0; s2 < a.length; ++s2) t2.push(o3[a[s2]]);
      r == "v" ? t2.push(0) : t2.push(1, o3[r]);
    }, convertJsFunctionToWasm = (e, t2) => {
      if (typeof WebAssembly.Function == "function") return new WebAssembly.Function(sigToWasmTypes(t2), e);
      var r = [1];
      generateFuncType(t2, r);
      var a = [0, 97, 115, 109, 1, 0, 0, 0, 1];
      uleb128Encode(r.length, a), a.push(...r), a.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
      var o3 = new WebAssembly.Module(new Uint8Array(a)), s2 = new WebAssembly.Instance(o3, { e: { f: e } }), l2 = s2.exports.f;
      return l2;
    }, wasmTableMirror = [], wasmTable = new WebAssembly.Table({ initial: 5918, element: "anyfunc" }), getWasmTableEntry = (e) => {
      var t2 = wasmTableMirror[e];
      return t2 || (e >= wasmTableMirror.length && (wasmTableMirror.length = e + 1), wasmTableMirror[e] = t2 = wasmTable.get(e)), t2;
    }, updateTableMap = (e, t2) => {
      if (functionsInTableMap) for (var r = e; r < e + t2; r++) {
        var a = getWasmTableEntry(r);
        a && functionsInTableMap.set(a, r);
      }
    }, functionsInTableMap, getFunctionAddress = (e) => (functionsInTableMap || (functionsInTableMap = /* @__PURE__ */ new WeakMap(), updateTableMap(0, wasmTable.length)), functionsInTableMap.get(e) || 0), freeTableIndexes = [], getEmptyTableSlot = () => {
      if (freeTableIndexes.length) return freeTableIndexes.pop();
      try {
        wasmTable.grow(1);
      } catch (e) {
        throw e instanceof RangeError ? "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH." : e;
      }
      return wasmTable.length - 1;
    }, setWasmTableEntry = (e, t2) => {
      wasmTable.set(e, t2), wasmTableMirror[e] = wasmTable.get(e);
    }, addFunction = (e, t2) => {
      var r = getFunctionAddress(e);
      if (r) return r;
      var a = getEmptyTableSlot();
      try {
        setWasmTableEntry(a, e);
      } catch (s2) {
        if (!(s2 instanceof TypeError)) throw s2;
        var o3 = convertJsFunctionToWasm(e, t2);
        setWasmTableEntry(a, o3);
      }
      return functionsInTableMap.set(e, a), a;
    }, updateGOT = (e, t2) => {
      for (var r in e) if (!isInternalSym(r)) {
        var a = e[r];
        GOT[r] || (GOT[r] = new WebAssembly.Global({ value: "i32", mutable: true })), (t2 || GOT[r].value == 0) && (typeof a == "function" ? GOT[r].value = addFunction(a) : typeof a == "number" ? GOT[r].value = a : err(`unhandled export type for '${r}': ${typeof a}`));
      }
    }, relocateExports = (e, t2, r) => {
      var a = {};
      for (var o3 in e) {
        var s2 = e[o3];
        typeof s2 == "object" && (s2 = s2.value), typeof s2 == "number" && (s2 += t2), a[o3] = s2;
      }
      return updateGOT(a, r), a;
    }, isSymbolDefined = (e) => {
      var t2 = wasmImports[e];
      return !(!t2 || t2.stub);
    }, dynCall = (e, t2, r = []) => {
      var a = getWasmTableEntry(t2)(...r);
      return a;
    }, stackSave = () => _emscripten_stack_get_current(), stackRestore = (e) => __emscripten_stack_restore(e), createInvokeFunction = (e) => (t2, ...r) => {
      var a = stackSave();
      try {
        return dynCall(e, t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        if (_setThrew(1, 0), e[0] == "j") return 0n;
      }
    }, resolveGlobalSymbol = (e, t2 = false) => {
      var r;
      return isSymbolDefined(e) ? r = wasmImports[e] : e.startsWith("invoke_") && (r = wasmImports[e] = createInvokeFunction(e.split("_")[1])), { sym: r, name: e };
    }, UTF8ToString = (e, t2) => e ? UTF8ArrayToString(HEAPU8, e, t2) : "", loadWebAssemblyModule = (binary, flags, libName, localScope, handle) => {
      var metadata = getDylinkMetadata(binary);
      currentModuleWeakSymbols = metadata.weakImports;
      function loadModule() {
        var firstLoad = !handle || !HEAP8[handle + 8];
        if (firstLoad) {
          var memAlign = Math.pow(2, metadata.memoryAlign), memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0, tableBase = metadata.tableSize ? wasmTable.length : 0;
          handle && (HEAP8[handle + 8] = 1, HEAPU32[handle + 12 >> 2] = memoryBase, HEAP32[handle + 16 >> 2] = metadata.memorySize, HEAPU32[handle + 20 >> 2] = tableBase, HEAP32[handle + 24 >> 2] = metadata.tableSize);
        } else memoryBase = HEAPU32[handle + 12 >> 2], tableBase = HEAPU32[handle + 20 >> 2];
        var tableGrowthNeeded = tableBase + metadata.tableSize - wasmTable.length;
        tableGrowthNeeded > 0 && wasmTable.grow(tableGrowthNeeded);
        var moduleExports;
        function resolveSymbol(e) {
          var t2 = resolveGlobalSymbol(e).sym;
          return !t2 && localScope && (t2 = localScope[e]), t2 || (t2 = moduleExports[e]), t2;
        }
        var proxyHandler = { get(e, t2) {
          switch (t2) {
            case "__memory_base":
              return memoryBase;
            case "__table_base":
              return tableBase;
          }
          if (t2 in wasmImports && !wasmImports[t2].stub) return wasmImports[t2];
          if (!(t2 in e)) {
            var r;
            e[t2] = (...a) => {
              if (r || (r = resolveSymbol(t2)), !r) throw new Error();
              return r(...a);
            };
          }
          return e[t2];
        } }, proxy = new Proxy({}, proxyHandler), info = { "GOT.mem": new Proxy({}, GOTHandler), "GOT.func": new Proxy({}, GOTHandler), env: proxy, wasi_snapshot_preview1: proxy };
        function postInstantiation(module, instance) {
          updateTableMap(tableBase, metadata.tableSize), moduleExports = relocateExports(instance.exports, memoryBase), flags.allowUndefined || reportUndefinedSymbols();
          function addEmAsm(addr, body) {
            for (var args = [], arity = 0; arity < 16 && body.indexOf("$" + arity) != -1; arity++) args.push("$" + arity);
            args = args.join(",");
            var func = `(${args}) => { ${body} };`;
            ASM_CONSTS[start] = eval(func);
          }
          if ("__start_em_asm" in moduleExports) for (var start = moduleExports.__start_em_asm, stop = moduleExports.__stop_em_asm; start < stop; ) {
            var jsString = UTF8ToString(start);
            addEmAsm(start, jsString), start = HEAPU8.indexOf(0, start) + 1;
          }
          function addEmJs(name, cSig, body) {
            var jsArgs = [];
            if (cSig = cSig.slice(1, -1), cSig != "void") {
              cSig = cSig.split(",");
              for (var i in cSig) {
                var jsArg = cSig[i].split(" ").pop();
                jsArgs.push(jsArg.replaceAll("*", ""));
              }
            }
            var func = `(${jsArgs}) => ${body};`;
            moduleExports[name] = eval(func);
          }
          for (var name in moduleExports) if (name.startsWith("__em_js__")) {
            var start = moduleExports[name], jsString = UTF8ToString(start), parts = jsString.split("<::>");
            addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]), delete moduleExports[name];
          }
          var applyRelocs = moduleExports.__wasm_apply_data_relocs;
          applyRelocs && (runtimeInitialized ? applyRelocs() : __RELOC_FUNCS__.push(applyRelocs));
          var init = moduleExports.__wasm_call_ctors;
          return init && (runtimeInitialized ? init() : __ATINIT__.push(init)), moduleExports;
        }
        if (flags.loadAsync) {
          if (binary instanceof WebAssembly.Module) {
            var instance = new WebAssembly.Instance(binary, info);
            return Promise.resolve(postInstantiation(binary, instance));
          }
          return WebAssembly.instantiate(binary, info).then((e) => postInstantiation(e.module, e.instance));
        }
        var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary), instance = new WebAssembly.Instance(module, info);
        return postInstantiation(module, instance);
      }
      return flags.loadAsync ? metadata.neededDynlibs.reduce((e, t2) => e.then(() => loadDynamicLibrary(t2, flags, localScope)), Promise.resolve()).then(loadModule) : (metadata.neededDynlibs.forEach((e) => loadDynamicLibrary(e, flags, localScope)), loadModule());
    }, mergeLibSymbols = (e, t2) => {
      for (var [r, a] of Object.entries(e)) {
        let o3 = (l2) => {
          isSymbolDefined(l2) || (wasmImports[l2] = a);
        };
        o3(r);
        let s2 = "__main_argc_argv";
        r == "main" && o3(s2), r == s2 && o3("main");
      }
    }, asyncLoad = async (e) => {
      var t2 = await readAsync(e);
      return new Uint8Array(t2);
    }, preloadPlugins = Module.preloadPlugins || [], registerWasmPlugin = () => {
      var e = { promiseChainEnd: Promise.resolve(), canHandle: (t2) => !Module.noWasmDecoding && t2.endsWith(".so"), handle: (t2, r, a, o3) => {
        e.promiseChainEnd = e.promiseChainEnd.then(() => loadWebAssemblyModule(t2, { loadAsync: true, nodelete: true }, r, {})).then((s2) => {
          preloadedWasm[r] = s2, a(t2);
        }, (s2) => {
          err(`failed to instantiate wasm: ${r}: ${s2}`), o3();
        });
      } };
      preloadPlugins.push(e);
    }, preloadedWasm = {};
    function loadDynamicLibrary(e, t2 = { global: true, nodelete: true }, r, a) {
      var o3 = LDSO.loadedLibsByName[e];
      if (o3) return t2.global ? o3.global || (o3.global = true, mergeLibSymbols(o3.exports, e)) : r && Object.assign(r, o3.exports), t2.nodelete && o3.refcount !== 1 / 0 && (o3.refcount = 1 / 0), o3.refcount++, a && (LDSO.loadedLibsByHandle[a] = o3), t2.loadAsync ? Promise.resolve(true) : true;
      o3 = newDSO(e, a, "loading"), o3.refcount = t2.nodelete ? 1 / 0 : 1, o3.global = t2.global;
      function s2() {
        if (a) {
          var n = HEAPU32[a + 28 >> 2], m3 = HEAPU32[a + 32 >> 2];
          if (n && m3) {
            var p2 = HEAP8.slice(n, n + m3);
            return t2.loadAsync ? Promise.resolve(p2) : p2;
          }
        }
        var d2 = locateFile(e);
        if (t2.loadAsync) return asyncLoad(d2);
        if (!readBinary) throw new Error(`${d2}: file not found, and synchronous loading of external files is not available`);
        return readBinary(d2);
      }
      function l2() {
        var n = preloadedWasm[e];
        return n ? t2.loadAsync ? Promise.resolve(n) : n : t2.loadAsync ? s2().then((m3) => loadWebAssemblyModule(m3, t2, e, r, a)) : loadWebAssemblyModule(s2(), t2, e, r, a);
      }
      function _2(n) {
        o3.global ? mergeLibSymbols(n, e) : r && Object.assign(r, n), o3.exports = n;
      }
      return t2.loadAsync ? l2().then((n) => (_2(n), true)) : (_2(l2()), true);
    }
    var reportUndefinedSymbols = () => {
      for (var [e, t2] of Object.entries(GOT)) if (t2.value == 0) {
        var r = resolveGlobalSymbol(e, true).sym;
        if (!r && !t2.required) continue;
        if (typeof r == "function") t2.value = addFunction(r, r.sig);
        else if (typeof r == "number") t2.value = r;
        else throw new Error(`bad export type for '${e}': ${typeof r}`);
      }
    }, loadDylibs = () => {
      if (!dynamicLibraries.length) {
        reportUndefinedSymbols();
        return;
      }
      addRunDependency("loadDylibs"), dynamicLibraries.reduce((e, t2) => e.then(() => loadDynamicLibrary(t2, { loadAsync: true, global: true, nodelete: true, allowUndefined: true })), Promise.resolve()).then(() => {
        reportUndefinedSymbols(), removeRunDependency("loadDylibs");
      });
    }, noExitRuntime = Module.noExitRuntime || true;
    function setValue(e, t2, r = "i8") {
      switch (r.endsWith("*") && (r = "*"), r) {
        case "i1":
          HEAP8[e] = t2;
          break;
        case "i8":
          HEAP8[e] = t2;
          break;
        case "i16":
          HEAP16[e >> 1] = t2;
          break;
        case "i32":
          HEAP32[e >> 2] = t2;
          break;
        case "i64":
          HEAP64[e >> 3] = BigInt(t2);
          break;
        case "float":
          HEAPF32[e >> 2] = t2;
          break;
        case "double":
          HEAPF64[e >> 3] = t2;
          break;
        case "*":
          HEAPU32[e >> 2] = t2;
          break;
        default:
          abort(`invalid type for setValue: ${r}`);
      }
    }
    var ___assert_fail = (e, t2, r, a) => abort(`Assertion failed: ${UTF8ToString(e)}, at: ` + [t2 ? UTF8ToString(t2) : "unknown filename", r, a ? UTF8ToString(a) : "unknown function"]);
    ___assert_fail.sig = "vppip";
    var ___call_sighandler = (e, t2) => getWasmTableEntry(e)(t2);
    ___call_sighandler.sig = "vpi";
    var ___memory_base = new WebAssembly.Global({ value: "i32", mutable: false }, 12582912), ___stack_high = 15399760, ___stack_low = 15334224, ___stack_pointer = new WebAssembly.Global({ value: "i32", mutable: true }, 15399760), PATH = { isAbs: (e) => e.charAt(0) === "/", splitPath: (e) => {
      var t2 = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return t2.exec(e).slice(1);
    }, normalizeArray: (e, t2) => {
      for (var r = 0, a = e.length - 1; a >= 0; a--) {
        var o3 = e[a];
        o3 === "." ? e.splice(a, 1) : o3 === ".." ? (e.splice(a, 1), r++) : r && (e.splice(a, 1), r--);
      }
      if (t2) for (; r; r--) e.unshift("..");
      return e;
    }, normalize: (e) => {
      var t2 = PATH.isAbs(e), r = e.substr(-1) === "/";
      return e = PATH.normalizeArray(e.split("/").filter((a) => !!a), !t2).join("/"), !e && !t2 && (e = "."), e && r && (e += "/"), (t2 ? "/" : "") + e;
    }, dirname: (e) => {
      var t2 = PATH.splitPath(e), r = t2[0], a = t2[1];
      return !r && !a ? "." : (a && (a = a.substr(0, a.length - 1)), r + a);
    }, basename: (e) => {
      if (e === "/") return "/";
      e = PATH.normalize(e), e = e.replace(/\/$/, "");
      var t2 = e.lastIndexOf("/");
      return t2 === -1 ? e : e.substr(t2 + 1);
    }, join: (...e) => PATH.normalize(e.join("/")), join2: (e, t2) => PATH.normalize(e + "/" + t2) }, initRandomFill = () => {
      if (typeof crypto == "object" && typeof crypto.getRandomValues == "function") return (a) => crypto.getRandomValues(a);
      if (ENVIRONMENT_IS_NODE) try {
        var e = require("crypto"), t2 = e.randomFillSync;
        if (t2) return (a) => e.randomFillSync(a);
        var r = e.randomBytes;
        return (a) => (a.set(r(a.byteLength)), a);
      } catch {
      }
      abort("initRandomDevice");
    }, randomFill = (e) => (randomFill = initRandomFill())(e), PATH_FS = { resolve: (...e) => {
      for (var t2 = "", r = false, a = e.length - 1; a >= -1 && !r; a--) {
        var o3 = a >= 0 ? e[a] : FS.cwd();
        if (typeof o3 != "string") throw new TypeError("Arguments to path.resolve must be strings");
        if (!o3) return "";
        t2 = o3 + "/" + t2, r = PATH.isAbs(o3);
      }
      return t2 = PATH.normalizeArray(t2.split("/").filter((s2) => !!s2), !r).join("/"), (r ? "/" : "") + t2 || ".";
    }, relative: (e, t2) => {
      e = PATH_FS.resolve(e).substr(1), t2 = PATH_FS.resolve(t2).substr(1);
      function r(m3) {
        for (var p2 = 0; p2 < m3.length && m3[p2] === ""; p2++) ;
        for (var d2 = m3.length - 1; d2 >= 0 && m3[d2] === ""; d2--) ;
        return p2 > d2 ? [] : m3.slice(p2, d2 - p2 + 1);
      }
      for (var a = r(e.split("/")), o3 = r(t2.split("/")), s2 = Math.min(a.length, o3.length), l2 = s2, _2 = 0; _2 < s2; _2++) if (a[_2] !== o3[_2]) {
        l2 = _2;
        break;
      }
      for (var n = [], _2 = l2; _2 < a.length; _2++) n.push("..");
      return n = n.concat(o3.slice(l2)), n.join("/");
    } }, FS_stdin_getChar_buffer = [], lengthBytesUTF8 = (e) => {
      for (var t2 = 0, r = 0; r < e.length; ++r) {
        var a = e.charCodeAt(r);
        a <= 127 ? t2++ : a <= 2047 ? t2 += 2 : a >= 55296 && a <= 57343 ? (t2 += 4, ++r) : t2 += 3;
      }
      return t2;
    }, stringToUTF8Array = (e, t2, r, a) => {
      if (!(a > 0)) return 0;
      for (var o3 = r, s2 = r + a - 1, l2 = 0; l2 < e.length; ++l2) {
        var _2 = e.charCodeAt(l2);
        if (_2 >= 55296 && _2 <= 57343) {
          var n = e.charCodeAt(++l2);
          _2 = 65536 + ((_2 & 1023) << 10) | n & 1023;
        }
        if (_2 <= 127) {
          if (r >= s2) break;
          t2[r++] = _2;
        } else if (_2 <= 2047) {
          if (r + 1 >= s2) break;
          t2[r++] = 192 | _2 >> 6, t2[r++] = 128 | _2 & 63;
        } else if (_2 <= 65535) {
          if (r + 2 >= s2) break;
          t2[r++] = 224 | _2 >> 12, t2[r++] = 128 | _2 >> 6 & 63, t2[r++] = 128 | _2 & 63;
        } else {
          if (r + 3 >= s2) break;
          t2[r++] = 240 | _2 >> 18, t2[r++] = 128 | _2 >> 12 & 63, t2[r++] = 128 | _2 >> 6 & 63, t2[r++] = 128 | _2 & 63;
        }
      }
      return t2[r] = 0, r - o3;
    };
    function intArrayFromString(e, t2, r) {
      var a = r > 0 ? r : lengthBytesUTF8(e) + 1, o3 = new Array(a), s2 = stringToUTF8Array(e, o3, 0, o3.length);
      return t2 && (o3.length = s2), o3;
    }
    var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var e = null;
        if (ENVIRONMENT_IS_NODE) {
          var t2 = 256, r = Buffer.alloc(t2), a = 0, o3 = process.stdin.fd;
          try {
            a = fs.readSync(o3, r, 0, t2);
          } catch (s2) {
            if (s2.toString().includes("EOF")) a = 0;
            else throw s2;
          }
          a > 0 && (e = r.slice(0, a).toString("utf-8"));
        } else typeof window < "u" && typeof window.prompt == "function" && (e = window.prompt("Input: "), e !== null && (e += `
`));
        if (!e) return null;
        FS_stdin_getChar_buffer = intArrayFromString(e, true);
      }
      return FS_stdin_getChar_buffer.shift();
    }, TTY = { ttys: [], init() {
    }, shutdown() {
    }, register(e, t2) {
      TTY.ttys[e] = { input: [], output: [], ops: t2 }, FS.registerDevice(e, TTY.stream_ops);
    }, stream_ops: { open(e) {
      var t2 = TTY.ttys[e.node.rdev];
      if (!t2) throw new FS.ErrnoError(43);
      e.tty = t2, e.seekable = false;
    }, close(e) {
      e.tty.ops.fsync(e.tty);
    }, fsync(e) {
      e.tty.ops.fsync(e.tty);
    }, read(e, t2, r, a, o3) {
      if (!e.tty || !e.tty.ops.get_char) throw new FS.ErrnoError(60);
      for (var s2 = 0, l2 = 0; l2 < a; l2++) {
        var _2;
        try {
          _2 = e.tty.ops.get_char(e.tty);
        } catch {
          throw new FS.ErrnoError(29);
        }
        if (_2 === void 0 && s2 === 0) throw new FS.ErrnoError(6);
        if (_2 == null) break;
        s2++, t2[r + l2] = _2;
      }
      return s2 && (e.node.atime = Date.now()), s2;
    }, write(e, t2, r, a, o3) {
      if (!e.tty || !e.tty.ops.put_char) throw new FS.ErrnoError(60);
      try {
        for (var s2 = 0; s2 < a; s2++) e.tty.ops.put_char(e.tty, t2[r + s2]);
      } catch {
        throw new FS.ErrnoError(29);
      }
      return a && (e.node.mtime = e.node.ctime = Date.now()), s2;
    } }, default_tty_ops: { get_char(e) {
      return FS_stdin_getChar();
    }, put_char(e, t2) {
      t2 === null || t2 === 10 ? (out(UTF8ArrayToString(e.output)), e.output = []) : t2 != 0 && e.output.push(t2);
    }, fsync(e) {
      e.output && e.output.length > 0 && (out(UTF8ArrayToString(e.output)), e.output = []);
    }, ioctl_tcgets(e) {
      return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    }, ioctl_tcsets(e, t2, r) {
      return 0;
    }, ioctl_tiocgwinsz(e) {
      return [24, 80];
    } }, default_tty1_ops: { put_char(e, t2) {
      t2 === null || t2 === 10 ? (err(UTF8ArrayToString(e.output)), e.output = []) : t2 != 0 && e.output.push(t2);
    }, fsync(e) {
      e.output && e.output.length > 0 && (err(UTF8ArrayToString(e.output)), e.output = []);
    } } }, zeroMemory = (e, t2) => {
      HEAPU8.fill(0, e, e + t2);
    }, mmapAlloc = (e) => {
      e = alignMemory(e, 65536);
      var t2 = _emscripten_builtin_memalign(65536, e);
      return t2 && zeroMemory(t2, e), t2;
    }, MEMFS = { ops_table: null, mount(e) {
      return MEMFS.createNode(null, "/", 16895, 0);
    }, createNode(e, t2, r, a) {
      if (FS.isBlkdev(r) || FS.isFIFO(r)) throw new FS.ErrnoError(63);
      MEMFS.ops_table || (MEMFS.ops_table = { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } });
      var o3 = FS.createNode(e, t2, r, a);
      return FS.isDir(o3.mode) ? (o3.node_ops = MEMFS.ops_table.dir.node, o3.stream_ops = MEMFS.ops_table.dir.stream, o3.contents = {}) : FS.isFile(o3.mode) ? (o3.node_ops = MEMFS.ops_table.file.node, o3.stream_ops = MEMFS.ops_table.file.stream, o3.usedBytes = 0, o3.contents = null) : FS.isLink(o3.mode) ? (o3.node_ops = MEMFS.ops_table.link.node, o3.stream_ops = MEMFS.ops_table.link.stream) : FS.isChrdev(o3.mode) && (o3.node_ops = MEMFS.ops_table.chrdev.node, o3.stream_ops = MEMFS.ops_table.chrdev.stream), o3.atime = o3.mtime = o3.ctime = Date.now(), e && (e.contents[t2] = o3, e.atime = e.mtime = e.ctime = o3.atime), o3;
    }, getFileDataAsTypedArray(e) {
      return e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : new Uint8Array(0);
    }, expandFileStorage(e, t2) {
      var r = e.contents ? e.contents.length : 0;
      if (!(r >= t2)) {
        var a = 1024 * 1024;
        t2 = Math.max(t2, r * (r < a ? 2 : 1.125) >>> 0), r != 0 && (t2 = Math.max(t2, 256));
        var o3 = e.contents;
        e.contents = new Uint8Array(t2), e.usedBytes > 0 && e.contents.set(o3.subarray(0, e.usedBytes), 0);
      }
    }, resizeFileStorage(e, t2) {
      if (e.usedBytes != t2) if (t2 == 0) e.contents = null, e.usedBytes = 0;
      else {
        var r = e.contents;
        e.contents = new Uint8Array(t2), r && e.contents.set(r.subarray(0, Math.min(t2, e.usedBytes))), e.usedBytes = t2;
      }
    }, node_ops: { getattr(e) {
      var t2 = {};
      return t2.dev = FS.isChrdev(e.mode) ? e.id : 1, t2.ino = e.id, t2.mode = e.mode, t2.nlink = 1, t2.uid = 0, t2.gid = 0, t2.rdev = e.rdev, FS.isDir(e.mode) ? t2.size = 4096 : FS.isFile(e.mode) ? t2.size = e.usedBytes : FS.isLink(e.mode) ? t2.size = e.link.length : t2.size = 0, t2.atime = new Date(e.atime), t2.mtime = new Date(e.mtime), t2.ctime = new Date(e.ctime), t2.blksize = 4096, t2.blocks = Math.ceil(t2.size / t2.blksize), t2;
    }, setattr(e, t2) {
      for (let r of ["mode", "atime", "mtime", "ctime"]) t2[r] && (e[r] = t2[r]);
      t2.size !== void 0 && MEMFS.resizeFileStorage(e, t2.size);
    }, lookup(e, t2) {
      throw MEMFS.doesNotExistError;
    }, mknod(e, t2, r, a) {
      return MEMFS.createNode(e, t2, r, a);
    }, rename(e, t2, r) {
      var a;
      try {
        a = FS.lookupNode(t2, r);
      } catch {
      }
      if (a) {
        if (FS.isDir(e.mode)) for (var o3 in a.contents) throw new FS.ErrnoError(55);
        FS.hashRemoveNode(a);
      }
      delete e.parent.contents[e.name], t2.contents[r] = e, e.name = r, t2.ctime = t2.mtime = e.parent.ctime = e.parent.mtime = Date.now();
    }, unlink(e, t2) {
      delete e.contents[t2], e.ctime = e.mtime = Date.now();
    }, rmdir(e, t2) {
      var r = FS.lookupNode(e, t2);
      for (var a in r.contents) throw new FS.ErrnoError(55);
      delete e.contents[t2], e.ctime = e.mtime = Date.now();
    }, readdir(e) {
      return [".", "..", ...Object.keys(e.contents)];
    }, symlink(e, t2, r) {
      var a = MEMFS.createNode(e, t2, 41471, 0);
      return a.link = r, a;
    }, readlink(e) {
      if (!FS.isLink(e.mode)) throw new FS.ErrnoError(28);
      return e.link;
    } }, stream_ops: { read(e, t2, r, a, o3) {
      var s2 = e.node.contents;
      if (o3 >= e.node.usedBytes) return 0;
      var l2 = Math.min(e.node.usedBytes - o3, a);
      if (l2 > 8 && s2.subarray) t2.set(s2.subarray(o3, o3 + l2), r);
      else for (var _2 = 0; _2 < l2; _2++) t2[r + _2] = s2[o3 + _2];
      return l2;
    }, write(e, t2, r, a, o3, s2) {
      if (t2.buffer === HEAP8.buffer && (s2 = false), !a) return 0;
      var l2 = e.node;
      if (l2.mtime = l2.ctime = Date.now(), t2.subarray && (!l2.contents || l2.contents.subarray)) {
        if (s2) return l2.contents = t2.subarray(r, r + a), l2.usedBytes = a, a;
        if (l2.usedBytes === 0 && o3 === 0) return l2.contents = t2.slice(r, r + a), l2.usedBytes = a, a;
        if (o3 + a <= l2.usedBytes) return l2.contents.set(t2.subarray(r, r + a), o3), a;
      }
      if (MEMFS.expandFileStorage(l2, o3 + a), l2.contents.subarray && t2.subarray) l2.contents.set(t2.subarray(r, r + a), o3);
      else for (var _2 = 0; _2 < a; _2++) l2.contents[o3 + _2] = t2[r + _2];
      return l2.usedBytes = Math.max(l2.usedBytes, o3 + a), a;
    }, llseek(e, t2, r) {
      var a = t2;
      if (r === 1 ? a += e.position : r === 2 && FS.isFile(e.node.mode) && (a += e.node.usedBytes), a < 0) throw new FS.ErrnoError(28);
      return a;
    }, allocate(e, t2, r) {
      MEMFS.expandFileStorage(e.node, t2 + r), e.node.usedBytes = Math.max(e.node.usedBytes, t2 + r);
    }, mmap(e, t2, r, a, o3) {
      if (!FS.isFile(e.node.mode)) throw new FS.ErrnoError(43);
      var s2, l2, _2 = e.node.contents;
      if (!(o3 & 2) && _2 && _2.buffer === HEAP8.buffer) l2 = false, s2 = _2.byteOffset;
      else {
        if (l2 = true, s2 = mmapAlloc(t2), !s2) throw new FS.ErrnoError(48);
        _2 && ((r > 0 || r + t2 < _2.length) && (_2.subarray ? _2 = _2.subarray(r, r + t2) : _2 = Array.prototype.slice.call(_2, r, r + t2)), HEAP8.set(_2, s2));
      }
      return { ptr: s2, allocated: l2 };
    }, msync(e, t2, r, a, o3) {
      return MEMFS.stream_ops.write(e, t2, 0, a, r, false), 0;
    } } }, FS_createDataFile = (e, t2, r, a, o3, s2) => {
      FS.createDataFile(e, t2, r, a, o3, s2);
    }, FS_handledByPreloadPlugin = (e, t2, r, a) => {
      typeof Browser < "u" && Browser.init();
      var o3 = false;
      return preloadPlugins.forEach((s2) => {
        o3 || s2.canHandle(t2) && (s2.handle(e, t2, r, a), o3 = true);
      }), o3;
    }, FS_createPreloadedFile = (e, t2, r, a, o3, s2, l2, _2, n, m3) => {
      var p2 = t2 ? PATH_FS.resolve(PATH.join2(e, t2)) : e, d2 = `cp ${p2}`;
      function g3(u2) {
        function f(c) {
          m3?.(), _2 || FS_createDataFile(e, t2, c, a, o3, n), s2?.(), removeRunDependency(d2);
        }
        FS_handledByPreloadPlugin(u2, p2, f, () => {
          l2?.(), removeRunDependency(d2);
        }) || f(u2);
      }
      addRunDependency(d2), typeof r == "string" ? asyncLoad(r).then(g3, l2) : g3(r);
    }, FS_modeStringToFlags = (e) => {
      var t2 = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }, r = t2[e];
      if (typeof r > "u") throw new Error(`Unknown file open mode: ${e}`);
      return r;
    }, FS_getMode = (e, t2) => {
      var r = 0;
      return e && (r |= 365), t2 && (r |= 146), r;
    }, IDBFS = { dbs: {}, indexedDB: () => {
      if (typeof indexedDB < "u") return indexedDB;
      var e = null;
      return typeof window == "object" && (e = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB), e;
    }, DB_VERSION: 21, DB_STORE_NAME: "FILE_DATA", queuePersist: (e) => {
      function t2() {
        e.idbPersistState === "again" ? r() : e.idbPersistState = 0;
      }
      function r() {
        e.idbPersistState = "idb", IDBFS.syncfs(e, false, t2);
      }
      e.idbPersistState ? e.idbPersistState === "idb" && (e.idbPersistState = "again") : e.idbPersistState = setTimeout(r, 0);
    }, mount: (e) => {
      var t2 = MEMFS.mount(e);
      if (e?.opts?.autoPersist) {
        t2.idbPersistState = 0;
        var r = t2.node_ops;
        t2.node_ops = Object.assign({}, t2.node_ops), t2.node_ops.mknod = (a, o3, s2, l2) => {
          var _2 = r.mknod(a, o3, s2, l2);
          return _2.node_ops = t2.node_ops, _2.idbfs_mount = t2.mount, _2.memfs_stream_ops = _2.stream_ops, _2.stream_ops = Object.assign({}, _2.stream_ops), _2.stream_ops.write = (n, m3, p2, d2, g3, u2) => (n.node.isModified = true, _2.memfs_stream_ops.write(n, m3, p2, d2, g3, u2)), _2.stream_ops.close = (n) => {
            var m3 = n.node;
            if (m3.isModified && (IDBFS.queuePersist(m3.idbfs_mount), m3.isModified = false), m3.memfs_stream_ops.close) return m3.memfs_stream_ops.close(n);
          }, _2;
        }, t2.node_ops.mkdir = (...a) => (IDBFS.queuePersist(t2.mount), r.mkdir(...a)), t2.node_ops.rmdir = (...a) => (IDBFS.queuePersist(t2.mount), r.rmdir(...a)), t2.node_ops.symlink = (...a) => (IDBFS.queuePersist(t2.mount), r.symlink(...a)), t2.node_ops.unlink = (...a) => (IDBFS.queuePersist(t2.mount), r.unlink(...a)), t2.node_ops.rename = (...a) => (IDBFS.queuePersist(t2.mount), r.rename(...a));
      }
      return t2;
    }, syncfs: (e, t2, r) => {
      IDBFS.getLocalSet(e, (a, o3) => {
        if (a) return r(a);
        IDBFS.getRemoteSet(e, (s2, l2) => {
          if (s2) return r(s2);
          var _2 = t2 ? l2 : o3, n = t2 ? o3 : l2;
          IDBFS.reconcile(_2, n, r);
        });
      });
    }, quit: () => {
      Object.values(IDBFS.dbs).forEach((e) => e.close()), IDBFS.dbs = {};
    }, getDB: (e, t2) => {
      var r = IDBFS.dbs[e];
      if (r) return t2(null, r);
      var a;
      try {
        a = IDBFS.indexedDB().open(e, IDBFS.DB_VERSION);
      } catch (o3) {
        return t2(o3);
      }
      if (!a) return t2("Unable to connect to IndexedDB");
      a.onupgradeneeded = (o3) => {
        var s2 = o3.target.result, l2 = o3.target.transaction, _2;
        s2.objectStoreNames.contains(IDBFS.DB_STORE_NAME) ? _2 = l2.objectStore(IDBFS.DB_STORE_NAME) : _2 = s2.createObjectStore(IDBFS.DB_STORE_NAME), _2.indexNames.contains("timestamp") || _2.createIndex("timestamp", "timestamp", { unique: false });
      }, a.onsuccess = () => {
        r = a.result, IDBFS.dbs[e] = r, t2(null, r);
      }, a.onerror = (o3) => {
        t2(o3.target.error), o3.preventDefault();
      };
    }, getLocalSet: (e, t2) => {
      var r = {};
      function a(n) {
        return n !== "." && n !== "..";
      }
      function o3(n) {
        return (m3) => PATH.join2(n, m3);
      }
      for (var s2 = FS.readdir(e.mountpoint).filter(a).map(o3(e.mountpoint)); s2.length; ) {
        var l2 = s2.pop(), _2;
        try {
          _2 = FS.stat(l2);
        } catch (n) {
          return t2(n);
        }
        FS.isDir(_2.mode) && s2.push(...FS.readdir(l2).filter(a).map(o3(l2))), r[l2] = { timestamp: _2.mtime };
      }
      return t2(null, { type: "local", entries: r });
    }, getRemoteSet: (e, t2) => {
      var r = {};
      IDBFS.getDB(e.mountpoint, (a, o3) => {
        if (a) return t2(a);
        try {
          var s2 = o3.transaction([IDBFS.DB_STORE_NAME], "readonly");
          s2.onerror = (n) => {
            t2(n.target.error), n.preventDefault();
          };
          var l2 = s2.objectStore(IDBFS.DB_STORE_NAME), _2 = l2.index("timestamp");
          _2.openKeyCursor().onsuccess = (n) => {
            var m3 = n.target.result;
            if (!m3) return t2(null, { type: "remote", db: o3, entries: r });
            r[m3.primaryKey] = { timestamp: m3.key }, m3.continue();
          };
        } catch (n) {
          return t2(n);
        }
      });
    }, loadLocalEntry: (e, t2) => {
      var r, a;
      try {
        var o3 = FS.lookupPath(e);
        a = o3.node, r = FS.stat(e);
      } catch (s2) {
        return t2(s2);
      }
      return FS.isDir(r.mode) ? t2(null, { timestamp: r.mtime, mode: r.mode }) : FS.isFile(r.mode) ? (a.contents = MEMFS.getFileDataAsTypedArray(a), t2(null, { timestamp: r.mtime, mode: r.mode, contents: a.contents })) : t2(new Error("node type not supported"));
    }, storeLocalEntry: (e, t2, r) => {
      try {
        if (FS.isDir(t2.mode)) FS.mkdirTree(e, t2.mode);
        else if (FS.isFile(t2.mode)) FS.writeFile(e, t2.contents, { canOwn: true });
        else return r(new Error("node type not supported"));
        FS.chmod(e, t2.mode), FS.utime(e, t2.timestamp, t2.timestamp);
      } catch (a) {
        return r(a);
      }
      r(null);
    }, removeLocalEntry: (e, t2) => {
      try {
        var r = FS.stat(e);
        FS.isDir(r.mode) ? FS.rmdir(e) : FS.isFile(r.mode) && FS.unlink(e);
      } catch (a) {
        return t2(a);
      }
      t2(null);
    }, loadRemoteEntry: (e, t2, r) => {
      var a = e.get(t2);
      a.onsuccess = (o3) => r(null, o3.target.result), a.onerror = (o3) => {
        r(o3.target.error), o3.preventDefault();
      };
    }, storeRemoteEntry: (e, t2, r, a) => {
      try {
        var o3 = e.put(r, t2);
      } catch (s2) {
        a(s2);
        return;
      }
      o3.onsuccess = (s2) => a(), o3.onerror = (s2) => {
        a(s2.target.error), s2.preventDefault();
      };
    }, removeRemoteEntry: (e, t2, r) => {
      var a = e.delete(t2);
      a.onsuccess = (o3) => r(), a.onerror = (o3) => {
        r(o3.target.error), o3.preventDefault();
      };
    }, reconcile: (e, t2, r) => {
      var a = 0, o3 = [];
      Object.keys(e.entries).forEach((d2) => {
        var g3 = e.entries[d2], u2 = t2.entries[d2];
        (!u2 || g3.timestamp.getTime() != u2.timestamp.getTime()) && (o3.push(d2), a++);
      });
      var s2 = [];
      if (Object.keys(t2.entries).forEach((d2) => {
        e.entries[d2] || (s2.push(d2), a++);
      }), !a) return r(null);
      var l2 = false, _2 = e.type === "remote" ? e.db : t2.db, n = _2.transaction([IDBFS.DB_STORE_NAME], "readwrite"), m3 = n.objectStore(IDBFS.DB_STORE_NAME);
      function p2(d2) {
        if (d2 && !l2) return l2 = true, r(d2);
      }
      n.onerror = n.onabort = (d2) => {
        p2(d2.target.error), d2.preventDefault();
      }, n.oncomplete = (d2) => {
        l2 || r(null);
      }, o3.sort().forEach((d2) => {
        t2.type === "local" ? IDBFS.loadRemoteEntry(m3, d2, (g3, u2) => {
          if (g3) return p2(g3);
          IDBFS.storeLocalEntry(d2, u2, p2);
        }) : IDBFS.loadLocalEntry(d2, (g3, u2) => {
          if (g3) return p2(g3);
          IDBFS.storeRemoteEntry(m3, d2, u2, p2);
        });
      }), s2.sort().reverse().forEach((d2) => {
        t2.type === "local" ? IDBFS.removeLocalEntry(d2, p2) : IDBFS.removeRemoteEntry(m3, d2, p2);
      });
    } }, ERRNO_CODES = { EPERM: 63, ENOENT: 44, ESRCH: 71, EINTR: 27, EIO: 29, ENXIO: 60, E2BIG: 1, ENOEXEC: 45, EBADF: 8, ECHILD: 12, EAGAIN: 6, EWOULDBLOCK: 6, ENOMEM: 48, EACCES: 2, EFAULT: 21, ENOTBLK: 105, EBUSY: 10, EEXIST: 20, EXDEV: 75, ENODEV: 43, ENOTDIR: 54, EISDIR: 31, EINVAL: 28, ENFILE: 41, EMFILE: 33, ENOTTY: 59, ETXTBSY: 74, EFBIG: 22, ENOSPC: 51, ESPIPE: 70, EROFS: 69, EMLINK: 34, EPIPE: 64, EDOM: 18, ERANGE: 68, ENOMSG: 49, EIDRM: 24, ECHRNG: 106, EL2NSYNC: 156, EL3HLT: 107, EL3RST: 108, ELNRNG: 109, EUNATCH: 110, ENOCSI: 111, EL2HLT: 112, EDEADLK: 16, ENOLCK: 46, EBADE: 113, EBADR: 114, EXFULL: 115, ENOANO: 104, EBADRQC: 103, EBADSLT: 102, EDEADLOCK: 16, EBFONT: 101, ENOSTR: 100, ENODATA: 116, ETIME: 117, ENOSR: 118, ENONET: 119, ENOPKG: 120, EREMOTE: 121, ENOLINK: 47, EADV: 122, ESRMNT: 123, ECOMM: 124, EPROTO: 65, EMULTIHOP: 36, EDOTDOT: 125, EBADMSG: 9, ENOTUNIQ: 126, EBADFD: 127, EREMCHG: 128, ELIBACC: 129, ELIBBAD: 130, ELIBSCN: 131, ELIBMAX: 132, ELIBEXEC: 133, ENOSYS: 52, ENOTEMPTY: 55, ENAMETOOLONG: 37, ELOOP: 32, EOPNOTSUPP: 138, EPFNOSUPPORT: 139, ECONNRESET: 15, ENOBUFS: 42, EAFNOSUPPORT: 5, EPROTOTYPE: 67, ENOTSOCK: 57, ENOPROTOOPT: 50, ESHUTDOWN: 140, ECONNREFUSED: 14, EADDRINUSE: 3, ECONNABORTED: 13, ENETUNREACH: 40, ENETDOWN: 38, ETIMEDOUT: 73, EHOSTDOWN: 142, EHOSTUNREACH: 23, EINPROGRESS: 26, EALREADY: 7, EDESTADDRREQ: 17, EMSGSIZE: 35, EPROTONOSUPPORT: 66, ESOCKTNOSUPPORT: 137, EADDRNOTAVAIL: 4, ENETRESET: 39, EISCONN: 30, ENOTCONN: 53, ETOOMANYREFS: 141, EUSERS: 136, EDQUOT: 19, ESTALE: 72, ENOTSUP: 138, ENOMEDIUM: 148, EILSEQ: 25, EOVERFLOW: 61, ECANCELED: 11, ENOTRECOVERABLE: 56, EOWNERDEAD: 62, ESTRPIPE: 135 }, NODEFS = { isWindows: false, staticInit() {
      NODEFS.isWindows = !!process.platform.match(/^win/);
      var e = process.binding("constants");
      e.fs && (e = e.fs), NODEFS.flagsForNodeMap = { 1024: e.O_APPEND, 64: e.O_CREAT, 128: e.O_EXCL, 256: e.O_NOCTTY, 0: e.O_RDONLY, 2: e.O_RDWR, 4096: e.O_SYNC, 512: e.O_TRUNC, 1: e.O_WRONLY, 131072: e.O_NOFOLLOW };
    }, convertNodeCode(e) {
      var t2 = e.code;
      return ERRNO_CODES[t2];
    }, tryFSOperation(e) {
      try {
        return e();
      } catch (t2) {
        throw t2.code ? t2.code === "UNKNOWN" ? new FS.ErrnoError(28) : new FS.ErrnoError(NODEFS.convertNodeCode(t2)) : t2;
      }
    }, mount(e) {
      return NODEFS.createNode(null, "/", NODEFS.getMode(e.opts.root), 0);
    }, createNode(e, t2, r, a) {
      if (!FS.isDir(r) && !FS.isFile(r) && !FS.isLink(r)) throw new FS.ErrnoError(28);
      var o3 = FS.createNode(e, t2, r);
      return o3.node_ops = NODEFS.node_ops, o3.stream_ops = NODEFS.stream_ops, o3;
    }, getMode(e) {
      return NODEFS.tryFSOperation(() => {
        var t2 = fs.lstatSync(e).mode;
        return NODEFS.isWindows && (t2 |= (t2 & 292) >> 2), t2;
      });
    }, realPath(e) {
      for (var t2 = []; e.parent !== e; ) t2.push(e.name), e = e.parent;
      return t2.push(e.mount.opts.root), t2.reverse(), PATH.join(...t2);
    }, flagsForNode(e) {
      e &= -2097153, e &= -2049, e &= -32769, e &= -524289, e &= -65537;
      var t2 = 0;
      for (var r in NODEFS.flagsForNodeMap) e & r && (t2 |= NODEFS.flagsForNodeMap[r], e ^= r);
      if (e) throw new FS.ErrnoError(28);
      return t2;
    }, node_ops: { getattr(e) {
      var t2 = NODEFS.realPath(e), r;
      return NODEFS.tryFSOperation(() => r = fs.lstatSync(t2)), NODEFS.isWindows && (r.blksize || (r.blksize = 4096), r.blocks || (r.blocks = (r.size + r.blksize - 1) / r.blksize | 0), r.mode |= (r.mode & 292) >> 2), { dev: r.dev, ino: r.ino, mode: r.mode, nlink: r.nlink, uid: r.uid, gid: r.gid, rdev: r.rdev, size: r.size, atime: r.atime, mtime: r.mtime, ctime: r.ctime, blksize: r.blksize, blocks: r.blocks };
    }, setattr(e, t2) {
      var r = NODEFS.realPath(e);
      NODEFS.tryFSOperation(() => {
        if (t2.mode !== void 0) {
          var a = t2.mode;
          NODEFS.isWindows && (a &= 384), fs.chmodSync(r, a), e.mode = t2.mode;
        }
        if (t2.atime || t2.mtime) {
          var o3 = t2.atime && new Date(t2.atime), s2 = t2.mtime && new Date(t2.mtime);
          fs.utimesSync(r, o3, s2);
        }
        t2.size !== void 0 && fs.truncateSync(r, t2.size);
      });
    }, lookup(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2), a = NODEFS.getMode(r);
      return NODEFS.createNode(e, t2, a);
    }, mknod(e, t2, r, a) {
      var o3 = NODEFS.createNode(e, t2, r, a), s2 = NODEFS.realPath(o3);
      return NODEFS.tryFSOperation(() => {
        FS.isDir(o3.mode) ? fs.mkdirSync(s2, o3.mode) : fs.writeFileSync(s2, "", { mode: o3.mode });
      }), o3;
    }, rename(e, t2, r) {
      var a = NODEFS.realPath(e), o3 = PATH.join2(NODEFS.realPath(t2), r);
      try {
        FS.unlink(o3);
      } catch {
      }
      NODEFS.tryFSOperation(() => fs.renameSync(a, o3)), e.name = r;
    }, unlink(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.unlinkSync(r));
    }, rmdir(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.rmdirSync(r));
    }, readdir(e) {
      var t2 = NODEFS.realPath(e);
      return NODEFS.tryFSOperation(() => fs.readdirSync(t2));
    }, symlink(e, t2, r) {
      var a = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.symlinkSync(r, a));
    }, readlink(e) {
      var t2 = NODEFS.realPath(e);
      return NODEFS.tryFSOperation(() => fs.readlinkSync(t2));
    }, statfs(e) {
      var t2 = NODEFS.tryFSOperation(() => fs.statfsSync(e));
      return t2.frsize = t2.bsize, t2;
    } }, stream_ops: { open(e) {
      var t2 = NODEFS.realPath(e.node);
      NODEFS.tryFSOperation(() => {
        FS.isFile(e.node.mode) && (e.shared.refcount = 1, e.nfd = fs.openSync(t2, NODEFS.flagsForNode(e.flags)));
      });
    }, close(e) {
      NODEFS.tryFSOperation(() => {
        FS.isFile(e.node.mode) && e.nfd && --e.shared.refcount === 0 && fs.closeSync(e.nfd);
      });
    }, dup(e) {
      e.shared.refcount++;
    }, read(e, t2, r, a, o3) {
      return a === 0 ? 0 : NODEFS.tryFSOperation(() => fs.readSync(e.nfd, new Int8Array(t2.buffer, r, a), 0, a, o3));
    }, write(e, t2, r, a, o3) {
      return NODEFS.tryFSOperation(() => fs.writeSync(e.nfd, new Int8Array(t2.buffer, r, a), 0, a, o3));
    }, llseek(e, t2, r) {
      var a = t2;
      if (r === 1 ? a += e.position : r === 2 && FS.isFile(e.node.mode) && NODEFS.tryFSOperation(() => {
        var o3 = fs.fstatSync(e.nfd);
        a += o3.size;
      }), a < 0) throw new FS.ErrnoError(28);
      return a;
    }, mmap(e, t2, r, a, o3) {
      if (!FS.isFile(e.node.mode)) throw new FS.ErrnoError(43);
      var s2 = mmapAlloc(t2);
      return NODEFS.stream_ops.read(e, HEAP8, s2, t2, r), { ptr: s2, allocated: true };
    }, msync(e, t2, r, a, o3) {
      return NODEFS.stream_ops.write(e, t2, 0, a, r, false), 0;
    } } }, FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, ErrnoError: class {
      constructor(e) {
        P(this, "name", "ErrnoError");
        this.errno = e;
      }
    }, filesystems: null, syncFSRequests: 0, readFiles: {}, FSStream: class {
      constructor() {
        P(this, "shared", {});
      }
      get object() {
        return this.node;
      }
      set object(e) {
        this.node = e;
      }
      get isRead() {
        return (this.flags & 2097155) !== 1;
      }
      get isWrite() {
        return (this.flags & 2097155) !== 0;
      }
      get isAppend() {
        return this.flags & 1024;
      }
      get flags() {
        return this.shared.flags;
      }
      set flags(e) {
        this.shared.flags = e;
      }
      get position() {
        return this.shared.position;
      }
      set position(e) {
        this.shared.position = e;
      }
    }, FSNode: class {
      constructor(e, t2, r, a) {
        P(this, "node_ops", {});
        P(this, "stream_ops", {});
        P(this, "readMode", 365);
        P(this, "writeMode", 146);
        P(this, "mounted", null);
        e || (e = this), this.parent = e, this.mount = e.mount, this.id = FS.nextInode++, this.name = t2, this.mode = r, this.rdev = a, this.atime = this.mtime = this.ctime = Date.now();
      }
      get read() {
        return (this.mode & this.readMode) === this.readMode;
      }
      set read(e) {
        e ? this.mode |= this.readMode : this.mode &= ~this.readMode;
      }
      get write() {
        return (this.mode & this.writeMode) === this.writeMode;
      }
      set write(e) {
        e ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
      }
      get isFolder() {
        return FS.isDir(this.mode);
      }
      get isDevice() {
        return FS.isChrdev(this.mode);
      }
    }, lookupPath(e, t2 = {}) {
      if (!e) return { path: "", node: null };
      t2.follow_mount ?? (t2.follow_mount = true), PATH.isAbs(e) || (e = FS.cwd() + "/" + e);
      e: for (var r = 0; r < 40; r++) {
        for (var a = e.split("/").filter((m3) => !!m3 && m3 !== "."), o3 = FS.root, s2 = "/", l2 = 0; l2 < a.length; l2++) {
          var _2 = l2 === a.length - 1;
          if (_2 && t2.parent) break;
          if (a[l2] === "..") {
            s2 = PATH.dirname(s2), o3 = o3.parent;
            continue;
          }
          s2 = PATH.join2(s2, a[l2]);
          try {
            o3 = FS.lookupNode(o3, a[l2]);
          } catch (m3) {
            if (m3?.errno === 44 && _2 && t2.noent_okay) return { path: s2 };
            throw m3;
          }
          if (FS.isMountpoint(o3) && (!_2 || t2.follow_mount) && (o3 = o3.mounted.root), FS.isLink(o3.mode) && (!_2 || t2.follow)) {
            if (!o3.node_ops.readlink) throw new FS.ErrnoError(52);
            var n = o3.node_ops.readlink(o3);
            PATH.isAbs(n) || (n = PATH.dirname(s2) + "/" + n), e = n + "/" + a.slice(l2 + 1).join("/");
            continue e;
          }
        }
        return { path: s2, node: o3 };
      }
      throw new FS.ErrnoError(32);
    }, getPath(e) {
      for (var t2; ; ) {
        if (FS.isRoot(e)) {
          var r = e.mount.mountpoint;
          return t2 ? r[r.length - 1] !== "/" ? `${r}/${t2}` : r + t2 : r;
        }
        t2 = t2 ? `${e.name}/${t2}` : e.name, e = e.parent;
      }
    }, hashName(e, t2) {
      for (var r = 0, a = 0; a < t2.length; a++) r = (r << 5) - r + t2.charCodeAt(a) | 0;
      return (e + r >>> 0) % FS.nameTable.length;
    }, hashAddNode(e) {
      var t2 = FS.hashName(e.parent.id, e.name);
      e.name_next = FS.nameTable[t2], FS.nameTable[t2] = e;
    }, hashRemoveNode(e) {
      var t2 = FS.hashName(e.parent.id, e.name);
      if (FS.nameTable[t2] === e) FS.nameTable[t2] = e.name_next;
      else for (var r = FS.nameTable[t2]; r; ) {
        if (r.name_next === e) {
          r.name_next = e.name_next;
          break;
        }
        r = r.name_next;
      }
    }, lookupNode(e, t2) {
      var r = FS.mayLookup(e);
      if (r) throw new FS.ErrnoError(r);
      for (var a = FS.hashName(e.id, t2), o3 = FS.nameTable[a]; o3; o3 = o3.name_next) {
        var s2 = o3.name;
        if (o3.parent.id === e.id && s2 === t2) return o3;
      }
      return FS.lookup(e, t2);
    }, createNode(e, t2, r, a) {
      var o3 = new FS.FSNode(e, t2, r, a);
      return FS.hashAddNode(o3), o3;
    }, destroyNode(e) {
      FS.hashRemoveNode(e);
    }, isRoot(e) {
      return e === e.parent;
    }, isMountpoint(e) {
      return !!e.mounted;
    }, isFile(e) {
      return (e & 61440) === 32768;
    }, isDir(e) {
      return (e & 61440) === 16384;
    }, isLink(e) {
      return (e & 61440) === 40960;
    }, isChrdev(e) {
      return (e & 61440) === 8192;
    }, isBlkdev(e) {
      return (e & 61440) === 24576;
    }, isFIFO(e) {
      return (e & 61440) === 4096;
    }, isSocket(e) {
      return (e & 49152) === 49152;
    }, flagsToPermissionString(e) {
      var t2 = ["r", "w", "rw"][e & 3];
      return e & 512 && (t2 += "w"), t2;
    }, nodePermissions(e, t2) {
      return FS.ignorePermissions ? 0 : t2.includes("r") && !(e.mode & 292) || t2.includes("w") && !(e.mode & 146) || t2.includes("x") && !(e.mode & 73) ? 2 : 0;
    }, mayLookup(e) {
      if (!FS.isDir(e.mode)) return 54;
      var t2 = FS.nodePermissions(e, "x");
      return t2 || (e.node_ops.lookup ? 0 : 2);
    }, mayCreate(e, t2) {
      if (!FS.isDir(e.mode)) return 54;
      try {
        var r = FS.lookupNode(e, t2);
        return 20;
      } catch {
      }
      return FS.nodePermissions(e, "wx");
    }, mayDelete(e, t2, r) {
      var a;
      try {
        a = FS.lookupNode(e, t2);
      } catch (s2) {
        return s2.errno;
      }
      var o3 = FS.nodePermissions(e, "wx");
      if (o3) return o3;
      if (r) {
        if (!FS.isDir(a.mode)) return 54;
        if (FS.isRoot(a) || FS.getPath(a) === FS.cwd()) return 10;
      } else if (FS.isDir(a.mode)) return 31;
      return 0;
    }, mayOpen(e, t2) {
      return e ? FS.isLink(e.mode) ? 32 : FS.isDir(e.mode) && (FS.flagsToPermissionString(t2) !== "r" || t2 & 512) ? 31 : FS.nodePermissions(e, FS.flagsToPermissionString(t2)) : 44;
    }, MAX_OPEN_FDS: 4096, nextfd() {
      for (var e = 0; e <= FS.MAX_OPEN_FDS; e++) if (!FS.streams[e]) return e;
      throw new FS.ErrnoError(33);
    }, getStreamChecked(e) {
      var t2 = FS.getStream(e);
      if (!t2) throw new FS.ErrnoError(8);
      return t2;
    }, getStream: (e) => FS.streams[e], createStream(e, t2 = -1) {
      return e = Object.assign(new FS.FSStream(), e), t2 == -1 && (t2 = FS.nextfd()), e.fd = t2, FS.streams[t2] = e, e;
    }, closeStream(e) {
      FS.streams[e] = null;
    }, dupStream(e, t2 = -1) {
      var r = FS.createStream(e, t2);
      return r.stream_ops?.dup?.(r), r;
    }, chrdev_stream_ops: { open(e) {
      var t2 = FS.getDevice(e.node.rdev);
      e.stream_ops = t2.stream_ops, e.stream_ops.open?.(e);
    }, llseek() {
      throw new FS.ErrnoError(70);
    } }, major: (e) => e >> 8, minor: (e) => e & 255, makedev: (e, t2) => e << 8 | t2, registerDevice(e, t2) {
      FS.devices[e] = { stream_ops: t2 };
    }, getDevice: (e) => FS.devices[e], getMounts(e) {
      for (var t2 = [], r = [e]; r.length; ) {
        var a = r.pop();
        t2.push(a), r.push(...a.mounts);
      }
      return t2;
    }, syncfs(e, t2) {
      typeof e == "function" && (t2 = e, e = false), FS.syncFSRequests++, FS.syncFSRequests > 1 && err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
      var r = FS.getMounts(FS.root.mount), a = 0;
      function o3(l2) {
        return FS.syncFSRequests--, t2(l2);
      }
      function s2(l2) {
        if (l2) return s2.errored ? void 0 : (s2.errored = true, o3(l2));
        ++a >= r.length && o3(null);
      }
      r.forEach((l2) => {
        if (!l2.type.syncfs) return s2(null);
        l2.type.syncfs(l2, e, s2);
      });
    }, mount(e, t2, r) {
      var a = r === "/", o3 = !r, s2;
      if (a && FS.root) throw new FS.ErrnoError(10);
      if (!a && !o3) {
        var l2 = FS.lookupPath(r, { follow_mount: false });
        if (r = l2.path, s2 = l2.node, FS.isMountpoint(s2)) throw new FS.ErrnoError(10);
        if (!FS.isDir(s2.mode)) throw new FS.ErrnoError(54);
      }
      var _2 = { type: e, opts: t2, mountpoint: r, mounts: [] }, n = e.mount(_2);
      return n.mount = _2, _2.root = n, a ? FS.root = n : s2 && (s2.mounted = _2, s2.mount && s2.mount.mounts.push(_2)), n;
    }, unmount(e) {
      var t2 = FS.lookupPath(e, { follow_mount: false });
      if (!FS.isMountpoint(t2.node)) throw new FS.ErrnoError(28);
      var r = t2.node, a = r.mounted, o3 = FS.getMounts(a);
      Object.keys(FS.nameTable).forEach((l2) => {
        for (var _2 = FS.nameTable[l2]; _2; ) {
          var n = _2.name_next;
          o3.includes(_2.mount) && FS.destroyNode(_2), _2 = n;
        }
      }), r.mounted = null;
      var s2 = r.mount.mounts.indexOf(a);
      r.mount.mounts.splice(s2, 1);
    }, lookup(e, t2) {
      return e.node_ops.lookup(e, t2);
    }, mknod(e, t2, r) {
      var a = FS.lookupPath(e, { parent: true }), o3 = a.node, s2 = PATH.basename(e);
      if (!s2 || s2 === "." || s2 === "..") throw new FS.ErrnoError(28);
      var l2 = FS.mayCreate(o3, s2);
      if (l2) throw new FS.ErrnoError(l2);
      if (!o3.node_ops.mknod) throw new FS.ErrnoError(63);
      return o3.node_ops.mknod(o3, s2, t2, r);
    }, statfs(e) {
      var t2 = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 5e5, bavail: 5e5, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 }, r = FS.lookupPath(e, { follow: true }).node;
      return r?.node_ops.statfs && Object.assign(t2, r.node_ops.statfs(r.mount.opts.root)), t2;
    }, create(e, t2 = 438) {
      return t2 &= 4095, t2 |= 32768, FS.mknod(e, t2, 0);
    }, mkdir(e, t2 = 511) {
      return t2 &= 1023, t2 |= 16384, FS.mknod(e, t2, 0);
    }, mkdirTree(e, t2) {
      for (var r = e.split("/"), a = "", o3 = 0; o3 < r.length; ++o3) if (r[o3]) {
        a += "/" + r[o3];
        try {
          FS.mkdir(a, t2);
        } catch (s2) {
          if (s2.errno != 20) throw s2;
        }
      }
    }, mkdev(e, t2, r) {
      return typeof r > "u" && (r = t2, t2 = 438), t2 |= 8192, FS.mknod(e, t2, r);
    }, symlink(e, t2) {
      if (!PATH_FS.resolve(e)) throw new FS.ErrnoError(44);
      var r = FS.lookupPath(t2, { parent: true }), a = r.node;
      if (!a) throw new FS.ErrnoError(44);
      var o3 = PATH.basename(t2), s2 = FS.mayCreate(a, o3);
      if (s2) throw new FS.ErrnoError(s2);
      if (!a.node_ops.symlink) throw new FS.ErrnoError(63);
      return a.node_ops.symlink(a, o3, e);
    }, rename(e, t2) {
      var r = PATH.dirname(e), a = PATH.dirname(t2), o3 = PATH.basename(e), s2 = PATH.basename(t2), l2, _2, n;
      if (l2 = FS.lookupPath(e, { parent: true }), _2 = l2.node, l2 = FS.lookupPath(t2, { parent: true }), n = l2.node, !_2 || !n) throw new FS.ErrnoError(44);
      if (_2.mount !== n.mount) throw new FS.ErrnoError(75);
      var m3 = FS.lookupNode(_2, o3), p2 = PATH_FS.relative(e, a);
      if (p2.charAt(0) !== ".") throw new FS.ErrnoError(28);
      if (p2 = PATH_FS.relative(t2, r), p2.charAt(0) !== ".") throw new FS.ErrnoError(55);
      var d2;
      try {
        d2 = FS.lookupNode(n, s2);
      } catch {
      }
      if (m3 !== d2) {
        var g3 = FS.isDir(m3.mode), u2 = FS.mayDelete(_2, o3, g3);
        if (u2) throw new FS.ErrnoError(u2);
        if (u2 = d2 ? FS.mayDelete(n, s2, g3) : FS.mayCreate(n, s2), u2) throw new FS.ErrnoError(u2);
        if (!_2.node_ops.rename) throw new FS.ErrnoError(63);
        if (FS.isMountpoint(m3) || d2 && FS.isMountpoint(d2)) throw new FS.ErrnoError(10);
        if (n !== _2 && (u2 = FS.nodePermissions(_2, "w"), u2)) throw new FS.ErrnoError(u2);
        FS.hashRemoveNode(m3);
        try {
          _2.node_ops.rename(m3, n, s2), m3.parent = n;
        } catch (f) {
          throw f;
        } finally {
          FS.hashAddNode(m3);
        }
      }
    }, rmdir(e) {
      var t2 = FS.lookupPath(e, { parent: true }), r = t2.node, a = PATH.basename(e), o3 = FS.lookupNode(r, a), s2 = FS.mayDelete(r, a, true);
      if (s2) throw new FS.ErrnoError(s2);
      if (!r.node_ops.rmdir) throw new FS.ErrnoError(63);
      if (FS.isMountpoint(o3)) throw new FS.ErrnoError(10);
      r.node_ops.rmdir(r, a), FS.destroyNode(o3);
    }, readdir(e) {
      var t2 = FS.lookupPath(e, { follow: true }), r = t2.node;
      if (!r.node_ops.readdir) throw new FS.ErrnoError(54);
      return r.node_ops.readdir(r);
    }, unlink(e) {
      var t2 = FS.lookupPath(e, { parent: true }), r = t2.node;
      if (!r) throw new FS.ErrnoError(44);
      var a = PATH.basename(e), o3 = FS.lookupNode(r, a), s2 = FS.mayDelete(r, a, false);
      if (s2) throw new FS.ErrnoError(s2);
      if (!r.node_ops.unlink) throw new FS.ErrnoError(63);
      if (FS.isMountpoint(o3)) throw new FS.ErrnoError(10);
      r.node_ops.unlink(r, a), FS.destroyNode(o3);
    }, readlink(e) {
      var t2 = FS.lookupPath(e), r = t2.node;
      if (!r) throw new FS.ErrnoError(44);
      if (!r.node_ops.readlink) throw new FS.ErrnoError(28);
      return r.node_ops.readlink(r);
    }, stat(e, t2) {
      var r = FS.lookupPath(e, { follow: !t2 }), a = r.node;
      if (!a) throw new FS.ErrnoError(44);
      if (!a.node_ops.getattr) throw new FS.ErrnoError(63);
      return a.node_ops.getattr(a);
    }, lstat(e) {
      return FS.stat(e, true);
    }, chmod(e, t2, r) {
      var a;
      if (typeof e == "string") {
        var o3 = FS.lookupPath(e, { follow: !r });
        a = o3.node;
      } else a = e;
      if (!a.node_ops.setattr) throw new FS.ErrnoError(63);
      a.node_ops.setattr(a, { mode: t2 & 4095 | a.mode & -4096, ctime: Date.now() });
    }, lchmod(e, t2) {
      FS.chmod(e, t2, true);
    }, fchmod(e, t2) {
      var r = FS.getStreamChecked(e);
      FS.chmod(r.node, t2);
    }, chown(e, t2, r, a) {
      var o3;
      if (typeof e == "string") {
        var s2 = FS.lookupPath(e, { follow: !a });
        o3 = s2.node;
      } else o3 = e;
      if (!o3.node_ops.setattr) throw new FS.ErrnoError(63);
      o3.node_ops.setattr(o3, { timestamp: Date.now() });
    }, lchown(e, t2, r) {
      FS.chown(e, t2, r, true);
    }, fchown(e, t2, r) {
      var a = FS.getStreamChecked(e);
      FS.chown(a.node, t2, r);
    }, truncate(e, t2) {
      if (t2 < 0) throw new FS.ErrnoError(28);
      var r;
      if (typeof e == "string") {
        var a = FS.lookupPath(e, { follow: true });
        r = a.node;
      } else r = e;
      if (!r.node_ops.setattr) throw new FS.ErrnoError(63);
      if (FS.isDir(r.mode)) throw new FS.ErrnoError(31);
      if (!FS.isFile(r.mode)) throw new FS.ErrnoError(28);
      var o3 = FS.nodePermissions(r, "w");
      if (o3) throw new FS.ErrnoError(o3);
      r.node_ops.setattr(r, { size: t2, timestamp: Date.now() });
    }, ftruncate(e, t2) {
      var r = FS.getStreamChecked(e);
      if (!(r.flags & 2097155)) throw new FS.ErrnoError(28);
      FS.truncate(r.node, t2);
    }, utime(e, t2, r) {
      var a = FS.lookupPath(e, { follow: true }), o3 = a.node;
      o3.node_ops.setattr(o3, { atime: t2, mtime: r });
    }, open(e, t2, r = 438) {
      if (e === "") throw new FS.ErrnoError(44);
      t2 = typeof t2 == "string" ? FS_modeStringToFlags(t2) : t2, t2 & 64 ? r = r & 4095 | 32768 : r = 0;
      var a;
      if (typeof e == "object") a = e;
      else {
        var o3 = FS.lookupPath(e, { follow: !(t2 & 131072), noent_okay: true });
        a = o3.node, e = o3.path;
      }
      var s2 = false;
      if (t2 & 64) if (a) {
        if (t2 & 128) throw new FS.ErrnoError(20);
      } else a = FS.mknod(e, r, 0), s2 = true;
      if (!a) throw new FS.ErrnoError(44);
      if (FS.isChrdev(a.mode) && (t2 &= -513), t2 & 65536 && !FS.isDir(a.mode)) throw new FS.ErrnoError(54);
      if (!s2) {
        var l2 = FS.mayOpen(a, t2);
        if (l2) throw new FS.ErrnoError(l2);
      }
      t2 & 512 && !s2 && FS.truncate(a, 0), t2 &= -131713;
      var _2 = FS.createStream({ node: a, path: FS.getPath(a), flags: t2, seekable: true, position: 0, stream_ops: a.stream_ops, ungotten: [], error: false });
      return _2.stream_ops.open && _2.stream_ops.open(_2), Module.logReadFiles && !(t2 & 1) && (e in FS.readFiles || (FS.readFiles[e] = 1)), _2;
    }, close(e) {
      if (FS.isClosed(e)) throw new FS.ErrnoError(8);
      e.getdents && (e.getdents = null);
      try {
        e.stream_ops.close && e.stream_ops.close(e);
      } catch (t2) {
        throw t2;
      } finally {
        FS.closeStream(e.fd);
      }
      e.fd = null;
    }, isClosed(e) {
      return e.fd === null;
    }, llseek(e, t2, r) {
      if (FS.isClosed(e)) throw new FS.ErrnoError(8);
      if (!e.seekable || !e.stream_ops.llseek) throw new FS.ErrnoError(70);
      if (r != 0 && r != 1 && r != 2) throw new FS.ErrnoError(28);
      return e.position = e.stream_ops.llseek(e, t2, r), e.ungotten = [], e.position;
    }, read(e, t2, r, a, o3) {
      if (a < 0 || o3 < 0) throw new FS.ErrnoError(28);
      if (FS.isClosed(e)) throw new FS.ErrnoError(8);
      if ((e.flags & 2097155) === 1) throw new FS.ErrnoError(8);
      if (FS.isDir(e.node.mode)) throw new FS.ErrnoError(31);
      if (!e.stream_ops.read) throw new FS.ErrnoError(28);
      var s2 = typeof o3 < "u";
      if (!s2) o3 = e.position;
      else if (!e.seekable) throw new FS.ErrnoError(70);
      var l2 = e.stream_ops.read(e, t2, r, a, o3);
      return s2 || (e.position += l2), l2;
    }, write(e, t2, r, a, o3, s2) {
      if (a < 0 || o3 < 0) throw new FS.ErrnoError(28);
      if (FS.isClosed(e)) throw new FS.ErrnoError(8);
      if (!(e.flags & 2097155)) throw new FS.ErrnoError(8);
      if (FS.isDir(e.node.mode)) throw new FS.ErrnoError(31);
      if (!e.stream_ops.write) throw new FS.ErrnoError(28);
      e.seekable && e.flags & 1024 && FS.llseek(e, 0, 2);
      var l2 = typeof o3 < "u";
      if (!l2) o3 = e.position;
      else if (!e.seekable) throw new FS.ErrnoError(70);
      var _2 = e.stream_ops.write(e, t2, r, a, o3, s2);
      return l2 || (e.position += _2), _2;
    }, allocate(e, t2, r) {
      if (FS.isClosed(e)) throw new FS.ErrnoError(8);
      if (t2 < 0 || r <= 0) throw new FS.ErrnoError(28);
      if (!(e.flags & 2097155)) throw new FS.ErrnoError(8);
      if (!FS.isFile(e.node.mode) && !FS.isDir(e.node.mode)) throw new FS.ErrnoError(43);
      if (!e.stream_ops.allocate) throw new FS.ErrnoError(138);
      e.stream_ops.allocate(e, t2, r);
    }, mmap(e, t2, r, a, o3) {
      if (a & 2 && !(o3 & 2) && (e.flags & 2097155) !== 2) throw new FS.ErrnoError(2);
      if ((e.flags & 2097155) === 1) throw new FS.ErrnoError(2);
      if (!e.stream_ops.mmap) throw new FS.ErrnoError(43);
      if (!t2) throw new FS.ErrnoError(28);
      return e.stream_ops.mmap(e, t2, r, a, o3);
    }, msync(e, t2, r, a, o3) {
      return e.stream_ops.msync ? e.stream_ops.msync(e, t2, r, a, o3) : 0;
    }, ioctl(e, t2, r) {
      if (!e.stream_ops.ioctl) throw new FS.ErrnoError(59);
      return e.stream_ops.ioctl(e, t2, r);
    }, readFile(e, t2 = {}) {
      if (t2.flags = t2.flags || 0, t2.encoding = t2.encoding || "binary", t2.encoding !== "utf8" && t2.encoding !== "binary") throw new Error(`Invalid encoding type "${t2.encoding}"`);
      var r, a = FS.open(e, t2.flags), o3 = FS.stat(e), s2 = o3.size, l2 = new Uint8Array(s2);
      return FS.read(a, l2, 0, s2, 0), t2.encoding === "utf8" ? r = UTF8ArrayToString(l2) : t2.encoding === "binary" && (r = l2), FS.close(a), r;
    }, writeFile(e, t2, r = {}) {
      r.flags = r.flags || 577;
      var a = FS.open(e, r.flags, r.mode);
      if (typeof t2 == "string") {
        var o3 = new Uint8Array(lengthBytesUTF8(t2) + 1), s2 = stringToUTF8Array(t2, o3, 0, o3.length);
        FS.write(a, o3, 0, s2, void 0, r.canOwn);
      } else if (ArrayBuffer.isView(t2)) FS.write(a, t2, 0, t2.byteLength, void 0, r.canOwn);
      else throw new Error("Unsupported data type");
      FS.close(a);
    }, cwd: () => FS.currentPath, chdir(e) {
      var t2 = FS.lookupPath(e, { follow: true });
      if (t2.node === null) throw new FS.ErrnoError(44);
      if (!FS.isDir(t2.node.mode)) throw new FS.ErrnoError(54);
      var r = FS.nodePermissions(t2.node, "x");
      if (r) throw new FS.ErrnoError(r);
      FS.currentPath = t2.path;
    }, createDefaultDirectories() {
      FS.mkdir("/tmp"), FS.mkdir("/home"), FS.mkdir("/home/web_user");
    }, createDefaultDevices() {
      FS.mkdir("/dev"), FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (a, o3, s2, l2, _2) => l2, llseek: () => 0 }), FS.mkdev("/dev/null", FS.makedev(1, 3)), TTY.register(FS.makedev(5, 0), TTY.default_tty_ops), TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops), FS.mkdev("/dev/tty", FS.makedev(5, 0)), FS.mkdev("/dev/tty1", FS.makedev(6, 0));
      var e = new Uint8Array(1024), t2 = 0, r = () => (t2 === 0 && (t2 = randomFill(e).byteLength), e[--t2]);
      FS.createDevice("/dev", "random", r), FS.createDevice("/dev", "urandom", r), FS.mkdir("/dev/shm"), FS.mkdir("/dev/shm/tmp");
    }, createSpecialDirectories() {
      FS.mkdir("/proc");
      var e = FS.mkdir("/proc/self");
      FS.mkdir("/proc/self/fd"), FS.mount({ mount() {
        var t2 = FS.createNode(e, "fd", 16895, 73);
        return t2.stream_ops = { llseek: MEMFS.stream_ops.llseek }, t2.node_ops = { lookup(r, a) {
          var o3 = +a, s2 = FS.getStreamChecked(o3), l2 = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => s2.path }, id: o3 + 1 };
          return l2.parent = l2, l2;
        }, readdir() {
          return Array.from(FS.streams.entries()).filter(([r, a]) => a).map(([r, a]) => r.toString());
        } }, t2;
      } }, {}, "/proc/self/fd");
    }, createStandardStreams(e, t2, r) {
      e ? FS.createDevice("/dev", "stdin", e) : FS.symlink("/dev/tty", "/dev/stdin"), t2 ? FS.createDevice("/dev", "stdout", null, t2) : FS.symlink("/dev/tty", "/dev/stdout"), r ? FS.createDevice("/dev", "stderr", null, r) : FS.symlink("/dev/tty1", "/dev/stderr");
      var a = FS.open("/dev/stdin", 0), o3 = FS.open("/dev/stdout", 1), s2 = FS.open("/dev/stderr", 1);
    }, staticInit() {
      FS.nameTable = new Array(4096), FS.mount(MEMFS, {}, "/"), FS.createDefaultDirectories(), FS.createDefaultDevices(), FS.createSpecialDirectories(), FS.filesystems = { MEMFS, IDBFS, NODEFS };
    }, init(e, t2, r) {
      FS.initialized = true, e ?? (e = Module.stdin), t2 ?? (t2 = Module.stdout), r ?? (r = Module.stderr), FS.createStandardStreams(e, t2, r);
    }, quit() {
      FS.initialized = false, _fflush(0);
      for (var e = 0; e < FS.streams.length; e++) {
        var t2 = FS.streams[e];
        t2 && FS.close(t2);
      }
    }, findObject(e, t2) {
      var r = FS.analyzePath(e, t2);
      return r.exists ? r.object : null;
    }, analyzePath(e, t2) {
      try {
        var r = FS.lookupPath(e, { follow: !t2 });
        e = r.path;
      } catch {
      }
      var a = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
      try {
        var r = FS.lookupPath(e, { parent: true });
        a.parentExists = true, a.parentPath = r.path, a.parentObject = r.node, a.name = PATH.basename(e), r = FS.lookupPath(e, { follow: !t2 }), a.exists = true, a.path = r.path, a.object = r.node, a.name = r.node.name, a.isRoot = r.path === "/";
      } catch (o3) {
        a.error = o3.errno;
      }
      return a;
    }, createPath(e, t2, r, a) {
      e = typeof e == "string" ? e : FS.getPath(e);
      for (var o3 = t2.split("/").reverse(); o3.length; ) {
        var s2 = o3.pop();
        if (s2) {
          var l2 = PATH.join2(e, s2);
          try {
            FS.mkdir(l2);
          } catch {
          }
          e = l2;
        }
      }
      return l2;
    }, createFile(e, t2, r, a, o3) {
      var s2 = PATH.join2(typeof e == "string" ? e : FS.getPath(e), t2), l2 = FS_getMode(a, o3);
      return FS.create(s2, l2);
    }, createDataFile(e, t2, r, a, o3, s2) {
      var l2 = t2;
      e && (e = typeof e == "string" ? e : FS.getPath(e), l2 = t2 ? PATH.join2(e, t2) : e);
      var _2 = FS_getMode(a, o3), n = FS.create(l2, _2);
      if (r) {
        if (typeof r == "string") {
          for (var m3 = new Array(r.length), p2 = 0, d2 = r.length; p2 < d2; ++p2) m3[p2] = r.charCodeAt(p2);
          r = m3;
        }
        FS.chmod(n, _2 | 146);
        var g3 = FS.open(n, 577);
        FS.write(g3, r, 0, r.length, 0, s2), FS.close(g3), FS.chmod(n, _2);
      }
    }, createDevice(e, t2, r, a) {
      var _2;
      var o3 = PATH.join2(typeof e == "string" ? e : FS.getPath(e), t2), s2 = FS_getMode(!!r, !!a);
      (_2 = FS.createDevice).major ?? (_2.major = 64);
      var l2 = FS.makedev(FS.createDevice.major++, 0);
      return FS.registerDevice(l2, { open(n) {
        n.seekable = false;
      }, close(n) {
        a?.buffer?.length && a(10);
      }, read(n, m3, p2, d2, g3) {
        for (var u2 = 0, f = 0; f < d2; f++) {
          var c;
          try {
            c = r();
          } catch {
            throw new FS.ErrnoError(29);
          }
          if (c === void 0 && u2 === 0) throw new FS.ErrnoError(6);
          if (c == null) break;
          u2++, m3[p2 + f] = c;
        }
        return u2 && (n.node.atime = Date.now()), u2;
      }, write(n, m3, p2, d2, g3) {
        for (var u2 = 0; u2 < d2; u2++) try {
          a(m3[p2 + u2]);
        } catch {
          throw new FS.ErrnoError(29);
        }
        return d2 && (n.node.mtime = n.node.ctime = Date.now()), u2;
      } }), FS.mkdev(o3, s2, l2);
    }, forceLoadFile(e) {
      if (e.isDevice || e.isFolder || e.link || e.contents) return true;
      if (typeof XMLHttpRequest < "u") throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
      try {
        e.contents = readBinary(e.url), e.usedBytes = e.contents.length;
      } catch {
        throw new FS.ErrnoError(29);
      }
    }, createLazyFile(e, t2, r, a, o3) {
      class s2 {
        constructor() {
          P(this, "lengthKnown", false);
          P(this, "chunks", []);
        }
        get(u2) {
          if (!(u2 > this.length - 1 || u2 < 0)) {
            var f = u2 % this.chunkSize, c = u2 / this.chunkSize | 0;
            return this.getter(c)[f];
          }
        }
        setDataGetter(u2) {
          this.getter = u2;
        }
        cacheLength() {
          var u2 = new XMLHttpRequest();
          if (u2.open("HEAD", r, false), u2.send(null), !(u2.status >= 200 && u2.status < 300 || u2.status === 304)) throw new Error("Couldn't load " + r + ". Status: " + u2.status);
          var f = Number(u2.getResponseHeader("Content-length")), c, w2 = (c = u2.getResponseHeader("Accept-Ranges")) && c === "bytes", v2 = (c = u2.getResponseHeader("Content-Encoding")) && c === "gzip", S2 = 1024 * 1024;
          w2 || (S2 = f);
          var x4 = (M2, E3) => {
            if (M2 > E3) throw new Error("invalid range (" + M2 + ", " + E3 + ") or no bytes requested!");
            if (E3 > f - 1) throw new Error("only " + f + " bytes available! programmer error!");
            var b2 = new XMLHttpRequest();
            if (b2.open("GET", r, false), f !== S2 && b2.setRequestHeader("Range", "bytes=" + M2 + "-" + E3), b2.responseType = "arraybuffer", b2.overrideMimeType && b2.overrideMimeType("text/plain; charset=x-user-defined"), b2.send(null), !(b2.status >= 200 && b2.status < 300 || b2.status === 304)) throw new Error("Couldn't load " + r + ". Status: " + b2.status);
            return b2.response !== void 0 ? new Uint8Array(b2.response || []) : intArrayFromString(b2.responseText || "", true);
          }, y3 = this;
          y3.setDataGetter((M2) => {
            var E3 = M2 * S2, b2 = (M2 + 1) * S2 - 1;
            if (b2 = Math.min(b2, f - 1), typeof y3.chunks[M2] > "u" && (y3.chunks[M2] = x4(E3, b2)), typeof y3.chunks[M2] > "u") throw new Error("doXHR failed!");
            return y3.chunks[M2];
          }), (v2 || !f) && (S2 = f = 1, f = this.getter(0).length, S2 = f, out("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = f, this._chunkSize = S2, this.lengthKnown = true;
        }
        get length() {
          return this.lengthKnown || this.cacheLength(), this._length;
        }
        get chunkSize() {
          return this.lengthKnown || this.cacheLength(), this._chunkSize;
        }
      }
      if (typeof XMLHttpRequest < "u") {
        if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
        var l2 = new s2(), _2 = { isDevice: false, contents: l2 };
      } else var _2 = { isDevice: false, url: r };
      var n = FS.createFile(e, t2, _2, a, o3);
      _2.contents ? n.contents = _2.contents : _2.url && (n.contents = null, n.url = _2.url), Object.defineProperties(n, { usedBytes: { get: function() {
        return this.contents.length;
      } } });
      var m3 = {}, p2 = Object.keys(n.stream_ops);
      p2.forEach((g3) => {
        var u2 = n.stream_ops[g3];
        m3[g3] = (...f) => (FS.forceLoadFile(n), u2(...f));
      });
      function d2(g3, u2, f, c, w2) {
        var v2 = g3.node.contents;
        if (w2 >= v2.length) return 0;
        var S2 = Math.min(v2.length - w2, c);
        if (v2.slice) for (var x4 = 0; x4 < S2; x4++) u2[f + x4] = v2[w2 + x4];
        else for (var x4 = 0; x4 < S2; x4++) u2[f + x4] = v2.get(w2 + x4);
        return S2;
      }
      return m3.read = (g3, u2, f, c, w2) => (FS.forceLoadFile(n), d2(g3, u2, f, c, w2)), m3.mmap = (g3, u2, f, c, w2) => {
        FS.forceLoadFile(n);
        var v2 = mmapAlloc(u2);
        if (!v2) throw new FS.ErrnoError(48);
        return d2(g3, HEAP8, v2, u2, f), { ptr: v2, allocated: true };
      }, n.stream_ops = m3, n;
    } }, SYSCALLS = { DEFAULT_POLLMASK: 5, calculateAt(e, t2, r) {
      if (PATH.isAbs(t2)) return t2;
      var a;
      if (e === -100) a = FS.cwd();
      else {
        var o3 = SYSCALLS.getStreamFromFD(e);
        a = o3.path;
      }
      if (t2.length == 0) {
        if (!r) throw new FS.ErrnoError(44);
        return a;
      }
      return a + "/" + t2;
    }, doStat(e, t2, r) {
      var a = e(t2);
      HEAP32[r >> 2] = a.dev, HEAP32[r + 4 >> 2] = a.mode, HEAPU32[r + 8 >> 2] = a.nlink, HEAP32[r + 12 >> 2] = a.uid, HEAP32[r + 16 >> 2] = a.gid, HEAP32[r + 20 >> 2] = a.rdev, HEAP64[r + 24 >> 3] = BigInt(a.size), HEAP32[r + 32 >> 2] = 4096, HEAP32[r + 36 >> 2] = a.blocks;
      var o3 = a.atime.getTime(), s2 = a.mtime.getTime(), l2 = a.ctime.getTime();
      return HEAP64[r + 40 >> 3] = BigInt(Math.floor(o3 / 1e3)), HEAPU32[r + 48 >> 2] = o3 % 1e3 * 1e3 * 1e3, HEAP64[r + 56 >> 3] = BigInt(Math.floor(s2 / 1e3)), HEAPU32[r + 64 >> 2] = s2 % 1e3 * 1e3 * 1e3, HEAP64[r + 72 >> 3] = BigInt(Math.floor(l2 / 1e3)), HEAPU32[r + 80 >> 2] = l2 % 1e3 * 1e3 * 1e3, HEAP64[r + 88 >> 3] = BigInt(a.ino), 0;
    }, doMsync(e, t2, r, a, o3) {
      if (!FS.isFile(t2.node.mode)) throw new FS.ErrnoError(43);
      if (a & 2) return 0;
      var s2 = HEAPU8.slice(e, e + r);
      FS.msync(t2, s2, o3, r, a);
    }, getStreamFromFD(e) {
      var t2 = FS.getStreamChecked(e);
      return t2;
    }, varargs: void 0, getStr(e) {
      var t2 = UTF8ToString(e);
      return t2;
    } }, ___syscall__newselect = function(e, t2, r, a, o3) {
      try {
        for (var s2 = 0, l2 = t2 ? HEAP32[t2 >> 2] : 0, _2 = t2 ? HEAP32[t2 + 4 >> 2] : 0, n = r ? HEAP32[r >> 2] : 0, m3 = r ? HEAP32[r + 4 >> 2] : 0, p2 = a ? HEAP32[a >> 2] : 0, d2 = a ? HEAP32[a + 4 >> 2] : 0, g3 = 0, u2 = 0, f = 0, c = 0, w2 = 0, v2 = 0, S2 = (t2 ? HEAP32[t2 >> 2] : 0) | (r ? HEAP32[r >> 2] : 0) | (a ? HEAP32[a >> 2] : 0), x4 = (t2 ? HEAP32[t2 + 4 >> 2] : 0) | (r ? HEAP32[r + 4 >> 2] : 0) | (a ? HEAP32[a + 4 >> 2] : 0), y3 = (N2, P3, R3, k) => N2 < 32 ? P3 & k : R3 & k, M2 = 0; M2 < e; M2++) {
          var E3 = 1 << M2 % 32;
          if (y3(M2, S2, x4, E3)) {
            var b2 = SYSCALLS.getStreamFromFD(M2), U3 = SYSCALLS.DEFAULT_POLLMASK;
            if (b2.stream_ops.poll) {
              var z2 = -1;
              if (o3) {
                var W2 = t2 ? HEAP32[o3 >> 2] : 0, D2 = t2 ? HEAP32[o3 + 4 >> 2] : 0;
                z2 = (W2 + D2 / 1e6) * 1e3;
              }
              U3 = b2.stream_ops.poll(b2, z2);
            }
            U3 & 1 && y3(M2, l2, _2, E3) && (M2 < 32 ? g3 = g3 | E3 : u2 = u2 | E3, s2++), U3 & 4 && y3(M2, n, m3, E3) && (M2 < 32 ? f = f | E3 : c = c | E3, s2++), U3 & 2 && y3(M2, p2, d2, E3) && (M2 < 32 ? w2 = w2 | E3 : v2 = v2 | E3, s2++);
          }
        }
        return t2 && (HEAP32[t2 >> 2] = g3, HEAP32[t2 + 4 >> 2] = u2), r && (HEAP32[r >> 2] = f, HEAP32[r + 4 >> 2] = c), a && (HEAP32[a >> 2] = w2, HEAP32[a + 4 >> 2] = v2), s2;
      } catch (N2) {
        if (typeof FS > "u" || N2.name !== "ErrnoError") throw N2;
        return -N2.errno;
      }
    };
    ___syscall__newselect.sig = "iipppp";
    var SOCKFS = { websocketArgs: {}, callbacks: {}, on(e, t2) {
      SOCKFS.callbacks[e] = t2;
    }, emit(e, t2) {
      SOCKFS.callbacks[e]?.(t2);
    }, mount(e) {
      return SOCKFS.websocketArgs = Module.websocket || {}, (Module.websocket ?? (Module.websocket = {})).on = SOCKFS.on, FS.createNode(null, "/", 16895, 0);
    }, createSocket(e, t2, r) {
      t2 &= -526337;
      var a = t2 == 1;
      if (a && r && r != 6) throw new FS.ErrnoError(66);
      var o3 = { family: e, type: t2, protocol: r, server: null, error: null, peers: {}, pending: [], recv_queue: [], sock_ops: SOCKFS.websocket_sock_ops }, s2 = SOCKFS.nextname(), l2 = FS.createNode(SOCKFS.root, s2, 49152, 0);
      l2.sock = o3;
      var _2 = FS.createStream({ path: s2, node: l2, flags: 2, seekable: false, stream_ops: SOCKFS.stream_ops });
      return o3.stream = _2, o3;
    }, getSocket(e) {
      var t2 = FS.getStream(e);
      return !t2 || !FS.isSocket(t2.node.mode) ? null : t2.node.sock;
    }, stream_ops: { poll(e) {
      var t2 = e.node.sock;
      return t2.sock_ops.poll(t2);
    }, ioctl(e, t2, r) {
      var a = e.node.sock;
      return a.sock_ops.ioctl(a, t2, r);
    }, read(e, t2, r, a, o3) {
      var s2 = e.node.sock, l2 = s2.sock_ops.recvmsg(s2, a);
      return l2 ? (t2.set(l2.buffer, r), l2.buffer.length) : 0;
    }, write(e, t2, r, a, o3) {
      var s2 = e.node.sock;
      return s2.sock_ops.sendmsg(s2, t2, r, a);
    }, close(e) {
      var t2 = e.node.sock;
      t2.sock_ops.close(t2);
    } }, nextname() {
      return SOCKFS.nextname.current || (SOCKFS.nextname.current = 0), `socket[${SOCKFS.nextname.current++}]`;
    }, websocket_sock_ops: { createPeer(e, t2, r) {
      var a;
      if (typeof t2 == "object" && (a = t2, t2 = null, r = null), a) if (a._socket) t2 = a._socket.remoteAddress, r = a._socket.remotePort;
      else {
        var o3 = /ws[s]?:\/\/([^:]+):(\d+)/.exec(a.url);
        if (!o3) throw new Error("WebSocket URL must be in the format ws(s)://address:port");
        t2 = o3[1], r = parseInt(o3[2], 10);
      }
      else try {
        var s2 = "ws:#".replace("#", "//"), l2 = "binary", _2 = void 0;
        if (SOCKFS.websocketArgs.url && (s2 = SOCKFS.websocketArgs.url), SOCKFS.websocketArgs.subprotocol ? l2 = SOCKFS.websocketArgs.subprotocol : SOCKFS.websocketArgs.subprotocol === null && (l2 = "null"), s2 === "ws://" || s2 === "wss://") {
          var n = t2.split("/");
          s2 = s2 + n[0] + ":" + r + "/" + n.slice(1).join("/");
        }
        l2 !== "null" && (l2 = l2.replace(/^ +| +$/g, "").split(/ *, */), _2 = l2);
        var m3;
        ENVIRONMENT_IS_NODE ? m3 = require("ws") : m3 = WebSocket, a = new m3(s2, _2), a.binaryType = "arraybuffer";
      } catch {
        throw new FS.ErrnoError(23);
      }
      var p2 = { addr: t2, port: r, socket: a, msg_send_queue: [] };
      return SOCKFS.websocket_sock_ops.addPeer(e, p2), SOCKFS.websocket_sock_ops.handlePeerEvents(e, p2), e.type === 2 && typeof e.sport < "u" && p2.msg_send_queue.push(new Uint8Array([255, 255, 255, 255, 112, 111, 114, 116, (e.sport & 65280) >> 8, e.sport & 255])), p2;
    }, getPeer(e, t2, r) {
      return e.peers[t2 + ":" + r];
    }, addPeer(e, t2) {
      e.peers[t2.addr + ":" + t2.port] = t2;
    }, removePeer(e, t2) {
      delete e.peers[t2.addr + ":" + t2.port];
    }, handlePeerEvents(e, t2) {
      var r = true, a = function() {
        e.connecting = false, SOCKFS.emit("open", e.stream.fd);
        try {
          for (var s2 = t2.msg_send_queue.shift(); s2; ) t2.socket.send(s2), s2 = t2.msg_send_queue.shift();
        } catch {
          t2.socket.close();
        }
      };
      function o3(s2) {
        if (typeof s2 == "string") {
          var l2 = new TextEncoder();
          s2 = l2.encode(s2);
        } else {
          if (assert(s2.byteLength !== void 0), s2.byteLength == 0) return;
          s2 = new Uint8Array(s2);
        }
        var _2 = r;
        if (r = false, _2 && s2.length === 10 && s2[0] === 255 && s2[1] === 255 && s2[2] === 255 && s2[3] === 255 && s2[4] === 112 && s2[5] === 111 && s2[6] === 114 && s2[7] === 116) {
          var n = s2[8] << 8 | s2[9];
          SOCKFS.websocket_sock_ops.removePeer(e, t2), t2.port = n, SOCKFS.websocket_sock_ops.addPeer(e, t2);
          return;
        }
        e.recv_queue.push({ addr: t2.addr, port: t2.port, data: s2 }), SOCKFS.emit("message", e.stream.fd);
      }
      ENVIRONMENT_IS_NODE ? (t2.socket.on("open", a), t2.socket.on("message", function(s2, l2) {
        l2 && o3(new Uint8Array(s2).buffer);
      }), t2.socket.on("close", function() {
        SOCKFS.emit("close", e.stream.fd);
      }), t2.socket.on("error", function(s2) {
        e.error = 14, SOCKFS.emit("error", [e.stream.fd, e.error, "ECONNREFUSED: Connection refused"]);
      })) : (t2.socket.onopen = a, t2.socket.onclose = function() {
        SOCKFS.emit("close", e.stream.fd);
      }, t2.socket.onmessage = function(l2) {
        o3(l2.data);
      }, t2.socket.onerror = function(s2) {
        e.error = 14, SOCKFS.emit("error", [e.stream.fd, e.error, "ECONNREFUSED: Connection refused"]);
      });
    }, poll(e) {
      if (e.type === 1 && e.server) return e.pending.length ? 65 : 0;
      var t2 = 0, r = e.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport) : null;
      return (e.recv_queue.length || !r || r && r.socket.readyState === r.socket.CLOSING || r && r.socket.readyState === r.socket.CLOSED) && (t2 |= 65), (!r || r && r.socket.readyState === r.socket.OPEN) && (t2 |= 4), (r && r.socket.readyState === r.socket.CLOSING || r && r.socket.readyState === r.socket.CLOSED) && (e.connecting ? t2 |= 4 : t2 |= 16), t2;
    }, ioctl(e, t2, r) {
      switch (t2) {
        case 21531:
          var a = 0;
          return e.recv_queue.length && (a = e.recv_queue[0].data.length), HEAP32[r >> 2] = a, 0;
        default:
          return 28;
      }
    }, close(e) {
      if (e.server) {
        try {
          e.server.close();
        } catch {
        }
        e.server = null;
      }
      for (var t2 = Object.keys(e.peers), r = 0; r < t2.length; r++) {
        var a = e.peers[t2[r]];
        try {
          a.socket.close();
        } catch {
        }
        SOCKFS.websocket_sock_ops.removePeer(e, a);
      }
      return 0;
    }, bind(e, t2, r) {
      if (typeof e.saddr < "u" || typeof e.sport < "u") throw new FS.ErrnoError(28);
      if (e.saddr = t2, e.sport = r, e.type === 2) {
        e.server && (e.server.close(), e.server = null);
        try {
          e.sock_ops.listen(e, 0);
        } catch (a) {
          if (a.name !== "ErrnoError" || a.errno !== 138) throw a;
        }
      }
    }, connect(e, t2, r) {
      if (e.server) throw new FS.ErrnoError(138);
      if (typeof e.daddr < "u" && typeof e.dport < "u") {
        var a = SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport);
        if (a) throw a.socket.readyState === a.socket.CONNECTING ? new FS.ErrnoError(7) : new FS.ErrnoError(30);
      }
      var o3 = SOCKFS.websocket_sock_ops.createPeer(e, t2, r);
      e.daddr = o3.addr, e.dport = o3.port, e.connecting = true;
    }, listen(e, t2) {
      if (!ENVIRONMENT_IS_NODE) throw new FS.ErrnoError(138);
      if (e.server) throw new FS.ErrnoError(28);
      var r = require("ws").Server, a = e.saddr;
      e.server = new r({ host: a, port: e.sport }), SOCKFS.emit("listen", e.stream.fd), e.server.on("connection", function(o3) {
        if (e.type === 1) {
          var s2 = SOCKFS.createSocket(e.family, e.type, e.protocol), l2 = SOCKFS.websocket_sock_ops.createPeer(s2, o3);
          s2.daddr = l2.addr, s2.dport = l2.port, e.pending.push(s2), SOCKFS.emit("connection", s2.stream.fd);
        } else SOCKFS.websocket_sock_ops.createPeer(e, o3), SOCKFS.emit("connection", e.stream.fd);
      }), e.server.on("close", function() {
        SOCKFS.emit("close", e.stream.fd), e.server = null;
      }), e.server.on("error", function(o3) {
        e.error = 23, SOCKFS.emit("error", [e.stream.fd, e.error, "EHOSTUNREACH: Host is unreachable"]);
      });
    }, accept(e) {
      if (!e.server || !e.pending.length) throw new FS.ErrnoError(28);
      var t2 = e.pending.shift();
      return t2.stream.flags = e.stream.flags, t2;
    }, getname(e, t2) {
      var r, a;
      if (t2) {
        if (e.daddr === void 0 || e.dport === void 0) throw new FS.ErrnoError(53);
        r = e.daddr, a = e.dport;
      } else r = e.saddr || 0, a = e.sport || 0;
      return { addr: r, port: a };
    }, sendmsg(e, t2, r, a, o3, s2) {
      if (e.type === 2) {
        if ((o3 === void 0 || s2 === void 0) && (o3 = e.daddr, s2 = e.dport), o3 === void 0 || s2 === void 0) throw new FS.ErrnoError(17);
      } else o3 = e.daddr, s2 = e.dport;
      var l2 = SOCKFS.websocket_sock_ops.getPeer(e, o3, s2);
      if (e.type === 1 && (!l2 || l2.socket.readyState === l2.socket.CLOSING || l2.socket.readyState === l2.socket.CLOSED)) throw new FS.ErrnoError(53);
      ArrayBuffer.isView(t2) && (r += t2.byteOffset, t2 = t2.buffer);
      var _2 = t2.slice(r, r + a);
      if (!l2 || l2.socket.readyState !== l2.socket.OPEN) return e.type === 2 && (!l2 || l2.socket.readyState === l2.socket.CLOSING || l2.socket.readyState === l2.socket.CLOSED) && (l2 = SOCKFS.websocket_sock_ops.createPeer(e, o3, s2)), l2.msg_send_queue.push(_2), a;
      try {
        return l2.socket.send(_2), a;
      } catch {
        throw new FS.ErrnoError(28);
      }
    }, recvmsg(e, t2) {
      if (e.type === 1 && e.server) throw new FS.ErrnoError(53);
      var r = e.recv_queue.shift();
      if (!r) {
        if (e.type === 1) {
          var a = SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport);
          if (!a) throw new FS.ErrnoError(53);
          if (a.socket.readyState === a.socket.CLOSING || a.socket.readyState === a.socket.CLOSED) return null;
          throw new FS.ErrnoError(6);
        }
        throw new FS.ErrnoError(6);
      }
      var o3 = r.data.byteLength || r.data.length, s2 = r.data.byteOffset || 0, l2 = r.data.buffer || r.data, _2 = Math.min(t2, o3), n = { buffer: new Uint8Array(l2, s2, _2), addr: r.addr, port: r.port };
      if (e.type === 1 && _2 < o3) {
        var m3 = o3 - _2;
        r.data = new Uint8Array(l2, s2 + _2, m3), e.recv_queue.unshift(r);
      }
      return n;
    } } }, getSocketFromFD = (e) => {
      var t2 = SOCKFS.getSocket(e);
      if (!t2) throw new FS.ErrnoError(8);
      return t2;
    }, inetPton4 = (e) => {
      for (var t2 = e.split("."), r = 0; r < 4; r++) {
        var a = Number(t2[r]);
        if (isNaN(a)) return null;
        t2[r] = a;
      }
      return (t2[0] | t2[1] << 8 | t2[2] << 16 | t2[3] << 24) >>> 0;
    }, jstoi_q = (e) => parseInt(e), inetPton6 = (e) => {
      var t2, r, a, o3, s2 = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i, l2 = [];
      if (!s2.test(e)) return null;
      if (e === "::") return [0, 0, 0, 0, 0, 0, 0, 0];
      for (e.startsWith("::") ? e = e.replace("::", "Z:") : e = e.replace("::", ":Z:"), e.indexOf(".") > 0 ? (e = e.replace(new RegExp("[.]", "g"), ":"), t2 = e.split(":"), t2[t2.length - 4] = jstoi_q(t2[t2.length - 4]) + jstoi_q(t2[t2.length - 3]) * 256, t2[t2.length - 3] = jstoi_q(t2[t2.length - 2]) + jstoi_q(t2[t2.length - 1]) * 256, t2 = t2.slice(0, t2.length - 2)) : t2 = e.split(":"), a = 0, o3 = 0, r = 0; r < t2.length; r++) if (typeof t2[r] == "string") if (t2[r] === "Z") {
        for (o3 = 0; o3 < 8 - t2.length + 1; o3++) l2[r + o3] = 0;
        a = o3 - 1;
      } else l2[r + a] = _htons(parseInt(t2[r], 16));
      else l2[r + a] = t2[r];
      return [l2[1] << 16 | l2[0], l2[3] << 16 | l2[2], l2[5] << 16 | l2[4], l2[7] << 16 | l2[6]];
    }, writeSockaddr = (e, t2, r, a, o3) => {
      switch (t2) {
        case 2:
          r = inetPton4(r), zeroMemory(e, 16), o3 && (HEAP32[o3 >> 2] = 16), HEAP16[e >> 1] = t2, HEAP32[e + 4 >> 2] = r, HEAP16[e + 2 >> 1] = _htons(a);
          break;
        case 10:
          r = inetPton6(r), zeroMemory(e, 28), o3 && (HEAP32[o3 >> 2] = 28), HEAP32[e >> 2] = t2, HEAP32[e + 8 >> 2] = r[0], HEAP32[e + 12 >> 2] = r[1], HEAP32[e + 16 >> 2] = r[2], HEAP32[e + 20 >> 2] = r[3], HEAP16[e + 2 >> 1] = _htons(a);
          break;
        default:
          return 5;
      }
      return 0;
    }, DNS = { address_map: { id: 1, addrs: {}, names: {} }, lookup_name(e) {
      var t2 = inetPton4(e);
      if (t2 !== null || (t2 = inetPton6(e), t2 !== null)) return e;
      var r;
      if (DNS.address_map.addrs[e]) r = DNS.address_map.addrs[e];
      else {
        var a = DNS.address_map.id++;
        assert(a < 65535, "exceeded max address mappings of 65535"), r = "172.29." + (a & 255) + "." + (a & 65280), DNS.address_map.names[r] = e, DNS.address_map.addrs[e] = r;
      }
      return r;
    }, lookup_addr(e) {
      return DNS.address_map.names[e] ? DNS.address_map.names[e] : null;
    } };
    function ___syscall_accept4(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e), _2 = l2.sock_ops.accept(l2);
        if (t2) var n = writeSockaddr(t2, _2.family, DNS.lookup_name(_2.daddr), _2.dport, r);
        return _2.stream.fd;
      } catch (m3) {
        if (typeof FS > "u" || m3.name !== "ErrnoError") throw m3;
        return -m3.errno;
      }
    }
    ___syscall_accept4.sig = "iippiii";
    var inetNtop4 = (e) => (e & 255) + "." + (e >> 8 & 255) + "." + (e >> 16 & 255) + "." + (e >> 24 & 255), inetNtop6 = (e) => {
      var t2 = "", r = 0, a = 0, o3 = 0, s2 = 0, l2 = 0, _2 = 0, n = [e[0] & 65535, e[0] >> 16, e[1] & 65535, e[1] >> 16, e[2] & 65535, e[2] >> 16, e[3] & 65535, e[3] >> 16], m3 = true, p2 = "";
      for (_2 = 0; _2 < 5; _2++) if (n[_2] !== 0) {
        m3 = false;
        break;
      }
      if (m3) {
        if (p2 = inetNtop4(n[6] | n[7] << 16), n[5] === -1) return t2 = "::ffff:", t2 += p2, t2;
        if (n[5] === 0) return t2 = "::", p2 === "0.0.0.0" && (p2 = ""), p2 === "0.0.0.1" && (p2 = "1"), t2 += p2, t2;
      }
      for (r = 0; r < 8; r++) n[r] === 0 && (r - o3 > 1 && (l2 = 0), o3 = r, l2++), l2 > a && (a = l2, s2 = r - a + 1);
      for (r = 0; r < 8; r++) {
        if (a > 1 && n[r] === 0 && r >= s2 && r < s2 + a) {
          r === s2 && (t2 += ":", s2 === 0 && (t2 += ":"));
          continue;
        }
        t2 += Number(_ntohs(n[r] & 65535)).toString(16), t2 += r < 7 ? ":" : "";
      }
      return t2;
    }, readSockaddr = (e, t2) => {
      var r = HEAP16[e >> 1], a = _ntohs(HEAPU16[e + 2 >> 1]), o3;
      switch (r) {
        case 2:
          if (t2 !== 16) return { errno: 28 };
          o3 = HEAP32[e + 4 >> 2], o3 = inetNtop4(o3);
          break;
        case 10:
          if (t2 !== 28) return { errno: 28 };
          o3 = [HEAP32[e + 8 >> 2], HEAP32[e + 12 >> 2], HEAP32[e + 16 >> 2], HEAP32[e + 20 >> 2]], o3 = inetNtop6(o3);
          break;
        default:
          return { errno: 5 };
      }
      return { family: r, addr: o3, port: a };
    }, getSocketAddress = (e, t2) => {
      var r = readSockaddr(e, t2);
      if (r.errno) throw new FS.ErrnoError(r.errno);
      return r.addr = DNS.lookup_addr(r.addr) || r.addr, r;
    };
    function ___syscall_bind(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e), _2 = getSocketAddress(t2, r);
        return l2.sock_ops.bind(l2, _2.addr, _2.port), 0;
      } catch (n) {
        if (typeof FS > "u" || n.name !== "ErrnoError") throw n;
        return -n.errno;
      }
    }
    ___syscall_bind.sig = "iippiii";
    function ___syscall_chdir(e) {
      try {
        return e = SYSCALLS.getStr(e), FS.chdir(e), 0;
      } catch (t2) {
        if (typeof FS > "u" || t2.name !== "ErrnoError") throw t2;
        return -t2.errno;
      }
    }
    ___syscall_chdir.sig = "ip";
    function ___syscall_chmod(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), FS.chmod(e, t2), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_chmod.sig = "ipi";
    function ___syscall_connect(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e), _2 = getSocketAddress(t2, r);
        return l2.sock_ops.connect(l2, _2.addr, _2.port), 0;
      } catch (n) {
        if (typeof FS > "u" || n.name !== "ErrnoError") throw n;
        return -n.errno;
      }
    }
    ___syscall_connect.sig = "iippiii";
    function ___syscall_dup(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return FS.dupStream(t2).fd;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_dup.sig = "ii";
    function ___syscall_dup3(e, t2, r) {
      try {
        var a = SYSCALLS.getStreamFromFD(e);
        if (a.fd === t2) return -28;
        if (t2 < 0 || t2 >= FS.MAX_OPEN_FDS) return -8;
        var o3 = FS.getStream(t2);
        return o3 && FS.close(o3), FS.dupStream(a, t2).fd;
      } catch (s2) {
        if (typeof FS > "u" || s2.name !== "ErrnoError") throw s2;
        return -s2.errno;
      }
    }
    ___syscall_dup3.sig = "iiii";
    function ___syscall_faccessat(e, t2, r, a) {
      try {
        if (t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), r & -8) return -28;
        var o3 = FS.lookupPath(t2, { follow: true }), s2 = o3.node;
        if (!s2) return -44;
        var l2 = "";
        return r & 4 && (l2 += "r"), r & 2 && (l2 += "w"), r & 1 && (l2 += "x"), l2 && FS.nodePermissions(s2, l2) ? -2 : 0;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return -_2.errno;
      }
    }
    ___syscall_faccessat.sig = "iipii";
    var ___syscall_fadvise64 = (e, t2, r, a) => 0;
    ___syscall_fadvise64.sig = "iijji";
    var INT53_MAX = 9007199254740992, INT53_MIN = -9007199254740992, bigintToI53Checked = (e) => e < INT53_MIN || e > INT53_MAX ? NaN : Number(e);
    function ___syscall_fallocate(e, t2, r, a) {
      r = bigintToI53Checked(r), a = bigintToI53Checked(a);
      try {
        if (isNaN(r)) return 61;
        var o3 = SYSCALLS.getStreamFromFD(e);
        return FS.allocate(o3, r, a), 0;
      } catch (s2) {
        if (typeof FS > "u" || s2.name !== "ErrnoError") throw s2;
        return -s2.errno;
      }
    }
    ___syscall_fallocate.sig = "iiijj";
    var syscallGetVarargI = () => {
      var e = HEAP32[+SYSCALLS.varargs >> 2];
      return SYSCALLS.varargs += 4, e;
    }, syscallGetVarargP = syscallGetVarargI;
    function ___syscall_fcntl64(e, t2, r) {
      SYSCALLS.varargs = r;
      try {
        var a = SYSCALLS.getStreamFromFD(e);
        switch (t2) {
          case 0: {
            var o3 = syscallGetVarargI();
            if (o3 < 0) return -28;
            for (; FS.streams[o3]; ) o3++;
            var s2;
            return s2 = FS.dupStream(a, o3), s2.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return a.flags;
          case 4: {
            var o3 = syscallGetVarargI();
            return a.flags |= o3, 0;
          }
          case 12: {
            var o3 = syscallGetVarargP(), l2 = 0;
            return HEAP16[o3 + l2 >> 1] = 2, 0;
          }
          case 13:
          case 14:
            return 0;
        }
        return -28;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return -_2.errno;
      }
    }
    ___syscall_fcntl64.sig = "iiip";
    function ___syscall_fdatasync(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_fdatasync.sig = "ii";
    function ___syscall_fstat64(e, t2) {
      try {
        var r = SYSCALLS.getStreamFromFD(e);
        return SYSCALLS.doStat(FS.stat, r.path, t2);
      } catch (a) {
        if (typeof FS > "u" || a.name !== "ErrnoError") throw a;
        return -a.errno;
      }
    }
    ___syscall_fstat64.sig = "iip";
    function ___syscall_ftruncate64(e, t2) {
      t2 = bigintToI53Checked(t2);
      try {
        return isNaN(t2) ? 61 : (FS.ftruncate(e, t2), 0);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_ftruncate64.sig = "iij";
    var stringToUTF8 = (e, t2, r) => stringToUTF8Array(e, HEAPU8, t2, r);
    function ___syscall_getcwd(e, t2) {
      try {
        if (t2 === 0) return -28;
        var r = FS.cwd(), a = lengthBytesUTF8(r) + 1;
        return t2 < a ? -68 : (stringToUTF8(r, e, t2), a);
      } catch (o3) {
        if (typeof FS > "u" || o3.name !== "ErrnoError") throw o3;
        return -o3.errno;
      }
    }
    ___syscall_getcwd.sig = "ipp";
    function ___syscall_getdents64(e, t2, r) {
      try {
        var a = SYSCALLS.getStreamFromFD(e);
        a.getdents || (a.getdents = FS.readdir(a.path));
        for (var o3 = 280, s2 = 0, l2 = FS.llseek(a, 0, 1), _2 = Math.floor(l2 / o3), n = Math.min(a.getdents.length, _2 + Math.floor(r / o3)), m3 = _2; m3 < n; m3++) {
          var p2, d2, g3 = a.getdents[m3];
          if (g3 === ".") p2 = a.node.id, d2 = 4;
          else if (g3 === "..") {
            var u2 = FS.lookupPath(a.path, { parent: true });
            p2 = u2.node.id, d2 = 4;
          } else {
            var f;
            try {
              f = FS.lookupNode(a.node, g3);
            } catch (c) {
              if (c?.errno === 28) continue;
              throw c;
            }
            p2 = f.id, d2 = FS.isChrdev(f.mode) ? 2 : FS.isDir(f.mode) ? 4 : FS.isLink(f.mode) ? 10 : 8;
          }
          HEAP64[t2 + s2 >> 3] = BigInt(p2), HEAP64[t2 + s2 + 8 >> 3] = BigInt((m3 + 1) * o3), HEAP16[t2 + s2 + 16 >> 1] = 280, HEAP8[t2 + s2 + 18] = d2, stringToUTF8(g3, t2 + s2 + 19, 256), s2 += o3;
        }
        return FS.llseek(a, m3 * o3, 0), s2;
      } catch (c) {
        if (typeof FS > "u" || c.name !== "ErrnoError") throw c;
        return -c.errno;
      }
    }
    ___syscall_getdents64.sig = "iipp";
    function ___syscall_getsockname(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e), _2 = writeSockaddr(t2, l2.family, DNS.lookup_name(l2.saddr || "0.0.0.0"), l2.sport, r);
        return 0;
      } catch (n) {
        if (typeof FS > "u" || n.name !== "ErrnoError") throw n;
        return -n.errno;
      }
    }
    ___syscall_getsockname.sig = "iippiii";
    function ___syscall_getsockopt(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e);
        return t2 === 1 && r === 4 ? (HEAP32[a >> 2] = l2.error, HEAP32[o3 >> 2] = 4, l2.error = null, 0) : -50;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return -_2.errno;
      }
    }
    ___syscall_getsockopt.sig = "iiiippi";
    function ___syscall_ioctl(e, t2, r) {
      SYSCALLS.varargs = r;
      try {
        var a = SYSCALLS.getStreamFromFD(e);
        switch (t2) {
          case 21509:
            return a.tty ? 0 : -59;
          case 21505: {
            if (!a.tty) return -59;
            if (a.tty.ops.ioctl_tcgets) {
              var o3 = a.tty.ops.ioctl_tcgets(a), s2 = syscallGetVarargP();
              HEAP32[s2 >> 2] = o3.c_iflag || 0, HEAP32[s2 + 4 >> 2] = o3.c_oflag || 0, HEAP32[s2 + 8 >> 2] = o3.c_cflag || 0, HEAP32[s2 + 12 >> 2] = o3.c_lflag || 0;
              for (var l2 = 0; l2 < 32; l2++) HEAP8[s2 + l2 + 17] = o3.c_cc[l2] || 0;
              return 0;
            }
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
            return a.tty ? 0 : -59;
          case 21506:
          case 21507:
          case 21508: {
            if (!a.tty) return -59;
            if (a.tty.ops.ioctl_tcsets) {
              for (var s2 = syscallGetVarargP(), _2 = HEAP32[s2 >> 2], n = HEAP32[s2 + 4 >> 2], m3 = HEAP32[s2 + 8 >> 2], p2 = HEAP32[s2 + 12 >> 2], d2 = [], l2 = 0; l2 < 32; l2++) d2.push(HEAP8[s2 + l2 + 17]);
              return a.tty.ops.ioctl_tcsets(a.tty, t2, { c_iflag: _2, c_oflag: n, c_cflag: m3, c_lflag: p2, c_cc: d2 });
            }
            return 0;
          }
          case 21519: {
            if (!a.tty) return -59;
            var s2 = syscallGetVarargP();
            return HEAP32[s2 >> 2] = 0, 0;
          }
          case 21520:
            return a.tty ? -28 : -59;
          case 21531: {
            var s2 = syscallGetVarargP();
            return FS.ioctl(a, t2, s2);
          }
          case 21523: {
            if (!a.tty) return -59;
            if (a.tty.ops && a.tty.ops.ioctl_tiocgwinsz) {
              var g3 = a.tty.ops.ioctl_tiocgwinsz(a.tty), s2 = syscallGetVarargP();
              HEAP16[s2 >> 1] = g3[0], HEAP16[s2 + 2 >> 1] = g3[1];
            }
            return 0;
          }
          case 21524:
            return a.tty ? 0 : -59;
          case 21515:
            return a.tty ? 0 : -59;
          default:
            return -28;
        }
      } catch (u2) {
        if (typeof FS > "u" || u2.name !== "ErrnoError") throw u2;
        return -u2.errno;
      }
    }
    ___syscall_ioctl.sig = "iiip";
    function ___syscall_listen(e, t2) {
      try {
        var r = getSocketFromFD(e);
        return r.sock_ops.listen(r, t2), 0;
      } catch (a) {
        if (typeof FS > "u" || a.name !== "ErrnoError") throw a;
        return -a.errno;
      }
    }
    ___syscall_listen.sig = "iiiiiii";
    function ___syscall_lstat64(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), SYSCALLS.doStat(FS.lstat, e, t2);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_lstat64.sig = "ipp";
    function ___syscall_mkdirat(e, t2, r) {
      try {
        return t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), FS.mkdir(t2, r, 0), 0;
      } catch (a) {
        if (typeof FS > "u" || a.name !== "ErrnoError") throw a;
        return -a.errno;
      }
    }
    ___syscall_mkdirat.sig = "iipi";
    function ___syscall_newfstatat(e, t2, r, a) {
      try {
        t2 = SYSCALLS.getStr(t2);
        var o3 = a & 256, s2 = a & 4096;
        return a = a & -6401, t2 = SYSCALLS.calculateAt(e, t2, s2), SYSCALLS.doStat(o3 ? FS.lstat : FS.stat, t2, r);
      } catch (l2) {
        if (typeof FS > "u" || l2.name !== "ErrnoError") throw l2;
        return -l2.errno;
      }
    }
    ___syscall_newfstatat.sig = "iippi";
    function ___syscall_openat(e, t2, r, a) {
      SYSCALLS.varargs = a;
      try {
        t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2);
        var o3 = a ? syscallGetVarargI() : 0;
        return FS.open(t2, r, o3).fd;
      } catch (s2) {
        if (typeof FS > "u" || s2.name !== "ErrnoError") throw s2;
        return -s2.errno;
      }
    }
    ___syscall_openat.sig = "iipip";
    var PIPEFS = { BUCKET_BUFFER_SIZE: 8192, mount(e) {
      return FS.createNode(null, "/", 16895, 0);
    }, createPipe() {
      var e = { buckets: [], refcnt: 2 };
      e.buckets.push({ buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 });
      var t2 = PIPEFS.nextname(), r = PIPEFS.nextname(), a = FS.createNode(PIPEFS.root, t2, 4096, 0), o3 = FS.createNode(PIPEFS.root, r, 4096, 0);
      a.pipe = e, o3.pipe = e;
      var s2 = FS.createStream({ path: t2, node: a, flags: 0, seekable: false, stream_ops: PIPEFS.stream_ops });
      a.stream = s2;
      var l2 = FS.createStream({ path: r, node: o3, flags: 1, seekable: false, stream_ops: PIPEFS.stream_ops });
      return o3.stream = l2, { readable_fd: s2.fd, writable_fd: l2.fd };
    }, stream_ops: { poll(e) {
      var t2 = e.node.pipe;
      if ((e.flags & 2097155) === 1) return 260;
      if (t2.buckets.length > 0) for (var r = 0; r < t2.buckets.length; r++) {
        var a = t2.buckets[r];
        if (a.offset - a.roffset > 0) return 65;
      }
      return 0;
    }, ioctl(e, t2, r) {
      return 28;
    }, fsync(e) {
      return 28;
    }, read(e, t2, r, a, o3) {
      for (var s2 = e.node.pipe, l2 = 0, _2 = 0; _2 < s2.buckets.length; _2++) {
        var n = s2.buckets[_2];
        l2 += n.offset - n.roffset;
      }
      var m3 = t2.subarray(r, r + a);
      if (a <= 0) return 0;
      if (l2 == 0) throw new FS.ErrnoError(6);
      for (var p2 = Math.min(l2, a), d2 = p2, g3 = 0, _2 = 0; _2 < s2.buckets.length; _2++) {
        var u2 = s2.buckets[_2], f = u2.offset - u2.roffset;
        if (p2 <= f) {
          var c = u2.buffer.subarray(u2.roffset, u2.offset);
          p2 < f ? (c = c.subarray(0, p2), u2.roffset += p2) : g3++, m3.set(c);
          break;
        } else {
          var c = u2.buffer.subarray(u2.roffset, u2.offset);
          m3.set(c), m3 = m3.subarray(c.byteLength), p2 -= c.byteLength, g3++;
        }
      }
      return g3 && g3 == s2.buckets.length && (g3--, s2.buckets[g3].offset = 0, s2.buckets[g3].roffset = 0), s2.buckets.splice(0, g3), d2;
    }, write(e, t2, r, a, o3) {
      var s2 = e.node.pipe, l2 = t2.subarray(r, r + a), _2 = l2.byteLength;
      if (_2 <= 0) return 0;
      var n = null;
      s2.buckets.length == 0 ? (n = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 }, s2.buckets.push(n)) : n = s2.buckets[s2.buckets.length - 1], assert(n.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
      var m3 = PIPEFS.BUCKET_BUFFER_SIZE - n.offset;
      if (m3 >= _2) return n.buffer.set(l2, n.offset), n.offset += _2, _2;
      m3 > 0 && (n.buffer.set(l2.subarray(0, m3), n.offset), n.offset += m3, l2 = l2.subarray(m3, l2.byteLength));
      for (var p2 = l2.byteLength / PIPEFS.BUCKET_BUFFER_SIZE | 0, d2 = l2.byteLength % PIPEFS.BUCKET_BUFFER_SIZE, g3 = 0; g3 < p2; g3++) {
        var u2 = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: PIPEFS.BUCKET_BUFFER_SIZE, roffset: 0 };
        s2.buckets.push(u2), u2.buffer.set(l2.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE)), l2 = l2.subarray(PIPEFS.BUCKET_BUFFER_SIZE, l2.byteLength);
      }
      if (d2 > 0) {
        var u2 = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: l2.byteLength, roffset: 0 };
        s2.buckets.push(u2), u2.buffer.set(l2);
      }
      return _2;
    }, close(e) {
      var t2 = e.node.pipe;
      t2.refcnt--, t2.refcnt === 0 && (t2.buckets = null);
    } }, nextname() {
      return PIPEFS.nextname.current || (PIPEFS.nextname.current = 0), "pipe[" + PIPEFS.nextname.current++ + "]";
    } };
    function ___syscall_pipe(e) {
      try {
        if (e == 0) throw new FS.ErrnoError(21);
        var t2 = PIPEFS.createPipe();
        return HEAP32[e >> 2] = t2.readable_fd, HEAP32[e + 4 >> 2] = t2.writable_fd, 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_pipe.sig = "ip";
    function ___syscall_poll(e, t2, r) {
      try {
        for (var a = 0, o3 = 0; o3 < t2; o3++) {
          var s2 = e + 8 * o3, l2 = HEAP32[s2 >> 2], _2 = HEAP16[s2 + 4 >> 1], n = 32, m3 = FS.getStream(l2);
          m3 && (n = SYSCALLS.DEFAULT_POLLMASK, m3.stream_ops.poll && (n = m3.stream_ops.poll(m3, -1))), n &= _2 | 8 | 16, n && a++, HEAP16[s2 + 6 >> 1] = n;
        }
        return a;
      } catch (p2) {
        if (typeof FS > "u" || p2.name !== "ErrnoError") throw p2;
        return -p2.errno;
      }
    }
    ___syscall_poll.sig = "ipii";
    function ___syscall_readlinkat(e, t2, r, a) {
      try {
        if (t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), a <= 0) return -28;
        var o3 = FS.readlink(t2), s2 = Math.min(a, lengthBytesUTF8(o3)), l2 = HEAP8[r + s2];
        return stringToUTF8(o3, r, a + 1), HEAP8[r + s2] = l2, s2;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return -_2.errno;
      }
    }
    ___syscall_readlinkat.sig = "iippp";
    function ___syscall_recvfrom(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e), _2 = l2.sock_ops.recvmsg(l2, r);
        if (!_2) return 0;
        if (o3) var n = writeSockaddr(o3, l2.family, DNS.lookup_name(_2.addr), _2.port, s2);
        return HEAPU8.set(_2.buffer, t2), _2.buffer.byteLength;
      } catch (m3) {
        if (typeof FS > "u" || m3.name !== "ErrnoError") throw m3;
        return -m3.errno;
      }
    }
    ___syscall_recvfrom.sig = "iippipp";
    function ___syscall_renameat(e, t2, r, a) {
      try {
        return t2 = SYSCALLS.getStr(t2), a = SYSCALLS.getStr(a), t2 = SYSCALLS.calculateAt(e, t2), a = SYSCALLS.calculateAt(r, a), FS.rename(t2, a), 0;
      } catch (o3) {
        if (typeof FS > "u" || o3.name !== "ErrnoError") throw o3;
        return -o3.errno;
      }
    }
    ___syscall_renameat.sig = "iipip";
    function ___syscall_rmdir(e) {
      try {
        return e = SYSCALLS.getStr(e), FS.rmdir(e), 0;
      } catch (t2) {
        if (typeof FS > "u" || t2.name !== "ErrnoError") throw t2;
        return -t2.errno;
      }
    }
    ___syscall_rmdir.sig = "ip";
    function ___syscall_sendto(e, t2, r, a, o3, s2) {
      try {
        var l2 = getSocketFromFD(e);
        if (!o3) return FS.write(l2.stream, HEAP8, t2, r);
        var _2 = getSocketAddress(o3, s2);
        return l2.sock_ops.sendmsg(l2, HEAP8, t2, r, _2.addr, _2.port);
      } catch (n) {
        if (typeof FS > "u" || n.name !== "ErrnoError") throw n;
        return -n.errno;
      }
    }
    ___syscall_sendto.sig = "iippipp";
    function ___syscall_socket(e, t2, r) {
      try {
        var a = SOCKFS.createSocket(e, t2, r);
        return a.stream.fd;
      } catch (o3) {
        if (typeof FS > "u" || o3.name !== "ErrnoError") throw o3;
        return -o3.errno;
      }
    }
    ___syscall_socket.sig = "iiiiiii";
    function ___syscall_stat64(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), SYSCALLS.doStat(FS.stat, e, t2);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_stat64.sig = "ipp";
    function ___syscall_symlinkat(e, t2, r) {
      try {
        return e = SYSCALLS.getStr(e), r = SYSCALLS.getStr(r), r = SYSCALLS.calculateAt(t2, r), FS.symlink(e, r), 0;
      } catch (a) {
        if (typeof FS > "u" || a.name !== "ErrnoError") throw a;
        return -a.errno;
      }
    }
    ___syscall_symlinkat.sig = "ipip";
    function ___syscall_truncate64(e, t2) {
      t2 = bigintToI53Checked(t2);
      try {
        return isNaN(t2) ? 61 : (e = SYSCALLS.getStr(e), FS.truncate(e, t2), 0);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return -r.errno;
      }
    }
    ___syscall_truncate64.sig = "ipj";
    function ___syscall_unlinkat(e, t2, r) {
      try {
        return t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), r === 0 ? FS.unlink(t2) : r === 512 ? FS.rmdir(t2) : abort("Invalid flags passed to unlinkat"), 0;
      } catch (a) {
        if (typeof FS > "u" || a.name !== "ErrnoError") throw a;
        return -a.errno;
      }
    }
    ___syscall_unlinkat.sig = "iipi";
    var ___table_base = new WebAssembly.Global({ value: "i32", mutable: false }, 1), __abort_js = () => abort("");
    __abort_js.sig = "v";
    var ENV = {}, stackAlloc = (e) => __emscripten_stack_alloc(e), stringToUTF8OnStack = (e) => {
      var t2 = lengthBytesUTF8(e) + 1, r = stackAlloc(t2);
      return stringToUTF8(e, r, t2), r;
    }, dlSetError = (e) => {
      var t2 = stackSave(), r = stringToUTF8OnStack(e);
      ___dl_seterr(r, 0), stackRestore(t2);
    }, dlopenInternal = (e, t2) => {
      var r = UTF8ToString(e + 36), a = HEAP32[e + 4 >> 2];
      r = PATH.normalize(r);
      var o3 = !!(a & 256), s2 = o3 ? null : {}, l2 = { global: o3, nodelete: !!(a & 4096), loadAsync: t2.loadAsync };
      if (t2.loadAsync) return loadDynamicLibrary(r, l2, s2, e);
      try {
        return loadDynamicLibrary(r, l2, s2, e);
      } catch (_2) {
        return dlSetError(`Could not load dynamic lib: ${r}
${_2}`), 0;
      }
    }, __dlopen_js = (e) => dlopenInternal(e, { loadAsync: false });
    __dlopen_js.sig = "pp";
    var __dlsym_js = (e, t2, r) => {
      t2 = UTF8ToString(t2);
      var a, o3, s2 = LDSO.loadedLibsByHandle[e];
      if (!s2.exports.hasOwnProperty(t2) || s2.exports[t2].stub) return dlSetError(`Tried to lookup unknown symbol "${t2}" in dynamic lib: ${s2.name}`), 0;
      if (o3 = Object.keys(s2.exports).indexOf(t2), a = s2.exports[t2], typeof a == "function") {
        var l2 = getFunctionAddress(a);
        l2 ? a = l2 : (a = addFunction(a, a.sig), HEAPU32[r >> 2] = o3);
      }
      return a;
    };
    __dlsym_js.sig = "pppp";
    var getExecutableName = () => thisProgram || "./this.program", __emscripten_get_progname = (e, t2) => stringToUTF8(getExecutableName(), e, t2);
    __emscripten_get_progname.sig = "vpi";
    var __emscripten_lookup_name = (e) => {
      var t2 = UTF8ToString(e);
      return inetPton4(DNS.lookup_name(t2));
    };
    __emscripten_lookup_name.sig = "ip";
    var __emscripten_memcpy_js = (e, t2, r) => HEAPU8.copyWithin(e, t2, t2 + r);
    __emscripten_memcpy_js.sig = "vppp";
    var runtimeKeepaliveCounter = 0, __emscripten_runtime_keepalive_clear = () => {
      noExitRuntime = false, runtimeKeepaliveCounter = 0;
    };
    __emscripten_runtime_keepalive_clear.sig = "v";
    var __emscripten_system = (e) => {
      if (ENVIRONMENT_IS_NODE) {
        if (!e) return 1;
        var t2 = UTF8ToString(e);
        if (!t2.length) return 0;
        var r = require("child_process"), a = r.spawnSync(t2, [], { shell: true, stdio: "inherit" }), o3 = (l2, _2) => l2 << 8 | _2;
        if (a.status === null) {
          var s2 = (l2) => {
            switch (l2) {
              case "SIGHUP":
                return 1;
              case "SIGQUIT":
                return 3;
              case "SIGFPE":
                return 8;
              case "SIGKILL":
                return 9;
              case "SIGALRM":
                return 14;
              case "SIGTERM":
                return 15;
              default:
                return 2;
            }
          };
          return o3(0, s2(a.signal));
        }
        return o3(a.status, 0);
      }
      return e ? -52 : 0;
    };
    __emscripten_system.sig = "ip";
    var __emscripten_throw_longjmp = () => {
      throw 1 / 0;
    };
    __emscripten_throw_longjmp.sig = "v";
    function __gmtime_js(e, t2) {
      e = bigintToI53Checked(e);
      var r = new Date(e * 1e3);
      HEAP32[t2 >> 2] = r.getUTCSeconds(), HEAP32[t2 + 4 >> 2] = r.getUTCMinutes(), HEAP32[t2 + 8 >> 2] = r.getUTCHours(), HEAP32[t2 + 12 >> 2] = r.getUTCDate(), HEAP32[t2 + 16 >> 2] = r.getUTCMonth(), HEAP32[t2 + 20 >> 2] = r.getUTCFullYear() - 1900, HEAP32[t2 + 24 >> 2] = r.getUTCDay();
      var a = Date.UTC(r.getUTCFullYear(), 0, 1, 0, 0, 0, 0), o3 = (r.getTime() - a) / (1e3 * 60 * 60 * 24) | 0;
      HEAP32[t2 + 28 >> 2] = o3;
    }
    __gmtime_js.sig = "vjp";
    var isLeapYear = (e) => e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0), MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], ydayFromDate = (e) => {
      var t2 = isLeapYear(e.getFullYear()), r = t2 ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE, a = r[e.getMonth()] + e.getDate() - 1;
      return a;
    };
    function __localtime_js(e, t2) {
      e = bigintToI53Checked(e);
      var r = new Date(e * 1e3);
      HEAP32[t2 >> 2] = r.getSeconds(), HEAP32[t2 + 4 >> 2] = r.getMinutes(), HEAP32[t2 + 8 >> 2] = r.getHours(), HEAP32[t2 + 12 >> 2] = r.getDate(), HEAP32[t2 + 16 >> 2] = r.getMonth(), HEAP32[t2 + 20 >> 2] = r.getFullYear() - 1900, HEAP32[t2 + 24 >> 2] = r.getDay();
      var a = ydayFromDate(r) | 0;
      HEAP32[t2 + 28 >> 2] = a, HEAP32[t2 + 36 >> 2] = -(r.getTimezoneOffset() * 60);
      var o3 = new Date(r.getFullYear(), 0, 1), s2 = new Date(r.getFullYear(), 6, 1).getTimezoneOffset(), l2 = o3.getTimezoneOffset(), _2 = (s2 != l2 && r.getTimezoneOffset() == Math.min(l2, s2)) | 0;
      HEAP32[t2 + 32 >> 2] = _2;
    }
    __localtime_js.sig = "vjp";
    function __mmap_js(e, t2, r, a, o3, s2, l2) {
      o3 = bigintToI53Checked(o3);
      try {
        if (isNaN(o3)) return 61;
        var _2 = SYSCALLS.getStreamFromFD(a), n = FS.mmap(_2, e, o3, t2, r), m3 = n.ptr;
        return HEAP32[s2 >> 2] = n.allocated, HEAPU32[l2 >> 2] = m3, 0;
      } catch (p2) {
        if (typeof FS > "u" || p2.name !== "ErrnoError") throw p2;
        return -p2.errno;
      }
    }
    __mmap_js.sig = "ipiiijpp";
    function __munmap_js(e, t2, r, a, o3, s2) {
      s2 = bigintToI53Checked(s2);
      try {
        var l2 = SYSCALLS.getStreamFromFD(o3);
        r & 2 && SYSCALLS.doMsync(e, l2, t2, a, s2);
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return -_2.errno;
      }
    }
    __munmap_js.sig = "ippiiij";
    var timers = {}, handleException = (e) => {
      if (e instanceof ExitStatus || e == "unwind") return EXITSTATUS;
      quit_(1, e);
    }, keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0, _proc_exit = (e) => {
      EXITSTATUS = e, keepRuntimeAlive() || (Module.onExit?.(e), ABORT = true), quit_(e, new ExitStatus(e));
    };
    _proc_exit.sig = "vi";
    var exitJS = (e, t2) => {
      EXITSTATUS = e, _proc_exit(e);
    }, _exit = exitJS;
    _exit.sig = "vi";
    var maybeExit = () => {
      if (!keepRuntimeAlive()) try {
        _exit(EXITSTATUS);
      } catch (e) {
        handleException(e);
      }
    }, callUserCallback = (e) => {
      if (!ABORT) try {
        e(), maybeExit();
      } catch (t2) {
        handleException(t2);
      }
    }, _emscripten_get_now = () => performance.now();
    _emscripten_get_now.sig = "d";
    var __setitimer_js = (e, t2) => {
      if (timers[e] && (clearTimeout(timers[e].id), delete timers[e]), !t2) return 0;
      var r = setTimeout(() => {
        delete timers[e], callUserCallback(() => __emscripten_timeout(e, _emscripten_get_now()));
      }, t2);
      return timers[e] = { id: r, timeout_ms: t2 }, 0;
    };
    __setitimer_js.sig = "iid";
    var __tzset_js = (e, t2, r, a) => {
      var o3 = (/* @__PURE__ */ new Date()).getFullYear(), s2 = new Date(o3, 0, 1), l2 = new Date(o3, 6, 1), _2 = s2.getTimezoneOffset(), n = l2.getTimezoneOffset(), m3 = Math.max(_2, n);
      HEAPU32[e >> 2] = m3 * 60, HEAP32[t2 >> 2] = +(_2 != n);
      var p2 = (u2) => {
        var f = u2 >= 0 ? "-" : "+", c = Math.abs(u2), w2 = String(Math.floor(c / 60)).padStart(2, "0"), v2 = String(c % 60).padStart(2, "0");
        return `UTC${f}${w2}${v2}`;
      }, d2 = p2(_2), g3 = p2(n);
      n < _2 ? (stringToUTF8(d2, r, 17), stringToUTF8(g3, a, 17)) : (stringToUTF8(d2, a, 17), stringToUTF8(g3, r, 17));
    };
    __tzset_js.sig = "vpppp";
    var _emscripten_date_now = () => Date.now();
    _emscripten_date_now.sig = "d";
    var nowIsMonotonic = 1, checkWasiClock = (e) => e >= 0 && e <= 3;
    function _clock_time_get(e, t2, r) {
      if (t2 = bigintToI53Checked(t2), !checkWasiClock(e)) return 28;
      var a;
      if (e === 0) a = _emscripten_date_now();
      else if (nowIsMonotonic) a = _emscripten_get_now();
      else return 52;
      var o3 = Math.round(a * 1e3 * 1e3);
      return HEAP64[r >> 3] = BigInt(o3), 0;
    }
    _clock_time_get.sig = "iijp";
    var readEmAsmArgsArray = [], readEmAsmArgs = (e, t2) => {
      readEmAsmArgsArray.length = 0;
      for (var r; r = HEAPU8[e++]; ) {
        var a = r != 105;
        a &= r != 112, t2 += a && t2 % 8 ? 4 : 0, readEmAsmArgsArray.push(r == 112 ? HEAPU32[t2 >> 2] : r == 106 ? HEAP64[t2 >> 3] : r == 105 ? HEAP32[t2 >> 2] : HEAPF64[t2 >> 3]), t2 += a ? 8 : 4;
      }
      return readEmAsmArgsArray;
    }, runEmAsmFunction = (e, t2, r) => {
      var a = readEmAsmArgs(t2, r);
      return ASM_CONSTS[e](...a);
    }, _emscripten_asm_const_int = (e, t2, r) => runEmAsmFunction(e, t2, r);
    _emscripten_asm_const_int.sig = "ippp";
    var _emscripten_force_exit = (e) => {
      __emscripten_runtime_keepalive_clear(), _exit(e);
    };
    _emscripten_force_exit.sig = "vi";
    var getHeapMax = () => 2147483648, _emscripten_get_heap_max = () => getHeapMax();
    _emscripten_get_heap_max.sig = "p";
    var growMemory = (e) => {
      var t2 = wasmMemory.buffer, r = (e - t2.byteLength + 65535) / 65536 | 0;
      try {
        return wasmMemory.grow(r), updateMemoryViews(), 1;
      } catch {
      }
    }, _emscripten_resize_heap = (e) => {
      var t2 = HEAPU8.length;
      e >>>= 0;
      var r = getHeapMax();
      if (e > r) return false;
      for (var a = 1; a <= 4; a *= 2) {
        var o3 = t2 * (1 + 0.2 / a);
        o3 = Math.min(o3, e + 100663296);
        var s2 = Math.min(r, alignMemory(Math.max(e, o3), 65536)), l2 = growMemory(s2);
        if (l2) return true;
      }
      return false;
    };
    _emscripten_resize_heap.sig = "ip";
    var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        var e = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", t2 = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: e, _: getExecutableName() };
        for (var r in ENV) ENV[r] === void 0 ? delete t2[r] : t2[r] = ENV[r];
        var a = [];
        for (var r in t2) a.push(`${r}=${t2[r]}`);
        getEnvStrings.strings = a;
      }
      return getEnvStrings.strings;
    }, stringToAscii = (e, t2) => {
      for (var r = 0; r < e.length; ++r) HEAP8[t2++] = e.charCodeAt(r);
      HEAP8[t2] = 0;
    }, _environ_get = (e, t2) => {
      var r = 0;
      return getEnvStrings().forEach((a, o3) => {
        var s2 = t2 + r;
        HEAPU32[e + o3 * 4 >> 2] = s2, stringToAscii(a, s2), r += a.length + 1;
      }), 0;
    };
    _environ_get.sig = "ipp";
    var _environ_sizes_get = (e, t2) => {
      var r = getEnvStrings();
      HEAPU32[e >> 2] = r.length;
      var a = 0;
      return r.forEach((o3) => a += o3.length + 1), HEAPU32[t2 >> 2] = a, 0;
    };
    _environ_sizes_get.sig = "ipp";
    function _fd_close(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return FS.close(t2), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return r.errno;
      }
    }
    _fd_close.sig = "ii";
    function _fd_fdstat_get(e, t2) {
      try {
        var r = 0, a = 0, o3 = 0, s2 = SYSCALLS.getStreamFromFD(e), l2 = s2.tty ? 2 : FS.isDir(s2.mode) ? 3 : FS.isLink(s2.mode) ? 7 : 4;
        return HEAP8[t2] = l2, HEAP16[t2 + 2 >> 1] = o3, HEAP64[t2 + 8 >> 3] = BigInt(r), HEAP64[t2 + 16 >> 3] = BigInt(a), 0;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return _2.errno;
      }
    }
    _fd_fdstat_get.sig = "iip";
    var doReadv = (e, t2, r, a) => {
      for (var o3 = 0, s2 = 0; s2 < r; s2++) {
        var l2 = HEAPU32[t2 >> 2], _2 = HEAPU32[t2 + 4 >> 2];
        t2 += 8;
        var n = FS.read(e, HEAP8, l2, _2, a);
        if (n < 0) return -1;
        if (o3 += n, n < _2) break;
        typeof a < "u" && (a += n);
      }
      return o3;
    };
    function _fd_pread(e, t2, r, a, o3) {
      a = bigintToI53Checked(a);
      try {
        if (isNaN(a)) return 61;
        var s2 = SYSCALLS.getStreamFromFD(e), l2 = doReadv(s2, t2, r, a);
        return HEAPU32[o3 >> 2] = l2, 0;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return _2.errno;
      }
    }
    _fd_pread.sig = "iippjp";
    var doWritev = (e, t2, r, a) => {
      for (var o3 = 0, s2 = 0; s2 < r; s2++) {
        var l2 = HEAPU32[t2 >> 2], _2 = HEAPU32[t2 + 4 >> 2];
        t2 += 8;
        var n = FS.write(e, HEAP8, l2, _2, a);
        if (n < 0) return -1;
        if (o3 += n, n < _2) break;
        typeof a < "u" && (a += n);
      }
      return o3;
    };
    function _fd_pwrite(e, t2, r, a, o3) {
      a = bigintToI53Checked(a);
      try {
        if (isNaN(a)) return 61;
        var s2 = SYSCALLS.getStreamFromFD(e), l2 = doWritev(s2, t2, r, a);
        return HEAPU32[o3 >> 2] = l2, 0;
      } catch (_2) {
        if (typeof FS > "u" || _2.name !== "ErrnoError") throw _2;
        return _2.errno;
      }
    }
    _fd_pwrite.sig = "iippjp";
    function _fd_read(e, t2, r, a) {
      try {
        var o3 = SYSCALLS.getStreamFromFD(e), s2 = doReadv(o3, t2, r);
        return HEAPU32[a >> 2] = s2, 0;
      } catch (l2) {
        if (typeof FS > "u" || l2.name !== "ErrnoError") throw l2;
        return l2.errno;
      }
    }
    _fd_read.sig = "iippp";
    function _fd_seek(e, t2, r, a) {
      t2 = bigintToI53Checked(t2);
      try {
        if (isNaN(t2)) return 61;
        var o3 = SYSCALLS.getStreamFromFD(e);
        return FS.llseek(o3, t2, r), HEAP64[a >> 3] = BigInt(o3.position), o3.getdents && t2 === 0 && r === 0 && (o3.getdents = null), 0;
      } catch (s2) {
        if (typeof FS > "u" || s2.name !== "ErrnoError") throw s2;
        return s2.errno;
      }
    }
    _fd_seek.sig = "iijip";
    function _fd_sync(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return t2.stream_ops?.fsync ? t2.stream_ops.fsync(t2) : 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return r.errno;
      }
    }
    _fd_sync.sig = "ii";
    function _fd_write(e, t2, r, a) {
      try {
        var o3 = SYSCALLS.getStreamFromFD(e), s2 = doWritev(o3, t2, r);
        return HEAPU32[a >> 2] = s2, 0;
      } catch (l2) {
        if (typeof FS > "u" || l2.name !== "ErrnoError") throw l2;
        return l2.errno;
      }
    }
    _fd_write.sig = "iippp";
    var _getaddrinfo = (e, t2, r, a) => {
      var o3 = 0, s2 = 0, l2 = 0, _2 = 0, n = 0, m3 = 0, p2;
      function d2(g3, u2, f, c, w2, v2) {
        var S2, x4, y3, M2;
        return x4 = g3 === 10 ? 28 : 16, w2 = g3 === 10 ? inetNtop6(w2) : inetNtop4(w2), S2 = _malloc(x4), M2 = writeSockaddr(S2, g3, w2, v2), assert(!M2), y3 = _malloc(32), HEAP32[y3 + 4 >> 2] = g3, HEAP32[y3 + 8 >> 2] = u2, HEAP32[y3 + 12 >> 2] = f, HEAPU32[y3 + 24 >> 2] = c, HEAPU32[y3 + 20 >> 2] = S2, g3 === 10 ? HEAP32[y3 + 16 >> 2] = 28 : HEAP32[y3 + 16 >> 2] = 16, HEAP32[y3 + 28 >> 2] = 0, y3;
      }
      if (r && (l2 = HEAP32[r >> 2], _2 = HEAP32[r + 4 >> 2], n = HEAP32[r + 8 >> 2], m3 = HEAP32[r + 12 >> 2]), n && !m3 && (m3 = n === 2 ? 17 : 6), !n && m3 && (n = m3 === 17 ? 2 : 1), m3 === 0 && (m3 = 6), n === 0 && (n = 1), !e && !t2) return -2;
      if (l2 & -1088 || r !== 0 && HEAP32[r >> 2] & 2 && !e) return -1;
      if (l2 & 32) return -2;
      if (n !== 0 && n !== 1 && n !== 2) return -7;
      if (_2 !== 0 && _2 !== 2 && _2 !== 10) return -6;
      if (t2 && (t2 = UTF8ToString(t2), s2 = parseInt(t2, 10), isNaN(s2))) return l2 & 1024 ? -2 : -8;
      if (!e) return _2 === 0 && (_2 = 2), l2 & 1 || (_2 === 2 ? o3 = _htonl(2130706433) : o3 = [0, 0, 0, _htonl(1)]), p2 = d2(_2, n, m3, null, o3, s2), HEAPU32[a >> 2] = p2, 0;
      if (e = UTF8ToString(e), o3 = inetPton4(e), o3 !== null) if (_2 === 0 || _2 === 2) _2 = 2;
      else if (_2 === 10 && l2 & 8) o3 = [0, 0, _htonl(65535), o3], _2 = 10;
      else return -2;
      else if (o3 = inetPton6(e), o3 !== null) if (_2 === 0 || _2 === 10) _2 = 10;
      else return -2;
      return o3 != null ? (p2 = d2(_2, n, m3, e, o3, s2), HEAPU32[a >> 2] = p2, 0) : l2 & 4 ? -2 : (e = DNS.lookup_name(e), o3 = inetPton4(e), _2 === 0 ? _2 = 2 : _2 === 10 && (o3 = [0, 0, _htonl(65535), o3]), p2 = d2(_2, n, m3, null, o3, s2), HEAPU32[a >> 2] = p2, 0);
    };
    _getaddrinfo.sig = "ipppp";
    var _getnameinfo = (e, t2, r, a, o3, s2, l2) => {
      var _2 = readSockaddr(e, t2);
      if (_2.errno) return -6;
      var n = _2.port, m3 = _2.addr, p2 = false;
      if (r && a) {
        var d2;
        if (l2 & 1 || !(d2 = DNS.lookup_addr(m3))) {
          if (l2 & 8) return -2;
        } else m3 = d2;
        var g3 = stringToUTF8(m3, r, a);
        g3 + 1 >= a && (p2 = true);
      }
      if (o3 && s2) {
        n = "" + n;
        var g3 = stringToUTF8(n, o3, s2);
        g3 + 1 >= s2 && (p2 = true);
      }
      return p2 ? -12 : 0;
    };
    _getnameinfo.sig = "ipipipii";
    function _random_get(e, t2) {
      try {
        return randomFill(HEAPU8.subarray(e, e + t2)), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError") throw r;
        return r.errno;
      }
    }
    _random_get.sig = "ipp";
    var stringToNewUTF8 = (e) => {
      var t2 = lengthBytesUTF8(e) + 1, r = _malloc(t2);
      return r && stringToUTF8(e, r, t2), r;
    }, getTempRet0 = (e) => __emscripten_tempret_get();
    Module.getTempRet0 = getTempRet0;
    var setTempRet0 = (e) => __emscripten_tempret_set(e), FS_createPath = FS.createPath, FS_unlink = (e) => FS.unlink(e), FS_createLazyFile = FS.createLazyFile, FS_createDevice = FS.createDevice, _setTempRet0 = setTempRet0;
    Module._setTempRet0 = _setTempRet0;
    var _getTempRet0 = getTempRet0;
    Module._getTempRet0 = _getTempRet0;
    class ExceptionInfo {
      constructor(t2) {
        this.excPtr = t2, this.ptr = t2 - 24;
      }
      set_type(t2) {
        HEAPU32[this.ptr + 4 >> 2] = t2;
      }
      get_type() {
        return HEAPU32[this.ptr + 4 >> 2];
      }
      set_destructor(t2) {
        HEAPU32[this.ptr + 8 >> 2] = t2;
      }
      get_destructor() {
        return HEAPU32[this.ptr + 8 >> 2];
      }
      set_caught(t2) {
        t2 = t2 ? 1 : 0, HEAP8[this.ptr + 12] = t2;
      }
      get_caught() {
        return HEAP8[this.ptr + 12] != 0;
      }
      set_rethrown(t2) {
        t2 = t2 ? 1 : 0, HEAP8[this.ptr + 13] = t2;
      }
      get_rethrown() {
        return HEAP8[this.ptr + 13] != 0;
      }
      init(t2, r) {
        this.set_adjusted_ptr(0), this.set_type(t2), this.set_destructor(r);
      }
      set_adjusted_ptr(t2) {
        HEAPU32[this.ptr + 16 >> 2] = t2;
      }
      get_adjusted_ptr() {
        return HEAPU32[this.ptr + 16 >> 2];
      }
    }
    var exceptionLast = 0, uncaughtExceptionCount = 0, ___cxa_throw = (e, t2, r) => {
      var a = new ExceptionInfo(e);
      throw a.init(t2, r), exceptionLast = e, uncaughtExceptionCount++, exceptionLast;
    };
    Module.___cxa_throw = ___cxa_throw, ___cxa_throw.sig = "vppp", registerWasmPlugin(), FS.createPreloadedFile = FS_createPreloadedFile, FS.staticInit(), Module.FS_createPath = FS.createPath, Module.FS_createDataFile = FS.createDataFile, Module.FS_createPreloadedFile = FS.createPreloadedFile, Module.FS_unlink = FS.unlink, Module.FS_createLazyFile = FS.createLazyFile, Module.FS_createDevice = FS.createDevice, MEMFS.doesNotExistError = new FS.ErrnoError(44), MEMFS.doesNotExistError.stack = "<generic error, no stack>", ENVIRONMENT_IS_NODE && NODEFS.staticInit();
    var wasmImports = { __assert_fail: ___assert_fail, __call_sighandler: ___call_sighandler, __cxa_throw: ___cxa_throw, __heap_base: ___heap_base, __indirect_function_table: wasmTable, __memory_base: ___memory_base, __stack_high: ___stack_high, __stack_low: ___stack_low, __stack_pointer: ___stack_pointer, __syscall__newselect: ___syscall__newselect, __syscall_accept4: ___syscall_accept4, __syscall_bind: ___syscall_bind, __syscall_chdir: ___syscall_chdir, __syscall_chmod: ___syscall_chmod, __syscall_connect: ___syscall_connect, __syscall_dup: ___syscall_dup, __syscall_dup3: ___syscall_dup3, __syscall_faccessat: ___syscall_faccessat, __syscall_fadvise64: ___syscall_fadvise64, __syscall_fallocate: ___syscall_fallocate, __syscall_fcntl64: ___syscall_fcntl64, __syscall_fdatasync: ___syscall_fdatasync, __syscall_fstat64: ___syscall_fstat64, __syscall_ftruncate64: ___syscall_ftruncate64, __syscall_getcwd: ___syscall_getcwd, __syscall_getdents64: ___syscall_getdents64, __syscall_getsockname: ___syscall_getsockname, __syscall_getsockopt: ___syscall_getsockopt, __syscall_ioctl: ___syscall_ioctl, __syscall_listen: ___syscall_listen, __syscall_lstat64: ___syscall_lstat64, __syscall_mkdirat: ___syscall_mkdirat, __syscall_newfstatat: ___syscall_newfstatat, __syscall_openat: ___syscall_openat, __syscall_pipe: ___syscall_pipe, __syscall_poll: ___syscall_poll, __syscall_readlinkat: ___syscall_readlinkat, __syscall_recvfrom: ___syscall_recvfrom, __syscall_renameat: ___syscall_renameat, __syscall_rmdir: ___syscall_rmdir, __syscall_sendto: ___syscall_sendto, __syscall_socket: ___syscall_socket, __syscall_stat64: ___syscall_stat64, __syscall_symlinkat: ___syscall_symlinkat, __syscall_truncate64: ___syscall_truncate64, __syscall_unlinkat: ___syscall_unlinkat, __table_base: ___table_base, _abort_js: __abort_js, _dlopen_js: __dlopen_js, _dlsym_js: __dlsym_js, _emscripten_get_progname: __emscripten_get_progname, _emscripten_lookup_name: __emscripten_lookup_name, _emscripten_memcpy_js: __emscripten_memcpy_js, _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear, _emscripten_system: __emscripten_system, _emscripten_throw_longjmp: __emscripten_throw_longjmp, _gmtime_js: __gmtime_js, _localtime_js: __localtime_js, _mmap_js: __mmap_js, _munmap_js: __munmap_js, _setitimer_js: __setitimer_js, _tzset_js: __tzset_js, clock_time_get: _clock_time_get, emscripten_asm_const_int: _emscripten_asm_const_int, emscripten_date_now: _emscripten_date_now, emscripten_force_exit: _emscripten_force_exit, emscripten_get_heap_max: _emscripten_get_heap_max, emscripten_get_now: _emscripten_get_now, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, exit: _exit, fd_close: _fd_close, fd_fdstat_get: _fd_fdstat_get, fd_pread: _fd_pread, fd_pwrite: _fd_pwrite, fd_read: _fd_read, fd_seek: _fd_seek, fd_sync: _fd_sync, fd_write: _fd_write, getTempRet0: _getTempRet0, getaddrinfo: _getaddrinfo, getnameinfo: _getnameinfo, invoke_di, invoke_i, invoke_id, invoke_ii, invoke_iii, invoke_iiii, invoke_iiiii, invoke_iiiiii, invoke_iiiiiii, invoke_iiiiiiii, invoke_iiiiiiiii, invoke_iiiiiiiiii, invoke_iiiiiiiiiii, invoke_iiiiiiiiiiiiii, invoke_iiiiiiiiiiiiiiiiii, invoke_iiiiiji, invoke_iiiij, invoke_iiiijii, invoke_iiij, invoke_iiji, invoke_ij, invoke_ijiiiii, invoke_ijiiiiii, invoke_j, invoke_ji, invoke_jii, invoke_jiiii, invoke_jiiiiii, invoke_jiiiiiiiii, invoke_v, invoke_vi, invoke_vid, invoke_vii, invoke_viii, invoke_viiii, invoke_viiiii, invoke_viiiiii, invoke_viiiiiii, invoke_viiiiiiii, invoke_viiiiiiiii, invoke_viiiiiiiiiiii, invoke_viiiji, invoke_viij, invoke_viiji, invoke_viijii, invoke_viijiiii, invoke_vij, invoke_viji, invoke_vijiji, invoke_vj, invoke_vji, memory: wasmMemory, proc_exit: _proc_exit, random_get: _random_get, setTempRet0: _setTempRet0 }, wasmExports;
    createWasm();
    var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports.__wasm_call_ctors)(), _fiprintf = Module._fiprintf = (e, t2, r) => (_fiprintf = Module._fiprintf = wasmExports.fiprintf)(e, t2, r), _fopen = Module._fopen = (e, t2) => (_fopen = Module._fopen = wasmExports.fopen)(e, t2), _fflush = Module._fflush = (e) => (_fflush = Module._fflush = wasmExports.fflush)(e), _fclose = Module._fclose = (e) => (_fclose = Module._fclose = wasmExports.fclose)(e), _free = Module._free = (e) => (_free = Module._free = wasmExports.free)(e), ___errno_location = Module.___errno_location = () => (___errno_location = Module.___errno_location = wasmExports.__errno_location)(), _ProcessInterrupts = Module._ProcessInterrupts = () => (_ProcessInterrupts = Module._ProcessInterrupts = wasmExports.ProcessInterrupts)(), _errstart_cold = Module._errstart_cold = (e, t2) => (_errstart_cold = Module._errstart_cold = wasmExports.errstart_cold)(e, t2), _errcode = Module._errcode = (e) => (_errcode = Module._errcode = wasmExports.errcode)(e), _errmsg = Module._errmsg = (e, t2) => (_errmsg = Module._errmsg = wasmExports.errmsg)(e, t2), _errfinish = Module._errfinish = (e, t2, r) => (_errfinish = Module._errfinish = wasmExports.errfinish)(e, t2, r), _puts = Module._puts = (e) => (_puts = Module._puts = wasmExports.puts)(e), _errstart = Module._errstart = (e, t2) => (_errstart = Module._errstart = wasmExports.errstart)(e, t2), _errmsg_internal = Module._errmsg_internal = (e, t2) => (_errmsg_internal = Module._errmsg_internal = wasmExports.errmsg_internal)(e, t2), _errdetail = Module._errdetail = (e, t2) => (_errdetail = Module._errdetail = wasmExports.errdetail)(e, t2), _errhint = Module._errhint = (e, t2) => (_errhint = Module._errhint = wasmExports.errhint)(e, t2), _pg_parse_query = Module._pg_parse_query = (e) => (_pg_parse_query = Module._pg_parse_query = wasmExports.pg_parse_query)(e), _gettimeofday = Module._gettimeofday = (e, t2) => (_gettimeofday = Module._gettimeofday = wasmExports.gettimeofday)(e, t2), _raw_parser = Module._raw_parser = (e, t2) => (_raw_parser = Module._raw_parser = wasmExports.raw_parser)(e, t2), _initStringInfo = Module._initStringInfo = (e) => (_initStringInfo = Module._initStringInfo = wasmExports.initStringInfo)(e), _appendStringInfoString = Module._appendStringInfoString = (e, t2) => (_appendStringInfoString = Module._appendStringInfoString = wasmExports.appendStringInfoString)(e, t2), _appendStringInfo = Module._appendStringInfo = (e, t2, r) => (_appendStringInfo = Module._appendStringInfo = wasmExports.appendStringInfo)(e, t2, r), _errdetail_internal = Module._errdetail_internal = (e, t2) => (_errdetail_internal = Module._errdetail_internal = wasmExports.errdetail_internal)(e, t2), _pfree = Module._pfree = (e) => (_pfree = Module._pfree = wasmExports.pfree)(e), _list_make1_impl = Module._list_make1_impl = (e, t2) => (_list_make1_impl = Module._list_make1_impl = wasmExports.list_make1_impl)(e, t2), _QueryRewrite = Module._QueryRewrite = (e) => (_QueryRewrite = Module._QueryRewrite = wasmExports.QueryRewrite)(e), _pg_plan_query = Module._pg_plan_query = (e, t2, r, a) => (_pg_plan_query = Module._pg_plan_query = wasmExports.pg_plan_query)(e, t2, r, a), _palloc0 = Module._palloc0 = (e) => (_palloc0 = Module._palloc0 = wasmExports.palloc0)(e), _lappend = Module._lappend = (e, t2) => (_lappend = Module._lappend = wasmExports.lappend)(e, t2), _GetCurrentTimestamp = Module._GetCurrentTimestamp = () => (_GetCurrentTimestamp = Module._GetCurrentTimestamp = wasmExports.GetCurrentTimestamp)(), _pg_prng_double = Module._pg_prng_double = (e) => (_pg_prng_double = Module._pg_prng_double = wasmExports.pg_prng_double)(e), _pg_snprintf = Module._pg_snprintf = (e, t2, r, a) => (_pg_snprintf = Module._pg_snprintf = wasmExports.pg_snprintf)(e, t2, r, a), _sigaddset = Module._sigaddset = (e, t2) => (_sigaddset = Module._sigaddset = wasmExports.sigaddset)(e, t2), _die = Module._die = (e) => (_die = Module._die = wasmExports.die)(e), _check_stack_depth = Module._check_stack_depth = () => (_check_stack_depth = Module._check_stack_depth = wasmExports.check_stack_depth)(), _pre_format_elog_string = Module._pre_format_elog_string = (e, t2) => (_pre_format_elog_string = Module._pre_format_elog_string = wasmExports.pre_format_elog_string)(e, t2), _format_elog_string = Module._format_elog_string = (e, t2) => (_format_elog_string = Module._format_elog_string = wasmExports.format_elog_string)(e, t2), _pstrdup = Module._pstrdup = (e) => (_pstrdup = Module._pstrdup = wasmExports.pstrdup)(e), _SplitIdentifierString = Module._SplitIdentifierString = (e, t2, r) => (_SplitIdentifierString = Module._SplitIdentifierString = wasmExports.SplitIdentifierString)(e, t2, r), _list_free = Module._list_free = (e) => (_list_free = Module._list_free = wasmExports.list_free)(e), _pg_strcasecmp = Module._pg_strcasecmp = (e, t2) => (_pg_strcasecmp = Module._pg_strcasecmp = wasmExports.pg_strcasecmp)(e, t2), _guc_malloc = Module._guc_malloc = (e, t2) => (_guc_malloc = Module._guc_malloc = wasmExports.guc_malloc)(e, t2), _SetConfigOption = Module._SetConfigOption = (e, t2, r, a) => (_SetConfigOption = Module._SetConfigOption = wasmExports.SetConfigOption)(e, t2, r, a), _pg_sprintf = Module._pg_sprintf = (e, t2, r) => (_pg_sprintf = Module._pg_sprintf = wasmExports.pg_sprintf)(e, t2, r), _strcmp = Module._strcmp = (e, t2) => (_strcmp = Module._strcmp = wasmExports.strcmp)(e, t2), _strdup = Module._strdup = (e) => (_strdup = Module._strdup = wasmExports.strdup)(e), _atoi = Module._atoi = (e) => (_atoi = Module._atoi = wasmExports.atoi)(e), _strlcpy = Module._strlcpy = (e, t2, r) => (_strlcpy = Module._strlcpy = wasmExports.strlcpy)(e, t2, r), _pgl_shutdown = Module._pgl_shutdown = () => (_pgl_shutdown = Module._pgl_shutdown = wasmExports.pgl_shutdown)(), _pgl_closed = Module._pgl_closed = () => (_pgl_closed = Module._pgl_closed = wasmExports.pgl_closed)(), _MemoryContextReset = Module._MemoryContextReset = (e) => (_MemoryContextReset = Module._MemoryContextReset = wasmExports.MemoryContextReset)(e), _resetStringInfo = Module._resetStringInfo = (e) => (_resetStringInfo = Module._resetStringInfo = wasmExports.resetStringInfo)(e), _getc = Module._getc = (e) => (_getc = Module._getc = wasmExports.getc)(e), _appendStringInfoChar = Module._appendStringInfoChar = (e, t2) => (_appendStringInfoChar = Module._appendStringInfoChar = wasmExports.appendStringInfoChar)(e, t2), _strlen = Module._strlen = (e) => (_strlen = Module._strlen = wasmExports.strlen)(e), _strncmp = Module._strncmp = (e, t2, r) => (_strncmp = Module._strncmp = wasmExports.strncmp)(e, t2, r), _pg_fprintf = Module._pg_fprintf = (e, t2, r) => (_pg_fprintf = Module._pg_fprintf = wasmExports.pg_fprintf)(e, t2, r), _pgstat_report_activity = Module._pgstat_report_activity = (e, t2) => (_pgstat_report_activity = Module._pgstat_report_activity = wasmExports.pgstat_report_activity)(e, t2), _errhidestmt = Module._errhidestmt = (e) => (_errhidestmt = Module._errhidestmt = wasmExports.errhidestmt)(e), _GetTransactionSnapshot = Module._GetTransactionSnapshot = () => (_GetTransactionSnapshot = Module._GetTransactionSnapshot = wasmExports.GetTransactionSnapshot)(), _PushActiveSnapshot = Module._PushActiveSnapshot = (e) => (_PushActiveSnapshot = Module._PushActiveSnapshot = wasmExports.PushActiveSnapshot)(e), _AllocSetContextCreateInternal = Module._AllocSetContextCreateInternal = (e, t2, r, a, o3) => (_AllocSetContextCreateInternal = Module._AllocSetContextCreateInternal = wasmExports.AllocSetContextCreateInternal)(e, t2, r, a, o3), _PopActiveSnapshot = Module._PopActiveSnapshot = () => (_PopActiveSnapshot = Module._PopActiveSnapshot = wasmExports.PopActiveSnapshot)(), _CreateDestReceiver = Module._CreateDestReceiver = (e) => (_CreateDestReceiver = Module._CreateDestReceiver = wasmExports.CreateDestReceiver)(e), _CommitTransactionCommand = Module._CommitTransactionCommand = () => (_CommitTransactionCommand = Module._CommitTransactionCommand = wasmExports.CommitTransactionCommand)(), _CommandCounterIncrement = Module._CommandCounterIncrement = () => (_CommandCounterIncrement = Module._CommandCounterIncrement = wasmExports.CommandCounterIncrement)(), _MemoryContextDelete = Module._MemoryContextDelete = (e) => (_MemoryContextDelete = Module._MemoryContextDelete = wasmExports.MemoryContextDelete)(e), _StartTransactionCommand = Module._StartTransactionCommand = () => (_StartTransactionCommand = Module._StartTransactionCommand = wasmExports.StartTransactionCommand)(), _enlargeStringInfo = Module._enlargeStringInfo = (e, t2) => (_enlargeStringInfo = Module._enlargeStringInfo = wasmExports.enlargeStringInfo)(e, t2), ___wasm_setjmp_test = Module.___wasm_setjmp_test = (e, t2) => (___wasm_setjmp_test = Module.___wasm_setjmp_test = wasmExports.__wasm_setjmp_test)(e, t2), _pg_printf = Module._pg_printf = (e, t2) => (_pg_printf = Module._pg_printf = wasmExports.pg_printf)(e, t2), ___wasm_setjmp = Module.___wasm_setjmp = (e, t2, r) => (___wasm_setjmp = Module.___wasm_setjmp = wasmExports.__wasm_setjmp)(e, t2, r), _FlushErrorState = Module._FlushErrorState = () => (_FlushErrorState = Module._FlushErrorState = wasmExports.FlushErrorState)(), _emscripten_longjmp = Module._emscripten_longjmp = (e, t2) => (_emscripten_longjmp = Module._emscripten_longjmp = wasmExports.emscripten_longjmp)(e, t2), _malloc = Module._malloc = (e) => (_malloc = Module._malloc = wasmExports.malloc)(e), _realloc = Module._realloc = (e, t2) => (_realloc = Module._realloc = wasmExports.realloc)(e, t2), _getenv = Module._getenv = (e) => (_getenv = Module._getenv = wasmExports.getenv)(e), _strspn = Module._strspn = (e, t2) => (_strspn = Module._strspn = wasmExports.strspn)(e, t2), _strnlen = Module._strnlen = (e, t2) => (_strnlen = Module._strnlen = wasmExports.strnlen)(e, t2), _setenv = Module._setenv = (e, t2, r) => (_setenv = Module._setenv = wasmExports.setenv)(e, t2, r), _mkdir = Module._mkdir = (e, t2) => (_mkdir = Module._mkdir = wasmExports.mkdir)(e, t2), _fileno = Module._fileno = (e) => (_fileno = Module._fileno = wasmExports.fileno)(e), _isatty = Module._isatty = (e) => (_isatty = Module._isatty = wasmExports.isatty)(e), _strchr = Module._strchr = (e, t2) => (_strchr = Module._strchr = wasmExports.strchr)(e, t2), _pg_vsnprintf = Module._pg_vsnprintf = (e, t2, r, a) => (_pg_vsnprintf = Module._pg_vsnprintf = wasmExports.pg_vsnprintf)(e, t2, r, a), _strcpy = Module._strcpy = (e, t2) => (_strcpy = Module._strcpy = wasmExports.strcpy)(e, t2), _pg_get_encoding_from_locale = Module._pg_get_encoding_from_locale = (e, t2) => (_pg_get_encoding_from_locale = Module._pg_get_encoding_from_locale = wasmExports.pg_get_encoding_from_locale)(e, t2), _pg_encoding_to_char_private = Module._pg_encoding_to_char_private = (e) => (_pg_encoding_to_char_private = Module._pg_encoding_to_char_private = wasmExports.pg_encoding_to_char_private)(e), _psprintf = Module._psprintf = (e, t2) => (_psprintf = Module._psprintf = wasmExports.psprintf)(e, t2), _stat = Module._stat = (e, t2) => (_stat = Module._stat = wasmExports.stat)(e, t2), _pqsignal = Module._pqsignal = (e, t2) => (_pqsignal = Module._pqsignal = wasmExports.pqsignal)(e, t2), _chmod = Module._chmod = (e, t2) => (_chmod = Module._chmod = wasmExports.chmod)(e, t2), _fwrite = Module._fwrite = (e, t2, r, a) => (_fwrite = Module._fwrite = wasmExports.fwrite)(e, t2, r, a), _strftime = Module._strftime = (e, t2, r, a) => (_strftime = Module._strftime = wasmExports.strftime)(e, t2, r, a), _strstr = Module._strstr = (e, t2) => (_strstr = Module._strstr = wasmExports.strstr)(e, t2), _fputs = Module._fputs = (e, t2) => (_fputs = Module._fputs = wasmExports.fputs)(e, t2), _atexit = Module._atexit = (e) => (_atexit = Module._atexit = wasmExports.atexit)(e), _strtol = Module._strtol = (e, t2, r) => (_strtol = Module._strtol = wasmExports.strtol)(e, t2, r), _ferror = Module._ferror = (e) => (_ferror = Module._ferror = wasmExports.ferror)(e), _pg_strip_crlf = Module._pg_strip_crlf = (e) => (_pg_strip_crlf = Module._pg_strip_crlf = wasmExports.pg_strip_crlf)(e), _get_buffer_size = Module._get_buffer_size = (e) => (_get_buffer_size = Module._get_buffer_size = wasmExports.get_buffer_size)(e), _get_buffer_addr = Module._get_buffer_addr = (e) => (_get_buffer_addr = Module._get_buffer_addr = wasmExports.get_buffer_addr)(e), _get_channel = Module._get_channel = () => (_get_channel = Module._get_channel = wasmExports.get_channel)(), _interactive_read = Module._interactive_read = () => (_interactive_read = Module._interactive_read = wasmExports.interactive_read)(), _interactive_write = Module._interactive_write = (e) => (_interactive_write = Module._interactive_write = wasmExports.interactive_write)(e), _use_wire = Module._use_wire = (e) => (_use_wire = Module._use_wire = wasmExports.use_wire)(e), _clear_error = Module._clear_error = () => (_clear_error = Module._clear_error = wasmExports.clear_error)(), _interactive_one = Module._interactive_one = () => (_interactive_one = Module._interactive_one = wasmExports.interactive_one)(), _abort = Module._abort = () => (_abort = Module._abort = wasmExports.abort)(), _fseek = Module._fseek = (e, t2, r) => (_fseek = Module._fseek = wasmExports.fseek)(e, t2, r), _ftell = Module._ftell = (e) => (_ftell = Module._ftell = wasmExports.ftell)(e), _pq_recvbuf_fill = Module._pq_recvbuf_fill = (e, t2) => (_pq_recvbuf_fill = Module._pq_recvbuf_fill = wasmExports.pq_recvbuf_fill)(e, t2), _pq_getmsgint = Module._pq_getmsgint = (e, t2) => (_pq_getmsgint = Module._pq_getmsgint = wasmExports.pq_getmsgint)(e, t2), _palloc = Module._palloc = (e) => (_palloc = Module._palloc = wasmExports.palloc)(e), _makeParamList = Module._makeParamList = (e) => (_makeParamList = Module._makeParamList = wasmExports.makeParamList)(e), _getTypeInputInfo = Module._getTypeInputInfo = (e, t2, r) => (_getTypeInputInfo = Module._getTypeInputInfo = wasmExports.getTypeInputInfo)(e, t2, r), _pnstrdup = Module._pnstrdup = (e, t2) => (_pnstrdup = Module._pnstrdup = wasmExports.pnstrdup)(e, t2), _MemoryContextSetParent = Module._MemoryContextSetParent = (e, t2) => (_MemoryContextSetParent = Module._MemoryContextSetParent = wasmExports.MemoryContextSetParent)(e, t2), _unlink = Module._unlink = (e) => (_unlink = Module._unlink = wasmExports.unlink)(e), _pgl_backend = Module._pgl_backend = () => (_pgl_backend = Module._pgl_backend = wasmExports.pgl_backend)(), _pgl_initdb = Module._pgl_initdb = () => (_pgl_initdb = Module._pgl_initdb = wasmExports.pgl_initdb)(), _dup = Module._dup = (e) => (_dup = Module._dup = wasmExports.dup)(e), _fdopen = Module._fdopen = (e, t2) => (_fdopen = Module._fdopen = wasmExports.fdopen)(e, t2), _main = Module._main = (e, t2) => (_main = Module._main = wasmExports.__main_argc_argv)(e, t2), _appendStringInfoStringQuoted = Module._appendStringInfoStringQuoted = (e, t2, r) => (_appendStringInfoStringQuoted = Module._appendStringInfoStringQuoted = wasmExports.appendStringInfoStringQuoted)(e, t2, r), _set_errcontext_domain = Module._set_errcontext_domain = (e) => (_set_errcontext_domain = Module._set_errcontext_domain = wasmExports.set_errcontext_domain)(e), _errcontext_msg = Module._errcontext_msg = (e, t2) => (_errcontext_msg = Module._errcontext_msg = wasmExports.errcontext_msg)(e, t2), _pg_is_ascii = Module._pg_is_ascii = (e) => (_pg_is_ascii = Module._pg_is_ascii = wasmExports.pg_is_ascii)(e), _memchr = Module._memchr = (e, t2, r) => (_memchr = Module._memchr = wasmExports.memchr)(e, t2, r), _strrchr = Module._strrchr = (e, t2) => (_strrchr = Module._strrchr = wasmExports.strrchr)(e, t2), _replace_percent_placeholders = Module._replace_percent_placeholders = (e, t2, r, a) => (_replace_percent_placeholders = Module._replace_percent_placeholders = wasmExports.replace_percent_placeholders)(e, t2, r, a), _pg_b64_encode = Module._pg_b64_encode = (e, t2, r, a) => (_pg_b64_encode = Module._pg_b64_encode = wasmExports.pg_b64_encode)(e, t2, r, a), _pg_b64_decode = Module._pg_b64_decode = (e, t2, r, a) => (_pg_b64_decode = Module._pg_b64_decode = wasmExports.pg_b64_decode)(e, t2, r, a), _pg_b64_enc_len = Module._pg_b64_enc_len = (e) => (_pg_b64_enc_len = Module._pg_b64_enc_len = wasmExports.pg_b64_enc_len)(e), _pg_b64_dec_len = Module._pg_b64_dec_len = (e) => (_pg_b64_dec_len = Module._pg_b64_dec_len = wasmExports.pg_b64_dec_len)(e), _MemoryContextAllocZero = Module._MemoryContextAllocZero = (e, t2) => (_MemoryContextAllocZero = Module._MemoryContextAllocZero = wasmExports.MemoryContextAllocZero)(e, t2), _MemoryContextAllocExtended = Module._MemoryContextAllocExtended = (e, t2, r) => (_MemoryContextAllocExtended = Module._MemoryContextAllocExtended = wasmExports.MemoryContextAllocExtended)(e, t2, r), _hash_bytes = Module._hash_bytes = (e, t2) => (_hash_bytes = Module._hash_bytes = wasmExports.hash_bytes)(e, t2), _memcmp = Module._memcmp = (e, t2, r) => (_memcmp = Module._memcmp = wasmExports.memcmp)(e, t2, r), _repalloc = Module._repalloc = (e, t2) => (_repalloc = Module._repalloc = wasmExports.repalloc)(e, t2), _pg_qsort = Module._pg_qsort = (e, t2, r, a) => (_pg_qsort = Module._pg_qsort = wasmExports.pg_qsort)(e, t2, r, a), _strlcat = Module._strlcat = (e, t2, r) => (_strlcat = Module._strlcat = wasmExports.strlcat)(e, t2, r), _OpenTransientFile = Module._OpenTransientFile = (e, t2) => (_OpenTransientFile = Module._OpenTransientFile = wasmExports.OpenTransientFile)(e, t2), _errcode_for_file_access = Module._errcode_for_file_access = () => (_errcode_for_file_access = Module._errcode_for_file_access = wasmExports.errcode_for_file_access)(), _read = Module._read = (e, t2, r) => (_read = Module._read = wasmExports.read)(e, t2, r), _CloseTransientFile = Module._CloseTransientFile = (e) => (_CloseTransientFile = Module._CloseTransientFile = wasmExports.CloseTransientFile)(e), _time = Module._time = (e) => (_time = Module._time = wasmExports.time)(e), _write = Module._write = (e, t2, r) => (_write = Module._write = wasmExports.write)(e, t2, r), _close = Module._close = (e) => (_close = Module._close = wasmExports.close)(e), ___multi3 = Module.___multi3 = (e, t2, r, a, o3) => (___multi3 = Module.___multi3 = wasmExports.__multi3)(e, t2, r, a, o3), _pg_char_to_encoding_private = Module._pg_char_to_encoding_private = (e) => (_pg_char_to_encoding_private = Module._pg_char_to_encoding_private = wasmExports.pg_char_to_encoding_private)(e), _isalnum = Module._isalnum = (e) => (_isalnum = Module._isalnum = wasmExports.isalnum)(e), _popen = Module._popen = (e, t2) => (_popen = Module._popen = wasmExports.popen)(e, t2), _pclose = Module._pclose = (e) => (_pclose = Module._pclose = wasmExports.pclose)(e), _wait_result_to_str = Module._wait_result_to_str = (e) => (_wait_result_to_str = Module._wait_result_to_str = wasmExports.wait_result_to_str)(e), _float_to_shortest_decimal_bufn = Module._float_to_shortest_decimal_bufn = (e, t2) => (_float_to_shortest_decimal_bufn = Module._float_to_shortest_decimal_bufn = wasmExports.float_to_shortest_decimal_bufn)(e, t2), _float_to_shortest_decimal_buf = Module._float_to_shortest_decimal_buf = (e, t2) => (_float_to_shortest_decimal_buf = Module._float_to_shortest_decimal_buf = wasmExports.float_to_shortest_decimal_buf)(e, t2), _pwrite = Module._pwrite = (e, t2, r, a) => (_pwrite = Module._pwrite = wasmExports.pwrite)(e, t2, r, a), _hash_bytes_extended = Module._hash_bytes_extended = (e, t2, r) => (_hash_bytes_extended = Module._hash_bytes_extended = wasmExports.hash_bytes_extended)(e, t2, r), _pg_getaddrinfo_all = Module._pg_getaddrinfo_all = (e, t2, r, a) => (_pg_getaddrinfo_all = Module._pg_getaddrinfo_all = wasmExports.pg_getaddrinfo_all)(e, t2, r, a), _calloc = Module._calloc = (e, t2) => (_calloc = Module._calloc = wasmExports.calloc)(e, t2), _pg_freeaddrinfo_all = Module._pg_freeaddrinfo_all = (e, t2) => (_pg_freeaddrinfo_all = Module._pg_freeaddrinfo_all = wasmExports.pg_freeaddrinfo_all)(e, t2), _freeaddrinfo = Module._freeaddrinfo = (e) => (_freeaddrinfo = Module._freeaddrinfo = wasmExports.freeaddrinfo)(e), _pg_getnameinfo_all = Module._pg_getnameinfo_all = (e, t2, r, a, o3, s2, l2) => (_pg_getnameinfo_all = Module._pg_getnameinfo_all = wasmExports.pg_getnameinfo_all)(e, t2, r, a, o3, s2, l2), _IsValidJsonNumber = Module._IsValidJsonNumber = (e, t2) => (_IsValidJsonNumber = Module._IsValidJsonNumber = wasmExports.IsValidJsonNumber)(e, t2), _appendBinaryStringInfo = Module._appendBinaryStringInfo = (e, t2, r) => (_appendBinaryStringInfo = Module._appendBinaryStringInfo = wasmExports.appendBinaryStringInfo)(e, t2, r), _makeStringInfo = Module._makeStringInfo = () => (_makeStringInfo = Module._makeStringInfo = wasmExports.makeStringInfo)(), _pg_encoding_mblen_or_incomplete = Module._pg_encoding_mblen_or_incomplete = (e, t2, r) => (_pg_encoding_mblen_or_incomplete = Module._pg_encoding_mblen_or_incomplete = wasmExports.pg_encoding_mblen_or_incomplete)(e, t2, r), _GetDatabaseEncodingName = Module._GetDatabaseEncodingName = () => (_GetDatabaseEncodingName = Module._GetDatabaseEncodingName = wasmExports.GetDatabaseEncodingName)(), _ScanKeywordLookup = Module._ScanKeywordLookup = (e, t2) => (_ScanKeywordLookup = Module._ScanKeywordLookup = wasmExports.ScanKeywordLookup)(e, t2), _pg_md5_encrypt = Module._pg_md5_encrypt = (e, t2, r, a, o3) => (_pg_md5_encrypt = Module._pg_md5_encrypt = wasmExports.pg_md5_encrypt)(e, t2, r, a, o3), _strtoul = Module._strtoul = (e, t2, r) => (_strtoul = Module._strtoul = wasmExports.strtoul)(e, t2, r), _sscanf = Module._sscanf = (e, t2, r) => (_sscanf = Module._sscanf = wasmExports.sscanf)(e, t2, r), _fgets = Module._fgets = (e, t2, r) => (_fgets = Module._fgets = wasmExports.fgets)(e, t2, r), _pg_prng_seed = Module._pg_prng_seed = (e, t2) => (_pg_prng_seed = Module._pg_prng_seed = wasmExports.pg_prng_seed)(e, t2), _pg_prng_seed_check = Module._pg_prng_seed_check = (e) => (_pg_prng_seed_check = Module._pg_prng_seed_check = wasmExports.pg_prng_seed_check)(e), _pg_prng_uint64 = Module._pg_prng_uint64 = (e) => (_pg_prng_uint64 = Module._pg_prng_uint64 = wasmExports.pg_prng_uint64)(e), _pg_prng_uint64_range = Module._pg_prng_uint64_range = (e, t2, r) => (_pg_prng_uint64_range = Module._pg_prng_uint64_range = wasmExports.pg_prng_uint64_range)(e, t2, r), _pg_prng_uint32 = Module._pg_prng_uint32 = (e) => (_pg_prng_uint32 = Module._pg_prng_uint32 = wasmExports.pg_prng_uint32)(e), _log = Module._log = (e) => (_log = Module._log = wasmExports.log)(e), _sin = Module._sin = (e) => (_sin = Module._sin = wasmExports.sin)(e), _opendir = Module._opendir = (e) => (_opendir = Module._opendir = wasmExports.opendir)(e), _readdir = Module._readdir = (e) => (_readdir = Module._readdir = wasmExports.readdir)(e), _closedir = Module._closedir = (e) => (_closedir = Module._closedir = wasmExports.closedir)(e), _forkname_to_number = Module._forkname_to_number = (e) => (_forkname_to_number = Module._forkname_to_number = wasmExports.forkname_to_number)(e), _pg_saslprep = Module._pg_saslprep = (e, t2) => (_pg_saslprep = Module._pg_saslprep = wasmExports.pg_saslprep)(e, t2), _pg_utf_mblen_private = Module._pg_utf_mblen_private = (e) => (_pg_utf_mblen_private = Module._pg_utf_mblen_private = wasmExports.pg_utf_mblen_private)(e), _pg_utf8_islegal = Module._pg_utf8_islegal = (e, t2) => (_pg_utf8_islegal = Module._pg_utf8_islegal = wasmExports.pg_utf8_islegal)(e, t2), _bsearch = Module._bsearch = (e, t2, r, a, o3) => (_bsearch = Module._bsearch = wasmExports.bsearch)(e, t2, r, a, o3), _scram_SaltedPassword = Module._scram_SaltedPassword = (e, t2, r, a, o3, s2, l2, _2) => (_scram_SaltedPassword = Module._scram_SaltedPassword = wasmExports.scram_SaltedPassword)(e, t2, r, a, o3, s2, l2, _2), _pg_hmac_create = Module._pg_hmac_create = (e) => (_pg_hmac_create = Module._pg_hmac_create = wasmExports.pg_hmac_create)(e), _pg_hmac_error = Module._pg_hmac_error = (e) => (_pg_hmac_error = Module._pg_hmac_error = wasmExports.pg_hmac_error)(e), _pg_hmac_init = Module._pg_hmac_init = (e, t2, r) => (_pg_hmac_init = Module._pg_hmac_init = wasmExports.pg_hmac_init)(e, t2, r), _pg_hmac_update = Module._pg_hmac_update = (e, t2, r) => (_pg_hmac_update = Module._pg_hmac_update = wasmExports.pg_hmac_update)(e, t2, r), _pg_hmac_final = Module._pg_hmac_final = (e, t2, r) => (_pg_hmac_final = Module._pg_hmac_final = wasmExports.pg_hmac_final)(e, t2, r), _pg_hmac_free = Module._pg_hmac_free = (e) => (_pg_hmac_free = Module._pg_hmac_free = wasmExports.pg_hmac_free)(e), _scram_H = Module._scram_H = (e, t2, r, a, o3) => (_scram_H = Module._scram_H = wasmExports.scram_H)(e, t2, r, a, o3), _scram_ClientKey = Module._scram_ClientKey = (e, t2, r, a, o3) => (_scram_ClientKey = Module._scram_ClientKey = wasmExports.scram_ClientKey)(e, t2, r, a, o3), _scram_ServerKey = Module._scram_ServerKey = (e, t2, r, a, o3) => (_scram_ServerKey = Module._scram_ServerKey = wasmExports.scram_ServerKey)(e, t2, r, a, o3), _scram_build_secret = Module._scram_build_secret = (e, t2, r, a, o3, s2, l2) => (_scram_build_secret = Module._scram_build_secret = wasmExports.scram_build_secret)(e, t2, r, a, o3, s2, l2), _palloc_extended = Module._palloc_extended = (e, t2) => (_palloc_extended = Module._palloc_extended = wasmExports.palloc_extended)(e, t2), _appendStringInfoSpaces = Module._appendStringInfoSpaces = (e, t2) => (_appendStringInfoSpaces = Module._appendStringInfoSpaces = wasmExports.appendStringInfoSpaces)(e, t2), _geteuid = Module._geteuid = () => (_geteuid = Module._geteuid = wasmExports.geteuid)(), _pg_encoding_set_invalid = Module._pg_encoding_set_invalid = (e, t2) => (_pg_encoding_set_invalid = Module._pg_encoding_set_invalid = wasmExports.pg_encoding_set_invalid)(e, t2), _pg_encoding_mblen = Module._pg_encoding_mblen = (e, t2) => (_pg_encoding_mblen = Module._pg_encoding_mblen = wasmExports.pg_encoding_mblen)(e, t2), _pg_encoding_dsplen = Module._pg_encoding_dsplen = (e, t2) => (_pg_encoding_dsplen = Module._pg_encoding_dsplen = wasmExports.pg_encoding_dsplen)(e, t2), _pg_encoding_verifymbchar = Module._pg_encoding_verifymbchar = (e, t2, r) => (_pg_encoding_verifymbchar = Module._pg_encoding_verifymbchar = wasmExports.pg_encoding_verifymbchar)(e, t2, r), _pg_encoding_verifymbstr = Module._pg_encoding_verifymbstr = (e, t2, r) => (_pg_encoding_verifymbstr = Module._pg_encoding_verifymbstr = wasmExports.pg_encoding_verifymbstr)(e, t2, r), _pg_encoding_max_length = Module._pg_encoding_max_length = (e) => (_pg_encoding_max_length = Module._pg_encoding_max_length = wasmExports.pg_encoding_max_length)(e), _explicit_bzero = Module._explicit_bzero = (e, t2) => (_explicit_bzero = Module._explicit_bzero = wasmExports.explicit_bzero)(e, t2), _getpeereid = Module._getpeereid = (e, t2, r) => (_getpeereid = Module._getpeereid = wasmExports.getpeereid)(e, t2, r), _pg_inet_net_ntop = Module._pg_inet_net_ntop = (e, t2, r, a, o3) => (_pg_inet_net_ntop = Module._pg_inet_net_ntop = wasmExports.pg_inet_net_ntop)(e, t2, r, a, o3), _fcntl = Module._fcntl = (e, t2, r) => (_fcntl = Module._fcntl = wasmExports.fcntl)(e, t2, r), _getcwd = Module._getcwd = (e, t2) => (_getcwd = Module._getcwd = wasmExports.getcwd)(e, t2), _pg_get_user_home_dir = Module._pg_get_user_home_dir = (e, t2, r) => (_pg_get_user_home_dir = Module._pg_get_user_home_dir = wasmExports.pg_get_user_home_dir)(e, t2, r), _pg_popcount_optimized = Module._pg_popcount_optimized = (e, t2) => (_pg_popcount_optimized = Module._pg_popcount_optimized = wasmExports.pg_popcount_optimized)(e, t2), _pg_strong_random = Module._pg_strong_random = (e, t2) => (_pg_strong_random = Module._pg_strong_random = wasmExports.pg_strong_random)(e, t2), _open = Module._open = (e, t2, r) => (_open = Module._open = wasmExports.open)(e, t2, r), _pg_usleep = Module._pg_usleep = (e) => (_pg_usleep = Module._pg_usleep = wasmExports.pg_usleep)(e), _nanosleep = Module._nanosleep = (e, t2) => (_nanosleep = Module._nanosleep = wasmExports.nanosleep)(e, t2), _pg_tolower = Module._pg_tolower = (e) => (_pg_tolower = Module._pg_tolower = wasmExports.pg_tolower)(e), _sigemptyset = Module._sigemptyset = (e) => (_sigemptyset = Module._sigemptyset = wasmExports.sigemptyset)(e), _sigaction = Module._sigaction = (e, t2, r) => (_sigaction = Module._sigaction = wasmExports.sigaction)(e, t2, r), _getpid = Module._getpid = () => (_getpid = Module._getpid = wasmExports.getpid)(), _qsort_arg = Module._qsort_arg = (e, t2, r, a, o3) => (_qsort_arg = Module._qsort_arg = wasmExports.qsort_arg)(e, t2, r, a, o3), _snprintf = Module._snprintf = (e, t2, r, a) => (_snprintf = Module._snprintf = wasmExports.snprintf)(e, t2, r, a), _pg_strerror_r = Module._pg_strerror_r = (e, t2, r) => (_pg_strerror_r = Module._pg_strerror_r = wasmExports.pg_strerror_r)(e, t2, r), _strerror_r = Module._strerror_r = (e, t2, r) => (_strerror_r = Module._strerror_r = wasmExports.strerror_r)(e, t2, r), _RelationGetNumberOfBlocksInFork = Module._RelationGetNumberOfBlocksInFork = (e, t2) => (_RelationGetNumberOfBlocksInFork = Module._RelationGetNumberOfBlocksInFork = wasmExports.RelationGetNumberOfBlocksInFork)(e, t2), _ExtendBufferedRel = Module._ExtendBufferedRel = (e, t2, r, a) => (_ExtendBufferedRel = Module._ExtendBufferedRel = wasmExports.ExtendBufferedRel)(e, t2, r, a), _MarkBufferDirty = Module._MarkBufferDirty = (e) => (_MarkBufferDirty = Module._MarkBufferDirty = wasmExports.MarkBufferDirty)(e), _XLogBeginInsert = Module._XLogBeginInsert = () => (_XLogBeginInsert = Module._XLogBeginInsert = wasmExports.XLogBeginInsert)(), _XLogRegisterData = Module._XLogRegisterData = (e, t2) => (_XLogRegisterData = Module._XLogRegisterData = wasmExports.XLogRegisterData)(e, t2), _XLogInsert = Module._XLogInsert = (e, t2) => (_XLogInsert = Module._XLogInsert = wasmExports.XLogInsert)(e, t2), _UnlockReleaseBuffer = Module._UnlockReleaseBuffer = (e) => (_UnlockReleaseBuffer = Module._UnlockReleaseBuffer = wasmExports.UnlockReleaseBuffer)(e), _brin_build_desc = Module._brin_build_desc = (e) => (_brin_build_desc = Module._brin_build_desc = wasmExports.brin_build_desc)(e), _EnterParallelMode = Module._EnterParallelMode = () => (_EnterParallelMode = Module._EnterParallelMode = wasmExports.EnterParallelMode)(), _CreateParallelContext = Module._CreateParallelContext = (e, t2, r) => (_CreateParallelContext = Module._CreateParallelContext = wasmExports.CreateParallelContext)(e, t2, r), _RegisterSnapshot = Module._RegisterSnapshot = (e) => (_RegisterSnapshot = Module._RegisterSnapshot = wasmExports.RegisterSnapshot)(e), _table_parallelscan_estimate = Module._table_parallelscan_estimate = (e, t2) => (_table_parallelscan_estimate = Module._table_parallelscan_estimate = wasmExports.table_parallelscan_estimate)(e, t2), _add_size = Module._add_size = (e, t2) => (_add_size = Module._add_size = wasmExports.add_size)(e, t2), _tuplesort_estimate_shared = Module._tuplesort_estimate_shared = (e) => (_tuplesort_estimate_shared = Module._tuplesort_estimate_shared = wasmExports.tuplesort_estimate_shared)(e), _InitializeParallelDSM = Module._InitializeParallelDSM = (e) => (_InitializeParallelDSM = Module._InitializeParallelDSM = wasmExports.InitializeParallelDSM)(e), _UnregisterSnapshot = Module._UnregisterSnapshot = (e) => (_UnregisterSnapshot = Module._UnregisterSnapshot = wasmExports.UnregisterSnapshot)(e), _DestroyParallelContext = Module._DestroyParallelContext = (e) => (_DestroyParallelContext = Module._DestroyParallelContext = wasmExports.DestroyParallelContext)(e), _ExitParallelMode = Module._ExitParallelMode = () => (_ExitParallelMode = Module._ExitParallelMode = wasmExports.ExitParallelMode)(), _shm_toc_allocate = Module._shm_toc_allocate = (e, t2) => (_shm_toc_allocate = Module._shm_toc_allocate = wasmExports.shm_toc_allocate)(e, t2), _ConditionVariableInit = Module._ConditionVariableInit = (e) => (_ConditionVariableInit = Module._ConditionVariableInit = wasmExports.ConditionVariableInit)(e), _s_init_lock_sema = Module._s_init_lock_sema = (e, t2) => (_s_init_lock_sema = Module._s_init_lock_sema = wasmExports.s_init_lock_sema)(e, t2), _table_parallelscan_initialize = Module._table_parallelscan_initialize = (e, t2, r) => (_table_parallelscan_initialize = Module._table_parallelscan_initialize = wasmExports.table_parallelscan_initialize)(e, t2, r), _tuplesort_initialize_shared = Module._tuplesort_initialize_shared = (e, t2, r) => (_tuplesort_initialize_shared = Module._tuplesort_initialize_shared = wasmExports.tuplesort_initialize_shared)(e, t2, r), _shm_toc_insert = Module._shm_toc_insert = (e, t2, r) => (_shm_toc_insert = Module._shm_toc_insert = wasmExports.shm_toc_insert)(e, t2, r), _LaunchParallelWorkers = Module._LaunchParallelWorkers = (e) => (_LaunchParallelWorkers = Module._LaunchParallelWorkers = wasmExports.LaunchParallelWorkers)(e), _WaitForParallelWorkersToAttach = Module._WaitForParallelWorkersToAttach = (e) => (_WaitForParallelWorkersToAttach = Module._WaitForParallelWorkersToAttach = wasmExports.WaitForParallelWorkersToAttach)(e), _tas_sema = Module._tas_sema = (e) => (_tas_sema = Module._tas_sema = wasmExports.tas_sema)(e), _s_lock = Module._s_lock = (e, t2, r, a) => (_s_lock = Module._s_lock = wasmExports.s_lock)(e, t2, r, a), _s_unlock_sema = Module._s_unlock_sema = (e) => (_s_unlock_sema = Module._s_unlock_sema = wasmExports.s_unlock_sema)(e), _ConditionVariableSleep = Module._ConditionVariableSleep = (e, t2) => (_ConditionVariableSleep = Module._ConditionVariableSleep = wasmExports.ConditionVariableSleep)(e, t2), _ConditionVariableCancelSleep = Module._ConditionVariableCancelSleep = () => (_ConditionVariableCancelSleep = Module._ConditionVariableCancelSleep = wasmExports.ConditionVariableCancelSleep)(), _tuplesort_performsort = Module._tuplesort_performsort = (e) => (_tuplesort_performsort = Module._tuplesort_performsort = wasmExports.tuplesort_performsort)(e), _tuplesort_end = Module._tuplesort_end = (e) => (_tuplesort_end = Module._tuplesort_end = wasmExports.tuplesort_end)(e), _brin_deform_tuple = Module._brin_deform_tuple = (e, t2, r) => (_brin_deform_tuple = Module._brin_deform_tuple = wasmExports.brin_deform_tuple)(e, t2, r), _log_newpage_buffer = Module._log_newpage_buffer = (e, t2) => (_log_newpage_buffer = Module._log_newpage_buffer = wasmExports.log_newpage_buffer)(e, t2), _LockBuffer = Module._LockBuffer = (e, t2) => (_LockBuffer = Module._LockBuffer = wasmExports.LockBuffer)(e, t2), _ReleaseBuffer = Module._ReleaseBuffer = (e) => (_ReleaseBuffer = Module._ReleaseBuffer = wasmExports.ReleaseBuffer)(e), _IndexGetRelation = Module._IndexGetRelation = (e, t2) => (_IndexGetRelation = Module._IndexGetRelation = wasmExports.IndexGetRelation)(e, t2), _table_open = Module._table_open = (e, t2) => (_table_open = Module._table_open = wasmExports.table_open)(e, t2), _ReadBufferExtended = Module._ReadBufferExtended = (e, t2, r, a, o3) => (_ReadBufferExtended = Module._ReadBufferExtended = wasmExports.ReadBufferExtended)(e, t2, r, a, o3), _table_close = Module._table_close = (e, t2) => (_table_close = Module._table_close = wasmExports.table_close)(e, t2), _build_reloptions = Module._build_reloptions = (e, t2, r, a, o3, s2) => (_build_reloptions = Module._build_reloptions = wasmExports.build_reloptions)(e, t2, r, a, o3, s2), _RelationGetIndexScan = Module._RelationGetIndexScan = (e, t2, r) => (_RelationGetIndexScan = Module._RelationGetIndexScan = wasmExports.RelationGetIndexScan)(e, t2, r), _pgstat_assoc_relation = Module._pgstat_assoc_relation = (e) => (_pgstat_assoc_relation = Module._pgstat_assoc_relation = wasmExports.pgstat_assoc_relation)(e), _index_getprocinfo = Module._index_getprocinfo = (e, t2, r) => (_index_getprocinfo = Module._index_getprocinfo = wasmExports.index_getprocinfo)(e, t2, r), _fmgr_info_copy = Module._fmgr_info_copy = (e, t2, r) => (_fmgr_info_copy = Module._fmgr_info_copy = wasmExports.fmgr_info_copy)(e, t2, r), _FunctionCall4Coll = Module._FunctionCall4Coll = (e, t2, r, a, o3, s2) => (_FunctionCall4Coll = Module._FunctionCall4Coll = wasmExports.FunctionCall4Coll)(e, t2, r, a, o3, s2), _FunctionCall1Coll = Module._FunctionCall1Coll = (e, t2, r) => (_FunctionCall1Coll = Module._FunctionCall1Coll = wasmExports.FunctionCall1Coll)(e, t2, r), _brin_free_desc = Module._brin_free_desc = (e) => (_brin_free_desc = Module._brin_free_desc = wasmExports.brin_free_desc)(e), _WaitForParallelWorkersToFinish = Module._WaitForParallelWorkersToFinish = (e) => (_WaitForParallelWorkersToFinish = Module._WaitForParallelWorkersToFinish = wasmExports.WaitForParallelWorkersToFinish)(e), _PageGetFreeSpace = Module._PageGetFreeSpace = (e) => (_PageGetFreeSpace = Module._PageGetFreeSpace = wasmExports.PageGetFreeSpace)(e), _BufferGetBlockNumber = Module._BufferGetBlockNumber = (e) => (_BufferGetBlockNumber = Module._BufferGetBlockNumber = wasmExports.BufferGetBlockNumber)(e), _BuildIndexInfo = Module._BuildIndexInfo = (e) => (_BuildIndexInfo = Module._BuildIndexInfo = wasmExports.BuildIndexInfo)(e), _Int64GetDatum = Module._Int64GetDatum = (e) => (_Int64GetDatum = Module._Int64GetDatum = wasmExports.Int64GetDatum)(e), _DirectFunctionCall2Coll = Module._DirectFunctionCall2Coll = (e, t2, r, a) => (_DirectFunctionCall2Coll = Module._DirectFunctionCall2Coll = wasmExports.DirectFunctionCall2Coll)(e, t2, r, a), _RecoveryInProgress = Module._RecoveryInProgress = () => (_RecoveryInProgress = Module._RecoveryInProgress = wasmExports.RecoveryInProgress)(), _GetUserIdAndSecContext = Module._GetUserIdAndSecContext = (e, t2) => (_GetUserIdAndSecContext = Module._GetUserIdAndSecContext = wasmExports.GetUserIdAndSecContext)(e, t2), _SetUserIdAndSecContext = Module._SetUserIdAndSecContext = (e, t2) => (_SetUserIdAndSecContext = Module._SetUserIdAndSecContext = wasmExports.SetUserIdAndSecContext)(e, t2), _NewGUCNestLevel = Module._NewGUCNestLevel = () => (_NewGUCNestLevel = Module._NewGUCNestLevel = wasmExports.NewGUCNestLevel)(), _RestrictSearchPath = Module._RestrictSearchPath = () => (_RestrictSearchPath = Module._RestrictSearchPath = wasmExports.RestrictSearchPath)(), _index_open = Module._index_open = (e, t2) => (_index_open = Module._index_open = wasmExports.index_open)(e, t2), _object_ownercheck = Module._object_ownercheck = (e, t2, r) => (_object_ownercheck = Module._object_ownercheck = wasmExports.object_ownercheck)(e, t2, r), _aclcheck_error = Module._aclcheck_error = (e, t2, r) => (_aclcheck_error = Module._aclcheck_error = wasmExports.aclcheck_error)(e, t2, r), _AtEOXact_GUC = Module._AtEOXact_GUC = (e, t2) => (_AtEOXact_GUC = Module._AtEOXact_GUC = wasmExports.AtEOXact_GUC)(e, t2), _relation_close = Module._relation_close = (e, t2) => (_relation_close = Module._relation_close = wasmExports.relation_close)(e, t2), _GetUserId = Module._GetUserId = () => (_GetUserId = Module._GetUserId = wasmExports.GetUserId)(), _ReadBuffer = Module._ReadBuffer = (e, t2) => (_ReadBuffer = Module._ReadBuffer = wasmExports.ReadBuffer)(e, t2), _shm_toc_lookup = Module._shm_toc_lookup = (e, t2, r) => (_shm_toc_lookup = Module._shm_toc_lookup = wasmExports.shm_toc_lookup)(e, t2, r), _tuplesort_attach_shared = Module._tuplesort_attach_shared = (e, t2) => (_tuplesort_attach_shared = Module._tuplesort_attach_shared = wasmExports.tuplesort_attach_shared)(e, t2), _index_close = Module._index_close = (e, t2) => (_index_close = Module._index_close = wasmExports.index_close)(e, t2), _table_beginscan_parallel = Module._table_beginscan_parallel = (e, t2) => (_table_beginscan_parallel = Module._table_beginscan_parallel = wasmExports.table_beginscan_parallel)(e, t2), _ConditionVariableSignal = Module._ConditionVariableSignal = (e) => (_ConditionVariableSignal = Module._ConditionVariableSignal = wasmExports.ConditionVariableSignal)(e), _datumCopy = Module._datumCopy = (e, t2, r) => (_datumCopy = Module._datumCopy = wasmExports.datumCopy)(e, t2, r), _lookup_type_cache = Module._lookup_type_cache = (e, t2) => (_lookup_type_cache = Module._lookup_type_cache = wasmExports.lookup_type_cache)(e, t2), _get_fn_opclass_options = Module._get_fn_opclass_options = (e) => (_get_fn_opclass_options = Module._get_fn_opclass_options = wasmExports.get_fn_opclass_options)(e), _pg_detoast_datum = Module._pg_detoast_datum = (e) => (_pg_detoast_datum = Module._pg_detoast_datum = wasmExports.pg_detoast_datum)(e), _index_getprocid = Module._index_getprocid = (e, t2, r) => (_index_getprocid = Module._index_getprocid = wasmExports.index_getprocid)(e, t2, r), _init_local_reloptions = Module._init_local_reloptions = (e, t2) => (_init_local_reloptions = Module._init_local_reloptions = wasmExports.init_local_reloptions)(e, t2), _FunctionCall2Coll = Module._FunctionCall2Coll = (e, t2, r, a) => (_FunctionCall2Coll = Module._FunctionCall2Coll = wasmExports.FunctionCall2Coll)(e, t2, r, a), _SysCacheGetAttrNotNull = Module._SysCacheGetAttrNotNull = (e, t2, r) => (_SysCacheGetAttrNotNull = Module._SysCacheGetAttrNotNull = wasmExports.SysCacheGetAttrNotNull)(e, t2, r), _ReleaseSysCache = Module._ReleaseSysCache = (e) => (_ReleaseSysCache = Module._ReleaseSysCache = wasmExports.ReleaseSysCache)(e), _fmgr_info_cxt = Module._fmgr_info_cxt = (e, t2, r) => (_fmgr_info_cxt = Module._fmgr_info_cxt = wasmExports.fmgr_info_cxt)(e, t2, r), _Float8GetDatum = Module._Float8GetDatum = (e) => (_Float8GetDatum = Module._Float8GetDatum = wasmExports.Float8GetDatum)(e), _numeric_sub = Module._numeric_sub = (e) => (_numeric_sub = Module._numeric_sub = wasmExports.numeric_sub)(e), _DirectFunctionCall1Coll = Module._DirectFunctionCall1Coll = (e, t2, r) => (_DirectFunctionCall1Coll = Module._DirectFunctionCall1Coll = wasmExports.DirectFunctionCall1Coll)(e, t2, r), _pg_detoast_datum_packed = Module._pg_detoast_datum_packed = (e) => (_pg_detoast_datum_packed = Module._pg_detoast_datum_packed = wasmExports.pg_detoast_datum_packed)(e), _add_local_int_reloption = Module._add_local_int_reloption = (e, t2, r, a, o3, s2, l2) => (_add_local_int_reloption = Module._add_local_int_reloption = wasmExports.add_local_int_reloption)(e, t2, r, a, o3, s2, l2), _getTypeOutputInfo = Module._getTypeOutputInfo = (e, t2, r) => (_getTypeOutputInfo = Module._getTypeOutputInfo = wasmExports.getTypeOutputInfo)(e, t2, r), _fmgr_info = Module._fmgr_info = (e, t2) => (_fmgr_info = Module._fmgr_info = wasmExports.fmgr_info)(e, t2), _OutputFunctionCall = Module._OutputFunctionCall = (e, t2) => (_OutputFunctionCall = Module._OutputFunctionCall = wasmExports.OutputFunctionCall)(e, t2), _cstring_to_text_with_len = Module._cstring_to_text_with_len = (e, t2) => (_cstring_to_text_with_len = Module._cstring_to_text_with_len = wasmExports.cstring_to_text_with_len)(e, t2), _accumArrayResult = Module._accumArrayResult = (e, t2, r, a, o3) => (_accumArrayResult = Module._accumArrayResult = wasmExports.accumArrayResult)(e, t2, r, a, o3), _makeArrayResult = Module._makeArrayResult = (e, t2) => (_makeArrayResult = Module._makeArrayResult = wasmExports.makeArrayResult)(e, t2), _OidOutputFunctionCall = Module._OidOutputFunctionCall = (e, t2) => (_OidOutputFunctionCall = Module._OidOutputFunctionCall = wasmExports.OidOutputFunctionCall)(e, t2), _cstring_to_text = Module._cstring_to_text = (e) => (_cstring_to_text = Module._cstring_to_text = wasmExports.cstring_to_text)(e), _PageGetExactFreeSpace = Module._PageGetExactFreeSpace = (e) => (_PageGetExactFreeSpace = Module._PageGetExactFreeSpace = wasmExports.PageGetExactFreeSpace)(e), _PageIndexTupleOverwrite = Module._PageIndexTupleOverwrite = (e, t2, r, a) => (_PageIndexTupleOverwrite = Module._PageIndexTupleOverwrite = wasmExports.PageIndexTupleOverwrite)(e, t2, r, a), _PageInit = Module._PageInit = (e, t2, r) => (_PageInit = Module._PageInit = wasmExports.PageInit)(e, t2, r), _PageAddItemExtended = Module._PageAddItemExtended = (e, t2, r, a, o3) => (_PageAddItemExtended = Module._PageAddItemExtended = wasmExports.PageAddItemExtended)(e, t2, r, a, o3), _LockRelationForExtension = Module._LockRelationForExtension = (e, t2) => (_LockRelationForExtension = Module._LockRelationForExtension = wasmExports.LockRelationForExtension)(e, t2), _UnlockRelationForExtension = Module._UnlockRelationForExtension = (e, t2) => (_UnlockRelationForExtension = Module._UnlockRelationForExtension = wasmExports.UnlockRelationForExtension)(e, t2), _smgropen = Module._smgropen = (e, t2) => (_smgropen = Module._smgropen = wasmExports.smgropen)(e, t2), _smgrpin = Module._smgrpin = (e) => (_smgrpin = Module._smgrpin = wasmExports.smgrpin)(e), _ItemPointerEquals = Module._ItemPointerEquals = (e, t2) => (_ItemPointerEquals = Module._ItemPointerEquals = wasmExports.ItemPointerEquals)(e, t2), _detoast_external_attr = Module._detoast_external_attr = (e) => (_detoast_external_attr = Module._detoast_external_attr = wasmExports.detoast_external_attr)(e), _CreateTemplateTupleDesc = Module._CreateTemplateTupleDesc = (e) => (_CreateTemplateTupleDesc = Module._CreateTemplateTupleDesc = wasmExports.CreateTemplateTupleDesc)(e), _TupleDescInitEntry = Module._TupleDescInitEntry = (e, t2, r, a, o3, s2) => (_TupleDescInitEntry = Module._TupleDescInitEntry = wasmExports.TupleDescInitEntry)(e, t2, r, a, o3, s2), _SearchSysCache1 = Module._SearchSysCache1 = (e, t2) => (_SearchSysCache1 = Module._SearchSysCache1 = wasmExports.SearchSysCache1)(e, t2), _SearchSysCacheList = Module._SearchSysCacheList = (e, t2, r, a, o3) => (_SearchSysCacheList = Module._SearchSysCacheList = wasmExports.SearchSysCacheList)(e, t2, r, a, o3), _check_amproc_signature = Module._check_amproc_signature = (e, t2, r, a, o3, s2) => (_check_amproc_signature = Module._check_amproc_signature = wasmExports.check_amproc_signature)(e, t2, r, a, o3, s2), _check_amoptsproc_signature = Module._check_amoptsproc_signature = (e) => (_check_amoptsproc_signature = Module._check_amoptsproc_signature = wasmExports.check_amoptsproc_signature)(e), _format_procedure = Module._format_procedure = (e) => (_format_procedure = Module._format_procedure = wasmExports.format_procedure)(e), _format_operator = Module._format_operator = (e) => (_format_operator = Module._format_operator = wasmExports.format_operator)(e), _check_amop_signature = Module._check_amop_signature = (e, t2, r, a) => (_check_amop_signature = Module._check_amop_signature = wasmExports.check_amop_signature)(e, t2, r, a), _identify_opfamily_groups = Module._identify_opfamily_groups = (e, t2) => (_identify_opfamily_groups = Module._identify_opfamily_groups = wasmExports.identify_opfamily_groups)(e, t2), _format_type_be = Module._format_type_be = (e) => (_format_type_be = Module._format_type_be = wasmExports.format_type_be)(e), _ReleaseCatCacheList = Module._ReleaseCatCacheList = (e) => (_ReleaseCatCacheList = Module._ReleaseCatCacheList = wasmExports.ReleaseCatCacheList)(e), _free_attrmap = Module._free_attrmap = (e) => (_free_attrmap = Module._free_attrmap = wasmExports.free_attrmap)(e), _format_type_with_typemod = Module._format_type_with_typemod = (e, t2) => (_format_type_with_typemod = Module._format_type_with_typemod = wasmExports.format_type_with_typemod)(e, t2), _build_attrmap_by_name_if_req = Module._build_attrmap_by_name_if_req = (e, t2, r) => (_build_attrmap_by_name_if_req = Module._build_attrmap_by_name_if_req = wasmExports.build_attrmap_by_name_if_req)(e, t2, r), _DatumGetEOHP = Module._DatumGetEOHP = (e) => (_DatumGetEOHP = Module._DatumGetEOHP = wasmExports.DatumGetEOHP)(e), _EOH_get_flat_size = Module._EOH_get_flat_size = (e) => (_EOH_get_flat_size = Module._EOH_get_flat_size = wasmExports.EOH_get_flat_size)(e), _EOH_flatten_into = Module._EOH_flatten_into = (e, t2, r) => (_EOH_flatten_into = Module._EOH_flatten_into = wasmExports.EOH_flatten_into)(e, t2, r), _getmissingattr = Module._getmissingattr = (e, t2, r) => (_getmissingattr = Module._getmissingattr = wasmExports.getmissingattr)(e, t2, r), _hash_create = Module._hash_create = (e, t2, r, a) => (_hash_create = Module._hash_create = wasmExports.hash_create)(e, t2, r, a), _hash_search = Module._hash_search = (e, t2, r, a) => (_hash_search = Module._hash_search = wasmExports.hash_search)(e, t2, r, a), _nocachegetattr = Module._nocachegetattr = (e, t2, r) => (_nocachegetattr = Module._nocachegetattr = wasmExports.nocachegetattr)(e, t2, r), _heap_form_tuple = Module._heap_form_tuple = (e, t2, r) => (_heap_form_tuple = Module._heap_form_tuple = wasmExports.heap_form_tuple)(e, t2, r), _heap_modify_tuple = Module._heap_modify_tuple = (e, t2, r, a, o3) => (_heap_modify_tuple = Module._heap_modify_tuple = wasmExports.heap_modify_tuple)(e, t2, r, a, o3), _heap_deform_tuple = Module._heap_deform_tuple = (e, t2, r, a) => (_heap_deform_tuple = Module._heap_deform_tuple = wasmExports.heap_deform_tuple)(e, t2, r, a), _heap_modify_tuple_by_cols = Module._heap_modify_tuple_by_cols = (e, t2, r, a, o3, s2) => (_heap_modify_tuple_by_cols = Module._heap_modify_tuple_by_cols = wasmExports.heap_modify_tuple_by_cols)(e, t2, r, a, o3, s2), _heap_freetuple = Module._heap_freetuple = (e) => (_heap_freetuple = Module._heap_freetuple = wasmExports.heap_freetuple)(e), _index_form_tuple = Module._index_form_tuple = (e, t2, r) => (_index_form_tuple = Module._index_form_tuple = wasmExports.index_form_tuple)(e, t2, r), _nocache_index_getattr = Module._nocache_index_getattr = (e, t2, r) => (_nocache_index_getattr = Module._nocache_index_getattr = wasmExports.nocache_index_getattr)(e, t2, r), _index_deform_tuple = Module._index_deform_tuple = (e, t2, r, a) => (_index_deform_tuple = Module._index_deform_tuple = wasmExports.index_deform_tuple)(e, t2, r, a), _slot_getsomeattrs_int = Module._slot_getsomeattrs_int = (e, t2) => (_slot_getsomeattrs_int = Module._slot_getsomeattrs_int = wasmExports.slot_getsomeattrs_int)(e, t2), _pg_ltoa = Module._pg_ltoa = (e, t2) => (_pg_ltoa = Module._pg_ltoa = wasmExports.pg_ltoa)(e, t2), _relation_open = Module._relation_open = (e, t2) => (_relation_open = Module._relation_open = wasmExports.relation_open)(e, t2), _LockRelationOid = Module._LockRelationOid = (e, t2) => (_LockRelationOid = Module._LockRelationOid = wasmExports.LockRelationOid)(e, t2), _RelationIdGetRelation = Module._RelationIdGetRelation = (e) => (_RelationIdGetRelation = Module._RelationIdGetRelation = wasmExports.RelationIdGetRelation)(e), _try_relation_open = Module._try_relation_open = (e, t2) => (_try_relation_open = Module._try_relation_open = wasmExports.try_relation_open)(e, t2), _SearchSysCacheExists = Module._SearchSysCacheExists = (e, t2, r, a, o3) => (_SearchSysCacheExists = Module._SearchSysCacheExists = wasmExports.SearchSysCacheExists)(e, t2, r, a, o3), _relation_openrv = Module._relation_openrv = (e, t2) => (_relation_openrv = Module._relation_openrv = wasmExports.relation_openrv)(e, t2), _RangeVarGetRelidExtended = Module._RangeVarGetRelidExtended = (e, t2, r, a, o3) => (_RangeVarGetRelidExtended = Module._RangeVarGetRelidExtended = wasmExports.RangeVarGetRelidExtended)(e, t2, r, a, o3), _RelationClose = Module._RelationClose = (e) => (_RelationClose = Module._RelationClose = wasmExports.RelationClose)(e), _add_reloption_kind = Module._add_reloption_kind = () => (_add_reloption_kind = Module._add_reloption_kind = wasmExports.add_reloption_kind)(), _register_reloptions_validator = Module._register_reloptions_validator = (e, t2) => (_register_reloptions_validator = Module._register_reloptions_validator = wasmExports.register_reloptions_validator)(e, t2), _add_int_reloption = Module._add_int_reloption = (e, t2, r, a, o3, s2, l2) => (_add_int_reloption = Module._add_int_reloption = wasmExports.add_int_reloption)(e, t2, r, a, o3, s2, l2), _MemoryContextStrdup = Module._MemoryContextStrdup = (e, t2) => (_MemoryContextStrdup = Module._MemoryContextStrdup = wasmExports.MemoryContextStrdup)(e, t2), _transformRelOptions = Module._transformRelOptions = (e, t2, r, a, o3, s2) => (_transformRelOptions = Module._transformRelOptions = wasmExports.transformRelOptions)(e, t2, r, a, o3, s2), _deconstruct_array_builtin = Module._deconstruct_array_builtin = (e, t2, r, a, o3) => (_deconstruct_array_builtin = Module._deconstruct_array_builtin = wasmExports.deconstruct_array_builtin)(e, t2, r, a, o3), _defGetString = Module._defGetString = (e) => (_defGetString = Module._defGetString = wasmExports.defGetString)(e), _defGetBoolean = Module._defGetBoolean = (e) => (_defGetBoolean = Module._defGetBoolean = wasmExports.defGetBoolean)(e), _untransformRelOptions = Module._untransformRelOptions = (e) => (_untransformRelOptions = Module._untransformRelOptions = wasmExports.untransformRelOptions)(e), _text_to_cstring = Module._text_to_cstring = (e) => (_text_to_cstring = Module._text_to_cstring = wasmExports.text_to_cstring)(e), _makeString = Module._makeString = (e) => (_makeString = Module._makeString = wasmExports.makeString)(e), _makeDefElem = Module._makeDefElem = (e, t2, r) => (_makeDefElem = Module._makeDefElem = wasmExports.makeDefElem)(e, t2, r), _heap_reloptions = Module._heap_reloptions = (e, t2, r) => (_heap_reloptions = Module._heap_reloptions = wasmExports.heap_reloptions)(e, t2, r), _MemoryContextAlloc = Module._MemoryContextAlloc = (e, t2) => (_MemoryContextAlloc = Module._MemoryContextAlloc = wasmExports.MemoryContextAlloc)(e, t2), _parse_bool = Module._parse_bool = (e, t2) => (_parse_bool = Module._parse_bool = wasmExports.parse_bool)(e, t2), _parse_int = Module._parse_int = (e, t2, r, a) => (_parse_int = Module._parse_int = wasmExports.parse_int)(e, t2, r, a), _parse_real = Module._parse_real = (e, t2, r, a) => (_parse_real = Module._parse_real = wasmExports.parse_real)(e, t2, r, a), _ScanKeyInit = Module._ScanKeyInit = (e, t2, r, a, o3) => (_ScanKeyInit = Module._ScanKeyInit = wasmExports.ScanKeyInit)(e, t2, r, a, o3), _dsm_segment_handle = Module._dsm_segment_handle = (e) => (_dsm_segment_handle = Module._dsm_segment_handle = wasmExports.dsm_segment_handle)(e), _dsm_create = Module._dsm_create = (e, t2) => (_dsm_create = Module._dsm_create = wasmExports.dsm_create)(e, t2), _dsm_segment_address = Module._dsm_segment_address = (e) => (_dsm_segment_address = Module._dsm_segment_address = wasmExports.dsm_segment_address)(e), _dsm_attach = Module._dsm_attach = (e) => (_dsm_attach = Module._dsm_attach = wasmExports.dsm_attach)(e), _dsm_detach = Module._dsm_detach = (e) => (_dsm_detach = Module._dsm_detach = wasmExports.dsm_detach)(e), _ShmemInitStruct = Module._ShmemInitStruct = (e, t2, r) => (_ShmemInitStruct = Module._ShmemInitStruct = wasmExports.ShmemInitStruct)(e, t2, r), _LWLockAcquire = Module._LWLockAcquire = (e, t2) => (_LWLockAcquire = Module._LWLockAcquire = wasmExports.LWLockAcquire)(e, t2), _LWLockRelease = Module._LWLockRelease = (e) => (_LWLockRelease = Module._LWLockRelease = wasmExports.LWLockRelease)(e), _LWLockInitialize = Module._LWLockInitialize = (e, t2) => (_LWLockInitialize = Module._LWLockInitialize = wasmExports.LWLockInitialize)(e, t2), _MemoryContextMemAllocated = Module._MemoryContextMemAllocated = (e, t2) => (_MemoryContextMemAllocated = Module._MemoryContextMemAllocated = wasmExports.MemoryContextMemAllocated)(e, t2), _GetCurrentCommandId = Module._GetCurrentCommandId = (e) => (_GetCurrentCommandId = Module._GetCurrentCommandId = wasmExports.GetCurrentCommandId)(e), _toast_open_indexes = Module._toast_open_indexes = (e, t2, r, a) => (_toast_open_indexes = Module._toast_open_indexes = wasmExports.toast_open_indexes)(e, t2, r, a), _RelationGetIndexList = Module._RelationGetIndexList = (e) => (_RelationGetIndexList = Module._RelationGetIndexList = wasmExports.RelationGetIndexList)(e), _systable_beginscan = Module._systable_beginscan = (e, t2, r, a, o3, s2) => (_systable_beginscan = Module._systable_beginscan = wasmExports.systable_beginscan)(e, t2, r, a, o3, s2), _systable_getnext = Module._systable_getnext = (e) => (_systable_getnext = Module._systable_getnext = wasmExports.systable_getnext)(e), _systable_endscan = Module._systable_endscan = (e) => (_systable_endscan = Module._systable_endscan = wasmExports.systable_endscan)(e), _toast_close_indexes = Module._toast_close_indexes = (e, t2, r) => (_toast_close_indexes = Module._toast_close_indexes = wasmExports.toast_close_indexes)(e, t2, r), _systable_beginscan_ordered = Module._systable_beginscan_ordered = (e, t2, r, a, o3) => (_systable_beginscan_ordered = Module._systable_beginscan_ordered = wasmExports.systable_beginscan_ordered)(e, t2, r, a, o3), _systable_getnext_ordered = Module._systable_getnext_ordered = (e, t2) => (_systable_getnext_ordered = Module._systable_getnext_ordered = wasmExports.systable_getnext_ordered)(e, t2), _systable_endscan_ordered = Module._systable_endscan_ordered = (e) => (_systable_endscan_ordered = Module._systable_endscan_ordered = wasmExports.systable_endscan_ordered)(e), _init_toast_snapshot = Module._init_toast_snapshot = (e) => (_init_toast_snapshot = Module._init_toast_snapshot = wasmExports.init_toast_snapshot)(e), _convert_tuples_by_position = Module._convert_tuples_by_position = (e, t2, r) => (_convert_tuples_by_position = Module._convert_tuples_by_position = wasmExports.convert_tuples_by_position)(e, t2, r), _execute_attr_map_tuple = Module._execute_attr_map_tuple = (e, t2) => (_execute_attr_map_tuple = Module._execute_attr_map_tuple = wasmExports.execute_attr_map_tuple)(e, t2), _execute_attr_map_slot = Module._execute_attr_map_slot = (e, t2, r) => (_execute_attr_map_slot = Module._execute_attr_map_slot = wasmExports.execute_attr_map_slot)(e, t2, r), _ExecStoreVirtualTuple = Module._ExecStoreVirtualTuple = (e) => (_ExecStoreVirtualTuple = Module._ExecStoreVirtualTuple = wasmExports.ExecStoreVirtualTuple)(e), _bms_is_member = Module._bms_is_member = (e, t2) => (_bms_is_member = Module._bms_is_member = wasmExports.bms_is_member)(e, t2), _bms_add_member = Module._bms_add_member = (e, t2) => (_bms_add_member = Module._bms_add_member = wasmExports.bms_add_member)(e, t2), _CreateTupleDescCopy = Module._CreateTupleDescCopy = (e) => (_CreateTupleDescCopy = Module._CreateTupleDescCopy = wasmExports.CreateTupleDescCopy)(e), _CreateTupleDescCopyConstr = Module._CreateTupleDescCopyConstr = (e) => (_CreateTupleDescCopyConstr = Module._CreateTupleDescCopyConstr = wasmExports.CreateTupleDescCopyConstr)(e), _FreeTupleDesc = Module._FreeTupleDesc = (e) => (_FreeTupleDesc = Module._FreeTupleDesc = wasmExports.FreeTupleDesc)(e), _ResourceOwnerEnlarge = Module._ResourceOwnerEnlarge = (e) => (_ResourceOwnerEnlarge = Module._ResourceOwnerEnlarge = wasmExports.ResourceOwnerEnlarge)(e), _ResourceOwnerRemember = Module._ResourceOwnerRemember = (e, t2, r) => (_ResourceOwnerRemember = Module._ResourceOwnerRemember = wasmExports.ResourceOwnerRemember)(e, t2, r), _DecrTupleDescRefCount = Module._DecrTupleDescRefCount = (e) => (_DecrTupleDescRefCount = Module._DecrTupleDescRefCount = wasmExports.DecrTupleDescRefCount)(e), _ResourceOwnerForget = Module._ResourceOwnerForget = (e, t2, r) => (_ResourceOwnerForget = Module._ResourceOwnerForget = wasmExports.ResourceOwnerForget)(e, t2, r), _datumIsEqual = Module._datumIsEqual = (e, t2, r, a) => (_datumIsEqual = Module._datumIsEqual = wasmExports.datumIsEqual)(e, t2, r, a), _TupleDescInitEntryCollation = Module._TupleDescInitEntryCollation = (e, t2, r) => (_TupleDescInitEntryCollation = Module._TupleDescInitEntryCollation = wasmExports.TupleDescInitEntryCollation)(e, t2, r), _stringToNode = Module._stringToNode = (e) => (_stringToNode = Module._stringToNode = wasmExports.stringToNode)(e), _pg_detoast_datum_copy = Module._pg_detoast_datum_copy = (e) => (_pg_detoast_datum_copy = Module._pg_detoast_datum_copy = wasmExports.pg_detoast_datum_copy)(e), _get_typlenbyvalalign = Module._get_typlenbyvalalign = (e, t2, r, a) => (_get_typlenbyvalalign = Module._get_typlenbyvalalign = wasmExports.get_typlenbyvalalign)(e, t2, r, a), _deconstruct_array = Module._deconstruct_array = (e, t2, r, a, o3, s2, l2, _2) => (_deconstruct_array = Module._deconstruct_array = wasmExports.deconstruct_array)(e, t2, r, a, o3, s2, l2, _2), _tbm_add_tuples = Module._tbm_add_tuples = (e, t2, r, a) => (_tbm_add_tuples = Module._tbm_add_tuples = wasmExports.tbm_add_tuples)(e, t2, r, a), _ginPostingListDecode = Module._ginPostingListDecode = (e, t2) => (_ginPostingListDecode = Module._ginPostingListDecode = wasmExports.ginPostingListDecode)(e, t2), _ItemPointerCompare = Module._ItemPointerCompare = (e, t2) => (_ItemPointerCompare = Module._ItemPointerCompare = wasmExports.ItemPointerCompare)(e, t2), _LockPage = Module._LockPage = (e, t2, r) => (_LockPage = Module._LockPage = wasmExports.LockPage)(e, t2, r), _UnlockPage = Module._UnlockPage = (e, t2, r) => (_UnlockPage = Module._UnlockPage = wasmExports.UnlockPage)(e, t2, r), _vacuum_delay_point = Module._vacuum_delay_point = () => (_vacuum_delay_point = Module._vacuum_delay_point = wasmExports.vacuum_delay_point)(), _RecordFreeIndexPage = Module._RecordFreeIndexPage = (e, t2) => (_RecordFreeIndexPage = Module._RecordFreeIndexPage = wasmExports.RecordFreeIndexPage)(e, t2), _IndexFreeSpaceMapVacuum = Module._IndexFreeSpaceMapVacuum = (e) => (_IndexFreeSpaceMapVacuum = Module._IndexFreeSpaceMapVacuum = wasmExports.IndexFreeSpaceMapVacuum)(e), _log_newpage_range = Module._log_newpage_range = (e, t2, r, a, o3) => (_log_newpage_range = Module._log_newpage_range = wasmExports.log_newpage_range)(e, t2, r, a, o3), _GetFreeIndexPage = Module._GetFreeIndexPage = (e) => (_GetFreeIndexPage = Module._GetFreeIndexPage = wasmExports.GetFreeIndexPage)(e), _ConditionalLockBuffer = Module._ConditionalLockBuffer = (e) => (_ConditionalLockBuffer = Module._ConditionalLockBuffer = wasmExports.ConditionalLockBuffer)(e), _LockBufferForCleanup = Module._LockBufferForCleanup = (e) => (_LockBufferForCleanup = Module._LockBufferForCleanup = wasmExports.LockBufferForCleanup)(e), _gistcheckpage = Module._gistcheckpage = (e, t2) => (_gistcheckpage = Module._gistcheckpage = wasmExports.gistcheckpage)(e, t2), _PageIndexMultiDelete = Module._PageIndexMultiDelete = (e, t2, r) => (_PageIndexMultiDelete = Module._PageIndexMultiDelete = wasmExports.PageIndexMultiDelete)(e, t2, r), _pow = Module._pow = (e, t2) => (_pow = Module._pow = wasmExports.pow)(e, t2), _smgrnblocks = Module._smgrnblocks = (e, t2) => (_smgrnblocks = Module._smgrnblocks = wasmExports.smgrnblocks)(e, t2), _list_free_deep = Module._list_free_deep = (e) => (_list_free_deep = Module._list_free_deep = wasmExports.list_free_deep)(e), _pairingheap_remove_first = Module._pairingheap_remove_first = (e) => (_pairingheap_remove_first = Module._pairingheap_remove_first = wasmExports.pairingheap_remove_first)(e), _pairingheap_add = Module._pairingheap_add = (e, t2) => (_pairingheap_add = Module._pairingheap_add = wasmExports.pairingheap_add)(e, t2), _float_overflow_error = Module._float_overflow_error = () => (_float_overflow_error = Module._float_overflow_error = wasmExports.float_overflow_error)(), _float_underflow_error = Module._float_underflow_error = () => (_float_underflow_error = Module._float_underflow_error = wasmExports.float_underflow_error)(), _DirectFunctionCall5Coll = Module._DirectFunctionCall5Coll = (e, t2, r, a, o3, s2, l2) => (_DirectFunctionCall5Coll = Module._DirectFunctionCall5Coll = wasmExports.DirectFunctionCall5Coll)(e, t2, r, a, o3, s2, l2), _pairingheap_allocate = Module._pairingheap_allocate = (e, t2) => (_pairingheap_allocate = Module._pairingheap_allocate = wasmExports.pairingheap_allocate)(e, t2), _GenerationContextCreate = Module._GenerationContextCreate = (e, t2, r, a, o3) => (_GenerationContextCreate = Module._GenerationContextCreate = wasmExports.GenerationContextCreate)(e, t2, r, a, o3), _pgstat_progress_update_param = Module._pgstat_progress_update_param = (e, t2) => (_pgstat_progress_update_param = Module._pgstat_progress_update_param = wasmExports.pgstat_progress_update_param)(e, t2), __hash_getbuf = Module.__hash_getbuf = (e, t2, r, a) => (__hash_getbuf = Module.__hash_getbuf = wasmExports._hash_getbuf)(e, t2, r, a), __hash_relbuf = Module.__hash_relbuf = (e, t2) => (__hash_relbuf = Module.__hash_relbuf = wasmExports._hash_relbuf)(e, t2), __hash_get_indextuple_hashkey = Module.__hash_get_indextuple_hashkey = (e) => (__hash_get_indextuple_hashkey = Module.__hash_get_indextuple_hashkey = wasmExports._hash_get_indextuple_hashkey)(e), __hash_getbuf_with_strategy = Module.__hash_getbuf_with_strategy = (e, t2, r, a, o3) => (__hash_getbuf_with_strategy = Module.__hash_getbuf_with_strategy = wasmExports._hash_getbuf_with_strategy)(e, t2, r, a, o3), __hash_ovflblkno_to_bitno = Module.__hash_ovflblkno_to_bitno = (e, t2) => (__hash_ovflblkno_to_bitno = Module.__hash_ovflblkno_to_bitno = wasmExports._hash_ovflblkno_to_bitno)(e, t2), _hash_destroy = Module._hash_destroy = (e) => (_hash_destroy = Module._hash_destroy = wasmExports.hash_destroy)(e), _list_member_oid = Module._list_member_oid = (e, t2) => (_list_member_oid = Module._list_member_oid = wasmExports.list_member_oid)(e, t2), _HeapTupleSatisfiesVisibility = Module._HeapTupleSatisfiesVisibility = (e, t2, r) => (_HeapTupleSatisfiesVisibility = Module._HeapTupleSatisfiesVisibility = wasmExports.HeapTupleSatisfiesVisibility)(e, t2, r), _read_stream_begin_relation = Module._read_stream_begin_relation = (e, t2, r, a, o3, s2, l2) => (_read_stream_begin_relation = Module._read_stream_begin_relation = wasmExports.read_stream_begin_relation)(e, t2, r, a, o3, s2, l2), _GetAccessStrategy = Module._GetAccessStrategy = (e) => (_GetAccessStrategy = Module._GetAccessStrategy = wasmExports.GetAccessStrategy)(e), _FreeAccessStrategy = Module._FreeAccessStrategy = (e) => (_FreeAccessStrategy = Module._FreeAccessStrategy = wasmExports.FreeAccessStrategy)(e), _read_stream_end = Module._read_stream_end = (e) => (_read_stream_end = Module._read_stream_end = wasmExports.read_stream_end)(e), _heap_getnext = Module._heap_getnext = (e, t2) => (_heap_getnext = Module._heap_getnext = wasmExports.heap_getnext)(e, t2), _HeapTupleSatisfiesVacuum = Module._HeapTupleSatisfiesVacuum = (e, t2, r) => (_HeapTupleSatisfiesVacuum = Module._HeapTupleSatisfiesVacuum = wasmExports.HeapTupleSatisfiesVacuum)(e, t2, r), _GetMultiXactIdMembers = Module._GetMultiXactIdMembers = (e, t2, r, a) => (_GetMultiXactIdMembers = Module._GetMultiXactIdMembers = wasmExports.GetMultiXactIdMembers)(e, t2, r, a), _TransactionIdPrecedes = Module._TransactionIdPrecedes = (e, t2) => (_TransactionIdPrecedes = Module._TransactionIdPrecedes = wasmExports.TransactionIdPrecedes)(e, t2), _HeapTupleGetUpdateXid = Module._HeapTupleGetUpdateXid = (e) => (_HeapTupleGetUpdateXid = Module._HeapTupleGetUpdateXid = wasmExports.HeapTupleGetUpdateXid)(e), _visibilitymap_clear = Module._visibilitymap_clear = (e, t2, r, a) => (_visibilitymap_clear = Module._visibilitymap_clear = wasmExports.visibilitymap_clear)(e, t2, r, a), _pgstat_count_heap_insert = Module._pgstat_count_heap_insert = (e, t2) => (_pgstat_count_heap_insert = Module._pgstat_count_heap_insert = wasmExports.pgstat_count_heap_insert)(e, t2), _ExecFetchSlotHeapTuple = Module._ExecFetchSlotHeapTuple = (e, t2, r) => (_ExecFetchSlotHeapTuple = Module._ExecFetchSlotHeapTuple = wasmExports.ExecFetchSlotHeapTuple)(e, t2, r), _PageGetHeapFreeSpace = Module._PageGetHeapFreeSpace = (e) => (_PageGetHeapFreeSpace = Module._PageGetHeapFreeSpace = wasmExports.PageGetHeapFreeSpace)(e), _visibilitymap_pin = Module._visibilitymap_pin = (e, t2, r) => (_visibilitymap_pin = Module._visibilitymap_pin = wasmExports.visibilitymap_pin)(e, t2, r), _HeapTupleSatisfiesUpdate = Module._HeapTupleSatisfiesUpdate = (e, t2, r) => (_HeapTupleSatisfiesUpdate = Module._HeapTupleSatisfiesUpdate = wasmExports.HeapTupleSatisfiesUpdate)(e, t2, r), _TransactionIdIsCurrentTransactionId = Module._TransactionIdIsCurrentTransactionId = (e) => (_TransactionIdIsCurrentTransactionId = Module._TransactionIdIsCurrentTransactionId = wasmExports.TransactionIdIsCurrentTransactionId)(e), _TransactionIdDidCommit = Module._TransactionIdDidCommit = (e) => (_TransactionIdDidCommit = Module._TransactionIdDidCommit = wasmExports.TransactionIdDidCommit)(e), _TransactionIdIsInProgress = Module._TransactionIdIsInProgress = (e) => (_TransactionIdIsInProgress = Module._TransactionIdIsInProgress = wasmExports.TransactionIdIsInProgress)(e), _bms_free = Module._bms_free = (e) => (_bms_free = Module._bms_free = wasmExports.bms_free)(e), _bms_add_members = Module._bms_add_members = (e, t2) => (_bms_add_members = Module._bms_add_members = wasmExports.bms_add_members)(e, t2), _bms_next_member = Module._bms_next_member = (e, t2) => (_bms_next_member = Module._bms_next_member = wasmExports.bms_next_member)(e, t2), _bms_overlap = Module._bms_overlap = (e, t2) => (_bms_overlap = Module._bms_overlap = wasmExports.bms_overlap)(e, t2), _MultiXactIdPrecedes = Module._MultiXactIdPrecedes = (e, t2) => (_MultiXactIdPrecedes = Module._MultiXactIdPrecedes = wasmExports.MultiXactIdPrecedes)(e, t2), _heap_tuple_needs_eventual_freeze = Module._heap_tuple_needs_eventual_freeze = (e) => (_heap_tuple_needs_eventual_freeze = Module._heap_tuple_needs_eventual_freeze = wasmExports.heap_tuple_needs_eventual_freeze)(e), _PrefetchBuffer = Module._PrefetchBuffer = (e, t2, r, a) => (_PrefetchBuffer = Module._PrefetchBuffer = wasmExports.PrefetchBuffer)(e, t2, r, a), _XLogRecGetBlockTagExtended = Module._XLogRecGetBlockTagExtended = (e, t2, r, a, o3, s2) => (_XLogRecGetBlockTagExtended = Module._XLogRecGetBlockTagExtended = wasmExports.XLogRecGetBlockTagExtended)(e, t2, r, a, o3, s2), _read_stream_next_buffer = Module._read_stream_next_buffer = (e, t2) => (_read_stream_next_buffer = Module._read_stream_next_buffer = wasmExports.read_stream_next_buffer)(e, t2), _smgrexists = Module._smgrexists = (e, t2) => (_smgrexists = Module._smgrexists = wasmExports.smgrexists)(e, t2), _table_slot_create = Module._table_slot_create = (e, t2) => (_table_slot_create = Module._table_slot_create = wasmExports.table_slot_create)(e, t2), _ExecDropSingleTupleTableSlot = Module._ExecDropSingleTupleTableSlot = (e) => (_ExecDropSingleTupleTableSlot = Module._ExecDropSingleTupleTableSlot = wasmExports.ExecDropSingleTupleTableSlot)(e), _CreateExecutorState = Module._CreateExecutorState = () => (_CreateExecutorState = Module._CreateExecutorState = wasmExports.CreateExecutorState)(), _MakePerTupleExprContext = Module._MakePerTupleExprContext = (e) => (_MakePerTupleExprContext = Module._MakePerTupleExprContext = wasmExports.MakePerTupleExprContext)(e), _GetOldestNonRemovableTransactionId = Module._GetOldestNonRemovableTransactionId = (e) => (_GetOldestNonRemovableTransactionId = Module._GetOldestNonRemovableTransactionId = wasmExports.GetOldestNonRemovableTransactionId)(e), _FreeExecutorState = Module._FreeExecutorState = (e) => (_FreeExecutorState = Module._FreeExecutorState = wasmExports.FreeExecutorState)(e), _MakeSingleTupleTableSlot = Module._MakeSingleTupleTableSlot = (e, t2) => (_MakeSingleTupleTableSlot = Module._MakeSingleTupleTableSlot = wasmExports.MakeSingleTupleTableSlot)(e, t2), _ExecStoreHeapTuple = Module._ExecStoreHeapTuple = (e, t2, r) => (_ExecStoreHeapTuple = Module._ExecStoreHeapTuple = wasmExports.ExecStoreHeapTuple)(e, t2, r), _visibilitymap_get_status = Module._visibilitymap_get_status = (e, t2, r) => (_visibilitymap_get_status = Module._visibilitymap_get_status = wasmExports.visibilitymap_get_status)(e, t2, r), _ExecStoreAllNullTuple = Module._ExecStoreAllNullTuple = (e) => (_ExecStoreAllNullTuple = Module._ExecStoreAllNullTuple = wasmExports.ExecStoreAllNullTuple)(e), _XidInMVCCSnapshot = Module._XidInMVCCSnapshot = (e, t2) => (_XidInMVCCSnapshot = Module._XidInMVCCSnapshot = wasmExports.XidInMVCCSnapshot)(e, t2), _hash_seq_init = Module._hash_seq_init = (e, t2) => (_hash_seq_init = Module._hash_seq_init = wasmExports.hash_seq_init)(e, t2), _hash_seq_search = Module._hash_seq_search = (e) => (_hash_seq_search = Module._hash_seq_search = wasmExports.hash_seq_search)(e), _ftruncate = Module._ftruncate = (e, t2) => (_ftruncate = Module._ftruncate = wasmExports.ftruncate)(e, t2), _fd_fsync_fname = Module._fd_fsync_fname = (e, t2) => (_fd_fsync_fname = Module._fd_fsync_fname = wasmExports.fd_fsync_fname)(e, t2), _get_namespace_name = Module._get_namespace_name = (e) => (_get_namespace_name = Module._get_namespace_name = wasmExports.get_namespace_name)(e), _GetRecordedFreeSpace = Module._GetRecordedFreeSpace = (e, t2) => (_GetRecordedFreeSpace = Module._GetRecordedFreeSpace = wasmExports.GetRecordedFreeSpace)(e, t2), _vac_estimate_reltuples = Module._vac_estimate_reltuples = (e, t2, r, a) => (_vac_estimate_reltuples = Module._vac_estimate_reltuples = wasmExports.vac_estimate_reltuples)(e, t2, r, a), _WaitLatch = Module._WaitLatch = (e, t2, r, a) => (_WaitLatch = Module._WaitLatch = wasmExports.WaitLatch)(e, t2, r, a), _ResetLatch = Module._ResetLatch = (e) => (_ResetLatch = Module._ResetLatch = wasmExports.ResetLatch)(e), _clock_gettime = Module._clock_gettime = (e, t2) => (_clock_gettime = Module._clock_gettime = wasmExports.clock_gettime)(e, t2), _WalUsageAccumDiff = Module._WalUsageAccumDiff = (e, t2, r) => (_WalUsageAccumDiff = Module._WalUsageAccumDiff = wasmExports.WalUsageAccumDiff)(e, t2, r), _BufferUsageAccumDiff = Module._BufferUsageAccumDiff = (e, t2, r) => (_BufferUsageAccumDiff = Module._BufferUsageAccumDiff = wasmExports.BufferUsageAccumDiff)(e, t2, r), _visibilitymap_prepare_truncate = Module._visibilitymap_prepare_truncate = (e, t2) => (_visibilitymap_prepare_truncate = Module._visibilitymap_prepare_truncate = wasmExports.visibilitymap_prepare_truncate)(e, t2), _pg_class_aclcheck = Module._pg_class_aclcheck = (e, t2, r) => (_pg_class_aclcheck = Module._pg_class_aclcheck = wasmExports.pg_class_aclcheck)(e, t2, r), _btboolcmp = Module._btboolcmp = (e) => (_btboolcmp = Module._btboolcmp = wasmExports.btboolcmp)(e), _btint2cmp = Module._btint2cmp = (e) => (_btint2cmp = Module._btint2cmp = wasmExports.btint2cmp)(e), _btint4cmp = Module._btint4cmp = (e) => (_btint4cmp = Module._btint4cmp = wasmExports.btint4cmp)(e), _btint8cmp = Module._btint8cmp = (e) => (_btint8cmp = Module._btint8cmp = wasmExports.btint8cmp)(e), _btoidcmp = Module._btoidcmp = (e) => (_btoidcmp = Module._btoidcmp = wasmExports.btoidcmp)(e), _btcharcmp = Module._btcharcmp = (e) => (_btcharcmp = Module._btcharcmp = wasmExports.btcharcmp)(e), __bt_form_posting = Module.__bt_form_posting = (e, t2, r) => (__bt_form_posting = Module.__bt_form_posting = wasmExports._bt_form_posting)(e, t2, r), __bt_mkscankey = Module.__bt_mkscankey = (e, t2) => (__bt_mkscankey = Module.__bt_mkscankey = wasmExports._bt_mkscankey)(e, t2), __bt_checkpage = Module.__bt_checkpage = (e, t2) => (__bt_checkpage = Module.__bt_checkpage = wasmExports._bt_checkpage)(e, t2), __bt_compare = Module.__bt_compare = (e, t2, r, a) => (__bt_compare = Module.__bt_compare = wasmExports._bt_compare)(e, t2, r, a), __bt_relbuf = Module.__bt_relbuf = (e, t2) => (__bt_relbuf = Module.__bt_relbuf = wasmExports._bt_relbuf)(e, t2), __bt_search = Module.__bt_search = (e, t2, r, a, o3) => (__bt_search = Module.__bt_search = wasmExports._bt_search)(e, t2, r, a, o3), __bt_binsrch_insert = Module.__bt_binsrch_insert = (e, t2) => (__bt_binsrch_insert = Module.__bt_binsrch_insert = wasmExports._bt_binsrch_insert)(e, t2), __bt_freestack = Module.__bt_freestack = (e) => (__bt_freestack = Module.__bt_freestack = wasmExports._bt_freestack)(e), __bt_metaversion = Module.__bt_metaversion = (e, t2, r) => (__bt_metaversion = Module.__bt_metaversion = wasmExports._bt_metaversion)(e, t2, r), __bt_allequalimage = Module.__bt_allequalimage = (e, t2) => (__bt_allequalimage = Module.__bt_allequalimage = wasmExports._bt_allequalimage)(e, t2), _before_shmem_exit = Module._before_shmem_exit = (e, t2) => (_before_shmem_exit = Module._before_shmem_exit = wasmExports.before_shmem_exit)(e, t2), _cancel_before_shmem_exit = Module._cancel_before_shmem_exit = (e, t2) => (_cancel_before_shmem_exit = Module._cancel_before_shmem_exit = wasmExports.cancel_before_shmem_exit)(e, t2), _pg_re_throw = Module._pg_re_throw = () => (_pg_re_throw = Module._pg_re_throw = wasmExports.pg_re_throw)(), _get_opfamily_member = Module._get_opfamily_member = (e, t2, r, a) => (_get_opfamily_member = Module._get_opfamily_member = wasmExports.get_opfamily_member)(e, t2, r, a), __bt_check_natts = Module.__bt_check_natts = (e, t2, r, a) => (__bt_check_natts = Module.__bt_check_natts = wasmExports._bt_check_natts)(e, t2, r, a), _strncpy = Module._strncpy = (e, t2, r) => (_strncpy = Module._strncpy = wasmExports.strncpy)(e, t2, r), _timestamptz_to_str = Module._timestamptz_to_str = (e) => (_timestamptz_to_str = Module._timestamptz_to_str = wasmExports.timestamptz_to_str)(e), _XLogRecGetBlockRefInfo = Module._XLogRecGetBlockRefInfo = (e, t2, r, a, o3) => (_XLogRecGetBlockRefInfo = Module._XLogRecGetBlockRefInfo = wasmExports.XLogRecGetBlockRefInfo)(e, t2, r, a, o3), _varstr_cmp = Module._varstr_cmp = (e, t2, r, a, o3) => (_varstr_cmp = Module._varstr_cmp = wasmExports.varstr_cmp)(e, t2, r, a, o3), _exprType = Module._exprType = (e) => (_exprType = Module._exprType = wasmExports.exprType)(e), _GetActiveSnapshot = Module._GetActiveSnapshot = () => (_GetActiveSnapshot = Module._GetActiveSnapshot = wasmExports.GetActiveSnapshot)(), _errdetail_relkind_not_supported = Module._errdetail_relkind_not_supported = (e) => (_errdetail_relkind_not_supported = Module._errdetail_relkind_not_supported = wasmExports.errdetail_relkind_not_supported)(e), _table_openrv = Module._table_openrv = (e, t2) => (_table_openrv = Module._table_openrv = wasmExports.table_openrv)(e, t2), _table_slot_callbacks = Module._table_slot_callbacks = (e) => (_table_slot_callbacks = Module._table_slot_callbacks = wasmExports.table_slot_callbacks)(e), _clamp_row_est = Module._clamp_row_est = (e) => (_clamp_row_est = Module._clamp_row_est = wasmExports.clamp_row_est)(e), _estimate_expression_value = Module._estimate_expression_value = (e, t2) => (_estimate_expression_value = Module._estimate_expression_value = wasmExports.estimate_expression_value)(e, t2), _XLogFlush = Module._XLogFlush = (e) => (_XLogFlush = Module._XLogFlush = wasmExports.XLogFlush)(e), _get_call_result_type = Module._get_call_result_type = (e, t2, r) => (_get_call_result_type = Module._get_call_result_type = wasmExports.get_call_result_type)(e, t2, r), _HeapTupleHeaderGetDatum = Module._HeapTupleHeaderGetDatum = (e) => (_HeapTupleHeaderGetDatum = Module._HeapTupleHeaderGetDatum = wasmExports.HeapTupleHeaderGetDatum)(e), _GenericXLogStart = Module._GenericXLogStart = (e) => (_GenericXLogStart = Module._GenericXLogStart = wasmExports.GenericXLogStart)(e), _GenericXLogRegisterBuffer = Module._GenericXLogRegisterBuffer = (e, t2, r) => (_GenericXLogRegisterBuffer = Module._GenericXLogRegisterBuffer = wasmExports.GenericXLogRegisterBuffer)(e, t2, r), _GenericXLogFinish = Module._GenericXLogFinish = (e) => (_GenericXLogFinish = Module._GenericXLogFinish = wasmExports.GenericXLogFinish)(e), _GenericXLogAbort = Module._GenericXLogAbort = (e) => (_GenericXLogAbort = Module._GenericXLogAbort = wasmExports.GenericXLogAbort)(e), _errmsg_plural = Module._errmsg_plural = (e, t2, r, a) => (_errmsg_plural = Module._errmsg_plural = wasmExports.errmsg_plural)(e, t2, r, a), _ReadNextMultiXactId = Module._ReadNextMultiXactId = () => (_ReadNextMultiXactId = Module._ReadNextMultiXactId = wasmExports.ReadNextMultiXactId)(), _ReadMultiXactIdRange = Module._ReadMultiXactIdRange = (e, t2) => (_ReadMultiXactIdRange = Module._ReadMultiXactIdRange = wasmExports.ReadMultiXactIdRange)(e, t2), _MultiXactIdPrecedesOrEquals = Module._MultiXactIdPrecedesOrEquals = (e, t2) => (_MultiXactIdPrecedesOrEquals = Module._MultiXactIdPrecedesOrEquals = wasmExports.MultiXactIdPrecedesOrEquals)(e, t2), _init_MultiFuncCall = Module._init_MultiFuncCall = (e) => (_init_MultiFuncCall = Module._init_MultiFuncCall = wasmExports.init_MultiFuncCall)(e), _TupleDescGetAttInMetadata = Module._TupleDescGetAttInMetadata = (e) => (_TupleDescGetAttInMetadata = Module._TupleDescGetAttInMetadata = wasmExports.TupleDescGetAttInMetadata)(e), _per_MultiFuncCall = Module._per_MultiFuncCall = (e) => (_per_MultiFuncCall = Module._per_MultiFuncCall = wasmExports.per_MultiFuncCall)(e), _BuildTupleFromCStrings = Module._BuildTupleFromCStrings = (e, t2) => (_BuildTupleFromCStrings = Module._BuildTupleFromCStrings = wasmExports.BuildTupleFromCStrings)(e, t2), _end_MultiFuncCall = Module._end_MultiFuncCall = (e, t2) => (_end_MultiFuncCall = Module._end_MultiFuncCall = wasmExports.end_MultiFuncCall)(e, t2), _GetCurrentSubTransactionId = Module._GetCurrentSubTransactionId = () => (_GetCurrentSubTransactionId = Module._GetCurrentSubTransactionId = wasmExports.GetCurrentSubTransactionId)(), _WaitForBackgroundWorkerShutdown = Module._WaitForBackgroundWorkerShutdown = (e) => (_WaitForBackgroundWorkerShutdown = Module._WaitForBackgroundWorkerShutdown = wasmExports.WaitForBackgroundWorkerShutdown)(e), _RegisterDynamicBackgroundWorker = Module._RegisterDynamicBackgroundWorker = (e, t2) => (_RegisterDynamicBackgroundWorker = Module._RegisterDynamicBackgroundWorker = wasmExports.RegisterDynamicBackgroundWorker)(e, t2), _BackgroundWorkerUnblockSignals = Module._BackgroundWorkerUnblockSignals = () => (_BackgroundWorkerUnblockSignals = Module._BackgroundWorkerUnblockSignals = wasmExports.BackgroundWorkerUnblockSignals)(), _BackgroundWorkerInitializeConnectionByOid = Module._BackgroundWorkerInitializeConnectionByOid = (e, t2, r) => (_BackgroundWorkerInitializeConnectionByOid = Module._BackgroundWorkerInitializeConnectionByOid = wasmExports.BackgroundWorkerInitializeConnectionByOid)(e, t2, r), _GetDatabaseEncoding = Module._GetDatabaseEncoding = () => (_GetDatabaseEncoding = Module._GetDatabaseEncoding = wasmExports.GetDatabaseEncoding)(), _RmgrNotFound = Module._RmgrNotFound = (e) => (_RmgrNotFound = Module._RmgrNotFound = wasmExports.RmgrNotFound)(e), _InitMaterializedSRF = Module._InitMaterializedSRF = (e, t2) => (_InitMaterializedSRF = Module._InitMaterializedSRF = wasmExports.InitMaterializedSRF)(e, t2), _tuplestore_putvalues = Module._tuplestore_putvalues = (e, t2, r, a) => (_tuplestore_putvalues = Module._tuplestore_putvalues = wasmExports.tuplestore_putvalues)(e, t2, r, a), _lseek = Module._lseek = (e, t2, r) => (_lseek = Module._lseek = wasmExports.lseek)(e, t2, r), _AllocateFile = Module._AllocateFile = (e, t2) => (_AllocateFile = Module._AllocateFile = wasmExports.AllocateFile)(e, t2), _FreeFile = Module._FreeFile = (e) => (_FreeFile = Module._FreeFile = wasmExports.FreeFile)(e), _fd_durable_rename = Module._fd_durable_rename = (e, t2, r) => (_fd_durable_rename = Module._fd_durable_rename = wasmExports.fd_durable_rename)(e, t2, r), _BlessTupleDesc = Module._BlessTupleDesc = (e) => (_BlessTupleDesc = Module._BlessTupleDesc = wasmExports.BlessTupleDesc)(e), _fstat = Module._fstat = (e, t2) => (_fstat = Module._fstat = wasmExports.fstat)(e, t2), _superuser_arg = Module._superuser_arg = (e) => (_superuser_arg = Module._superuser_arg = wasmExports.superuser_arg)(e), _wal_segment_close = Module._wal_segment_close = (e) => (_wal_segment_close = Module._wal_segment_close = wasmExports.wal_segment_close)(e), _wal_segment_open = Module._wal_segment_open = (e, t2, r) => (_wal_segment_open = Module._wal_segment_open = wasmExports.wal_segment_open)(e, t2, r), _XLogReaderAllocate = Module._XLogReaderAllocate = (e, t2, r, a) => (_XLogReaderAllocate = Module._XLogReaderAllocate = wasmExports.XLogReaderAllocate)(e, t2, r, a), _XLogReadRecord = Module._XLogReadRecord = (e, t2) => (_XLogReadRecord = Module._XLogReadRecord = wasmExports.XLogReadRecord)(e, t2), _XLogReaderFree = Module._XLogReaderFree = (e) => (_XLogReaderFree = Module._XLogReaderFree = wasmExports.XLogReaderFree)(e), _GetTopFullTransactionId = Module._GetTopFullTransactionId = () => (_GetTopFullTransactionId = Module._GetTopFullTransactionId = wasmExports.GetTopFullTransactionId)(), _GetCurrentTransactionNestLevel = Module._GetCurrentTransactionNestLevel = () => (_GetCurrentTransactionNestLevel = Module._GetCurrentTransactionNestLevel = wasmExports.GetCurrentTransactionNestLevel)(), _ResourceOwnerCreate = Module._ResourceOwnerCreate = (e, t2) => (_ResourceOwnerCreate = Module._ResourceOwnerCreate = wasmExports.ResourceOwnerCreate)(e, t2), _RegisterXactCallback = Module._RegisterXactCallback = (e, t2) => (_RegisterXactCallback = Module._RegisterXactCallback = wasmExports.RegisterXactCallback)(e, t2), _RegisterSubXactCallback = Module._RegisterSubXactCallback = (e, t2) => (_RegisterSubXactCallback = Module._RegisterSubXactCallback = wasmExports.RegisterSubXactCallback)(e, t2), _BeginInternalSubTransaction = Module._BeginInternalSubTransaction = (e) => (_BeginInternalSubTransaction = Module._BeginInternalSubTransaction = wasmExports.BeginInternalSubTransaction)(e), _ReleaseCurrentSubTransaction = Module._ReleaseCurrentSubTransaction = () => (_ReleaseCurrentSubTransaction = Module._ReleaseCurrentSubTransaction = wasmExports.ReleaseCurrentSubTransaction)(), _ResourceOwnerDelete = Module._ResourceOwnerDelete = (e) => (_ResourceOwnerDelete = Module._ResourceOwnerDelete = wasmExports.ResourceOwnerDelete)(e), _RollbackAndReleaseCurrentSubTransaction = Module._RollbackAndReleaseCurrentSubTransaction = () => (_RollbackAndReleaseCurrentSubTransaction = Module._RollbackAndReleaseCurrentSubTransaction = wasmExports.RollbackAndReleaseCurrentSubTransaction)(), _ReleaseExternalFD = Module._ReleaseExternalFD = () => (_ReleaseExternalFD = Module._ReleaseExternalFD = wasmExports.ReleaseExternalFD)(), _GetFlushRecPtr = Module._GetFlushRecPtr = (e) => (_GetFlushRecPtr = Module._GetFlushRecPtr = wasmExports.GetFlushRecPtr)(e), _GetXLogReplayRecPtr = Module._GetXLogReplayRecPtr = (e) => (_GetXLogReplayRecPtr = Module._GetXLogReplayRecPtr = wasmExports.GetXLogReplayRecPtr)(e), _TimestampDifferenceMilliseconds = Module._TimestampDifferenceMilliseconds = (e, t2) => (_TimestampDifferenceMilliseconds = Module._TimestampDifferenceMilliseconds = wasmExports.TimestampDifferenceMilliseconds)(e, t2), _numeric_in = Module._numeric_in = (e) => (_numeric_in = Module._numeric_in = wasmExports.numeric_in)(e), _DirectFunctionCall3Coll = Module._DirectFunctionCall3Coll = (e, t2, r, a, o3) => (_DirectFunctionCall3Coll = Module._DirectFunctionCall3Coll = wasmExports.DirectFunctionCall3Coll)(e, t2, r, a, o3), _XLogFindNextRecord = Module._XLogFindNextRecord = (e, t2) => (_XLogFindNextRecord = Module._XLogFindNextRecord = wasmExports.XLogFindNextRecord)(e, t2), _RestoreBlockImage = Module._RestoreBlockImage = (e, t2, r) => (_RestoreBlockImage = Module._RestoreBlockImage = wasmExports.RestoreBlockImage)(e, t2, r), _timestamptz_in = Module._timestamptz_in = (e) => (_timestamptz_in = Module._timestamptz_in = wasmExports.timestamptz_in)(e), _fscanf = Module._fscanf = (e, t2, r) => (_fscanf = Module._fscanf = wasmExports.fscanf)(e, t2, r), _XLogRecStoreStats = Module._XLogRecStoreStats = (e, t2) => (_XLogRecStoreStats = Module._XLogRecStoreStats = wasmExports.XLogRecStoreStats)(e, t2), _hash_get_num_entries = Module._hash_get_num_entries = (e) => (_hash_get_num_entries = Module._hash_get_num_entries = wasmExports.hash_get_num_entries)(e), _read_local_xlog_page_no_wait = Module._read_local_xlog_page_no_wait = (e, t2, r, a, o3) => (_read_local_xlog_page_no_wait = Module._read_local_xlog_page_no_wait = wasmExports.read_local_xlog_page_no_wait)(e, t2, r, a, o3), _escape_json = Module._escape_json = (e, t2) => (_escape_json = Module._escape_json = wasmExports.escape_json)(e, t2), _list_sort = Module._list_sort = (e, t2) => (_list_sort = Module._list_sort = wasmExports.list_sort)(e, t2), _getegid = Module._getegid = () => (_getegid = Module._getegid = wasmExports.getegid)(), _pg_checksum_page = Module._pg_checksum_page = (e, t2) => (_pg_checksum_page = Module._pg_checksum_page = wasmExports.pg_checksum_page)(e, t2), _bbsink_forward_end_archive = Module._bbsink_forward_end_archive = (e) => (_bbsink_forward_end_archive = Module._bbsink_forward_end_archive = wasmExports.bbsink_forward_end_archive)(e), _bbsink_forward_begin_manifest = Module._bbsink_forward_begin_manifest = (e) => (_bbsink_forward_begin_manifest = Module._bbsink_forward_begin_manifest = wasmExports.bbsink_forward_begin_manifest)(e), _bbsink_forward_end_manifest = Module._bbsink_forward_end_manifest = (e) => (_bbsink_forward_end_manifest = Module._bbsink_forward_end_manifest = wasmExports.bbsink_forward_end_manifest)(e), _bbsink_forward_end_backup = Module._bbsink_forward_end_backup = (e, t2, r) => (_bbsink_forward_end_backup = Module._bbsink_forward_end_backup = wasmExports.bbsink_forward_end_backup)(e, t2, r), _bbsink_forward_cleanup = Module._bbsink_forward_cleanup = (e) => (_bbsink_forward_cleanup = Module._bbsink_forward_cleanup = wasmExports.bbsink_forward_cleanup)(e), _list_concat = Module._list_concat = (e, t2) => (_list_concat = Module._list_concat = wasmExports.list_concat)(e, t2), _bbsink_forward_begin_backup = Module._bbsink_forward_begin_backup = (e) => (_bbsink_forward_begin_backup = Module._bbsink_forward_begin_backup = wasmExports.bbsink_forward_begin_backup)(e), _bbsink_forward_archive_contents = Module._bbsink_forward_archive_contents = (e, t2) => (_bbsink_forward_archive_contents = Module._bbsink_forward_archive_contents = wasmExports.bbsink_forward_archive_contents)(e, t2), _bbsink_forward_begin_archive = Module._bbsink_forward_begin_archive = (e, t2) => (_bbsink_forward_begin_archive = Module._bbsink_forward_begin_archive = wasmExports.bbsink_forward_begin_archive)(e, t2), _bbsink_forward_manifest_contents = Module._bbsink_forward_manifest_contents = (e, t2) => (_bbsink_forward_manifest_contents = Module._bbsink_forward_manifest_contents = wasmExports.bbsink_forward_manifest_contents)(e, t2), _has_privs_of_role = Module._has_privs_of_role = (e, t2) => (_has_privs_of_role = Module._has_privs_of_role = wasmExports.has_privs_of_role)(e, t2), _BaseBackupAddTarget = Module._BaseBackupAddTarget = (e, t2, r) => (_BaseBackupAddTarget = Module._BaseBackupAddTarget = wasmExports.BaseBackupAddTarget)(e, t2, r), _list_copy = Module._list_copy = (e) => (_list_copy = Module._list_copy = wasmExports.list_copy)(e), _tuplestore_puttuple = Module._tuplestore_puttuple = (e, t2) => (_tuplestore_puttuple = Module._tuplestore_puttuple = wasmExports.tuplestore_puttuple)(e, t2), _makeRangeVar = Module._makeRangeVar = (e, t2, r) => (_makeRangeVar = Module._makeRangeVar = wasmExports.makeRangeVar)(e, t2, r), _DefineIndex = Module._DefineIndex = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2) => (_DefineIndex = Module._DefineIndex = wasmExports.DefineIndex)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2), _fread = Module._fread = (e, t2, r, a) => (_fread = Module._fread = wasmExports.fread)(e, t2, r, a), _clearerr = Module._clearerr = (e) => (_clearerr = Module._clearerr = wasmExports.clearerr)(e), _copyObjectImpl = Module._copyObjectImpl = (e) => (_copyObjectImpl = Module._copyObjectImpl = wasmExports.copyObjectImpl)(e), _lappend_oid = Module._lappend_oid = (e, t2) => (_lappend_oid = Module._lappend_oid = wasmExports.lappend_oid)(e, t2), _makeTypeNameFromNameList = Module._makeTypeNameFromNameList = (e) => (_makeTypeNameFromNameList = Module._makeTypeNameFromNameList = wasmExports.makeTypeNameFromNameList)(e), _SearchSysCache2 = Module._SearchSysCache2 = (e, t2, r) => (_SearchSysCache2 = Module._SearchSysCache2 = wasmExports.SearchSysCache2)(e, t2, r), _SysCacheGetAttr = Module._SysCacheGetAttr = (e, t2, r, a) => (_SysCacheGetAttr = Module._SysCacheGetAttr = wasmExports.SysCacheGetAttr)(e, t2, r, a), _CatalogTupleUpdate = Module._CatalogTupleUpdate = (e, t2, r) => (_CatalogTupleUpdate = Module._CatalogTupleUpdate = wasmExports.CatalogTupleUpdate)(e, t2, r), _get_rel_name = Module._get_rel_name = (e) => (_get_rel_name = Module._get_rel_name = wasmExports.get_rel_name)(e), _CatalogTupleDelete = Module._CatalogTupleDelete = (e, t2) => (_CatalogTupleDelete = Module._CatalogTupleDelete = wasmExports.CatalogTupleDelete)(e, t2), _CatalogTupleInsert = Module._CatalogTupleInsert = (e, t2) => (_CatalogTupleInsert = Module._CatalogTupleInsert = wasmExports.CatalogTupleInsert)(e, t2), _recordDependencyOn = Module._recordDependencyOn = (e, t2, r) => (_recordDependencyOn = Module._recordDependencyOn = wasmExports.recordDependencyOn)(e, t2, r), _get_element_type = Module._get_element_type = (e) => (_get_element_type = Module._get_element_type = wasmExports.get_element_type)(e), _object_aclcheck = Module._object_aclcheck = (e, t2, r, a) => (_object_aclcheck = Module._object_aclcheck = wasmExports.object_aclcheck)(e, t2, r, a), _superuser = Module._superuser = () => (_superuser = Module._superuser = wasmExports.superuser)(), _SearchSysCacheAttName = Module._SearchSysCacheAttName = (e, t2) => (_SearchSysCacheAttName = Module._SearchSysCacheAttName = wasmExports.SearchSysCacheAttName)(e, t2), _new_object_addresses = Module._new_object_addresses = () => (_new_object_addresses = Module._new_object_addresses = wasmExports.new_object_addresses)(), _free_object_addresses = Module._free_object_addresses = (e) => (_free_object_addresses = Module._free_object_addresses = wasmExports.free_object_addresses)(e), _performMultipleDeletions = Module._performMultipleDeletions = (e, t2, r) => (_performMultipleDeletions = Module._performMultipleDeletions = wasmExports.performMultipleDeletions)(e, t2, r), _recordDependencyOnExpr = Module._recordDependencyOnExpr = (e, t2, r, a) => (_recordDependencyOnExpr = Module._recordDependencyOnExpr = wasmExports.recordDependencyOnExpr)(e, t2, r, a), _query_tree_walker_impl = Module._query_tree_walker_impl = (e, t2, r, a) => (_query_tree_walker_impl = Module._query_tree_walker_impl = wasmExports.query_tree_walker_impl)(e, t2, r, a), _expression_tree_walker_impl = Module._expression_tree_walker_impl = (e, t2, r) => (_expression_tree_walker_impl = Module._expression_tree_walker_impl = wasmExports.expression_tree_walker_impl)(e, t2, r), _add_exact_object_address = Module._add_exact_object_address = (e, t2) => (_add_exact_object_address = Module._add_exact_object_address = wasmExports.add_exact_object_address)(e, t2), _get_rel_relkind = Module._get_rel_relkind = (e) => (_get_rel_relkind = Module._get_rel_relkind = wasmExports.get_rel_relkind)(e), _get_typtype = Module._get_typtype = (e) => (_get_typtype = Module._get_typtype = wasmExports.get_typtype)(e), _list_delete_last = Module._list_delete_last = (e) => (_list_delete_last = Module._list_delete_last = wasmExports.list_delete_last)(e), _type_is_collatable = Module._type_is_collatable = (e) => (_type_is_collatable = Module._type_is_collatable = wasmExports.type_is_collatable)(e), _GetSysCacheOid = Module._GetSysCacheOid = (e, t2, r, a, o3, s2) => (_GetSysCacheOid = Module._GetSysCacheOid = wasmExports.GetSysCacheOid)(e, t2, r, a, o3, s2), _CheckTableNotInUse = Module._CheckTableNotInUse = (e, t2) => (_CheckTableNotInUse = Module._CheckTableNotInUse = wasmExports.CheckTableNotInUse)(e, t2), _construct_array = Module._construct_array = (e, t2, r, a, o3, s2) => (_construct_array = Module._construct_array = wasmExports.construct_array)(e, t2, r, a, o3, s2), _make_parsestate = Module._make_parsestate = (e) => (_make_parsestate = Module._make_parsestate = wasmExports.make_parsestate)(e), _transformExpr = Module._transformExpr = (e, t2, r) => (_transformExpr = Module._transformExpr = wasmExports.transformExpr)(e, t2, r), _equal = Module._equal = (e, t2) => (_equal = Module._equal = wasmExports.equal)(e, t2), _pull_var_clause = Module._pull_var_clause = (e, t2) => (_pull_var_clause = Module._pull_var_clause = wasmExports.pull_var_clause)(e, t2), _get_attname = Module._get_attname = (e, t2, r) => (_get_attname = Module._get_attname = wasmExports.get_attname)(e, t2, r), _coerce_to_target_type = Module._coerce_to_target_type = (e, t2, r, a, o3, s2, l2, _2) => (_coerce_to_target_type = Module._coerce_to_target_type = wasmExports.coerce_to_target_type)(e, t2, r, a, o3, s2, l2, _2), _nodeToString = Module._nodeToString = (e) => (_nodeToString = Module._nodeToString = wasmExports.nodeToString)(e), _parser_errposition = Module._parser_errposition = (e, t2) => (_parser_errposition = Module._parser_errposition = wasmExports.parser_errposition)(e, t2), _exprTypmod = Module._exprTypmod = (e) => (_exprTypmod = Module._exprTypmod = wasmExports.exprTypmod)(e), _get_base_element_type = Module._get_base_element_type = (e) => (_get_base_element_type = Module._get_base_element_type = wasmExports.get_base_element_type)(e), _SystemFuncName = Module._SystemFuncName = (e) => (_SystemFuncName = Module._SystemFuncName = wasmExports.SystemFuncName)(e), _CreateTrigger = Module._CreateTrigger = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2) => (_CreateTrigger = Module._CreateTrigger = wasmExports.CreateTrigger)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2), _plan_create_index_workers = Module._plan_create_index_workers = (e, t2) => (_plan_create_index_workers = Module._plan_create_index_workers = wasmExports.plan_create_index_workers)(e, t2), _get_rel_relispartition = Module._get_rel_relispartition = (e) => (_get_rel_relispartition = Module._get_rel_relispartition = wasmExports.get_rel_relispartition)(e), _get_partition_ancestors = Module._get_partition_ancestors = (e) => (_get_partition_ancestors = Module._get_partition_ancestors = wasmExports.get_partition_ancestors)(e), _get_rel_namespace = Module._get_rel_namespace = (e) => (_get_rel_namespace = Module._get_rel_namespace = wasmExports.get_rel_namespace)(e), _ConditionalLockRelationOid = Module._ConditionalLockRelationOid = (e, t2) => (_ConditionalLockRelationOid = Module._ConditionalLockRelationOid = wasmExports.ConditionalLockRelationOid)(e, t2), _RelnameGetRelid = Module._RelnameGetRelid = (e) => (_RelnameGetRelid = Module._RelnameGetRelid = wasmExports.RelnameGetRelid)(e), _get_relkind_objtype = Module._get_relkind_objtype = (e) => (_get_relkind_objtype = Module._get_relkind_objtype = wasmExports.get_relkind_objtype)(e), _RelationIsVisible = Module._RelationIsVisible = (e) => (_RelationIsVisible = Module._RelationIsVisible = wasmExports.RelationIsVisible)(e), _get_func_arg_info = Module._get_func_arg_info = (e, t2, r, a) => (_get_func_arg_info = Module._get_func_arg_info = wasmExports.get_func_arg_info)(e, t2, r, a), _NameListToString = Module._NameListToString = (e) => (_NameListToString = Module._NameListToString = wasmExports.NameListToString)(e), _OpernameGetOprid = Module._OpernameGetOprid = (e, t2, r) => (_OpernameGetOprid = Module._OpernameGetOprid = wasmExports.OpernameGetOprid)(e, t2, r), _makeRangeVarFromNameList = Module._makeRangeVarFromNameList = (e) => (_makeRangeVarFromNameList = Module._makeRangeVarFromNameList = wasmExports.makeRangeVarFromNameList)(e), _quote_identifier = Module._quote_identifier = (e) => (_quote_identifier = Module._quote_identifier = wasmExports.quote_identifier)(e), _GetSearchPathMatcher = Module._GetSearchPathMatcher = (e) => (_GetSearchPathMatcher = Module._GetSearchPathMatcher = wasmExports.GetSearchPathMatcher)(e), _SearchPathMatchesCurrentEnvironment = Module._SearchPathMatchesCurrentEnvironment = (e) => (_SearchPathMatchesCurrentEnvironment = Module._SearchPathMatchesCurrentEnvironment = wasmExports.SearchPathMatchesCurrentEnvironment)(e), _get_collation_oid = Module._get_collation_oid = (e, t2) => (_get_collation_oid = Module._get_collation_oid = wasmExports.get_collation_oid)(e, t2), _CacheRegisterSyscacheCallback = Module._CacheRegisterSyscacheCallback = (e, t2, r) => (_CacheRegisterSyscacheCallback = Module._CacheRegisterSyscacheCallback = wasmExports.CacheRegisterSyscacheCallback)(e, t2, r), _get_extension_oid = Module._get_extension_oid = (e, t2) => (_get_extension_oid = Module._get_extension_oid = wasmExports.get_extension_oid)(e, t2), _get_role_oid = Module._get_role_oid = (e, t2) => (_get_role_oid = Module._get_role_oid = wasmExports.get_role_oid)(e, t2), _GetForeignServerByName = Module._GetForeignServerByName = (e, t2) => (_GetForeignServerByName = Module._GetForeignServerByName = wasmExports.GetForeignServerByName)(e, t2), _GetPublicationByName = Module._GetPublicationByName = (e, t2) => (_GetPublicationByName = Module._GetPublicationByName = wasmExports.GetPublicationByName)(e, t2), _typeStringToTypeName = Module._typeStringToTypeName = (e, t2) => (_typeStringToTypeName = Module._typeStringToTypeName = wasmExports.typeStringToTypeName)(e, t2), _list_make2_impl = Module._list_make2_impl = (e, t2, r) => (_list_make2_impl = Module._list_make2_impl = wasmExports.list_make2_impl)(e, t2, r), _GetUserNameFromId = Module._GetUserNameFromId = (e, t2) => (_GetUserNameFromId = Module._GetUserNameFromId = wasmExports.GetUserNameFromId)(e, t2), _format_type_extended = Module._format_type_extended = (e, t2, r) => (_format_type_extended = Module._format_type_extended = wasmExports.format_type_extended)(e, t2, r), _quote_qualified_identifier = Module._quote_qualified_identifier = (e, t2) => (_quote_qualified_identifier = Module._quote_qualified_identifier = wasmExports.quote_qualified_identifier)(e, t2), _get_tablespace_name = Module._get_tablespace_name = (e) => (_get_tablespace_name = Module._get_tablespace_name = wasmExports.get_tablespace_name)(e), _GetForeignServerExtended = Module._GetForeignServerExtended = (e, t2) => (_GetForeignServerExtended = Module._GetForeignServerExtended = wasmExports.GetForeignServerExtended)(e, t2), _GetForeignServer = Module._GetForeignServer = (e) => (_GetForeignServer = Module._GetForeignServer = wasmExports.GetForeignServer)(e), _construct_empty_array = Module._construct_empty_array = (e) => (_construct_empty_array = Module._construct_empty_array = wasmExports.construct_empty_array)(e), _format_type_be_qualified = Module._format_type_be_qualified = (e) => (_format_type_be_qualified = Module._format_type_be_qualified = wasmExports.format_type_be_qualified)(e), _get_namespace_name_or_temp = Module._get_namespace_name_or_temp = (e) => (_get_namespace_name_or_temp = Module._get_namespace_name_or_temp = wasmExports.get_namespace_name_or_temp)(e), _list_make3_impl = Module._list_make3_impl = (e, t2, r, a) => (_list_make3_impl = Module._list_make3_impl = wasmExports.list_make3_impl)(e, t2, r, a), _construct_md_array = Module._construct_md_array = (e, t2, r, a, o3, s2, l2, _2, n) => (_construct_md_array = Module._construct_md_array = wasmExports.construct_md_array)(e, t2, r, a, o3, s2, l2, _2, n), _pull_varattnos = Module._pull_varattnos = (e, t2, r) => (_pull_varattnos = Module._pull_varattnos = wasmExports.pull_varattnos)(e, t2, r), _get_func_name = Module._get_func_name = (e) => (_get_func_name = Module._get_func_name = wasmExports.get_func_name)(e), _ExecPrepareExpr = Module._ExecPrepareExpr = (e, t2) => (_ExecPrepareExpr = Module._ExecPrepareExpr = wasmExports.ExecPrepareExpr)(e, t2), _construct_array_builtin = Module._construct_array_builtin = (e, t2, r) => (_construct_array_builtin = Module._construct_array_builtin = wasmExports.construct_array_builtin)(e, t2, r), _makeObjectName = Module._makeObjectName = (e, t2, r) => (_makeObjectName = Module._makeObjectName = wasmExports.makeObjectName)(e, t2, r), _get_primary_key_attnos = Module._get_primary_key_attnos = (e, t2, r) => (_get_primary_key_attnos = Module._get_primary_key_attnos = wasmExports.get_primary_key_attnos)(e, t2, r), _bms_is_subset = Module._bms_is_subset = (e, t2) => (_bms_is_subset = Module._bms_is_subset = wasmExports.bms_is_subset)(e, t2), _getExtensionOfObject = Module._getExtensionOfObject = (e, t2) => (_getExtensionOfObject = Module._getExtensionOfObject = wasmExports.getExtensionOfObject)(e, t2), _find_inheritance_children = Module._find_inheritance_children = (e, t2) => (_find_inheritance_children = Module._find_inheritance_children = wasmExports.find_inheritance_children)(e, t2), _lappend_int = Module._lappend_int = (e, t2) => (_lappend_int = Module._lappend_int = wasmExports.lappend_int)(e, t2), _has_superclass = Module._has_superclass = (e) => (_has_superclass = Module._has_superclass = wasmExports.has_superclass)(e), _CheckFunctionValidatorAccess = Module._CheckFunctionValidatorAccess = (e, t2) => (_CheckFunctionValidatorAccess = Module._CheckFunctionValidatorAccess = wasmExports.CheckFunctionValidatorAccess)(e, t2), _AcquireRewriteLocks = Module._AcquireRewriteLocks = (e, t2, r) => (_AcquireRewriteLocks = Module._AcquireRewriteLocks = wasmExports.AcquireRewriteLocks)(e, t2, r), _function_parse_error_transpose = Module._function_parse_error_transpose = (e) => (_function_parse_error_transpose = Module._function_parse_error_transpose = wasmExports.function_parse_error_transpose)(e), _geterrposition = Module._geterrposition = () => (_geterrposition = Module._geterrposition = wasmExports.geterrposition)(), _getinternalerrposition = Module._getinternalerrposition = () => (_getinternalerrposition = Module._getinternalerrposition = wasmExports.getinternalerrposition)(), _pg_mblen = Module._pg_mblen = (e) => (_pg_mblen = Module._pg_mblen = wasmExports.pg_mblen)(e), _pg_mbstrlen_with_len = Module._pg_mbstrlen_with_len = (e, t2) => (_pg_mbstrlen_with_len = Module._pg_mbstrlen_with_len = wasmExports.pg_mbstrlen_with_len)(e, t2), _errposition = Module._errposition = (e) => (_errposition = Module._errposition = wasmExports.errposition)(e), _internalerrposition = Module._internalerrposition = (e) => (_internalerrposition = Module._internalerrposition = wasmExports.internalerrposition)(e), _internalerrquery = Module._internalerrquery = (e) => (_internalerrquery = Module._internalerrquery = wasmExports.internalerrquery)(e), _is_publishable_relation = Module._is_publishable_relation = (e) => (_is_publishable_relation = Module._is_publishable_relation = wasmExports.is_publishable_relation)(e), _GetTopMostAncestorInPublication = Module._GetTopMostAncestorInPublication = (e, t2, r) => (_GetTopMostAncestorInPublication = Module._GetTopMostAncestorInPublication = wasmExports.GetTopMostAncestorInPublication)(e, t2, r), _GetRelationPublications = Module._GetRelationPublications = (e) => (_GetRelationPublications = Module._GetRelationPublications = wasmExports.GetRelationPublications)(e), _GetSchemaPublications = Module._GetSchemaPublications = (e) => (_GetSchemaPublications = Module._GetSchemaPublications = wasmExports.GetSchemaPublications)(e), _pub_collist_to_bitmapset = Module._pub_collist_to_bitmapset = (e, t2, r) => (_pub_collist_to_bitmapset = Module._pub_collist_to_bitmapset = wasmExports.pub_collist_to_bitmapset)(e, t2, r), _list_delete_nth_cell = Module._list_delete_nth_cell = (e, t2) => (_list_delete_nth_cell = Module._list_delete_nth_cell = wasmExports.list_delete_nth_cell)(e, t2), _get_array_type = Module._get_array_type = (e) => (_get_array_type = Module._get_array_type = wasmExports.get_array_type)(e), _smgrtruncate2 = Module._smgrtruncate2 = (e, t2, r, a, o3) => (_smgrtruncate2 = Module._smgrtruncate2 = wasmExports.smgrtruncate2)(e, t2, r, a, o3), _smgrreadv = Module._smgrreadv = (e, t2, r, a, o3) => (_smgrreadv = Module._smgrreadv = wasmExports.smgrreadv)(e, t2, r, a, o3), _NewRelationCreateToastTable = Module._NewRelationCreateToastTable = (e, t2) => (_NewRelationCreateToastTable = Module._NewRelationCreateToastTable = wasmExports.NewRelationCreateToastTable)(e, t2), _transformStmt = Module._transformStmt = (e, t2) => (_transformStmt = Module._transformStmt = wasmExports.transformStmt)(e, t2), _exprLocation = Module._exprLocation = (e) => (_exprLocation = Module._exprLocation = wasmExports.exprLocation)(e), _ParseFuncOrColumn = Module._ParseFuncOrColumn = (e, t2, r, a, o3, s2, l2) => (_ParseFuncOrColumn = Module._ParseFuncOrColumn = wasmExports.ParseFuncOrColumn)(e, t2, r, a, o3, s2, l2), _exprCollation = Module._exprCollation = (e) => (_exprCollation = Module._exprCollation = wasmExports.exprCollation)(e), _transformDistinctClause = Module._transformDistinctClause = (e, t2, r, a) => (_transformDistinctClause = Module._transformDistinctClause = wasmExports.transformDistinctClause)(e, t2, r, a), _makeTargetEntry = Module._makeTargetEntry = (e, t2, r, a) => (_makeTargetEntry = Module._makeTargetEntry = wasmExports.makeTargetEntry)(e, t2, r, a), _makeAlias = Module._makeAlias = (e, t2) => (_makeAlias = Module._makeAlias = wasmExports.makeAlias)(e, t2), _addRangeTableEntryForSubquery = Module._addRangeTableEntryForSubquery = (e, t2, r, a, o3) => (_addRangeTableEntryForSubquery = Module._addRangeTableEntryForSubquery = wasmExports.addRangeTableEntryForSubquery)(e, t2, r, a, o3), _makeVar = Module._makeVar = (e, t2, r, a, o3, s2) => (_makeVar = Module._makeVar = wasmExports.makeVar)(e, t2, r, a, o3, s2), _makeBoolean = Module._makeBoolean = (e) => (_makeBoolean = Module._makeBoolean = wasmExports.makeBoolean)(e), _makeInteger = Module._makeInteger = (e) => (_makeInteger = Module._makeInteger = wasmExports.makeInteger)(e), _makeTypeName = Module._makeTypeName = (e) => (_makeTypeName = Module._makeTypeName = wasmExports.makeTypeName)(e), _makeFuncCall = Module._makeFuncCall = (e, t2, r, a) => (_makeFuncCall = Module._makeFuncCall = wasmExports.makeFuncCall)(e, t2, r, a), _list_make4_impl = Module._list_make4_impl = (e, t2, r, a, o3) => (_list_make4_impl = Module._list_make4_impl = wasmExports.list_make4_impl)(e, t2, r, a, o3), _get_sortgroupclause_tle = Module._get_sortgroupclause_tle = (e, t2) => (_get_sortgroupclause_tle = Module._get_sortgroupclause_tle = wasmExports.get_sortgroupclause_tle)(e, t2), _flatten_join_alias_vars = Module._flatten_join_alias_vars = (e, t2, r) => (_flatten_join_alias_vars = Module._flatten_join_alias_vars = wasmExports.flatten_join_alias_vars)(e, t2, r), _list_member_int = Module._list_member_int = (e, t2) => (_list_member_int = Module._list_member_int = wasmExports.list_member_int)(e, t2), _addRangeTableEntryForENR = Module._addRangeTableEntryForENR = (e, t2, r) => (_addRangeTableEntryForENR = Module._addRangeTableEntryForENR = wasmExports.addRangeTableEntryForENR)(e, t2, r), _typenameTypeIdAndMod = Module._typenameTypeIdAndMod = (e, t2, r, a) => (_typenameTypeIdAndMod = Module._typenameTypeIdAndMod = wasmExports.typenameTypeIdAndMod)(e, t2, r, a), _get_typcollation = Module._get_typcollation = (e) => (_get_typcollation = Module._get_typcollation = wasmExports.get_typcollation)(e), _strip_implicit_coercions = Module._strip_implicit_coercions = (e) => (_strip_implicit_coercions = Module._strip_implicit_coercions = wasmExports.strip_implicit_coercions)(e), _get_sortgroupref_tle = Module._get_sortgroupref_tle = (e, t2) => (_get_sortgroupref_tle = Module._get_sortgroupref_tle = wasmExports.get_sortgroupref_tle)(e, t2), _contain_aggs_of_level = Module._contain_aggs_of_level = (e, t2) => (_contain_aggs_of_level = Module._contain_aggs_of_level = wasmExports.contain_aggs_of_level)(e, t2), _typeidType = Module._typeidType = (e) => (_typeidType = Module._typeidType = wasmExports.typeidType)(e), _typeTypeCollation = Module._typeTypeCollation = (e) => (_typeTypeCollation = Module._typeTypeCollation = wasmExports.typeTypeCollation)(e), _typeLen = Module._typeLen = (e) => (_typeLen = Module._typeLen = wasmExports.typeLen)(e), _typeByVal = Module._typeByVal = (e) => (_typeByVal = Module._typeByVal = wasmExports.typeByVal)(e), _makeConst = Module._makeConst = (e, t2, r, a, o3, s2, l2) => (_makeConst = Module._makeConst = wasmExports.makeConst)(e, t2, r, a, o3, s2, l2), _lookup_rowtype_tupdesc = Module._lookup_rowtype_tupdesc = (e, t2) => (_lookup_rowtype_tupdesc = Module._lookup_rowtype_tupdesc = wasmExports.lookup_rowtype_tupdesc)(e, t2), _bms_del_member = Module._bms_del_member = (e, t2) => (_bms_del_member = Module._bms_del_member = wasmExports.bms_del_member)(e, t2), _list_member = Module._list_member = (e, t2) => (_list_member = Module._list_member = wasmExports.list_member)(e, t2), _type_is_rowtype = Module._type_is_rowtype = (e) => (_type_is_rowtype = Module._type_is_rowtype = wasmExports.type_is_rowtype)(e), _bit_in = Module._bit_in = (e) => (_bit_in = Module._bit_in = wasmExports.bit_in)(e), _bms_union = Module._bms_union = (e, t2) => (_bms_union = Module._bms_union = wasmExports.bms_union)(e, t2), _varstr_levenshtein_less_equal = Module._varstr_levenshtein_less_equal = (e, t2, r, a, o3, s2, l2, _2, n) => (_varstr_levenshtein_less_equal = Module._varstr_levenshtein_less_equal = wasmExports.varstr_levenshtein_less_equal)(e, t2, r, a, o3, s2, l2, _2, n), _addRTEPermissionInfo = Module._addRTEPermissionInfo = (e, t2) => (_addRTEPermissionInfo = Module._addRTEPermissionInfo = wasmExports.addRTEPermissionInfo)(e, t2), _errsave_start = Module._errsave_start = (e, t2) => (_errsave_start = Module._errsave_start = wasmExports.errsave_start)(e, t2), _errsave_finish = Module._errsave_finish = (e, t2, r, a) => (_errsave_finish = Module._errsave_finish = wasmExports.errsave_finish)(e, t2, r, a), _makeColumnDef = Module._makeColumnDef = (e, t2, r, a) => (_makeColumnDef = Module._makeColumnDef = wasmExports.makeColumnDef)(e, t2, r, a), _GetDefaultOpClass = Module._GetDefaultOpClass = (e, t2) => (_GetDefaultOpClass = Module._GetDefaultOpClass = wasmExports.GetDefaultOpClass)(e, t2), _scanner_init = Module._scanner_init = (e, t2, r, a) => (_scanner_init = Module._scanner_init = wasmExports.scanner_init)(e, t2, r, a), _scanner_finish = Module._scanner_finish = (e) => (_scanner_finish = Module._scanner_finish = wasmExports.scanner_finish)(e), _core_yylex = Module._core_yylex = (e, t2, r) => (_core_yylex = Module._core_yylex = wasmExports.core_yylex)(e, t2, r), _isxdigit = Module._isxdigit = (e) => (_isxdigit = Module._isxdigit = wasmExports.isxdigit)(e), _scanner_isspace = Module._scanner_isspace = (e) => (_scanner_isspace = Module._scanner_isspace = wasmExports.scanner_isspace)(e), _truncate_identifier = Module._truncate_identifier = (e, t2, r) => (_truncate_identifier = Module._truncate_identifier = wasmExports.truncate_identifier)(e, t2, r), _downcase_truncate_identifier = Module._downcase_truncate_identifier = (e, t2, r) => (_downcase_truncate_identifier = Module._downcase_truncate_identifier = wasmExports.downcase_truncate_identifier)(e, t2, r), _pg_database_encoding_max_length = Module._pg_database_encoding_max_length = () => (_pg_database_encoding_max_length = Module._pg_database_encoding_max_length = wasmExports.pg_database_encoding_max_length)(), _namein = Module._namein = (e) => (_namein = Module._namein = wasmExports.namein)(e), _BlockSampler_Init = Module._BlockSampler_Init = (e, t2, r, a) => (_BlockSampler_Init = Module._BlockSampler_Init = wasmExports.BlockSampler_Init)(e, t2, r, a), _reservoir_init_selection_state = Module._reservoir_init_selection_state = (e, t2) => (_reservoir_init_selection_state = Module._reservoir_init_selection_state = wasmExports.reservoir_init_selection_state)(e, t2), _reservoir_get_next_S = Module._reservoir_get_next_S = (e, t2, r) => (_reservoir_get_next_S = Module._reservoir_get_next_S = wasmExports.reservoir_get_next_S)(e, t2, r), _sampler_random_fract = Module._sampler_random_fract = (e) => (_sampler_random_fract = Module._sampler_random_fract = wasmExports.sampler_random_fract)(e), _BlockSampler_HasMore = Module._BlockSampler_HasMore = (e) => (_BlockSampler_HasMore = Module._BlockSampler_HasMore = wasmExports.BlockSampler_HasMore)(e), _BlockSampler_Next = Module._BlockSampler_Next = (e) => (_BlockSampler_Next = Module._BlockSampler_Next = wasmExports.BlockSampler_Next)(e), _Async_Notify = Module._Async_Notify = (e, t2) => (_Async_Notify = Module._Async_Notify = wasmExports.Async_Notify)(e, t2), _RangeVarCallbackMaintainsTable = Module._RangeVarCallbackMaintainsTable = (e, t2, r, a) => (_RangeVarCallbackMaintainsTable = Module._RangeVarCallbackMaintainsTable = wasmExports.RangeVarCallbackMaintainsTable)(e, t2, r, a), _make_new_heap = Module._make_new_heap = (e, t2, r, a, o3) => (_make_new_heap = Module._make_new_heap = wasmExports.make_new_heap)(e, t2, r, a, o3), _finish_heap_swap = Module._finish_heap_swap = (e, t2, r, a, o3, s2, l2, _2, n) => (_finish_heap_swap = Module._finish_heap_swap = wasmExports.finish_heap_swap)(e, t2, r, a, o3, s2, l2, _2, n), _wasm_OpenPipeStream = Module._wasm_OpenPipeStream = (e, t2) => (_wasm_OpenPipeStream = Module._wasm_OpenPipeStream = wasmExports.wasm_OpenPipeStream)(e, t2), _ClosePipeStream = Module._ClosePipeStream = (e) => (_ClosePipeStream = Module._ClosePipeStream = wasmExports.ClosePipeStream)(e), _BeginCopyFrom = Module._BeginCopyFrom = (e, t2, r, a, o3, s2, l2, _2) => (_BeginCopyFrom = Module._BeginCopyFrom = wasmExports.BeginCopyFrom)(e, t2, r, a, o3, s2, l2, _2), _EndCopyFrom = Module._EndCopyFrom = (e) => (_EndCopyFrom = Module._EndCopyFrom = wasmExports.EndCopyFrom)(e), _ProcessCopyOptions = Module._ProcessCopyOptions = (e, t2, r, a) => (_ProcessCopyOptions = Module._ProcessCopyOptions = wasmExports.ProcessCopyOptions)(e, t2, r, a), _CopyFromErrorCallback = Module._CopyFromErrorCallback = (e) => (_CopyFromErrorCallback = Module._CopyFromErrorCallback = wasmExports.CopyFromErrorCallback)(e), _ExecInitRangeTable = Module._ExecInitRangeTable = (e, t2, r) => (_ExecInitRangeTable = Module._ExecInitRangeTable = wasmExports.ExecInitRangeTable)(e, t2, r), _NextCopyFrom = Module._NextCopyFrom = (e, t2, r, a) => (_NextCopyFrom = Module._NextCopyFrom = wasmExports.NextCopyFrom)(e, t2, r, a), _ExecInitExpr = Module._ExecInitExpr = (e, t2) => (_ExecInitExpr = Module._ExecInitExpr = wasmExports.ExecInitExpr)(e, t2), _report_invalid_encoding = Module._report_invalid_encoding = (e, t2, r) => (_report_invalid_encoding = Module._report_invalid_encoding = wasmExports.report_invalid_encoding)(e, t2, r), _tolower = Module._tolower = (e) => (_tolower = Module._tolower = wasmExports.tolower)(e), _PushCopiedSnapshot = Module._PushCopiedSnapshot = (e) => (_PushCopiedSnapshot = Module._PushCopiedSnapshot = wasmExports.PushCopiedSnapshot)(e), _UpdateActiveSnapshotCommandId = Module._UpdateActiveSnapshotCommandId = () => (_UpdateActiveSnapshotCommandId = Module._UpdateActiveSnapshotCommandId = wasmExports.UpdateActiveSnapshotCommandId)(), _CreateQueryDesc = Module._CreateQueryDesc = (e, t2, r, a, o3, s2, l2, _2) => (_CreateQueryDesc = Module._CreateQueryDesc = wasmExports.CreateQueryDesc)(e, t2, r, a, o3, s2, l2, _2), _ExecutorStart = Module._ExecutorStart = (e, t2) => (_ExecutorStart = Module._ExecutorStart = wasmExports.ExecutorStart)(e, t2), _ExecutorFinish = Module._ExecutorFinish = (e) => (_ExecutorFinish = Module._ExecutorFinish = wasmExports.ExecutorFinish)(e), _ExecutorEnd = Module._ExecutorEnd = (e) => (_ExecutorEnd = Module._ExecutorEnd = wasmExports.ExecutorEnd)(e), _FreeQueryDesc = Module._FreeQueryDesc = (e) => (_FreeQueryDesc = Module._FreeQueryDesc = wasmExports.FreeQueryDesc)(e), _pg_server_to_any = Module._pg_server_to_any = (e, t2, r) => (_pg_server_to_any = Module._pg_server_to_any = wasmExports.pg_server_to_any)(e, t2, r), _ExecutorRun = Module._ExecutorRun = (e, t2, r, a) => (_ExecutorRun = Module._ExecutorRun = wasmExports.ExecutorRun)(e, t2, r, a), _CreateTableAsRelExists = Module._CreateTableAsRelExists = (e) => (_CreateTableAsRelExists = Module._CreateTableAsRelExists = wasmExports.CreateTableAsRelExists)(e), _DefineRelation = Module._DefineRelation = (e, t2, r, a, o3, s2) => (_DefineRelation = Module._DefineRelation = wasmExports.DefineRelation)(e, t2, r, a, o3, s2), _oidin = Module._oidin = (e) => (_oidin = Module._oidin = wasmExports.oidin)(e), _GetCommandTagName = Module._GetCommandTagName = (e) => (_GetCommandTagName = Module._GetCommandTagName = wasmExports.GetCommandTagName)(e), _ExplainBeginOutput = Module._ExplainBeginOutput = (e) => (_ExplainBeginOutput = Module._ExplainBeginOutput = wasmExports.ExplainBeginOutput)(e), _NewExplainState = Module._NewExplainState = () => (_NewExplainState = Module._NewExplainState = wasmExports.NewExplainState)(), _ExplainEndOutput = Module._ExplainEndOutput = (e) => (_ExplainEndOutput = Module._ExplainEndOutput = wasmExports.ExplainEndOutput)(e), _ExplainPrintPlan = Module._ExplainPrintPlan = (e, t2) => (_ExplainPrintPlan = Module._ExplainPrintPlan = wasmExports.ExplainPrintPlan)(e, t2), _ExplainPrintTriggers = Module._ExplainPrintTriggers = (e, t2) => (_ExplainPrintTriggers = Module._ExplainPrintTriggers = wasmExports.ExplainPrintTriggers)(e, t2), _ExplainPrintJITSummary = Module._ExplainPrintJITSummary = (e, t2) => (_ExplainPrintJITSummary = Module._ExplainPrintJITSummary = wasmExports.ExplainPrintJITSummary)(e, t2), _InstrEndLoop = Module._InstrEndLoop = (e) => (_InstrEndLoop = Module._InstrEndLoop = wasmExports.InstrEndLoop)(e), _ExplainPropertyInteger = Module._ExplainPropertyInteger = (e, t2, r, a) => (_ExplainPropertyInteger = Module._ExplainPropertyInteger = wasmExports.ExplainPropertyInteger)(e, t2, r, a), _make_orclause = Module._make_orclause = (e) => (_make_orclause = Module._make_orclause = wasmExports.make_orclause)(e), _ExplainQueryText = Module._ExplainQueryText = (e, t2) => (_ExplainQueryText = Module._ExplainQueryText = wasmExports.ExplainQueryText)(e, t2), _ExplainPropertyText = Module._ExplainPropertyText = (e, t2, r) => (_ExplainPropertyText = Module._ExplainPropertyText = wasmExports.ExplainPropertyText)(e, t2, r), _ExplainQueryParameters = Module._ExplainQueryParameters = (e, t2, r) => (_ExplainQueryParameters = Module._ExplainQueryParameters = wasmExports.ExplainQueryParameters)(e, t2, r), _get_func_namespace = Module._get_func_namespace = (e) => (_get_func_namespace = Module._get_func_namespace = wasmExports.get_func_namespace)(e), _get_rel_type_id = Module._get_rel_type_id = (e) => (_get_rel_type_id = Module._get_rel_type_id = wasmExports.get_rel_type_id)(e), _set_config_option = Module._set_config_option = (e, t2, r, a, o3, s2, l2, _2) => (_set_config_option = Module._set_config_option = wasmExports.set_config_option)(e, t2, r, a, o3, s2, l2, _2), _pg_any_to_server = Module._pg_any_to_server = (e, t2, r) => (_pg_any_to_server = Module._pg_any_to_server = wasmExports.pg_any_to_server)(e, t2, r), _DirectFunctionCall4Coll = Module._DirectFunctionCall4Coll = (e, t2, r, a, o3, s2) => (_DirectFunctionCall4Coll = Module._DirectFunctionCall4Coll = wasmExports.DirectFunctionCall4Coll)(e, t2, r, a, o3, s2), _list_delete_cell = Module._list_delete_cell = (e, t2) => (_list_delete_cell = Module._list_delete_cell = wasmExports.list_delete_cell)(e, t2), _GetForeignDataWrapper = Module._GetForeignDataWrapper = (e) => (_GetForeignDataWrapper = Module._GetForeignDataWrapper = wasmExports.GetForeignDataWrapper)(e), _CreateExprContext = Module._CreateExprContext = (e) => (_CreateExprContext = Module._CreateExprContext = wasmExports.CreateExprContext)(e), _EnsurePortalSnapshotExists = Module._EnsurePortalSnapshotExists = () => (_EnsurePortalSnapshotExists = Module._EnsurePortalSnapshotExists = wasmExports.EnsurePortalSnapshotExists)(), _CheckIndexCompatible = Module._CheckIndexCompatible = (e, t2, r, a) => (_CheckIndexCompatible = Module._CheckIndexCompatible = wasmExports.CheckIndexCompatible)(e, t2, r, a), _pgstat_count_truncate = Module._pgstat_count_truncate = (e) => (_pgstat_count_truncate = Module._pgstat_count_truncate = wasmExports.pgstat_count_truncate)(e), _SPI_connect = Module._SPI_connect = () => (_SPI_connect = Module._SPI_connect = wasmExports.SPI_connect)(), _SPI_exec = Module._SPI_exec = (e, t2) => (_SPI_exec = Module._SPI_exec = wasmExports.SPI_exec)(e, t2), _SPI_execute = Module._SPI_execute = (e, t2, r) => (_SPI_execute = Module._SPI_execute = wasmExports.SPI_execute)(e, t2, r), _SPI_getvalue = Module._SPI_getvalue = (e, t2, r) => (_SPI_getvalue = Module._SPI_getvalue = wasmExports.SPI_getvalue)(e, t2, r), _generate_operator_clause = Module._generate_operator_clause = (e, t2, r, a, o3, s2) => (_generate_operator_clause = Module._generate_operator_clause = wasmExports.generate_operator_clause)(e, t2, r, a, o3, s2), _SPI_finish = Module._SPI_finish = () => (_SPI_finish = Module._SPI_finish = wasmExports.SPI_finish)(), _CreateTransientRelDestReceiver = Module._CreateTransientRelDestReceiver = (e) => (_CreateTransientRelDestReceiver = Module._CreateTransientRelDestReceiver = wasmExports.CreateTransientRelDestReceiver)(e), _MemoryContextSetIdentifier = Module._MemoryContextSetIdentifier = (e, t2) => (_MemoryContextSetIdentifier = Module._MemoryContextSetIdentifier = wasmExports.MemoryContextSetIdentifier)(e, t2), _checkExprHasSubLink = Module._checkExprHasSubLink = (e) => (_checkExprHasSubLink = Module._checkExprHasSubLink = wasmExports.checkExprHasSubLink)(e), _SetTuplestoreDestReceiverParams = Module._SetTuplestoreDestReceiverParams = (e, t2, r, a, o3, s2) => (_SetTuplestoreDestReceiverParams = Module._SetTuplestoreDestReceiverParams = wasmExports.SetTuplestoreDestReceiverParams)(e, t2, r, a, o3, s2), _tuplestore_rescan = Module._tuplestore_rescan = (e) => (_tuplestore_rescan = Module._tuplestore_rescan = wasmExports.tuplestore_rescan)(e), _MemoryContextDeleteChildren = Module._MemoryContextDeleteChildren = (e) => (_MemoryContextDeleteChildren = Module._MemoryContextDeleteChildren = wasmExports.MemoryContextDeleteChildren)(e), _ReleaseCachedPlan = Module._ReleaseCachedPlan = (e, t2) => (_ReleaseCachedPlan = Module._ReleaseCachedPlan = wasmExports.ReleaseCachedPlan)(e, t2), _bms_equal = Module._bms_equal = (e, t2) => (_bms_equal = Module._bms_equal = wasmExports.bms_equal)(e, t2), _nextval = Module._nextval = (e) => (_nextval = Module._nextval = wasmExports.nextval)(e), _textToQualifiedNameList = Module._textToQualifiedNameList = (e) => (_textToQualifiedNameList = Module._textToQualifiedNameList = wasmExports.textToQualifiedNameList)(e), _defGetStreamingMode = Module._defGetStreamingMode = (e) => (_defGetStreamingMode = Module._defGetStreamingMode = wasmExports.defGetStreamingMode)(e), _pg_lsn_in = Module._pg_lsn_in = (e) => (_pg_lsn_in = Module._pg_lsn_in = wasmExports.pg_lsn_in)(e), _tuplestore_gettupleslot = Module._tuplestore_gettupleslot = (e, t2, r, a) => (_tuplestore_gettupleslot = Module._tuplestore_gettupleslot = wasmExports.tuplestore_gettupleslot)(e, t2, r, a), _list_delete = Module._list_delete = (e, t2) => (_list_delete = Module._list_delete = wasmExports.list_delete)(e, t2), _tuplestore_end = Module._tuplestore_end = (e) => (_tuplestore_end = Module._tuplestore_end = wasmExports.tuplestore_end)(e), _quote_literal_cstr = Module._quote_literal_cstr = (e) => (_quote_literal_cstr = Module._quote_literal_cstr = wasmExports.quote_literal_cstr)(e), _contain_mutable_functions = Module._contain_mutable_functions = (e) => (_contain_mutable_functions = Module._contain_mutable_functions = wasmExports.contain_mutable_functions)(e), _ExecuteTruncateGuts = Module._ExecuteTruncateGuts = (e, t2, r, a, o3, s2) => (_ExecuteTruncateGuts = Module._ExecuteTruncateGuts = wasmExports.ExecuteTruncateGuts)(e, t2, r, a, o3, s2), _bms_make_singleton = Module._bms_make_singleton = (e) => (_bms_make_singleton = Module._bms_make_singleton = wasmExports.bms_make_singleton)(e), _tuplestore_puttupleslot = Module._tuplestore_puttupleslot = (e, t2) => (_tuplestore_puttupleslot = Module._tuplestore_puttupleslot = wasmExports.tuplestore_puttupleslot)(e, t2), _tuplestore_begin_heap = Module._tuplestore_begin_heap = (e, t2, r) => (_tuplestore_begin_heap = Module._tuplestore_begin_heap = wasmExports.tuplestore_begin_heap)(e, t2, r), _ExecForceStoreHeapTuple = Module._ExecForceStoreHeapTuple = (e, t2, r) => (_ExecForceStoreHeapTuple = Module._ExecForceStoreHeapTuple = wasmExports.ExecForceStoreHeapTuple)(e, t2, r), _strtod = Module._strtod = (e, t2) => (_strtod = Module._strtod = wasmExports.strtod)(e, t2), _plain_crypt_verify = Module._plain_crypt_verify = (e, t2, r, a) => (_plain_crypt_verify = Module._plain_crypt_verify = wasmExports.plain_crypt_verify)(e, t2, r, a), _ProcessConfigFile = Module._ProcessConfigFile = (e) => (_ProcessConfigFile = Module._ProcessConfigFile = wasmExports.ProcessConfigFile)(e), _ExecReScan = Module._ExecReScan = (e) => (_ExecReScan = Module._ExecReScan = wasmExports.ExecReScan)(e), _ExecAsyncResponse = Module._ExecAsyncResponse = (e) => (_ExecAsyncResponse = Module._ExecAsyncResponse = wasmExports.ExecAsyncResponse)(e), _ExecAsyncRequestDone = Module._ExecAsyncRequestDone = (e, t2) => (_ExecAsyncRequestDone = Module._ExecAsyncRequestDone = wasmExports.ExecAsyncRequestDone)(e, t2), _ExecAsyncRequestPending = Module._ExecAsyncRequestPending = (e) => (_ExecAsyncRequestPending = Module._ExecAsyncRequestPending = wasmExports.ExecAsyncRequestPending)(e), _ExprEvalPushStep = Module._ExprEvalPushStep = (e, t2) => (_ExprEvalPushStep = Module._ExprEvalPushStep = wasmExports.ExprEvalPushStep)(e, t2), _ExecInitExprWithParams = Module._ExecInitExprWithParams = (e, t2) => (_ExecInitExprWithParams = Module._ExecInitExprWithParams = wasmExports.ExecInitExprWithParams)(e, t2), _ExecInitExprList = Module._ExecInitExprList = (e, t2) => (_ExecInitExprList = Module._ExecInitExprList = wasmExports.ExecInitExprList)(e, t2), _MakeExpandedObjectReadOnlyInternal = Module._MakeExpandedObjectReadOnlyInternal = (e) => (_MakeExpandedObjectReadOnlyInternal = Module._MakeExpandedObjectReadOnlyInternal = wasmExports.MakeExpandedObjectReadOnlyInternal)(e), _tuplesort_puttupleslot = Module._tuplesort_puttupleslot = (e, t2) => (_tuplesort_puttupleslot = Module._tuplesort_puttupleslot = wasmExports.tuplesort_puttupleslot)(e, t2), _ArrayGetNItems = Module._ArrayGetNItems = (e, t2) => (_ArrayGetNItems = Module._ArrayGetNItems = wasmExports.ArrayGetNItems)(e, t2), _expanded_record_fetch_tupdesc = Module._expanded_record_fetch_tupdesc = (e) => (_expanded_record_fetch_tupdesc = Module._expanded_record_fetch_tupdesc = wasmExports.expanded_record_fetch_tupdesc)(e), _expanded_record_fetch_field = Module._expanded_record_fetch_field = (e, t2, r) => (_expanded_record_fetch_field = Module._expanded_record_fetch_field = wasmExports.expanded_record_fetch_field)(e, t2, r), _JsonbValueToJsonb = Module._JsonbValueToJsonb = (e) => (_JsonbValueToJsonb = Module._JsonbValueToJsonb = wasmExports.JsonbValueToJsonb)(e), _boolout = Module._boolout = (e) => (_boolout = Module._boolout = wasmExports.boolout)(e), _lookup_rowtype_tupdesc_domain = Module._lookup_rowtype_tupdesc_domain = (e, t2, r) => (_lookup_rowtype_tupdesc_domain = Module._lookup_rowtype_tupdesc_domain = wasmExports.lookup_rowtype_tupdesc_domain)(e, t2, r), _MemoryContextGetParent = Module._MemoryContextGetParent = (e) => (_MemoryContextGetParent = Module._MemoryContextGetParent = wasmExports.MemoryContextGetParent)(e), _DeleteExpandedObject = Module._DeleteExpandedObject = (e) => (_DeleteExpandedObject = Module._DeleteExpandedObject = wasmExports.DeleteExpandedObject)(e), _ExecFindJunkAttributeInTlist = Module._ExecFindJunkAttributeInTlist = (e, t2) => (_ExecFindJunkAttributeInTlist = Module._ExecFindJunkAttributeInTlist = wasmExports.ExecFindJunkAttributeInTlist)(e, t2), _standard_ExecutorStart = Module._standard_ExecutorStart = (e, t2) => (_standard_ExecutorStart = Module._standard_ExecutorStart = wasmExports.standard_ExecutorStart)(e, t2), _standard_ExecutorRun = Module._standard_ExecutorRun = (e, t2, r, a) => (_standard_ExecutorRun = Module._standard_ExecutorRun = wasmExports.standard_ExecutorRun)(e, t2, r, a), _standard_ExecutorFinish = Module._standard_ExecutorFinish = (e) => (_standard_ExecutorFinish = Module._standard_ExecutorFinish = wasmExports.standard_ExecutorFinish)(e), _standard_ExecutorEnd = Module._standard_ExecutorEnd = (e) => (_standard_ExecutorEnd = Module._standard_ExecutorEnd = wasmExports.standard_ExecutorEnd)(e), _InstrAlloc = Module._InstrAlloc = (e, t2, r) => (_InstrAlloc = Module._InstrAlloc = wasmExports.InstrAlloc)(e, t2, r), _MakeTupleTableSlot = Module._MakeTupleTableSlot = (e, t2) => (_MakeTupleTableSlot = Module._MakeTupleTableSlot = wasmExports.MakeTupleTableSlot)(e, t2), _get_typlenbyval = Module._get_typlenbyval = (e, t2, r) => (_get_typlenbyval = Module._get_typlenbyval = wasmExports.get_typlenbyval)(e, t2, r), _bms_num_members = Module._bms_num_members = (e) => (_bms_num_members = Module._bms_num_members = wasmExports.bms_num_members)(e), _InputFunctionCall = Module._InputFunctionCall = (e, t2, r, a) => (_InputFunctionCall = Module._InputFunctionCall = wasmExports.InputFunctionCall)(e, t2, r, a), _FreeExprContext = Module._FreeExprContext = (e, t2) => (_FreeExprContext = Module._FreeExprContext = wasmExports.FreeExprContext)(e, t2), _ExecOpenScanRelation = Module._ExecOpenScanRelation = (e, t2, r) => (_ExecOpenScanRelation = Module._ExecOpenScanRelation = wasmExports.ExecOpenScanRelation)(e, t2, r), _bms_intersect = Module._bms_intersect = (e, t2) => (_bms_intersect = Module._bms_intersect = wasmExports.bms_intersect)(e, t2), _ExecGetReturningSlot = Module._ExecGetReturningSlot = (e, t2) => (_ExecGetReturningSlot = Module._ExecGetReturningSlot = wasmExports.ExecGetReturningSlot)(e, t2), _ExecGetResultRelCheckAsUser = Module._ExecGetResultRelCheckAsUser = (e, t2) => (_ExecGetResultRelCheckAsUser = Module._ExecGetResultRelCheckAsUser = wasmExports.ExecGetResultRelCheckAsUser)(e, t2), _get_call_expr_argtype = Module._get_call_expr_argtype = (e, t2) => (_get_call_expr_argtype = Module._get_call_expr_argtype = wasmExports.get_call_expr_argtype)(e, t2), _tuplestore_clear = Module._tuplestore_clear = (e) => (_tuplestore_clear = Module._tuplestore_clear = wasmExports.tuplestore_clear)(e), _InstrUpdateTupleCount = Module._InstrUpdateTupleCount = (e, t2) => (_InstrUpdateTupleCount = Module._InstrUpdateTupleCount = wasmExports.InstrUpdateTupleCount)(e, t2), _tuplesort_begin_heap = Module._tuplesort_begin_heap = (e, t2, r, a, o3, s2, l2, _2, n) => (_tuplesort_begin_heap = Module._tuplesort_begin_heap = wasmExports.tuplesort_begin_heap)(e, t2, r, a, o3, s2, l2, _2, n), _tuplesort_gettupleslot = Module._tuplesort_gettupleslot = (e, t2, r, a, o3) => (_tuplesort_gettupleslot = Module._tuplesort_gettupleslot = wasmExports.tuplesort_gettupleslot)(e, t2, r, a, o3), _AddWaitEventToSet = Module._AddWaitEventToSet = (e, t2, r, a, o3) => (_AddWaitEventToSet = Module._AddWaitEventToSet = wasmExports.AddWaitEventToSet)(e, t2, r, a, o3), _GetNumRegisteredWaitEvents = Module._GetNumRegisteredWaitEvents = (e) => (_GetNumRegisteredWaitEvents = Module._GetNumRegisteredWaitEvents = wasmExports.GetNumRegisteredWaitEvents)(e), _get_attstatsslot = Module._get_attstatsslot = (e, t2, r, a, o3) => (_get_attstatsslot = Module._get_attstatsslot = wasmExports.get_attstatsslot)(e, t2, r, a, o3), _free_attstatsslot = Module._free_attstatsslot = (e) => (_free_attstatsslot = Module._free_attstatsslot = wasmExports.free_attstatsslot)(e), _tuplesort_reset = Module._tuplesort_reset = (e) => (_tuplesort_reset = Module._tuplesort_reset = wasmExports.tuplesort_reset)(e), _pairingheap_first = Module._pairingheap_first = (e) => (_pairingheap_first = Module._pairingheap_first = wasmExports.pairingheap_first)(e), _bms_nonempty_difference = Module._bms_nonempty_difference = (e, t2) => (_bms_nonempty_difference = Module._bms_nonempty_difference = wasmExports.bms_nonempty_difference)(e, t2), _SPI_connect_ext = Module._SPI_connect_ext = (e) => (_SPI_connect_ext = Module._SPI_connect_ext = wasmExports.SPI_connect_ext)(e), _SPI_commit = Module._SPI_commit = () => (_SPI_commit = Module._SPI_commit = wasmExports.SPI_commit)(), _CopyErrorData = Module._CopyErrorData = () => (_CopyErrorData = Module._CopyErrorData = wasmExports.CopyErrorData)(), _ReThrowError = Module._ReThrowError = (e) => (_ReThrowError = Module._ReThrowError = wasmExports.ReThrowError)(e), _SPI_commit_and_chain = Module._SPI_commit_and_chain = () => (_SPI_commit_and_chain = Module._SPI_commit_and_chain = wasmExports.SPI_commit_and_chain)(), _SPI_rollback = Module._SPI_rollback = () => (_SPI_rollback = Module._SPI_rollback = wasmExports.SPI_rollback)(), _SPI_rollback_and_chain = Module._SPI_rollback_and_chain = () => (_SPI_rollback_and_chain = Module._SPI_rollback_and_chain = wasmExports.SPI_rollback_and_chain)(), _SPI_freetuptable = Module._SPI_freetuptable = (e) => (_SPI_freetuptable = Module._SPI_freetuptable = wasmExports.SPI_freetuptable)(e), _SPI_execute_extended = Module._SPI_execute_extended = (e, t2) => (_SPI_execute_extended = Module._SPI_execute_extended = wasmExports.SPI_execute_extended)(e, t2), _SPI_execute_plan = Module._SPI_execute_plan = (e, t2, r, a, o3) => (_SPI_execute_plan = Module._SPI_execute_plan = wasmExports.SPI_execute_plan)(e, t2, r, a, o3), _SPI_execp = Module._SPI_execp = (e, t2, r, a) => (_SPI_execp = Module._SPI_execp = wasmExports.SPI_execp)(e, t2, r, a), _SPI_execute_plan_extended = Module._SPI_execute_plan_extended = (e, t2) => (_SPI_execute_plan_extended = Module._SPI_execute_plan_extended = wasmExports.SPI_execute_plan_extended)(e, t2), _SPI_execute_plan_with_paramlist = Module._SPI_execute_plan_with_paramlist = (e, t2, r, a) => (_SPI_execute_plan_with_paramlist = Module._SPI_execute_plan_with_paramlist = wasmExports.SPI_execute_plan_with_paramlist)(e, t2, r, a), _SPI_prepare = Module._SPI_prepare = (e, t2, r) => (_SPI_prepare = Module._SPI_prepare = wasmExports.SPI_prepare)(e, t2, r), _SPI_prepare_extended = Module._SPI_prepare_extended = (e, t2) => (_SPI_prepare_extended = Module._SPI_prepare_extended = wasmExports.SPI_prepare_extended)(e, t2), _SPI_keepplan = Module._SPI_keepplan = (e) => (_SPI_keepplan = Module._SPI_keepplan = wasmExports.SPI_keepplan)(e), _SPI_freeplan = Module._SPI_freeplan = (e) => (_SPI_freeplan = Module._SPI_freeplan = wasmExports.SPI_freeplan)(e), _SPI_copytuple = Module._SPI_copytuple = (e) => (_SPI_copytuple = Module._SPI_copytuple = wasmExports.SPI_copytuple)(e), _SPI_returntuple = Module._SPI_returntuple = (e, t2) => (_SPI_returntuple = Module._SPI_returntuple = wasmExports.SPI_returntuple)(e, t2), _SPI_fnumber = Module._SPI_fnumber = (e, t2) => (_SPI_fnumber = Module._SPI_fnumber = wasmExports.SPI_fnumber)(e, t2), _SPI_fname = Module._SPI_fname = (e, t2) => (_SPI_fname = Module._SPI_fname = wasmExports.SPI_fname)(e, t2), _SPI_getbinval = Module._SPI_getbinval = (e, t2, r, a) => (_SPI_getbinval = Module._SPI_getbinval = wasmExports.SPI_getbinval)(e, t2, r, a), _SPI_gettype = Module._SPI_gettype = (e, t2) => (_SPI_gettype = Module._SPI_gettype = wasmExports.SPI_gettype)(e, t2), _SPI_gettypeid = Module._SPI_gettypeid = (e, t2) => (_SPI_gettypeid = Module._SPI_gettypeid = wasmExports.SPI_gettypeid)(e, t2), _SPI_getrelname = Module._SPI_getrelname = (e) => (_SPI_getrelname = Module._SPI_getrelname = wasmExports.SPI_getrelname)(e), _SPI_palloc = Module._SPI_palloc = (e) => (_SPI_palloc = Module._SPI_palloc = wasmExports.SPI_palloc)(e), _SPI_datumTransfer = Module._SPI_datumTransfer = (e, t2, r) => (_SPI_datumTransfer = Module._SPI_datumTransfer = wasmExports.SPI_datumTransfer)(e, t2, r), _datumTransfer = Module._datumTransfer = (e, t2, r) => (_datumTransfer = Module._datumTransfer = wasmExports.datumTransfer)(e, t2, r), _SPI_cursor_open_with_paramlist = Module._SPI_cursor_open_with_paramlist = (e, t2, r, a) => (_SPI_cursor_open_with_paramlist = Module._SPI_cursor_open_with_paramlist = wasmExports.SPI_cursor_open_with_paramlist)(e, t2, r, a), _SPI_cursor_parse_open = Module._SPI_cursor_parse_open = (e, t2, r) => (_SPI_cursor_parse_open = Module._SPI_cursor_parse_open = wasmExports.SPI_cursor_parse_open)(e, t2, r), _SPI_cursor_find = Module._SPI_cursor_find = (e) => (_SPI_cursor_find = Module._SPI_cursor_find = wasmExports.SPI_cursor_find)(e), _SPI_cursor_fetch = Module._SPI_cursor_fetch = (e, t2, r) => (_SPI_cursor_fetch = Module._SPI_cursor_fetch = wasmExports.SPI_cursor_fetch)(e, t2, r), _SPI_scroll_cursor_fetch = Module._SPI_scroll_cursor_fetch = (e, t2, r) => (_SPI_scroll_cursor_fetch = Module._SPI_scroll_cursor_fetch = wasmExports.SPI_scroll_cursor_fetch)(e, t2, r), _SPI_scroll_cursor_move = Module._SPI_scroll_cursor_move = (e, t2, r) => (_SPI_scroll_cursor_move = Module._SPI_scroll_cursor_move = wasmExports.SPI_scroll_cursor_move)(e, t2, r), _SPI_cursor_close = Module._SPI_cursor_close = (e) => (_SPI_cursor_close = Module._SPI_cursor_close = wasmExports.SPI_cursor_close)(e), _SPI_plan_is_valid = Module._SPI_plan_is_valid = (e) => (_SPI_plan_is_valid = Module._SPI_plan_is_valid = wasmExports.SPI_plan_is_valid)(e), _SPI_result_code_string = Module._SPI_result_code_string = (e) => (_SPI_result_code_string = Module._SPI_result_code_string = wasmExports.SPI_result_code_string)(e), _SPI_plan_get_plan_sources = Module._SPI_plan_get_plan_sources = (e) => (_SPI_plan_get_plan_sources = Module._SPI_plan_get_plan_sources = wasmExports.SPI_plan_get_plan_sources)(e), _SPI_plan_get_cached_plan = Module._SPI_plan_get_cached_plan = (e) => (_SPI_plan_get_cached_plan = Module._SPI_plan_get_cached_plan = wasmExports.SPI_plan_get_cached_plan)(e), _SPI_register_relation = Module._SPI_register_relation = (e) => (_SPI_register_relation = Module._SPI_register_relation = wasmExports.SPI_register_relation)(e), _create_queryEnv = Module._create_queryEnv = () => (_create_queryEnv = Module._create_queryEnv = wasmExports.create_queryEnv)(), _register_ENR = Module._register_ENR = (e, t2) => (_register_ENR = Module._register_ENR = wasmExports.register_ENR)(e, t2), _SPI_register_trigger_data = Module._SPI_register_trigger_data = (e) => (_SPI_register_trigger_data = Module._SPI_register_trigger_data = wasmExports.SPI_register_trigger_data)(e), _tuplestore_tuple_count = Module._tuplestore_tuple_count = (e) => (_tuplestore_tuple_count = Module._tuplestore_tuple_count = wasmExports.tuplestore_tuple_count)(e), _GetUserMapping = Module._GetUserMapping = (e, t2) => (_GetUserMapping = Module._GetUserMapping = wasmExports.GetUserMapping)(e, t2), _GetForeignTable = Module._GetForeignTable = (e) => (_GetForeignTable = Module._GetForeignTable = wasmExports.GetForeignTable)(e), _GetForeignColumnOptions = Module._GetForeignColumnOptions = (e, t2) => (_GetForeignColumnOptions = Module._GetForeignColumnOptions = wasmExports.GetForeignColumnOptions)(e, t2), _initClosestMatch = Module._initClosestMatch = (e, t2, r) => (_initClosestMatch = Module._initClosestMatch = wasmExports.initClosestMatch)(e, t2, r), _updateClosestMatch = Module._updateClosestMatch = (e, t2) => (_updateClosestMatch = Module._updateClosestMatch = wasmExports.updateClosestMatch)(e, t2), _getClosestMatch = Module._getClosestMatch = (e) => (_getClosestMatch = Module._getClosestMatch = wasmExports.getClosestMatch)(e), _GetExistingLocalJoinPath = Module._GetExistingLocalJoinPath = (e) => (_GetExistingLocalJoinPath = Module._GetExistingLocalJoinPath = wasmExports.GetExistingLocalJoinPath)(e), _bloom_create = Module._bloom_create = (e, t2, r) => (_bloom_create = Module._bloom_create = wasmExports.bloom_create)(e, t2, r), _bloom_free = Module._bloom_free = (e) => (_bloom_free = Module._bloom_free = wasmExports.bloom_free)(e), _bloom_add_element = Module._bloom_add_element = (e, t2, r) => (_bloom_add_element = Module._bloom_add_element = wasmExports.bloom_add_element)(e, t2, r), _bloom_lacks_element = Module._bloom_lacks_element = (e, t2, r) => (_bloom_lacks_element = Module._bloom_lacks_element = wasmExports.bloom_lacks_element)(e, t2, r), _bloom_prop_bits_set = Module._bloom_prop_bits_set = (e) => (_bloom_prop_bits_set = Module._bloom_prop_bits_set = wasmExports.bloom_prop_bits_set)(e), _gai_strerror = Module._gai_strerror = (e) => (_gai_strerror = Module._gai_strerror = wasmExports.gai_strerror)(e), _socket = Module._socket = (e, t2, r) => (_socket = Module._socket = wasmExports.socket)(e, t2, r), _bind = Module._bind = (e, t2, r) => (_bind = Module._bind = wasmExports.bind)(e, t2, r), _connect = Module._connect = (e, t2, r) => (_connect = Module._connect = wasmExports.connect)(e, t2, r), _send = Module._send = (e, t2, r, a) => (_send = Module._send = wasmExports.send)(e, t2, r, a), _recv = Module._recv = (e, t2, r, a) => (_recv = Module._recv = wasmExports.recv)(e, t2, r, a), _sendto = Module._sendto = (e, t2, r, a, o3, s2) => (_sendto = Module._sendto = wasmExports.sendto)(e, t2, r, a, o3, s2), _recvfrom = Module._recvfrom = (e, t2, r, a, o3, s2) => (_recvfrom = Module._recvfrom = wasmExports.recvfrom)(e, t2, r, a, o3, s2), _be_lo_unlink = Module._be_lo_unlink = (e) => (_be_lo_unlink = Module._be_lo_unlink = wasmExports.be_lo_unlink)(e), _text_to_cstring_buffer = Module._text_to_cstring_buffer = (e, t2, r) => (_text_to_cstring_buffer = Module._text_to_cstring_buffer = wasmExports.text_to_cstring_buffer)(e, t2, r), _feof = Module._feof = (e) => (_feof = Module._feof = wasmExports.feof)(e), _pg_mb2wchar_with_len = Module._pg_mb2wchar_with_len = (e, t2, r) => (_pg_mb2wchar_with_len = Module._pg_mb2wchar_with_len = wasmExports.pg_mb2wchar_with_len)(e, t2, r), _pg_regcomp = Module._pg_regcomp = (e, t2, r, a, o3) => (_pg_regcomp = Module._pg_regcomp = wasmExports.pg_regcomp)(e, t2, r, a, o3), _pg_regerror = Module._pg_regerror = (e, t2, r, a) => (_pg_regerror = Module._pg_regerror = wasmExports.pg_regerror)(e, t2, r, a), _strcat = Module._strcat = (e, t2) => (_strcat = Module._strcat = wasmExports.strcat)(e, t2), _setsockopt = Module._setsockopt = (e, t2, r, a, o3) => (_setsockopt = Module._setsockopt = wasmExports.setsockopt)(e, t2, r, a, o3), _listen = Module._listen = (e, t2) => (_listen = Module._listen = wasmExports.listen)(e, t2), _accept = Module._accept = (e, t2, r) => (_accept = Module._accept = wasmExports.accept)(e, t2, r), _getsockopt = Module._getsockopt = (e, t2, r, a, o3) => (_getsockopt = Module._getsockopt = wasmExports.getsockopt)(e, t2, r, a, o3), _pq_sendtext = Module._pq_sendtext = (e, t2, r) => (_pq_sendtext = Module._pq_sendtext = wasmExports.pq_sendtext)(e, t2, r), _pq_sendfloat4 = Module._pq_sendfloat4 = (e, t2) => (_pq_sendfloat4 = Module._pq_sendfloat4 = wasmExports.pq_sendfloat4)(e, t2), _pq_sendfloat8 = Module._pq_sendfloat8 = (e, t2) => (_pq_sendfloat8 = Module._pq_sendfloat8 = wasmExports.pq_sendfloat8)(e, t2), _pq_begintypsend = Module._pq_begintypsend = (e) => (_pq_begintypsend = Module._pq_begintypsend = wasmExports.pq_begintypsend)(e), _pq_endtypsend = Module._pq_endtypsend = (e) => (_pq_endtypsend = Module._pq_endtypsend = wasmExports.pq_endtypsend)(e), _pq_getmsgfloat4 = Module._pq_getmsgfloat4 = (e) => (_pq_getmsgfloat4 = Module._pq_getmsgfloat4 = wasmExports.pq_getmsgfloat4)(e), _pq_getmsgfloat8 = Module._pq_getmsgfloat8 = (e) => (_pq_getmsgfloat8 = Module._pq_getmsgfloat8 = wasmExports.pq_getmsgfloat8)(e), _pq_getmsgtext = Module._pq_getmsgtext = (e, t2, r) => (_pq_getmsgtext = Module._pq_getmsgtext = wasmExports.pq_getmsgtext)(e, t2, r), _pg_strtoint32 = Module._pg_strtoint32 = (e) => (_pg_strtoint32 = Module._pg_strtoint32 = wasmExports.pg_strtoint32)(e), _bms_membership = Module._bms_membership = (e) => (_bms_membership = Module._bms_membership = wasmExports.bms_membership)(e), _list_make5_impl = Module._list_make5_impl = (e, t2, r, a, o3, s2) => (_list_make5_impl = Module._list_make5_impl = wasmExports.list_make5_impl)(e, t2, r, a, o3, s2), _lappend_xid = Module._lappend_xid = (e, t2) => (_lappend_xid = Module._lappend_xid = wasmExports.lappend_xid)(e, t2), _list_insert_nth = Module._list_insert_nth = (e, t2, r) => (_list_insert_nth = Module._list_insert_nth = wasmExports.list_insert_nth)(e, t2, r), _list_member_ptr = Module._list_member_ptr = (e, t2) => (_list_member_ptr = Module._list_member_ptr = wasmExports.list_member_ptr)(e, t2), _list_member_xid = Module._list_member_xid = (e, t2) => (_list_member_xid = Module._list_member_xid = wasmExports.list_member_xid)(e, t2), _list_append_unique_ptr = Module._list_append_unique_ptr = (e, t2) => (_list_append_unique_ptr = Module._list_append_unique_ptr = wasmExports.list_append_unique_ptr)(e, t2), _make_opclause = Module._make_opclause = (e, t2, r, a, o3, s2, l2) => (_make_opclause = Module._make_opclause = wasmExports.make_opclause)(e, t2, r, a, o3, s2, l2), _exprIsLengthCoercion = Module._exprIsLengthCoercion = (e, t2) => (_exprIsLengthCoercion = Module._exprIsLengthCoercion = wasmExports.exprIsLengthCoercion)(e, t2), _fix_opfuncids = Module._fix_opfuncids = (e) => (_fix_opfuncids = Module._fix_opfuncids = wasmExports.fix_opfuncids)(e), _CleanQuerytext = Module._CleanQuerytext = (e, t2, r) => (_CleanQuerytext = Module._CleanQuerytext = wasmExports.CleanQuerytext)(e, t2, r), _EnableQueryId = Module._EnableQueryId = () => (_EnableQueryId = Module._EnableQueryId = wasmExports.EnableQueryId)(), _find_base_rel = Module._find_base_rel = (e, t2) => (_find_base_rel = Module._find_base_rel = wasmExports.find_base_rel)(e, t2), _add_path = Module._add_path = (e, t2) => (_add_path = Module._add_path = wasmExports.add_path)(e, t2), _pathkeys_contained_in = Module._pathkeys_contained_in = (e, t2) => (_pathkeys_contained_in = Module._pathkeys_contained_in = wasmExports.pathkeys_contained_in)(e, t2), _create_sort_path = Module._create_sort_path = (e, t2, r, a, o3) => (_create_sort_path = Module._create_sort_path = wasmExports.create_sort_path)(e, t2, r, a, o3), _set_baserel_size_estimates = Module._set_baserel_size_estimates = (e, t2) => (_set_baserel_size_estimates = Module._set_baserel_size_estimates = wasmExports.set_baserel_size_estimates)(e, t2), _clauselist_selectivity = Module._clauselist_selectivity = (e, t2, r, a, o3) => (_clauselist_selectivity = Module._clauselist_selectivity = wasmExports.clauselist_selectivity)(e, t2, r, a, o3), _get_tablespace_page_costs = Module._get_tablespace_page_costs = (e, t2, r) => (_get_tablespace_page_costs = Module._get_tablespace_page_costs = wasmExports.get_tablespace_page_costs)(e, t2, r), _cost_qual_eval = Module._cost_qual_eval = (e, t2, r) => (_cost_qual_eval = Module._cost_qual_eval = wasmExports.cost_qual_eval)(e, t2, r), _estimate_num_groups = Module._estimate_num_groups = (e, t2, r, a, o3) => (_estimate_num_groups = Module._estimate_num_groups = wasmExports.estimate_num_groups)(e, t2, r, a, o3), _cost_sort = Module._cost_sort = (e, t2, r, a, o3, s2, l2, _2, n) => (_cost_sort = Module._cost_sort = wasmExports.cost_sort)(e, t2, r, a, o3, s2, l2, _2, n), _get_sortgrouplist_exprs = Module._get_sortgrouplist_exprs = (e, t2) => (_get_sortgrouplist_exprs = Module._get_sortgrouplist_exprs = wasmExports.get_sortgrouplist_exprs)(e, t2), _make_restrictinfo = Module._make_restrictinfo = (e, t2, r, a, o3, s2, l2, _2, n, m3) => (_make_restrictinfo = Module._make_restrictinfo = wasmExports.make_restrictinfo)(e, t2, r, a, o3, s2, l2, _2, n, m3), _generate_implied_equalities_for_column = Module._generate_implied_equalities_for_column = (e, t2, r, a, o3) => (_generate_implied_equalities_for_column = Module._generate_implied_equalities_for_column = wasmExports.generate_implied_equalities_for_column)(e, t2, r, a, o3), _eclass_useful_for_merging = Module._eclass_useful_for_merging = (e, t2, r) => (_eclass_useful_for_merging = Module._eclass_useful_for_merging = wasmExports.eclass_useful_for_merging)(e, t2, r), _join_clause_is_movable_to = Module._join_clause_is_movable_to = (e, t2) => (_join_clause_is_movable_to = Module._join_clause_is_movable_to = wasmExports.join_clause_is_movable_to)(e, t2), _get_plan_rowmark = Module._get_plan_rowmark = (e, t2) => (_get_plan_rowmark = Module._get_plan_rowmark = wasmExports.get_plan_rowmark)(e, t2), _update_mergeclause_eclasses = Module._update_mergeclause_eclasses = (e, t2) => (_update_mergeclause_eclasses = Module._update_mergeclause_eclasses = wasmExports.update_mergeclause_eclasses)(e, t2), _find_join_rel = Module._find_join_rel = (e, t2) => (_find_join_rel = Module._find_join_rel = wasmExports.find_join_rel)(e, t2), _make_canonical_pathkey = Module._make_canonical_pathkey = (e, t2, r, a, o3) => (_make_canonical_pathkey = Module._make_canonical_pathkey = wasmExports.make_canonical_pathkey)(e, t2, r, a, o3), _get_sortgroupref_clause_noerr = Module._get_sortgroupref_clause_noerr = (e, t2) => (_get_sortgroupref_clause_noerr = Module._get_sortgroupref_clause_noerr = wasmExports.get_sortgroupref_clause_noerr)(e, t2), _extract_actual_clauses = Module._extract_actual_clauses = (e, t2) => (_extract_actual_clauses = Module._extract_actual_clauses = wasmExports.extract_actual_clauses)(e, t2), _change_plan_targetlist = Module._change_plan_targetlist = (e, t2, r) => (_change_plan_targetlist = Module._change_plan_targetlist = wasmExports.change_plan_targetlist)(e, t2, r), _make_foreignscan = Module._make_foreignscan = (e, t2, r, a, o3, s2, l2, _2) => (_make_foreignscan = Module._make_foreignscan = wasmExports.make_foreignscan)(e, t2, r, a, o3, s2, l2, _2), _tlist_member = Module._tlist_member = (e, t2) => (_tlist_member = Module._tlist_member = wasmExports.tlist_member)(e, t2), _pull_vars_of_level = Module._pull_vars_of_level = (e, t2) => (_pull_vars_of_level = Module._pull_vars_of_level = wasmExports.pull_vars_of_level)(e, t2), _IncrementVarSublevelsUp = Module._IncrementVarSublevelsUp = (e, t2, r) => (_IncrementVarSublevelsUp = Module._IncrementVarSublevelsUp = wasmExports.IncrementVarSublevelsUp)(e, t2, r), _standard_planner = Module._standard_planner = (e, t2, r, a) => (_standard_planner = Module._standard_planner = wasmExports.standard_planner)(e, t2, r, a), _get_relids_in_jointree = Module._get_relids_in_jointree = (e, t2, r) => (_get_relids_in_jointree = Module._get_relids_in_jointree = wasmExports.get_relids_in_jointree)(e, t2, r), _add_new_columns_to_pathtarget = Module._add_new_columns_to_pathtarget = (e, t2) => (_add_new_columns_to_pathtarget = Module._add_new_columns_to_pathtarget = wasmExports.add_new_columns_to_pathtarget)(e, t2), _get_agg_clause_costs = Module._get_agg_clause_costs = (e, t2, r) => (_get_agg_clause_costs = Module._get_agg_clause_costs = wasmExports.get_agg_clause_costs)(e, t2, r), _grouping_is_sortable = Module._grouping_is_sortable = (e) => (_grouping_is_sortable = Module._grouping_is_sortable = wasmExports.grouping_is_sortable)(e), _copy_pathtarget = Module._copy_pathtarget = (e) => (_copy_pathtarget = Module._copy_pathtarget = wasmExports.copy_pathtarget)(e), _create_projection_path = Module._create_projection_path = (e, t2, r, a) => (_create_projection_path = Module._create_projection_path = wasmExports.create_projection_path)(e, t2, r, a), _GetSysCacheHashValue = Module._GetSysCacheHashValue = (e, t2, r, a, o3) => (_GetSysCacheHashValue = Module._GetSysCacheHashValue = wasmExports.GetSysCacheHashValue)(e, t2, r, a, o3), _get_translated_update_targetlist = Module._get_translated_update_targetlist = (e, t2, r, a) => (_get_translated_update_targetlist = Module._get_translated_update_targetlist = wasmExports.get_translated_update_targetlist)(e, t2, r, a), _add_row_identity_var = Module._add_row_identity_var = (e, t2, r, a) => (_add_row_identity_var = Module._add_row_identity_var = wasmExports.add_row_identity_var)(e, t2, r, a), _get_rel_all_updated_cols = Module._get_rel_all_updated_cols = (e, t2) => (_get_rel_all_updated_cols = Module._get_rel_all_updated_cols = wasmExports.get_rel_all_updated_cols)(e, t2), _get_baserel_parampathinfo = Module._get_baserel_parampathinfo = (e, t2, r) => (_get_baserel_parampathinfo = Module._get_baserel_parampathinfo = wasmExports.get_baserel_parampathinfo)(e, t2, r), _create_foreignscan_path = Module._create_foreignscan_path = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2) => (_create_foreignscan_path = Module._create_foreignscan_path = wasmExports.create_foreignscan_path)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2), _create_foreign_join_path = Module._create_foreign_join_path = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2) => (_create_foreign_join_path = Module._create_foreign_join_path = wasmExports.create_foreign_join_path)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2), _create_foreign_upper_path = Module._create_foreign_upper_path = (e, t2, r, a, o3, s2, l2, _2, n, m3) => (_create_foreign_upper_path = Module._create_foreign_upper_path = wasmExports.create_foreign_upper_path)(e, t2, r, a, o3, s2, l2, _2, n, m3), _adjust_limit_rows_costs = Module._adjust_limit_rows_costs = (e, t2, r, a, o3) => (_adjust_limit_rows_costs = Module._adjust_limit_rows_costs = wasmExports.adjust_limit_rows_costs)(e, t2, r, a, o3), _add_to_flat_tlist = Module._add_to_flat_tlist = (e, t2) => (_add_to_flat_tlist = Module._add_to_flat_tlist = wasmExports.add_to_flat_tlist)(e, t2), _get_fn_expr_argtype = Module._get_fn_expr_argtype = (e, t2) => (_get_fn_expr_argtype = Module._get_fn_expr_argtype = wasmExports.get_fn_expr_argtype)(e, t2), _on_shmem_exit = Module._on_shmem_exit = (e, t2) => (_on_shmem_exit = Module._on_shmem_exit = wasmExports.on_shmem_exit)(e, t2), _mmap = Module._mmap = (e, t2, r, a, o3, s2) => (_mmap = Module._mmap = wasmExports.mmap)(e, t2, r, a, o3, s2), _munmap = Module._munmap = (e, t2) => (_munmap = Module._munmap = wasmExports.munmap)(e, t2), _SignalHandlerForConfigReload = Module._SignalHandlerForConfigReload = (e) => (_SignalHandlerForConfigReload = Module._SignalHandlerForConfigReload = wasmExports.SignalHandlerForConfigReload)(e), _SignalHandlerForShutdownRequest = Module._SignalHandlerForShutdownRequest = (e) => (_SignalHandlerForShutdownRequest = Module._SignalHandlerForShutdownRequest = wasmExports.SignalHandlerForShutdownRequest)(e), _procsignal_sigusr1_handler = Module._procsignal_sigusr1_handler = (e) => (_procsignal_sigusr1_handler = Module._procsignal_sigusr1_handler = wasmExports.procsignal_sigusr1_handler)(e), _RegisterBackgroundWorker = Module._RegisterBackgroundWorker = (e) => (_RegisterBackgroundWorker = Module._RegisterBackgroundWorker = wasmExports.RegisterBackgroundWorker)(e), _WaitForBackgroundWorkerStartup = Module._WaitForBackgroundWorkerStartup = (e, t2) => (_WaitForBackgroundWorkerStartup = Module._WaitForBackgroundWorkerStartup = wasmExports.WaitForBackgroundWorkerStartup)(e, t2), _GetConfigOption = Module._GetConfigOption = (e, t2, r) => (_GetConfigOption = Module._GetConfigOption = wasmExports.GetConfigOption)(e, t2, r), _fputc = Module._fputc = (e, t2) => (_fputc = Module._fputc = wasmExports.fputc)(e, t2), _toupper = Module._toupper = (e) => (_toupper = Module._toupper = wasmExports.toupper)(e), _pg_reg_getinitialstate = Module._pg_reg_getinitialstate = (e) => (_pg_reg_getinitialstate = Module._pg_reg_getinitialstate = wasmExports.pg_reg_getinitialstate)(e), _pg_reg_getfinalstate = Module._pg_reg_getfinalstate = (e) => (_pg_reg_getfinalstate = Module._pg_reg_getfinalstate = wasmExports.pg_reg_getfinalstate)(e), _pg_reg_getnumoutarcs = Module._pg_reg_getnumoutarcs = (e, t2) => (_pg_reg_getnumoutarcs = Module._pg_reg_getnumoutarcs = wasmExports.pg_reg_getnumoutarcs)(e, t2), _pg_reg_getoutarcs = Module._pg_reg_getoutarcs = (e, t2, r, a) => (_pg_reg_getoutarcs = Module._pg_reg_getoutarcs = wasmExports.pg_reg_getoutarcs)(e, t2, r, a), _pg_reg_getnumcolors = Module._pg_reg_getnumcolors = (e) => (_pg_reg_getnumcolors = Module._pg_reg_getnumcolors = wasmExports.pg_reg_getnumcolors)(e), _pg_reg_colorisbegin = Module._pg_reg_colorisbegin = (e, t2) => (_pg_reg_colorisbegin = Module._pg_reg_colorisbegin = wasmExports.pg_reg_colorisbegin)(e, t2), _pg_reg_colorisend = Module._pg_reg_colorisend = (e, t2) => (_pg_reg_colorisend = Module._pg_reg_colorisend = wasmExports.pg_reg_colorisend)(e, t2), _pg_reg_getnumcharacters = Module._pg_reg_getnumcharacters = (e, t2) => (_pg_reg_getnumcharacters = Module._pg_reg_getnumcharacters = wasmExports.pg_reg_getnumcharacters)(e, t2), _pg_reg_getcharacters = Module._pg_reg_getcharacters = (e, t2, r, a) => (_pg_reg_getcharacters = Module._pg_reg_getcharacters = wasmExports.pg_reg_getcharacters)(e, t2, r, a), _OutputPluginPrepareWrite = Module._OutputPluginPrepareWrite = (e, t2) => (_OutputPluginPrepareWrite = Module._OutputPluginPrepareWrite = wasmExports.OutputPluginPrepareWrite)(e, t2), _OutputPluginWrite = Module._OutputPluginWrite = (e, t2) => (_OutputPluginWrite = Module._OutputPluginWrite = wasmExports.OutputPluginWrite)(e, t2), _OutputPluginUpdateProgress = Module._OutputPluginUpdateProgress = (e, t2) => (_OutputPluginUpdateProgress = Module._OutputPluginUpdateProgress = wasmExports.OutputPluginUpdateProgress)(e, t2), _array_contains_nulls = Module._array_contains_nulls = (e) => (_array_contains_nulls = Module._array_contains_nulls = wasmExports.array_contains_nulls)(e), _replorigin_by_oid = Module._replorigin_by_oid = (e, t2, r) => (_replorigin_by_oid = Module._replorigin_by_oid = wasmExports.replorigin_by_oid)(e, t2, r), _logicalrep_write_begin = Module._logicalrep_write_begin = (e, t2) => (_logicalrep_write_begin = Module._logicalrep_write_begin = wasmExports.logicalrep_write_begin)(e, t2), _logicalrep_write_commit = Module._logicalrep_write_commit = (e, t2, r) => (_logicalrep_write_commit = Module._logicalrep_write_commit = wasmExports.logicalrep_write_commit)(e, t2, r), _logicalrep_write_begin_prepare = Module._logicalrep_write_begin_prepare = (e, t2) => (_logicalrep_write_begin_prepare = Module._logicalrep_write_begin_prepare = wasmExports.logicalrep_write_begin_prepare)(e, t2), _logicalrep_write_prepare = Module._logicalrep_write_prepare = (e, t2, r) => (_logicalrep_write_prepare = Module._logicalrep_write_prepare = wasmExports.logicalrep_write_prepare)(e, t2, r), _logicalrep_write_commit_prepared = Module._logicalrep_write_commit_prepared = (e, t2, r) => (_logicalrep_write_commit_prepared = Module._logicalrep_write_commit_prepared = wasmExports.logicalrep_write_commit_prepared)(e, t2, r), _logicalrep_write_rollback_prepared = Module._logicalrep_write_rollback_prepared = (e, t2, r, a) => (_logicalrep_write_rollback_prepared = Module._logicalrep_write_rollback_prepared = wasmExports.logicalrep_write_rollback_prepared)(e, t2, r, a), _logicalrep_write_stream_prepare = Module._logicalrep_write_stream_prepare = (e, t2, r) => (_logicalrep_write_stream_prepare = Module._logicalrep_write_stream_prepare = wasmExports.logicalrep_write_stream_prepare)(e, t2, r), _logicalrep_write_origin = Module._logicalrep_write_origin = (e, t2, r) => (_logicalrep_write_origin = Module._logicalrep_write_origin = wasmExports.logicalrep_write_origin)(e, t2, r), _logicalrep_write_insert = Module._logicalrep_write_insert = (e, t2, r, a, o3, s2) => (_logicalrep_write_insert = Module._logicalrep_write_insert = wasmExports.logicalrep_write_insert)(e, t2, r, a, o3, s2), _logicalrep_write_update = Module._logicalrep_write_update = (e, t2, r, a, o3, s2, l2) => (_logicalrep_write_update = Module._logicalrep_write_update = wasmExports.logicalrep_write_update)(e, t2, r, a, o3, s2, l2), _logicalrep_write_delete = Module._logicalrep_write_delete = (e, t2, r, a, o3, s2) => (_logicalrep_write_delete = Module._logicalrep_write_delete = wasmExports.logicalrep_write_delete)(e, t2, r, a, o3, s2), _logicalrep_write_truncate = Module._logicalrep_write_truncate = (e, t2, r, a, o3, s2) => (_logicalrep_write_truncate = Module._logicalrep_write_truncate = wasmExports.logicalrep_write_truncate)(e, t2, r, a, o3, s2), _logicalrep_write_message = Module._logicalrep_write_message = (e, t2, r, a, o3, s2, l2) => (_logicalrep_write_message = Module._logicalrep_write_message = wasmExports.logicalrep_write_message)(e, t2, r, a, o3, s2, l2), _logicalrep_write_rel = Module._logicalrep_write_rel = (e, t2, r, a) => (_logicalrep_write_rel = Module._logicalrep_write_rel = wasmExports.logicalrep_write_rel)(e, t2, r, a), _logicalrep_write_typ = Module._logicalrep_write_typ = (e, t2, r) => (_logicalrep_write_typ = Module._logicalrep_write_typ = wasmExports.logicalrep_write_typ)(e, t2, r), _logicalrep_write_stream_start = Module._logicalrep_write_stream_start = (e, t2, r) => (_logicalrep_write_stream_start = Module._logicalrep_write_stream_start = wasmExports.logicalrep_write_stream_start)(e, t2, r), _logicalrep_write_stream_stop = Module._logicalrep_write_stream_stop = (e) => (_logicalrep_write_stream_stop = Module._logicalrep_write_stream_stop = wasmExports.logicalrep_write_stream_stop)(e), _logicalrep_write_stream_commit = Module._logicalrep_write_stream_commit = (e, t2, r) => (_logicalrep_write_stream_commit = Module._logicalrep_write_stream_commit = wasmExports.logicalrep_write_stream_commit)(e, t2, r), _logicalrep_write_stream_abort = Module._logicalrep_write_stream_abort = (e, t2, r, a, o3, s2) => (_logicalrep_write_stream_abort = Module._logicalrep_write_stream_abort = wasmExports.logicalrep_write_stream_abort)(e, t2, r, a, o3, s2), _CacheRegisterRelcacheCallback = Module._CacheRegisterRelcacheCallback = (e, t2) => (_CacheRegisterRelcacheCallback = Module._CacheRegisterRelcacheCallback = wasmExports.CacheRegisterRelcacheCallback)(e, t2), _hash_seq_term = Module._hash_seq_term = (e) => (_hash_seq_term = Module._hash_seq_term = wasmExports.hash_seq_term)(e), _FreeErrorData = Module._FreeErrorData = (e) => (_FreeErrorData = Module._FreeErrorData = wasmExports.FreeErrorData)(e), _RelidByRelfilenumber = Module._RelidByRelfilenumber = (e, t2) => (_RelidByRelfilenumber = Module._RelidByRelfilenumber = wasmExports.RelidByRelfilenumber)(e, t2), _WaitLatchOrSocket = Module._WaitLatchOrSocket = (e, t2, r, a, o3) => (_WaitLatchOrSocket = Module._WaitLatchOrSocket = wasmExports.WaitLatchOrSocket)(e, t2, r, a, o3), _ProcessWalRcvInterrupts = Module._ProcessWalRcvInterrupts = () => (_ProcessWalRcvInterrupts = Module._ProcessWalRcvInterrupts = wasmExports.ProcessWalRcvInterrupts)(), _get_row_security_policies = Module._get_row_security_policies = (e, t2, r, a, o3, s2, l2) => (_get_row_security_policies = Module._get_row_security_policies = wasmExports.get_row_security_policies)(e, t2, r, a, o3, s2, l2), _hash_estimate_size = Module._hash_estimate_size = (e, t2) => (_hash_estimate_size = Module._hash_estimate_size = wasmExports.hash_estimate_size)(e, t2), _ShmemInitHash = Module._ShmemInitHash = (e, t2, r, a, o3) => (_ShmemInitHash = Module._ShmemInitHash = wasmExports.ShmemInitHash)(e, t2, r, a, o3), _LockBufHdr = Module._LockBufHdr = (e) => (_LockBufHdr = Module._LockBufHdr = wasmExports.LockBufHdr)(e), _EvictUnpinnedBuffer = Module._EvictUnpinnedBuffer = (e) => (_EvictUnpinnedBuffer = Module._EvictUnpinnedBuffer = wasmExports.EvictUnpinnedBuffer)(e), _have_free_buffer = Module._have_free_buffer = () => (_have_free_buffer = Module._have_free_buffer = wasmExports.have_free_buffer)(), _copy_file = Module._copy_file = (e, t2) => (_copy_file = Module._copy_file = wasmExports.copy_file)(e, t2), _AcquireExternalFD = Module._AcquireExternalFD = () => (_AcquireExternalFD = Module._AcquireExternalFD = wasmExports.AcquireExternalFD)(), _GetNamedDSMSegment = Module._GetNamedDSMSegment = (e, t2, r, a) => (_GetNamedDSMSegment = Module._GetNamedDSMSegment = wasmExports.GetNamedDSMSegment)(e, t2, r, a), _RequestAddinShmemSpace = Module._RequestAddinShmemSpace = (e) => (_RequestAddinShmemSpace = Module._RequestAddinShmemSpace = wasmExports.RequestAddinShmemSpace)(e), _poll = Module._poll = (e, t2, r) => (_poll = Module._poll = wasmExports.poll)(e, t2, r), _GetRunningTransactionData = Module._GetRunningTransactionData = () => (_GetRunningTransactionData = Module._GetRunningTransactionData = wasmExports.GetRunningTransactionData)(), _BackendXidGetPid = Module._BackendXidGetPid = (e) => (_BackendXidGetPid = Module._BackendXidGetPid = wasmExports.BackendXidGetPid)(e), _LWLockRegisterTranche = Module._LWLockRegisterTranche = (e, t2) => (_LWLockRegisterTranche = Module._LWLockRegisterTranche = wasmExports.LWLockRegisterTranche)(e, t2), _GetNamedLWLockTranche = Module._GetNamedLWLockTranche = (e) => (_GetNamedLWLockTranche = Module._GetNamedLWLockTranche = wasmExports.GetNamedLWLockTranche)(e), _LWLockNewTrancheId = Module._LWLockNewTrancheId = () => (_LWLockNewTrancheId = Module._LWLockNewTrancheId = wasmExports.LWLockNewTrancheId)(), _RequestNamedLWLockTranche = Module._RequestNamedLWLockTranche = (e, t2) => (_RequestNamedLWLockTranche = Module._RequestNamedLWLockTranche = wasmExports.RequestNamedLWLockTranche)(e, t2), _standard_ProcessUtility = Module._standard_ProcessUtility = (e, t2, r, a, o3, s2, l2, _2) => (_standard_ProcessUtility = Module._standard_ProcessUtility = wasmExports.standard_ProcessUtility)(e, t2, r, a, o3, s2, l2, _2), _lookup_ts_dictionary_cache = Module._lookup_ts_dictionary_cache = (e) => (_lookup_ts_dictionary_cache = Module._lookup_ts_dictionary_cache = wasmExports.lookup_ts_dictionary_cache)(e), _get_tsearch_config_filename = Module._get_tsearch_config_filename = (e, t2) => (_get_tsearch_config_filename = Module._get_tsearch_config_filename = wasmExports.get_tsearch_config_filename)(e, t2), _lowerstr = Module._lowerstr = (e) => (_lowerstr = Module._lowerstr = wasmExports.lowerstr)(e), _readstoplist = Module._readstoplist = (e, t2, r) => (_readstoplist = Module._readstoplist = wasmExports.readstoplist)(e, t2, r), _lowerstr_with_len = Module._lowerstr_with_len = (e, t2) => (_lowerstr_with_len = Module._lowerstr_with_len = wasmExports.lowerstr_with_len)(e, t2), _searchstoplist = Module._searchstoplist = (e, t2) => (_searchstoplist = Module._searchstoplist = wasmExports.searchstoplist)(e, t2), _tsearch_readline_begin = Module._tsearch_readline_begin = (e, t2) => (_tsearch_readline_begin = Module._tsearch_readline_begin = wasmExports.tsearch_readline_begin)(e, t2), _tsearch_readline = Module._tsearch_readline = (e) => (_tsearch_readline = Module._tsearch_readline = wasmExports.tsearch_readline)(e), _t_isspace = Module._t_isspace = (e) => (_t_isspace = Module._t_isspace = wasmExports.t_isspace)(e), _tsearch_readline_end = Module._tsearch_readline_end = (e) => (_tsearch_readline_end = Module._tsearch_readline_end = wasmExports.tsearch_readline_end)(e), _stringToQualifiedNameList = Module._stringToQualifiedNameList = (e, t2) => (_stringToQualifiedNameList = Module._stringToQualifiedNameList = wasmExports.stringToQualifiedNameList)(e, t2), _t_isdigit = Module._t_isdigit = (e) => (_t_isdigit = Module._t_isdigit = wasmExports.t_isdigit)(e), _t_isalnum = Module._t_isalnum = (e) => (_t_isalnum = Module._t_isalnum = wasmExports.t_isalnum)(e), _get_restriction_variable = Module._get_restriction_variable = (e, t2, r, a, o3, s2) => (_get_restriction_variable = Module._get_restriction_variable = wasmExports.get_restriction_variable)(e, t2, r, a, o3, s2), _MemoryContextAllocHuge = Module._MemoryContextAllocHuge = (e, t2) => (_MemoryContextAllocHuge = Module._MemoryContextAllocHuge = wasmExports.MemoryContextAllocHuge)(e, t2), _WaitEventExtensionNew = Module._WaitEventExtensionNew = (e) => (_WaitEventExtensionNew = Module._WaitEventExtensionNew = wasmExports.WaitEventExtensionNew)(e), _expand_array = Module._expand_array = (e, t2, r) => (_expand_array = Module._expand_array = wasmExports.expand_array)(e, t2, r), _arraycontsel = Module._arraycontsel = (e) => (_arraycontsel = Module._arraycontsel = wasmExports.arraycontsel)(e), _arraycontjoinsel = Module._arraycontjoinsel = (e) => (_arraycontjoinsel = Module._arraycontjoinsel = wasmExports.arraycontjoinsel)(e), _initArrayResult = Module._initArrayResult = (e, t2, r) => (_initArrayResult = Module._initArrayResult = wasmExports.initArrayResult)(e, t2, r), _array_create_iterator = Module._array_create_iterator = (e, t2, r) => (_array_create_iterator = Module._array_create_iterator = wasmExports.array_create_iterator)(e, t2, r), _array_iterate = Module._array_iterate = (e, t2, r) => (_array_iterate = Module._array_iterate = wasmExports.array_iterate)(e, t2, r), _ArrayGetIntegerTypmods = Module._ArrayGetIntegerTypmods = (e, t2) => (_ArrayGetIntegerTypmods = Module._ArrayGetIntegerTypmods = wasmExports.ArrayGetIntegerTypmods)(e, t2), _boolin = Module._boolin = (e) => (_boolin = Module._boolin = wasmExports.boolin)(e), _cash_cmp = Module._cash_cmp = (e) => (_cash_cmp = Module._cash_cmp = wasmExports.cash_cmp)(e), _int64_to_numeric = Module._int64_to_numeric = (e) => (_int64_to_numeric = Module._int64_to_numeric = wasmExports.int64_to_numeric)(e), _numeric_div = Module._numeric_div = (e) => (_numeric_div = Module._numeric_div = wasmExports.numeric_div)(e), _date_eq = Module._date_eq = (e) => (_date_eq = Module._date_eq = wasmExports.date_eq)(e), _date_lt = Module._date_lt = (e) => (_date_lt = Module._date_lt = wasmExports.date_lt)(e), _date_le = Module._date_le = (e) => (_date_le = Module._date_le = wasmExports.date_le)(e), _date_gt = Module._date_gt = (e) => (_date_gt = Module._date_gt = wasmExports.date_gt)(e), _date_ge = Module._date_ge = (e) => (_date_ge = Module._date_ge = wasmExports.date_ge)(e), _date_cmp = Module._date_cmp = (e) => (_date_cmp = Module._date_cmp = wasmExports.date_cmp)(e), _date_mi = Module._date_mi = (e) => (_date_mi = Module._date_mi = wasmExports.date_mi)(e), _time_eq = Module._time_eq = (e) => (_time_eq = Module._time_eq = wasmExports.time_eq)(e), _time_lt = Module._time_lt = (e) => (_time_lt = Module._time_lt = wasmExports.time_lt)(e), _time_le = Module._time_le = (e) => (_time_le = Module._time_le = wasmExports.time_le)(e), _time_gt = Module._time_gt = (e) => (_time_gt = Module._time_gt = wasmExports.time_gt)(e), _time_ge = Module._time_ge = (e) => (_time_ge = Module._time_ge = wasmExports.time_ge)(e), _time_cmp = Module._time_cmp = (e) => (_time_cmp = Module._time_cmp = wasmExports.time_cmp)(e), _time_mi_time = Module._time_mi_time = (e) => (_time_mi_time = Module._time_mi_time = wasmExports.time_mi_time)(e), _timetz_cmp = Module._timetz_cmp = (e) => (_timetz_cmp = Module._timetz_cmp = wasmExports.timetz_cmp)(e), _TransferExpandedObject = Module._TransferExpandedObject = (e, t2) => (_TransferExpandedObject = Module._TransferExpandedObject = wasmExports.TransferExpandedObject)(e, t2), _numeric_lt = Module._numeric_lt = (e) => (_numeric_lt = Module._numeric_lt = wasmExports.numeric_lt)(e), _numeric_ge = Module._numeric_ge = (e) => (_numeric_ge = Module._numeric_ge = wasmExports.numeric_ge)(e), _err_generic_string = Module._err_generic_string = (e, t2) => (_err_generic_string = Module._err_generic_string = wasmExports.err_generic_string)(e, t2), _domain_check = Module._domain_check = (e, t2, r, a, o3) => (_domain_check = Module._domain_check = wasmExports.domain_check)(e, t2, r, a, o3), _enum_lt = Module._enum_lt = (e) => (_enum_lt = Module._enum_lt = wasmExports.enum_lt)(e), _enum_le = Module._enum_le = (e) => (_enum_le = Module._enum_le = wasmExports.enum_le)(e), _enum_ge = Module._enum_ge = (e) => (_enum_ge = Module._enum_ge = wasmExports.enum_ge)(e), _enum_gt = Module._enum_gt = (e) => (_enum_gt = Module._enum_gt = wasmExports.enum_gt)(e), _enum_cmp = Module._enum_cmp = (e) => (_enum_cmp = Module._enum_cmp = wasmExports.enum_cmp)(e), _make_expanded_record_from_typeid = Module._make_expanded_record_from_typeid = (e, t2, r) => (_make_expanded_record_from_typeid = Module._make_expanded_record_from_typeid = wasmExports.make_expanded_record_from_typeid)(e, t2, r), _MemoryContextRegisterResetCallback = Module._MemoryContextRegisterResetCallback = (e, t2) => (_MemoryContextRegisterResetCallback = Module._MemoryContextRegisterResetCallback = wasmExports.MemoryContextRegisterResetCallback)(e, t2), _make_expanded_record_from_tupdesc = Module._make_expanded_record_from_tupdesc = (e, t2) => (_make_expanded_record_from_tupdesc = Module._make_expanded_record_from_tupdesc = wasmExports.make_expanded_record_from_tupdesc)(e, t2), _make_expanded_record_from_exprecord = Module._make_expanded_record_from_exprecord = (e, t2) => (_make_expanded_record_from_exprecord = Module._make_expanded_record_from_exprecord = wasmExports.make_expanded_record_from_exprecord)(e, t2), _expanded_record_set_tuple = Module._expanded_record_set_tuple = (e, t2, r, a) => (_expanded_record_set_tuple = Module._expanded_record_set_tuple = wasmExports.expanded_record_set_tuple)(e, t2, r, a), _expanded_record_get_tuple = Module._expanded_record_get_tuple = (e) => (_expanded_record_get_tuple = Module._expanded_record_get_tuple = wasmExports.expanded_record_get_tuple)(e), _deconstruct_expanded_record = Module._deconstruct_expanded_record = (e) => (_deconstruct_expanded_record = Module._deconstruct_expanded_record = wasmExports.deconstruct_expanded_record)(e), _expanded_record_lookup_field = Module._expanded_record_lookup_field = (e, t2, r) => (_expanded_record_lookup_field = Module._expanded_record_lookup_field = wasmExports.expanded_record_lookup_field)(e, t2, r), _expanded_record_set_field_internal = Module._expanded_record_set_field_internal = (e, t2, r, a, o3, s2) => (_expanded_record_set_field_internal = Module._expanded_record_set_field_internal = wasmExports.expanded_record_set_field_internal)(e, t2, r, a, o3, s2), _expanded_record_set_fields = Module._expanded_record_set_fields = (e, t2, r, a) => (_expanded_record_set_fields = Module._expanded_record_set_fields = wasmExports.expanded_record_set_fields)(e, t2, r, a), _float4in_internal = Module._float4in_internal = (e, t2, r, a, o3) => (_float4in_internal = Module._float4in_internal = wasmExports.float4in_internal)(e, t2, r, a, o3), _strtof = Module._strtof = (e, t2) => (_strtof = Module._strtof = wasmExports.strtof)(e, t2), _float8in_internal = Module._float8in_internal = (e, t2, r, a, o3) => (_float8in_internal = Module._float8in_internal = wasmExports.float8in_internal)(e, t2, r, a, o3), _float8out_internal = Module._float8out_internal = (e) => (_float8out_internal = Module._float8out_internal = wasmExports.float8out_internal)(e), _btfloat4cmp = Module._btfloat4cmp = (e) => (_btfloat4cmp = Module._btfloat4cmp = wasmExports.btfloat4cmp)(e), _btfloat8cmp = Module._btfloat8cmp = (e) => (_btfloat8cmp = Module._btfloat8cmp = wasmExports.btfloat8cmp)(e), _log10 = Module._log10 = (e) => (_log10 = Module._log10 = wasmExports.log10)(e), _acos = Module._acos = (e) => (_acos = Module._acos = wasmExports.acos)(e), _asin = Module._asin = (e) => (_asin = Module._asin = wasmExports.asin)(e), _cos = Module._cos = (e) => (_cos = Module._cos = wasmExports.cos)(e), _fmod = Module._fmod = (e, t2) => (_fmod = Module._fmod = wasmExports.fmod)(e, t2), _str_tolower = Module._str_tolower = (e, t2, r) => (_str_tolower = Module._str_tolower = wasmExports.str_tolower)(e, t2, r), _pushJsonbValue = Module._pushJsonbValue = (e, t2, r) => (_pushJsonbValue = Module._pushJsonbValue = wasmExports.pushJsonbValue)(e, t2, r), _numeric_float4 = Module._numeric_float4 = (e) => (_numeric_float4 = Module._numeric_float4 = wasmExports.numeric_float4)(e), _numeric_cmp = Module._numeric_cmp = (e) => (_numeric_cmp = Module._numeric_cmp = wasmExports.numeric_cmp)(e), _numeric_eq = Module._numeric_eq = (e) => (_numeric_eq = Module._numeric_eq = wasmExports.numeric_eq)(e), _numeric_is_nan = Module._numeric_is_nan = (e) => (_numeric_is_nan = Module._numeric_is_nan = wasmExports.numeric_is_nan)(e), _timestamp_cmp = Module._timestamp_cmp = (e) => (_timestamp_cmp = Module._timestamp_cmp = wasmExports.timestamp_cmp)(e), _macaddr_cmp = Module._macaddr_cmp = (e) => (_macaddr_cmp = Module._macaddr_cmp = wasmExports.macaddr_cmp)(e), _macaddr_lt = Module._macaddr_lt = (e) => (_macaddr_lt = Module._macaddr_lt = wasmExports.macaddr_lt)(e), _macaddr_le = Module._macaddr_le = (e) => (_macaddr_le = Module._macaddr_le = wasmExports.macaddr_le)(e), _macaddr_eq = Module._macaddr_eq = (e) => (_macaddr_eq = Module._macaddr_eq = wasmExports.macaddr_eq)(e), _macaddr_ge = Module._macaddr_ge = (e) => (_macaddr_ge = Module._macaddr_ge = wasmExports.macaddr_ge)(e), _macaddr_gt = Module._macaddr_gt = (e) => (_macaddr_gt = Module._macaddr_gt = wasmExports.macaddr_gt)(e), _macaddr8_cmp = Module._macaddr8_cmp = (e) => (_macaddr8_cmp = Module._macaddr8_cmp = wasmExports.macaddr8_cmp)(e), _macaddr8_lt = Module._macaddr8_lt = (e) => (_macaddr8_lt = Module._macaddr8_lt = wasmExports.macaddr8_lt)(e), _macaddr8_le = Module._macaddr8_le = (e) => (_macaddr8_le = Module._macaddr8_le = wasmExports.macaddr8_le)(e), _macaddr8_eq = Module._macaddr8_eq = (e) => (_macaddr8_eq = Module._macaddr8_eq = wasmExports.macaddr8_eq)(e), _macaddr8_ge = Module._macaddr8_ge = (e) => (_macaddr8_ge = Module._macaddr8_ge = wasmExports.macaddr8_ge)(e), _macaddr8_gt = Module._macaddr8_gt = (e) => (_macaddr8_gt = Module._macaddr8_gt = wasmExports.macaddr8_gt)(e), _current_query = Module._current_query = (e) => (_current_query = Module._current_query = wasmExports.current_query)(e), _unpack_sql_state = Module._unpack_sql_state = (e) => (_unpack_sql_state = Module._unpack_sql_state = wasmExports.unpack_sql_state)(e), _get_fn_expr_rettype = Module._get_fn_expr_rettype = (e) => (_get_fn_expr_rettype = Module._get_fn_expr_rettype = wasmExports.get_fn_expr_rettype)(e), _btnamecmp = Module._btnamecmp = (e) => (_btnamecmp = Module._btnamecmp = wasmExports.btnamecmp)(e), _inet_in = Module._inet_in = (e) => (_inet_in = Module._inet_in = wasmExports.inet_in)(e), _network_cmp = Module._network_cmp = (e) => (_network_cmp = Module._network_cmp = wasmExports.network_cmp)(e), _convert_network_to_scalar = Module._convert_network_to_scalar = (e, t2, r) => (_convert_network_to_scalar = Module._convert_network_to_scalar = wasmExports.convert_network_to_scalar)(e, t2, r), _numeric_gt = Module._numeric_gt = (e) => (_numeric_gt = Module._numeric_gt = wasmExports.numeric_gt)(e), _numeric_le = Module._numeric_le = (e) => (_numeric_le = Module._numeric_le = wasmExports.numeric_le)(e), _numeric_float8_no_overflow = Module._numeric_float8_no_overflow = (e) => (_numeric_float8_no_overflow = Module._numeric_float8_no_overflow = wasmExports.numeric_float8_no_overflow)(e), _oidout = Module._oidout = (e) => (_oidout = Module._oidout = wasmExports.oidout)(e), _interval_mi = Module._interval_mi = (e) => (_interval_mi = Module._interval_mi = wasmExports.interval_mi)(e), _localtime = Module._localtime = (e) => (_localtime = Module._localtime = wasmExports.localtime)(e), _newlocale = Module._newlocale = (e, t2, r) => (_newlocale = Module._newlocale = wasmExports.newlocale)(e, t2, r), _quote_ident = Module._quote_ident = (e) => (_quote_ident = Module._quote_ident = wasmExports.quote_ident)(e), _pg_wchar2mb_with_len = Module._pg_wchar2mb_with_len = (e, t2, r) => (_pg_wchar2mb_with_len = Module._pg_wchar2mb_with_len = wasmExports.pg_wchar2mb_with_len)(e, t2, r), _pg_get_indexdef_columns_extended = Module._pg_get_indexdef_columns_extended = (e, t2) => (_pg_get_indexdef_columns_extended = Module._pg_get_indexdef_columns_extended = wasmExports.pg_get_indexdef_columns_extended)(e, t2), _pg_get_querydef = Module._pg_get_querydef = (e, t2) => (_pg_get_querydef = Module._pg_get_querydef = wasmExports.pg_get_querydef)(e, t2), _strcspn = Module._strcspn = (e, t2) => (_strcspn = Module._strcspn = wasmExports.strcspn)(e, t2), _generic_restriction_selectivity = Module._generic_restriction_selectivity = (e, t2, r, a, o3, s2) => (_generic_restriction_selectivity = Module._generic_restriction_selectivity = wasmExports.generic_restriction_selectivity)(e, t2, r, a, o3, s2), _genericcostestimate = Module._genericcostestimate = (e, t2, r, a) => (_genericcostestimate = Module._genericcostestimate = wasmExports.genericcostestimate)(e, t2, r, a), _tidin = Module._tidin = (e) => (_tidin = Module._tidin = wasmExports.tidin)(e), _tidout = Module._tidout = (e) => (_tidout = Module._tidout = wasmExports.tidout)(e), _timestamp_in = Module._timestamp_in = (e) => (_timestamp_in = Module._timestamp_in = wasmExports.timestamp_in)(e), _timestamp_eq = Module._timestamp_eq = (e) => (_timestamp_eq = Module._timestamp_eq = wasmExports.timestamp_eq)(e), _timestamp_lt = Module._timestamp_lt = (e) => (_timestamp_lt = Module._timestamp_lt = wasmExports.timestamp_lt)(e), _timestamp_gt = Module._timestamp_gt = (e) => (_timestamp_gt = Module._timestamp_gt = wasmExports.timestamp_gt)(e), _timestamp_le = Module._timestamp_le = (e) => (_timestamp_le = Module._timestamp_le = wasmExports.timestamp_le)(e), _timestamp_ge = Module._timestamp_ge = (e) => (_timestamp_ge = Module._timestamp_ge = wasmExports.timestamp_ge)(e), _interval_eq = Module._interval_eq = (e) => (_interval_eq = Module._interval_eq = wasmExports.interval_eq)(e), _interval_lt = Module._interval_lt = (e) => (_interval_lt = Module._interval_lt = wasmExports.interval_lt)(e), _interval_gt = Module._interval_gt = (e) => (_interval_gt = Module._interval_gt = wasmExports.interval_gt)(e), _interval_le = Module._interval_le = (e) => (_interval_le = Module._interval_le = wasmExports.interval_le)(e), _interval_ge = Module._interval_ge = (e) => (_interval_ge = Module._interval_ge = wasmExports.interval_ge)(e), _interval_cmp = Module._interval_cmp = (e) => (_interval_cmp = Module._interval_cmp = wasmExports.interval_cmp)(e), _timestamp_mi = Module._timestamp_mi = (e) => (_timestamp_mi = Module._timestamp_mi = wasmExports.timestamp_mi)(e), _interval_um = Module._interval_um = (e) => (_interval_um = Module._interval_um = wasmExports.interval_um)(e), _has_fn_opclass_options = Module._has_fn_opclass_options = (e) => (_has_fn_opclass_options = Module._has_fn_opclass_options = wasmExports.has_fn_opclass_options)(e), _uuid_in = Module._uuid_in = (e) => (_uuid_in = Module._uuid_in = wasmExports.uuid_in)(e), _uuid_out = Module._uuid_out = (e) => (_uuid_out = Module._uuid_out = wasmExports.uuid_out)(e), _uuid_cmp = Module._uuid_cmp = (e) => (_uuid_cmp = Module._uuid_cmp = wasmExports.uuid_cmp)(e), _gen_random_uuid = Module._gen_random_uuid = (e) => (_gen_random_uuid = Module._gen_random_uuid = wasmExports.gen_random_uuid)(e), _varbit_in = Module._varbit_in = (e) => (_varbit_in = Module._varbit_in = wasmExports.varbit_in)(e), _biteq = Module._biteq = (e) => (_biteq = Module._biteq = wasmExports.biteq)(e), _bitlt = Module._bitlt = (e) => (_bitlt = Module._bitlt = wasmExports.bitlt)(e), _bitle = Module._bitle = (e) => (_bitle = Module._bitle = wasmExports.bitle)(e), _bitgt = Module._bitgt = (e) => (_bitgt = Module._bitgt = wasmExports.bitgt)(e), _bitge = Module._bitge = (e) => (_bitge = Module._bitge = wasmExports.bitge)(e), _bitcmp = Module._bitcmp = (e) => (_bitcmp = Module._bitcmp = wasmExports.bitcmp)(e), _bpchareq = Module._bpchareq = (e) => (_bpchareq = Module._bpchareq = wasmExports.bpchareq)(e), _bpcharlt = Module._bpcharlt = (e) => (_bpcharlt = Module._bpcharlt = wasmExports.bpcharlt)(e), _bpcharle = Module._bpcharle = (e) => (_bpcharle = Module._bpcharle = wasmExports.bpcharle)(e), _bpchargt = Module._bpchargt = (e) => (_bpchargt = Module._bpchargt = wasmExports.bpchargt)(e), _bpcharge = Module._bpcharge = (e) => (_bpcharge = Module._bpcharge = wasmExports.bpcharge)(e), _bpcharcmp = Module._bpcharcmp = (e) => (_bpcharcmp = Module._bpcharcmp = wasmExports.bpcharcmp)(e), _texteq = Module._texteq = (e) => (_texteq = Module._texteq = wasmExports.texteq)(e), _text_lt = Module._text_lt = (e) => (_text_lt = Module._text_lt = wasmExports.text_lt)(e), _text_le = Module._text_le = (e) => (_text_le = Module._text_le = wasmExports.text_le)(e), _text_gt = Module._text_gt = (e) => (_text_gt = Module._text_gt = wasmExports.text_gt)(e), _text_ge = Module._text_ge = (e) => (_text_ge = Module._text_ge = wasmExports.text_ge)(e), _bttextcmp = Module._bttextcmp = (e) => (_bttextcmp = Module._bttextcmp = wasmExports.bttextcmp)(e), _byteaeq = Module._byteaeq = (e) => (_byteaeq = Module._byteaeq = wasmExports.byteaeq)(e), _bytealt = Module._bytealt = (e) => (_bytealt = Module._bytealt = wasmExports.bytealt)(e), _byteale = Module._byteale = (e) => (_byteale = Module._byteale = wasmExports.byteale)(e), _byteagt = Module._byteagt = (e) => (_byteagt = Module._byteagt = wasmExports.byteagt)(e), _byteage = Module._byteage = (e) => (_byteage = Module._byteage = wasmExports.byteage)(e), _byteacmp = Module._byteacmp = (e) => (_byteacmp = Module._byteacmp = wasmExports.byteacmp)(e), _to_hex32 = Module._to_hex32 = (e) => (_to_hex32 = Module._to_hex32 = wasmExports.to_hex32)(e), _varstr_levenshtein = Module._varstr_levenshtein = (e, t2, r, a, o3, s2, l2, _2) => (_varstr_levenshtein = Module._varstr_levenshtein = wasmExports.varstr_levenshtein)(e, t2, r, a, o3, s2, l2, _2), _pg_xml_init = Module._pg_xml_init = (e) => (_pg_xml_init = Module._pg_xml_init = wasmExports.pg_xml_init)(e), _xmlInitParser = Module._xmlInitParser = () => (_xmlInitParser = Module._xmlInitParser = wasmExports.xmlInitParser)(), _xml_ereport = Module._xml_ereport = (e, t2, r, a) => (_xml_ereport = Module._xml_ereport = wasmExports.xml_ereport)(e, t2, r, a), _pg_xml_done = Module._pg_xml_done = (e, t2) => (_pg_xml_done = Module._pg_xml_done = wasmExports.pg_xml_done)(e, t2), _xmlXPathNewContext = Module._xmlXPathNewContext = (e) => (_xmlXPathNewContext = Module._xmlXPathNewContext = wasmExports.xmlXPathNewContext)(e), _xmlXPathFreeContext = Module._xmlXPathFreeContext = (e) => (_xmlXPathFreeContext = Module._xmlXPathFreeContext = wasmExports.xmlXPathFreeContext)(e), _xmlFreeDoc = Module._xmlFreeDoc = (e) => (_xmlFreeDoc = Module._xmlFreeDoc = wasmExports.xmlFreeDoc)(e), _xmlXPathCtxtCompile = Module._xmlXPathCtxtCompile = (e, t2) => (_xmlXPathCtxtCompile = Module._xmlXPathCtxtCompile = wasmExports.xmlXPathCtxtCompile)(e, t2), _xmlXPathCompiledEval = Module._xmlXPathCompiledEval = (e, t2) => (_xmlXPathCompiledEval = Module._xmlXPathCompiledEval = wasmExports.xmlXPathCompiledEval)(e, t2), _xmlXPathFreeCompExpr = Module._xmlXPathFreeCompExpr = (e) => (_xmlXPathFreeCompExpr = Module._xmlXPathFreeCompExpr = wasmExports.xmlXPathFreeCompExpr)(e), _pg_do_encoding_conversion = Module._pg_do_encoding_conversion = (e, t2, r, a) => (_pg_do_encoding_conversion = Module._pg_do_encoding_conversion = wasmExports.pg_do_encoding_conversion)(e, t2, r, a), _xmlStrdup = Module._xmlStrdup = (e) => (_xmlStrdup = Module._xmlStrdup = wasmExports.xmlStrdup)(e), _xmlXPathCastNodeToString = Module._xmlXPathCastNodeToString = (e) => (_xmlXPathCastNodeToString = Module._xmlXPathCastNodeToString = wasmExports.xmlXPathCastNodeToString)(e), _get_typsubscript = Module._get_typsubscript = (e, t2) => (_get_typsubscript = Module._get_typsubscript = wasmExports.get_typsubscript)(e, t2), _CachedPlanAllowsSimpleValidityCheck = Module._CachedPlanAllowsSimpleValidityCheck = (e, t2, r) => (_CachedPlanAllowsSimpleValidityCheck = Module._CachedPlanAllowsSimpleValidityCheck = wasmExports.CachedPlanAllowsSimpleValidityCheck)(e, t2, r), _CachedPlanIsSimplyValid = Module._CachedPlanIsSimplyValid = (e, t2, r) => (_CachedPlanIsSimplyValid = Module._CachedPlanIsSimplyValid = wasmExports.CachedPlanIsSimplyValid)(e, t2, r), _GetCachedExpression = Module._GetCachedExpression = (e) => (_GetCachedExpression = Module._GetCachedExpression = wasmExports.GetCachedExpression)(e), _FreeCachedExpression = Module._FreeCachedExpression = (e) => (_FreeCachedExpression = Module._FreeCachedExpression = wasmExports.FreeCachedExpression)(e), _ReleaseAllPlanCacheRefsInOwner = Module._ReleaseAllPlanCacheRefsInOwner = (e) => (_ReleaseAllPlanCacheRefsInOwner = Module._ReleaseAllPlanCacheRefsInOwner = wasmExports.ReleaseAllPlanCacheRefsInOwner)(e), _in_error_recursion_trouble = Module._in_error_recursion_trouble = () => (_in_error_recursion_trouble = Module._in_error_recursion_trouble = wasmExports.in_error_recursion_trouble)(), _openlog = Module._openlog = (e, t2, r) => (_openlog = Module._openlog = wasmExports.openlog)(e, t2, r), _syslog = Module._syslog = (e, t2, r) => (_syslog = Module._syslog = wasmExports.syslog)(e, t2, r), _GetErrorContextStack = Module._GetErrorContextStack = () => (_GetErrorContextStack = Module._GetErrorContextStack = wasmExports.GetErrorContextStack)(), _closelog = Module._closelog = () => (_closelog = Module._closelog = wasmExports.closelog)(), _dlsym = Module._dlsym = (e, t2) => (_dlsym = Module._dlsym = wasmExports.dlsym)(e, t2), _dlopen = Module._dlopen = (e, t2) => (_dlopen = Module._dlopen = wasmExports.dlopen)(e, t2), _dlerror = Module._dlerror = () => (_dlerror = Module._dlerror = wasmExports.dlerror)(), _dlclose = Module._dlclose = (e) => (_dlclose = Module._dlclose = wasmExports.dlclose)(e), _find_rendezvous_variable = Module._find_rendezvous_variable = (e) => (_find_rendezvous_variable = Module._find_rendezvous_variable = wasmExports.find_rendezvous_variable)(e), _CallerFInfoFunctionCall2 = Module._CallerFInfoFunctionCall2 = (e, t2, r, a, o3) => (_CallerFInfoFunctionCall2 = Module._CallerFInfoFunctionCall2 = wasmExports.CallerFInfoFunctionCall2)(e, t2, r, a, o3), _FunctionCall0Coll = Module._FunctionCall0Coll = (e, t2) => (_FunctionCall0Coll = Module._FunctionCall0Coll = wasmExports.FunctionCall0Coll)(e, t2), _resolve_polymorphic_argtypes = Module._resolve_polymorphic_argtypes = (e, t2, r, a) => (_resolve_polymorphic_argtypes = Module._resolve_polymorphic_argtypes = wasmExports.resolve_polymorphic_argtypes)(e, t2, r, a), _memcpy = Module._memcpy = (e, t2, r) => (_memcpy = Module._memcpy = wasmExports.memcpy)(e, t2, r), _pg_bindtextdomain = Module._pg_bindtextdomain = (e) => (_pg_bindtextdomain = Module._pg_bindtextdomain = wasmExports.pg_bindtextdomain)(e), _local2local = Module._local2local = (e, t2, r, a, o3, s2, l2) => (_local2local = Module._local2local = wasmExports.local2local)(e, t2, r, a, o3, s2, l2), _report_untranslatable_char = Module._report_untranslatable_char = (e, t2, r, a) => (_report_untranslatable_char = Module._report_untranslatable_char = wasmExports.report_untranslatable_char)(e, t2, r, a), _latin2mic = Module._latin2mic = (e, t2, r, a, o3, s2) => (_latin2mic = Module._latin2mic = wasmExports.latin2mic)(e, t2, r, a, o3, s2), _mic2latin = Module._mic2latin = (e, t2, r, a, o3, s2) => (_mic2latin = Module._mic2latin = wasmExports.mic2latin)(e, t2, r, a, o3, s2), _latin2mic_with_table = Module._latin2mic_with_table = (e, t2, r, a, o3, s2, l2) => (_latin2mic_with_table = Module._latin2mic_with_table = wasmExports.latin2mic_with_table)(e, t2, r, a, o3, s2, l2), _mic2latin_with_table = Module._mic2latin_with_table = (e, t2, r, a, o3, s2, l2) => (_mic2latin_with_table = Module._mic2latin_with_table = wasmExports.mic2latin_with_table)(e, t2, r, a, o3, s2, l2), _UtfToLocal = Module._UtfToLocal = (e, t2, r, a, o3, s2, l2, _2, n) => (_UtfToLocal = Module._UtfToLocal = wasmExports.UtfToLocal)(e, t2, r, a, o3, s2, l2, _2, n), _LocalToUtf = Module._LocalToUtf = (e, t2, r, a, o3, s2, l2, _2, n) => (_LocalToUtf = Module._LocalToUtf = wasmExports.LocalToUtf)(e, t2, r, a, o3, s2, l2, _2, n), _check_encoding_conversion_args = Module._check_encoding_conversion_args = (e, t2, r, a, o3) => (_check_encoding_conversion_args = Module._check_encoding_conversion_args = wasmExports.check_encoding_conversion_args)(e, t2, r, a, o3), _DefineCustomBoolVariable = Module._DefineCustomBoolVariable = (e, t2, r, a, o3, s2, l2, _2, n, m3) => (_DefineCustomBoolVariable = Module._DefineCustomBoolVariable = wasmExports.DefineCustomBoolVariable)(e, t2, r, a, o3, s2, l2, _2, n, m3), _DefineCustomIntVariable = Module._DefineCustomIntVariable = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2) => (_DefineCustomIntVariable = Module._DefineCustomIntVariable = wasmExports.DefineCustomIntVariable)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2), _DefineCustomRealVariable = Module._DefineCustomRealVariable = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2) => (_DefineCustomRealVariable = Module._DefineCustomRealVariable = wasmExports.DefineCustomRealVariable)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2), _DefineCustomStringVariable = Module._DefineCustomStringVariable = (e, t2, r, a, o3, s2, l2, _2, n, m3) => (_DefineCustomStringVariable = Module._DefineCustomStringVariable = wasmExports.DefineCustomStringVariable)(e, t2, r, a, o3, s2, l2, _2, n, m3), _DefineCustomEnumVariable = Module._DefineCustomEnumVariable = (e, t2, r, a, o3, s2, l2, _2, n, m3, p2) => (_DefineCustomEnumVariable = Module._DefineCustomEnumVariable = wasmExports.DefineCustomEnumVariable)(e, t2, r, a, o3, s2, l2, _2, n, m3, p2), _MarkGUCPrefixReserved = Module._MarkGUCPrefixReserved = (e) => (_MarkGUCPrefixReserved = Module._MarkGUCPrefixReserved = wasmExports.MarkGUCPrefixReserved)(e), _sampler_random_init_state = Module._sampler_random_init_state = (e, t2) => (_sampler_random_init_state = Module._sampler_random_init_state = wasmExports.sampler_random_init_state)(e, t2), _pchomp = Module._pchomp = (e) => (_pchomp = Module._pchomp = wasmExports.pchomp)(e), _PinPortal = Module._PinPortal = (e) => (_PinPortal = Module._PinPortal = wasmExports.PinPortal)(e), _UnpinPortal = Module._UnpinPortal = (e) => (_UnpinPortal = Module._UnpinPortal = wasmExports.UnpinPortal)(e), _isolat1ToUTF8 = Module._isolat1ToUTF8 = (e, t2, r, a) => (_isolat1ToUTF8 = Module._isolat1ToUTF8 = wasmExports.isolat1ToUTF8)(e, t2, r, a), _UTF8Toisolat1 = Module._UTF8Toisolat1 = (e, t2, r, a) => (_UTF8Toisolat1 = Module._UTF8Toisolat1 = wasmExports.UTF8Toisolat1)(e, t2, r, a), _vfprintf = Module._vfprintf = (e, t2, r) => (_vfprintf = Module._vfprintf = wasmExports.vfprintf)(e, t2, r), _vsnprintf = Module._vsnprintf = (e, t2, r, a) => (_vsnprintf = Module._vsnprintf = wasmExports.vsnprintf)(e, t2, r, a), _xmlParserValidityWarning = Module._xmlParserValidityWarning = (e, t2, r) => (_xmlParserValidityWarning = Module._xmlParserValidityWarning = wasmExports.xmlParserValidityWarning)(e, t2, r), _xmlParserValidityError = Module._xmlParserValidityError = (e, t2, r) => (_xmlParserValidityError = Module._xmlParserValidityError = wasmExports.xmlParserValidityError)(e, t2, r), _xmlParserError = Module._xmlParserError = (e, t2, r) => (_xmlParserError = Module._xmlParserError = wasmExports.xmlParserError)(e, t2, r), _xmlParserWarning = Module._xmlParserWarning = (e, t2, r) => (_xmlParserWarning = Module._xmlParserWarning = wasmExports.xmlParserWarning)(e, t2, r), _fprintf = Module._fprintf = (e, t2, r) => (_fprintf = Module._fprintf = wasmExports.fprintf)(e, t2, r), ___xmlParserInputBufferCreateFilename = Module.___xmlParserInputBufferCreateFilename = (e, t2) => (___xmlParserInputBufferCreateFilename = Module.___xmlParserInputBufferCreateFilename = wasmExports.__xmlParserInputBufferCreateFilename)(e, t2), ___xmlOutputBufferCreateFilename = Module.___xmlOutputBufferCreateFilename = (e, t2, r) => (___xmlOutputBufferCreateFilename = Module.___xmlOutputBufferCreateFilename = wasmExports.__xmlOutputBufferCreateFilename)(e, t2, r), _xmlSAX2InternalSubset = Module._xmlSAX2InternalSubset = (e, t2, r, a) => (_xmlSAX2InternalSubset = Module._xmlSAX2InternalSubset = wasmExports.xmlSAX2InternalSubset)(e, t2, r, a), _xmlSAX2IsStandalone = Module._xmlSAX2IsStandalone = (e) => (_xmlSAX2IsStandalone = Module._xmlSAX2IsStandalone = wasmExports.xmlSAX2IsStandalone)(e), _xmlSAX2HasInternalSubset = Module._xmlSAX2HasInternalSubset = (e) => (_xmlSAX2HasInternalSubset = Module._xmlSAX2HasInternalSubset = wasmExports.xmlSAX2HasInternalSubset)(e), _xmlSAX2HasExternalSubset = Module._xmlSAX2HasExternalSubset = (e) => (_xmlSAX2HasExternalSubset = Module._xmlSAX2HasExternalSubset = wasmExports.xmlSAX2HasExternalSubset)(e), _xmlSAX2ResolveEntity = Module._xmlSAX2ResolveEntity = (e, t2, r) => (_xmlSAX2ResolveEntity = Module._xmlSAX2ResolveEntity = wasmExports.xmlSAX2ResolveEntity)(e, t2, r), _xmlSAX2GetEntity = Module._xmlSAX2GetEntity = (e, t2) => (_xmlSAX2GetEntity = Module._xmlSAX2GetEntity = wasmExports.xmlSAX2GetEntity)(e, t2), _xmlSAX2EntityDecl = Module._xmlSAX2EntityDecl = (e, t2, r, a, o3, s2) => (_xmlSAX2EntityDecl = Module._xmlSAX2EntityDecl = wasmExports.xmlSAX2EntityDecl)(e, t2, r, a, o3, s2), _xmlSAX2NotationDecl = Module._xmlSAX2NotationDecl = (e, t2, r, a) => (_xmlSAX2NotationDecl = Module._xmlSAX2NotationDecl = wasmExports.xmlSAX2NotationDecl)(e, t2, r, a), _xmlSAX2AttributeDecl = Module._xmlSAX2AttributeDecl = (e, t2, r, a, o3, s2, l2) => (_xmlSAX2AttributeDecl = Module._xmlSAX2AttributeDecl = wasmExports.xmlSAX2AttributeDecl)(e, t2, r, a, o3, s2, l2), _xmlSAX2ElementDecl = Module._xmlSAX2ElementDecl = (e, t2, r, a) => (_xmlSAX2ElementDecl = Module._xmlSAX2ElementDecl = wasmExports.xmlSAX2ElementDecl)(e, t2, r, a), _xmlSAX2UnparsedEntityDecl = Module._xmlSAX2UnparsedEntityDecl = (e, t2, r, a, o3) => (_xmlSAX2UnparsedEntityDecl = Module._xmlSAX2UnparsedEntityDecl = wasmExports.xmlSAX2UnparsedEntityDecl)(e, t2, r, a, o3), _xmlSAX2SetDocumentLocator = Module._xmlSAX2SetDocumentLocator = (e, t2) => (_xmlSAX2SetDocumentLocator = Module._xmlSAX2SetDocumentLocator = wasmExports.xmlSAX2SetDocumentLocator)(e, t2), _xmlSAX2StartDocument = Module._xmlSAX2StartDocument = (e) => (_xmlSAX2StartDocument = Module._xmlSAX2StartDocument = wasmExports.xmlSAX2StartDocument)(e), _xmlSAX2EndDocument = Module._xmlSAX2EndDocument = (e) => (_xmlSAX2EndDocument = Module._xmlSAX2EndDocument = wasmExports.xmlSAX2EndDocument)(e), _xmlSAX2StartElement = Module._xmlSAX2StartElement = (e, t2, r) => (_xmlSAX2StartElement = Module._xmlSAX2StartElement = wasmExports.xmlSAX2StartElement)(e, t2, r), _xmlSAX2EndElement = Module._xmlSAX2EndElement = (e, t2) => (_xmlSAX2EndElement = Module._xmlSAX2EndElement = wasmExports.xmlSAX2EndElement)(e, t2), _xmlSAX2Reference = Module._xmlSAX2Reference = (e, t2) => (_xmlSAX2Reference = Module._xmlSAX2Reference = wasmExports.xmlSAX2Reference)(e, t2), _xmlSAX2Characters = Module._xmlSAX2Characters = (e, t2, r) => (_xmlSAX2Characters = Module._xmlSAX2Characters = wasmExports.xmlSAX2Characters)(e, t2, r), _xmlSAX2ProcessingInstruction = Module._xmlSAX2ProcessingInstruction = (e, t2, r) => (_xmlSAX2ProcessingInstruction = Module._xmlSAX2ProcessingInstruction = wasmExports.xmlSAX2ProcessingInstruction)(e, t2, r), _xmlSAX2Comment = Module._xmlSAX2Comment = (e, t2) => (_xmlSAX2Comment = Module._xmlSAX2Comment = wasmExports.xmlSAX2Comment)(e, t2), _xmlSAX2GetParameterEntity = Module._xmlSAX2GetParameterEntity = (e, t2) => (_xmlSAX2GetParameterEntity = Module._xmlSAX2GetParameterEntity = wasmExports.xmlSAX2GetParameterEntity)(e, t2), _xmlSAX2CDataBlock = Module._xmlSAX2CDataBlock = (e, t2, r) => (_xmlSAX2CDataBlock = Module._xmlSAX2CDataBlock = wasmExports.xmlSAX2CDataBlock)(e, t2, r), _xmlSAX2ExternalSubset = Module._xmlSAX2ExternalSubset = (e, t2, r, a) => (_xmlSAX2ExternalSubset = Module._xmlSAX2ExternalSubset = wasmExports.xmlSAX2ExternalSubset)(e, t2, r, a), _xmlSAX2GetPublicId = Module._xmlSAX2GetPublicId = (e) => (_xmlSAX2GetPublicId = Module._xmlSAX2GetPublicId = wasmExports.xmlSAX2GetPublicId)(e), _xmlSAX2GetSystemId = Module._xmlSAX2GetSystemId = (e) => (_xmlSAX2GetSystemId = Module._xmlSAX2GetSystemId = wasmExports.xmlSAX2GetSystemId)(e), _xmlSAX2GetLineNumber = Module._xmlSAX2GetLineNumber = (e) => (_xmlSAX2GetLineNumber = Module._xmlSAX2GetLineNumber = wasmExports.xmlSAX2GetLineNumber)(e), _xmlSAX2GetColumnNumber = Module._xmlSAX2GetColumnNumber = (e) => (_xmlSAX2GetColumnNumber = Module._xmlSAX2GetColumnNumber = wasmExports.xmlSAX2GetColumnNumber)(e), _xmlSAX2IgnorableWhitespace = Module._xmlSAX2IgnorableWhitespace = (e, t2, r) => (_xmlSAX2IgnorableWhitespace = Module._xmlSAX2IgnorableWhitespace = wasmExports.xmlSAX2IgnorableWhitespace)(e, t2, r), _xmlHashDefaultDeallocator = Module._xmlHashDefaultDeallocator = (e, t2) => (_xmlHashDefaultDeallocator = Module._xmlHashDefaultDeallocator = wasmExports.xmlHashDefaultDeallocator)(e, t2), _iconv_open = Module._iconv_open = (e, t2) => (_iconv_open = Module._iconv_open = wasmExports.iconv_open)(e, t2), _iconv_close = Module._iconv_close = (e) => (_iconv_close = Module._iconv_close = wasmExports.iconv_close)(e), _iconv = Module._iconv = (e, t2, r, a, o3) => (_iconv = Module._iconv = wasmExports.iconv)(e, t2, r, a, o3), _UTF8ToHtml = Module._UTF8ToHtml = (e, t2, r, a) => (_UTF8ToHtml = Module._UTF8ToHtml = wasmExports.UTF8ToHtml)(e, t2, r, a), _xmlReadMemory = Module._xmlReadMemory = (e, t2, r, a, o3) => (_xmlReadMemory = Module._xmlReadMemory = wasmExports.xmlReadMemory)(e, t2, r, a, o3), _xmlSAX2StartElementNs = Module._xmlSAX2StartElementNs = (e, t2, r, a, o3, s2, l2, _2, n) => (_xmlSAX2StartElementNs = Module._xmlSAX2StartElementNs = wasmExports.xmlSAX2StartElementNs)(e, t2, r, a, o3, s2, l2, _2, n), _xmlSAX2EndElementNs = Module._xmlSAX2EndElementNs = (e, t2, r, a) => (_xmlSAX2EndElementNs = Module._xmlSAX2EndElementNs = wasmExports.xmlSAX2EndElementNs)(e, t2, r, a), ___cxa_atexit = Module.___cxa_atexit = (e, t2, r) => (___cxa_atexit = Module.___cxa_atexit = wasmExports.__cxa_atexit)(e, t2, r), _xmlDocGetRootElement = Module._xmlDocGetRootElement = (e) => (_xmlDocGetRootElement = Module._xmlDocGetRootElement = wasmExports.xmlDocGetRootElement)(e), _xmlFileMatch = Module._xmlFileMatch = (e) => (_xmlFileMatch = Module._xmlFileMatch = wasmExports.xmlFileMatch)(e), _xmlFileOpen = Module._xmlFileOpen = (e) => (_xmlFileOpen = Module._xmlFileOpen = wasmExports.xmlFileOpen)(e), _xmlFileRead = Module._xmlFileRead = (e, t2, r) => (_xmlFileRead = Module._xmlFileRead = wasmExports.xmlFileRead)(e, t2, r), _xmlFileClose = Module._xmlFileClose = (e) => (_xmlFileClose = Module._xmlFileClose = wasmExports.xmlFileClose)(e), _gzread = Module._gzread = (e, t2, r) => (_gzread = Module._gzread = wasmExports.gzread)(e, t2, r), _gzclose = Module._gzclose = (e) => (_gzclose = Module._gzclose = wasmExports.gzclose)(e), _gzdirect = Module._gzdirect = (e) => (_gzdirect = Module._gzdirect = wasmExports.gzdirect)(e), _gzdopen = Module._gzdopen = (e, t2) => (_gzdopen = Module._gzdopen = wasmExports.gzdopen)(e, t2), _gzopen = Module._gzopen = (e, t2) => (_gzopen = Module._gzopen = wasmExports.gzopen)(e, t2), _gzwrite = Module._gzwrite = (e, t2, r) => (_gzwrite = Module._gzwrite = wasmExports.gzwrite)(e, t2, r), _xmlUCSIsCatNd = Module._xmlUCSIsCatNd = (e) => (_xmlUCSIsCatNd = Module._xmlUCSIsCatNd = wasmExports.xmlUCSIsCatNd)(e), _xmlUCSIsCatP = Module._xmlUCSIsCatP = (e) => (_xmlUCSIsCatP = Module._xmlUCSIsCatP = wasmExports.xmlUCSIsCatP)(e), _xmlUCSIsCatZ = Module._xmlUCSIsCatZ = (e) => (_xmlUCSIsCatZ = Module._xmlUCSIsCatZ = wasmExports.xmlUCSIsCatZ)(e), _xmlUCSIsCatC = Module._xmlUCSIsCatC = (e) => (_xmlUCSIsCatC = Module._xmlUCSIsCatC = wasmExports.xmlUCSIsCatC)(e), _xmlUCSIsCatL = Module._xmlUCSIsCatL = (e) => (_xmlUCSIsCatL = Module._xmlUCSIsCatL = wasmExports.xmlUCSIsCatL)(e), _xmlUCSIsCatLu = Module._xmlUCSIsCatLu = (e) => (_xmlUCSIsCatLu = Module._xmlUCSIsCatLu = wasmExports.xmlUCSIsCatLu)(e), _xmlUCSIsCatLl = Module._xmlUCSIsCatLl = (e) => (_xmlUCSIsCatLl = Module._xmlUCSIsCatLl = wasmExports.xmlUCSIsCatLl)(e), _xmlUCSIsCatLt = Module._xmlUCSIsCatLt = (e) => (_xmlUCSIsCatLt = Module._xmlUCSIsCatLt = wasmExports.xmlUCSIsCatLt)(e), _xmlUCSIsCatLm = Module._xmlUCSIsCatLm = (e) => (_xmlUCSIsCatLm = Module._xmlUCSIsCatLm = wasmExports.xmlUCSIsCatLm)(e), _xmlUCSIsCatLo = Module._xmlUCSIsCatLo = (e) => (_xmlUCSIsCatLo = Module._xmlUCSIsCatLo = wasmExports.xmlUCSIsCatLo)(e), _xmlUCSIsCatM = Module._xmlUCSIsCatM = (e) => (_xmlUCSIsCatM = Module._xmlUCSIsCatM = wasmExports.xmlUCSIsCatM)(e), _xmlUCSIsCatMn = Module._xmlUCSIsCatMn = (e) => (_xmlUCSIsCatMn = Module._xmlUCSIsCatMn = wasmExports.xmlUCSIsCatMn)(e), _xmlUCSIsCatMc = Module._xmlUCSIsCatMc = (e) => (_xmlUCSIsCatMc = Module._xmlUCSIsCatMc = wasmExports.xmlUCSIsCatMc)(e), _xmlUCSIsCatMe = Module._xmlUCSIsCatMe = (e) => (_xmlUCSIsCatMe = Module._xmlUCSIsCatMe = wasmExports.xmlUCSIsCatMe)(e), _xmlUCSIsCatN = Module._xmlUCSIsCatN = (e) => (_xmlUCSIsCatN = Module._xmlUCSIsCatN = wasmExports.xmlUCSIsCatN)(e), _xmlUCSIsCatNl = Module._xmlUCSIsCatNl = (e) => (_xmlUCSIsCatNl = Module._xmlUCSIsCatNl = wasmExports.xmlUCSIsCatNl)(e), _xmlUCSIsCatNo = Module._xmlUCSIsCatNo = (e) => (_xmlUCSIsCatNo = Module._xmlUCSIsCatNo = wasmExports.xmlUCSIsCatNo)(e), _xmlUCSIsCatPc = Module._xmlUCSIsCatPc = (e) => (_xmlUCSIsCatPc = Module._xmlUCSIsCatPc = wasmExports.xmlUCSIsCatPc)(e), _xmlUCSIsCatPd = Module._xmlUCSIsCatPd = (e) => (_xmlUCSIsCatPd = Module._xmlUCSIsCatPd = wasmExports.xmlUCSIsCatPd)(e), _xmlUCSIsCatPs = Module._xmlUCSIsCatPs = (e) => (_xmlUCSIsCatPs = Module._xmlUCSIsCatPs = wasmExports.xmlUCSIsCatPs)(e), _xmlUCSIsCatPe = Module._xmlUCSIsCatPe = (e) => (_xmlUCSIsCatPe = Module._xmlUCSIsCatPe = wasmExports.xmlUCSIsCatPe)(e), _xmlUCSIsCatPi = Module._xmlUCSIsCatPi = (e) => (_xmlUCSIsCatPi = Module._xmlUCSIsCatPi = wasmExports.xmlUCSIsCatPi)(e), _xmlUCSIsCatPf = Module._xmlUCSIsCatPf = (e) => (_xmlUCSIsCatPf = Module._xmlUCSIsCatPf = wasmExports.xmlUCSIsCatPf)(e), _xmlUCSIsCatPo = Module._xmlUCSIsCatPo = (e) => (_xmlUCSIsCatPo = Module._xmlUCSIsCatPo = wasmExports.xmlUCSIsCatPo)(e), _xmlUCSIsCatZs = Module._xmlUCSIsCatZs = (e) => (_xmlUCSIsCatZs = Module._xmlUCSIsCatZs = wasmExports.xmlUCSIsCatZs)(e), _xmlUCSIsCatZl = Module._xmlUCSIsCatZl = (e) => (_xmlUCSIsCatZl = Module._xmlUCSIsCatZl = wasmExports.xmlUCSIsCatZl)(e), _xmlUCSIsCatZp = Module._xmlUCSIsCatZp = (e) => (_xmlUCSIsCatZp = Module._xmlUCSIsCatZp = wasmExports.xmlUCSIsCatZp)(e), _xmlUCSIsCatS = Module._xmlUCSIsCatS = (e) => (_xmlUCSIsCatS = Module._xmlUCSIsCatS = wasmExports.xmlUCSIsCatS)(e), _xmlUCSIsCatSm = Module._xmlUCSIsCatSm = (e) => (_xmlUCSIsCatSm = Module._xmlUCSIsCatSm = wasmExports.xmlUCSIsCatSm)(e), _xmlUCSIsCatSc = Module._xmlUCSIsCatSc = (e) => (_xmlUCSIsCatSc = Module._xmlUCSIsCatSc = wasmExports.xmlUCSIsCatSc)(e), _xmlUCSIsCatSk = Module._xmlUCSIsCatSk = (e) => (_xmlUCSIsCatSk = Module._xmlUCSIsCatSk = wasmExports.xmlUCSIsCatSk)(e), _xmlUCSIsCatSo = Module._xmlUCSIsCatSo = (e) => (_xmlUCSIsCatSo = Module._xmlUCSIsCatSo = wasmExports.xmlUCSIsCatSo)(e), _xmlUCSIsCatCc = Module._xmlUCSIsCatCc = (e) => (_xmlUCSIsCatCc = Module._xmlUCSIsCatCc = wasmExports.xmlUCSIsCatCc)(e), _xmlUCSIsCatCf = Module._xmlUCSIsCatCf = (e) => (_xmlUCSIsCatCf = Module._xmlUCSIsCatCf = wasmExports.xmlUCSIsCatCf)(e), _xmlUCSIsCatCo = Module._xmlUCSIsCatCo = (e) => (_xmlUCSIsCatCo = Module._xmlUCSIsCatCo = wasmExports.xmlUCSIsCatCo)(e), _xmlUCSIsAegeanNumbers = Module._xmlUCSIsAegeanNumbers = (e) => (_xmlUCSIsAegeanNumbers = Module._xmlUCSIsAegeanNumbers = wasmExports.xmlUCSIsAegeanNumbers)(e), _xmlUCSIsAlphabeticPresentationForms = Module._xmlUCSIsAlphabeticPresentationForms = (e) => (_xmlUCSIsAlphabeticPresentationForms = Module._xmlUCSIsAlphabeticPresentationForms = wasmExports.xmlUCSIsAlphabeticPresentationForms)(e), _xmlUCSIsArabic = Module._xmlUCSIsArabic = (e) => (_xmlUCSIsArabic = Module._xmlUCSIsArabic = wasmExports.xmlUCSIsArabic)(e), _xmlUCSIsArabicPresentationFormsA = Module._xmlUCSIsArabicPresentationFormsA = (e) => (_xmlUCSIsArabicPresentationFormsA = Module._xmlUCSIsArabicPresentationFormsA = wasmExports.xmlUCSIsArabicPresentationFormsA)(e), _xmlUCSIsArabicPresentationFormsB = Module._xmlUCSIsArabicPresentationFormsB = (e) => (_xmlUCSIsArabicPresentationFormsB = Module._xmlUCSIsArabicPresentationFormsB = wasmExports.xmlUCSIsArabicPresentationFormsB)(e), _xmlUCSIsArmenian = Module._xmlUCSIsArmenian = (e) => (_xmlUCSIsArmenian = Module._xmlUCSIsArmenian = wasmExports.xmlUCSIsArmenian)(e), _xmlUCSIsArrows = Module._xmlUCSIsArrows = (e) => (_xmlUCSIsArrows = Module._xmlUCSIsArrows = wasmExports.xmlUCSIsArrows)(e), _xmlUCSIsBasicLatin = Module._xmlUCSIsBasicLatin = (e) => (_xmlUCSIsBasicLatin = Module._xmlUCSIsBasicLatin = wasmExports.xmlUCSIsBasicLatin)(e), _xmlUCSIsBengali = Module._xmlUCSIsBengali = (e) => (_xmlUCSIsBengali = Module._xmlUCSIsBengali = wasmExports.xmlUCSIsBengali)(e), _xmlUCSIsBlockElements = Module._xmlUCSIsBlockElements = (e) => (_xmlUCSIsBlockElements = Module._xmlUCSIsBlockElements = wasmExports.xmlUCSIsBlockElements)(e), _xmlUCSIsBopomofo = Module._xmlUCSIsBopomofo = (e) => (_xmlUCSIsBopomofo = Module._xmlUCSIsBopomofo = wasmExports.xmlUCSIsBopomofo)(e), _xmlUCSIsBopomofoExtended = Module._xmlUCSIsBopomofoExtended = (e) => (_xmlUCSIsBopomofoExtended = Module._xmlUCSIsBopomofoExtended = wasmExports.xmlUCSIsBopomofoExtended)(e), _xmlUCSIsBoxDrawing = Module._xmlUCSIsBoxDrawing = (e) => (_xmlUCSIsBoxDrawing = Module._xmlUCSIsBoxDrawing = wasmExports.xmlUCSIsBoxDrawing)(e), _xmlUCSIsBraillePatterns = Module._xmlUCSIsBraillePatterns = (e) => (_xmlUCSIsBraillePatterns = Module._xmlUCSIsBraillePatterns = wasmExports.xmlUCSIsBraillePatterns)(e), _xmlUCSIsBuhid = Module._xmlUCSIsBuhid = (e) => (_xmlUCSIsBuhid = Module._xmlUCSIsBuhid = wasmExports.xmlUCSIsBuhid)(e), _xmlUCSIsByzantineMusicalSymbols = Module._xmlUCSIsByzantineMusicalSymbols = (e) => (_xmlUCSIsByzantineMusicalSymbols = Module._xmlUCSIsByzantineMusicalSymbols = wasmExports.xmlUCSIsByzantineMusicalSymbols)(e), _xmlUCSIsCJKCompatibility = Module._xmlUCSIsCJKCompatibility = (e) => (_xmlUCSIsCJKCompatibility = Module._xmlUCSIsCJKCompatibility = wasmExports.xmlUCSIsCJKCompatibility)(e), _xmlUCSIsCJKCompatibilityForms = Module._xmlUCSIsCJKCompatibilityForms = (e) => (_xmlUCSIsCJKCompatibilityForms = Module._xmlUCSIsCJKCompatibilityForms = wasmExports.xmlUCSIsCJKCompatibilityForms)(e), _xmlUCSIsCJKCompatibilityIdeographs = Module._xmlUCSIsCJKCompatibilityIdeographs = (e) => (_xmlUCSIsCJKCompatibilityIdeographs = Module._xmlUCSIsCJKCompatibilityIdeographs = wasmExports.xmlUCSIsCJKCompatibilityIdeographs)(e), _xmlUCSIsCJKCompatibilityIdeographsSupplement = Module._xmlUCSIsCJKCompatibilityIdeographsSupplement = (e) => (_xmlUCSIsCJKCompatibilityIdeographsSupplement = Module._xmlUCSIsCJKCompatibilityIdeographsSupplement = wasmExports.xmlUCSIsCJKCompatibilityIdeographsSupplement)(e), _xmlUCSIsCJKRadicalsSupplement = Module._xmlUCSIsCJKRadicalsSupplement = (e) => (_xmlUCSIsCJKRadicalsSupplement = Module._xmlUCSIsCJKRadicalsSupplement = wasmExports.xmlUCSIsCJKRadicalsSupplement)(e), _xmlUCSIsCJKSymbolsandPunctuation = Module._xmlUCSIsCJKSymbolsandPunctuation = (e) => (_xmlUCSIsCJKSymbolsandPunctuation = Module._xmlUCSIsCJKSymbolsandPunctuation = wasmExports.xmlUCSIsCJKSymbolsandPunctuation)(e), _xmlUCSIsCJKUnifiedIdeographs = Module._xmlUCSIsCJKUnifiedIdeographs = (e) => (_xmlUCSIsCJKUnifiedIdeographs = Module._xmlUCSIsCJKUnifiedIdeographs = wasmExports.xmlUCSIsCJKUnifiedIdeographs)(e), _xmlUCSIsCJKUnifiedIdeographsExtensionA = Module._xmlUCSIsCJKUnifiedIdeographsExtensionA = (e) => (_xmlUCSIsCJKUnifiedIdeographsExtensionA = Module._xmlUCSIsCJKUnifiedIdeographsExtensionA = wasmExports.xmlUCSIsCJKUnifiedIdeographsExtensionA)(e), _xmlUCSIsCJKUnifiedIdeographsExtensionB = Module._xmlUCSIsCJKUnifiedIdeographsExtensionB = (e) => (_xmlUCSIsCJKUnifiedIdeographsExtensionB = Module._xmlUCSIsCJKUnifiedIdeographsExtensionB = wasmExports.xmlUCSIsCJKUnifiedIdeographsExtensionB)(e), _xmlUCSIsCherokee = Module._xmlUCSIsCherokee = (e) => (_xmlUCSIsCherokee = Module._xmlUCSIsCherokee = wasmExports.xmlUCSIsCherokee)(e), _xmlUCSIsCombiningDiacriticalMarks = Module._xmlUCSIsCombiningDiacriticalMarks = (e) => (_xmlUCSIsCombiningDiacriticalMarks = Module._xmlUCSIsCombiningDiacriticalMarks = wasmExports.xmlUCSIsCombiningDiacriticalMarks)(e), _xmlUCSIsCombiningDiacriticalMarksforSymbols = Module._xmlUCSIsCombiningDiacriticalMarksforSymbols = (e) => (_xmlUCSIsCombiningDiacriticalMarksforSymbols = Module._xmlUCSIsCombiningDiacriticalMarksforSymbols = wasmExports.xmlUCSIsCombiningDiacriticalMarksforSymbols)(e), _xmlUCSIsCombiningHalfMarks = Module._xmlUCSIsCombiningHalfMarks = (e) => (_xmlUCSIsCombiningHalfMarks = Module._xmlUCSIsCombiningHalfMarks = wasmExports.xmlUCSIsCombiningHalfMarks)(e), _xmlUCSIsCombiningMarksforSymbols = Module._xmlUCSIsCombiningMarksforSymbols = (e) => (_xmlUCSIsCombiningMarksforSymbols = Module._xmlUCSIsCombiningMarksforSymbols = wasmExports.xmlUCSIsCombiningMarksforSymbols)(e), _xmlUCSIsControlPictures = Module._xmlUCSIsControlPictures = (e) => (_xmlUCSIsControlPictures = Module._xmlUCSIsControlPictures = wasmExports.xmlUCSIsControlPictures)(e), _xmlUCSIsCurrencySymbols = Module._xmlUCSIsCurrencySymbols = (e) => (_xmlUCSIsCurrencySymbols = Module._xmlUCSIsCurrencySymbols = wasmExports.xmlUCSIsCurrencySymbols)(e), _xmlUCSIsCypriotSyllabary = Module._xmlUCSIsCypriotSyllabary = (e) => (_xmlUCSIsCypriotSyllabary = Module._xmlUCSIsCypriotSyllabary = wasmExports.xmlUCSIsCypriotSyllabary)(e), _xmlUCSIsCyrillic = Module._xmlUCSIsCyrillic = (e) => (_xmlUCSIsCyrillic = Module._xmlUCSIsCyrillic = wasmExports.xmlUCSIsCyrillic)(e), _xmlUCSIsCyrillicSupplement = Module._xmlUCSIsCyrillicSupplement = (e) => (_xmlUCSIsCyrillicSupplement = Module._xmlUCSIsCyrillicSupplement = wasmExports.xmlUCSIsCyrillicSupplement)(e), _xmlUCSIsDeseret = Module._xmlUCSIsDeseret = (e) => (_xmlUCSIsDeseret = Module._xmlUCSIsDeseret = wasmExports.xmlUCSIsDeseret)(e), _xmlUCSIsDevanagari = Module._xmlUCSIsDevanagari = (e) => (_xmlUCSIsDevanagari = Module._xmlUCSIsDevanagari = wasmExports.xmlUCSIsDevanagari)(e), _xmlUCSIsDingbats = Module._xmlUCSIsDingbats = (e) => (_xmlUCSIsDingbats = Module._xmlUCSIsDingbats = wasmExports.xmlUCSIsDingbats)(e), _xmlUCSIsEnclosedAlphanumerics = Module._xmlUCSIsEnclosedAlphanumerics = (e) => (_xmlUCSIsEnclosedAlphanumerics = Module._xmlUCSIsEnclosedAlphanumerics = wasmExports.xmlUCSIsEnclosedAlphanumerics)(e), _xmlUCSIsEnclosedCJKLettersandMonths = Module._xmlUCSIsEnclosedCJKLettersandMonths = (e) => (_xmlUCSIsEnclosedCJKLettersandMonths = Module._xmlUCSIsEnclosedCJKLettersandMonths = wasmExports.xmlUCSIsEnclosedCJKLettersandMonths)(e), _xmlUCSIsEthiopic = Module._xmlUCSIsEthiopic = (e) => (_xmlUCSIsEthiopic = Module._xmlUCSIsEthiopic = wasmExports.xmlUCSIsEthiopic)(e), _xmlUCSIsGeneralPunctuation = Module._xmlUCSIsGeneralPunctuation = (e) => (_xmlUCSIsGeneralPunctuation = Module._xmlUCSIsGeneralPunctuation = wasmExports.xmlUCSIsGeneralPunctuation)(e), _xmlUCSIsGeometricShapes = Module._xmlUCSIsGeometricShapes = (e) => (_xmlUCSIsGeometricShapes = Module._xmlUCSIsGeometricShapes = wasmExports.xmlUCSIsGeometricShapes)(e), _xmlUCSIsGeorgian = Module._xmlUCSIsGeorgian = (e) => (_xmlUCSIsGeorgian = Module._xmlUCSIsGeorgian = wasmExports.xmlUCSIsGeorgian)(e), _xmlUCSIsGothic = Module._xmlUCSIsGothic = (e) => (_xmlUCSIsGothic = Module._xmlUCSIsGothic = wasmExports.xmlUCSIsGothic)(e), _xmlUCSIsGreek = Module._xmlUCSIsGreek = (e) => (_xmlUCSIsGreek = Module._xmlUCSIsGreek = wasmExports.xmlUCSIsGreek)(e), _xmlUCSIsGreekExtended = Module._xmlUCSIsGreekExtended = (e) => (_xmlUCSIsGreekExtended = Module._xmlUCSIsGreekExtended = wasmExports.xmlUCSIsGreekExtended)(e), _xmlUCSIsGreekandCoptic = Module._xmlUCSIsGreekandCoptic = (e) => (_xmlUCSIsGreekandCoptic = Module._xmlUCSIsGreekandCoptic = wasmExports.xmlUCSIsGreekandCoptic)(e), _xmlUCSIsGujarati = Module._xmlUCSIsGujarati = (e) => (_xmlUCSIsGujarati = Module._xmlUCSIsGujarati = wasmExports.xmlUCSIsGujarati)(e), _xmlUCSIsGurmukhi = Module._xmlUCSIsGurmukhi = (e) => (_xmlUCSIsGurmukhi = Module._xmlUCSIsGurmukhi = wasmExports.xmlUCSIsGurmukhi)(e), _xmlUCSIsHalfwidthandFullwidthForms = Module._xmlUCSIsHalfwidthandFullwidthForms = (e) => (_xmlUCSIsHalfwidthandFullwidthForms = Module._xmlUCSIsHalfwidthandFullwidthForms = wasmExports.xmlUCSIsHalfwidthandFullwidthForms)(e), _xmlUCSIsHangulCompatibilityJamo = Module._xmlUCSIsHangulCompatibilityJamo = (e) => (_xmlUCSIsHangulCompatibilityJamo = Module._xmlUCSIsHangulCompatibilityJamo = wasmExports.xmlUCSIsHangulCompatibilityJamo)(e), _xmlUCSIsHangulJamo = Module._xmlUCSIsHangulJamo = (e) => (_xmlUCSIsHangulJamo = Module._xmlUCSIsHangulJamo = wasmExports.xmlUCSIsHangulJamo)(e), _xmlUCSIsHangulSyllables = Module._xmlUCSIsHangulSyllables = (e) => (_xmlUCSIsHangulSyllables = Module._xmlUCSIsHangulSyllables = wasmExports.xmlUCSIsHangulSyllables)(e), _xmlUCSIsHanunoo = Module._xmlUCSIsHanunoo = (e) => (_xmlUCSIsHanunoo = Module._xmlUCSIsHanunoo = wasmExports.xmlUCSIsHanunoo)(e), _xmlUCSIsHebrew = Module._xmlUCSIsHebrew = (e) => (_xmlUCSIsHebrew = Module._xmlUCSIsHebrew = wasmExports.xmlUCSIsHebrew)(e), _xmlUCSIsHighPrivateUseSurrogates = Module._xmlUCSIsHighPrivateUseSurrogates = (e) => (_xmlUCSIsHighPrivateUseSurrogates = Module._xmlUCSIsHighPrivateUseSurrogates = wasmExports.xmlUCSIsHighPrivateUseSurrogates)(e), _xmlUCSIsHighSurrogates = Module._xmlUCSIsHighSurrogates = (e) => (_xmlUCSIsHighSurrogates = Module._xmlUCSIsHighSurrogates = wasmExports.xmlUCSIsHighSurrogates)(e), _xmlUCSIsHiragana = Module._xmlUCSIsHiragana = (e) => (_xmlUCSIsHiragana = Module._xmlUCSIsHiragana = wasmExports.xmlUCSIsHiragana)(e), _xmlUCSIsIPAExtensions = Module._xmlUCSIsIPAExtensions = (e) => (_xmlUCSIsIPAExtensions = Module._xmlUCSIsIPAExtensions = wasmExports.xmlUCSIsIPAExtensions)(e), _xmlUCSIsIdeographicDescriptionCharacters = Module._xmlUCSIsIdeographicDescriptionCharacters = (e) => (_xmlUCSIsIdeographicDescriptionCharacters = Module._xmlUCSIsIdeographicDescriptionCharacters = wasmExports.xmlUCSIsIdeographicDescriptionCharacters)(e), _xmlUCSIsKanbun = Module._xmlUCSIsKanbun = (e) => (_xmlUCSIsKanbun = Module._xmlUCSIsKanbun = wasmExports.xmlUCSIsKanbun)(e), _xmlUCSIsKangxiRadicals = Module._xmlUCSIsKangxiRadicals = (e) => (_xmlUCSIsKangxiRadicals = Module._xmlUCSIsKangxiRadicals = wasmExports.xmlUCSIsKangxiRadicals)(e), _xmlUCSIsKannada = Module._xmlUCSIsKannada = (e) => (_xmlUCSIsKannada = Module._xmlUCSIsKannada = wasmExports.xmlUCSIsKannada)(e), _xmlUCSIsKatakana = Module._xmlUCSIsKatakana = (e) => (_xmlUCSIsKatakana = Module._xmlUCSIsKatakana = wasmExports.xmlUCSIsKatakana)(e), _xmlUCSIsKatakanaPhoneticExtensions = Module._xmlUCSIsKatakanaPhoneticExtensions = (e) => (_xmlUCSIsKatakanaPhoneticExtensions = Module._xmlUCSIsKatakanaPhoneticExtensions = wasmExports.xmlUCSIsKatakanaPhoneticExtensions)(e), _xmlUCSIsKhmer = Module._xmlUCSIsKhmer = (e) => (_xmlUCSIsKhmer = Module._xmlUCSIsKhmer = wasmExports.xmlUCSIsKhmer)(e), _xmlUCSIsKhmerSymbols = Module._xmlUCSIsKhmerSymbols = (e) => (_xmlUCSIsKhmerSymbols = Module._xmlUCSIsKhmerSymbols = wasmExports.xmlUCSIsKhmerSymbols)(e), _xmlUCSIsLao = Module._xmlUCSIsLao = (e) => (_xmlUCSIsLao = Module._xmlUCSIsLao = wasmExports.xmlUCSIsLao)(e), _xmlUCSIsLatin1Supplement = Module._xmlUCSIsLatin1Supplement = (e) => (_xmlUCSIsLatin1Supplement = Module._xmlUCSIsLatin1Supplement = wasmExports.xmlUCSIsLatin1Supplement)(e), _xmlUCSIsLatinExtendedA = Module._xmlUCSIsLatinExtendedA = (e) => (_xmlUCSIsLatinExtendedA = Module._xmlUCSIsLatinExtendedA = wasmExports.xmlUCSIsLatinExtendedA)(e), _xmlUCSIsLatinExtendedB = Module._xmlUCSIsLatinExtendedB = (e) => (_xmlUCSIsLatinExtendedB = Module._xmlUCSIsLatinExtendedB = wasmExports.xmlUCSIsLatinExtendedB)(e), _xmlUCSIsLatinExtendedAdditional = Module._xmlUCSIsLatinExtendedAdditional = (e) => (_xmlUCSIsLatinExtendedAdditional = Module._xmlUCSIsLatinExtendedAdditional = wasmExports.xmlUCSIsLatinExtendedAdditional)(e), _xmlUCSIsLetterlikeSymbols = Module._xmlUCSIsLetterlikeSymbols = (e) => (_xmlUCSIsLetterlikeSymbols = Module._xmlUCSIsLetterlikeSymbols = wasmExports.xmlUCSIsLetterlikeSymbols)(e), _xmlUCSIsLimbu = Module._xmlUCSIsLimbu = (e) => (_xmlUCSIsLimbu = Module._xmlUCSIsLimbu = wasmExports.xmlUCSIsLimbu)(e), _xmlUCSIsLinearBIdeograms = Module._xmlUCSIsLinearBIdeograms = (e) => (_xmlUCSIsLinearBIdeograms = Module._xmlUCSIsLinearBIdeograms = wasmExports.xmlUCSIsLinearBIdeograms)(e), _xmlUCSIsLinearBSyllabary = Module._xmlUCSIsLinearBSyllabary = (e) => (_xmlUCSIsLinearBSyllabary = Module._xmlUCSIsLinearBSyllabary = wasmExports.xmlUCSIsLinearBSyllabary)(e), _xmlUCSIsLowSurrogates = Module._xmlUCSIsLowSurrogates = (e) => (_xmlUCSIsLowSurrogates = Module._xmlUCSIsLowSurrogates = wasmExports.xmlUCSIsLowSurrogates)(e), _xmlUCSIsMalayalam = Module._xmlUCSIsMalayalam = (e) => (_xmlUCSIsMalayalam = Module._xmlUCSIsMalayalam = wasmExports.xmlUCSIsMalayalam)(e), _xmlUCSIsMathematicalAlphanumericSymbols = Module._xmlUCSIsMathematicalAlphanumericSymbols = (e) => (_xmlUCSIsMathematicalAlphanumericSymbols = Module._xmlUCSIsMathematicalAlphanumericSymbols = wasmExports.xmlUCSIsMathematicalAlphanumericSymbols)(e), _xmlUCSIsMathematicalOperators = Module._xmlUCSIsMathematicalOperators = (e) => (_xmlUCSIsMathematicalOperators = Module._xmlUCSIsMathematicalOperators = wasmExports.xmlUCSIsMathematicalOperators)(e), _xmlUCSIsMiscellaneousMathematicalSymbolsA = Module._xmlUCSIsMiscellaneousMathematicalSymbolsA = (e) => (_xmlUCSIsMiscellaneousMathematicalSymbolsA = Module._xmlUCSIsMiscellaneousMathematicalSymbolsA = wasmExports.xmlUCSIsMiscellaneousMathematicalSymbolsA)(e), _xmlUCSIsMiscellaneousMathematicalSymbolsB = Module._xmlUCSIsMiscellaneousMathematicalSymbolsB = (e) => (_xmlUCSIsMiscellaneousMathematicalSymbolsB = Module._xmlUCSIsMiscellaneousMathematicalSymbolsB = wasmExports.xmlUCSIsMiscellaneousMathematicalSymbolsB)(e), _xmlUCSIsMiscellaneousSymbols = Module._xmlUCSIsMiscellaneousSymbols = (e) => (_xmlUCSIsMiscellaneousSymbols = Module._xmlUCSIsMiscellaneousSymbols = wasmExports.xmlUCSIsMiscellaneousSymbols)(e), _xmlUCSIsMiscellaneousSymbolsandArrows = Module._xmlUCSIsMiscellaneousSymbolsandArrows = (e) => (_xmlUCSIsMiscellaneousSymbolsandArrows = Module._xmlUCSIsMiscellaneousSymbolsandArrows = wasmExports.xmlUCSIsMiscellaneousSymbolsandArrows)(e), _xmlUCSIsMiscellaneousTechnical = Module._xmlUCSIsMiscellaneousTechnical = (e) => (_xmlUCSIsMiscellaneousTechnical = Module._xmlUCSIsMiscellaneousTechnical = wasmExports.xmlUCSIsMiscellaneousTechnical)(e), _xmlUCSIsMongolian = Module._xmlUCSIsMongolian = (e) => (_xmlUCSIsMongolian = Module._xmlUCSIsMongolian = wasmExports.xmlUCSIsMongolian)(e), _xmlUCSIsMusicalSymbols = Module._xmlUCSIsMusicalSymbols = (e) => (_xmlUCSIsMusicalSymbols = Module._xmlUCSIsMusicalSymbols = wasmExports.xmlUCSIsMusicalSymbols)(e), _xmlUCSIsMyanmar = Module._xmlUCSIsMyanmar = (e) => (_xmlUCSIsMyanmar = Module._xmlUCSIsMyanmar = wasmExports.xmlUCSIsMyanmar)(e), _xmlUCSIsNumberForms = Module._xmlUCSIsNumberForms = (e) => (_xmlUCSIsNumberForms = Module._xmlUCSIsNumberForms = wasmExports.xmlUCSIsNumberForms)(e), _xmlUCSIsOgham = Module._xmlUCSIsOgham = (e) => (_xmlUCSIsOgham = Module._xmlUCSIsOgham = wasmExports.xmlUCSIsOgham)(e), _xmlUCSIsOldItalic = Module._xmlUCSIsOldItalic = (e) => (_xmlUCSIsOldItalic = Module._xmlUCSIsOldItalic = wasmExports.xmlUCSIsOldItalic)(e), _xmlUCSIsOpticalCharacterRecognition = Module._xmlUCSIsOpticalCharacterRecognition = (e) => (_xmlUCSIsOpticalCharacterRecognition = Module._xmlUCSIsOpticalCharacterRecognition = wasmExports.xmlUCSIsOpticalCharacterRecognition)(e), _xmlUCSIsOriya = Module._xmlUCSIsOriya = (e) => (_xmlUCSIsOriya = Module._xmlUCSIsOriya = wasmExports.xmlUCSIsOriya)(e), _xmlUCSIsOsmanya = Module._xmlUCSIsOsmanya = (e) => (_xmlUCSIsOsmanya = Module._xmlUCSIsOsmanya = wasmExports.xmlUCSIsOsmanya)(e), _xmlUCSIsPhoneticExtensions = Module._xmlUCSIsPhoneticExtensions = (e) => (_xmlUCSIsPhoneticExtensions = Module._xmlUCSIsPhoneticExtensions = wasmExports.xmlUCSIsPhoneticExtensions)(e), _xmlUCSIsPrivateUse = Module._xmlUCSIsPrivateUse = (e) => (_xmlUCSIsPrivateUse = Module._xmlUCSIsPrivateUse = wasmExports.xmlUCSIsPrivateUse)(e), _xmlUCSIsPrivateUseArea = Module._xmlUCSIsPrivateUseArea = (e) => (_xmlUCSIsPrivateUseArea = Module._xmlUCSIsPrivateUseArea = wasmExports.xmlUCSIsPrivateUseArea)(e), _xmlUCSIsRunic = Module._xmlUCSIsRunic = (e) => (_xmlUCSIsRunic = Module._xmlUCSIsRunic = wasmExports.xmlUCSIsRunic)(e), _xmlUCSIsShavian = Module._xmlUCSIsShavian = (e) => (_xmlUCSIsShavian = Module._xmlUCSIsShavian = wasmExports.xmlUCSIsShavian)(e), _xmlUCSIsSinhala = Module._xmlUCSIsSinhala = (e) => (_xmlUCSIsSinhala = Module._xmlUCSIsSinhala = wasmExports.xmlUCSIsSinhala)(e), _xmlUCSIsSmallFormVariants = Module._xmlUCSIsSmallFormVariants = (e) => (_xmlUCSIsSmallFormVariants = Module._xmlUCSIsSmallFormVariants = wasmExports.xmlUCSIsSmallFormVariants)(e), _xmlUCSIsSpacingModifierLetters = Module._xmlUCSIsSpacingModifierLetters = (e) => (_xmlUCSIsSpacingModifierLetters = Module._xmlUCSIsSpacingModifierLetters = wasmExports.xmlUCSIsSpacingModifierLetters)(e), _xmlUCSIsSpecials = Module._xmlUCSIsSpecials = (e) => (_xmlUCSIsSpecials = Module._xmlUCSIsSpecials = wasmExports.xmlUCSIsSpecials)(e), _xmlUCSIsSuperscriptsandSubscripts = Module._xmlUCSIsSuperscriptsandSubscripts = (e) => (_xmlUCSIsSuperscriptsandSubscripts = Module._xmlUCSIsSuperscriptsandSubscripts = wasmExports.xmlUCSIsSuperscriptsandSubscripts)(e), _xmlUCSIsSupplementalArrowsA = Module._xmlUCSIsSupplementalArrowsA = (e) => (_xmlUCSIsSupplementalArrowsA = Module._xmlUCSIsSupplementalArrowsA = wasmExports.xmlUCSIsSupplementalArrowsA)(e), _xmlUCSIsSupplementalArrowsB = Module._xmlUCSIsSupplementalArrowsB = (e) => (_xmlUCSIsSupplementalArrowsB = Module._xmlUCSIsSupplementalArrowsB = wasmExports.xmlUCSIsSupplementalArrowsB)(e), _xmlUCSIsSupplementalMathematicalOperators = Module._xmlUCSIsSupplementalMathematicalOperators = (e) => (_xmlUCSIsSupplementalMathematicalOperators = Module._xmlUCSIsSupplementalMathematicalOperators = wasmExports.xmlUCSIsSupplementalMathematicalOperators)(e), _xmlUCSIsSupplementaryPrivateUseAreaA = Module._xmlUCSIsSupplementaryPrivateUseAreaA = (e) => (_xmlUCSIsSupplementaryPrivateUseAreaA = Module._xmlUCSIsSupplementaryPrivateUseAreaA = wasmExports.xmlUCSIsSupplementaryPrivateUseAreaA)(e), _xmlUCSIsSupplementaryPrivateUseAreaB = Module._xmlUCSIsSupplementaryPrivateUseAreaB = (e) => (_xmlUCSIsSupplementaryPrivateUseAreaB = Module._xmlUCSIsSupplementaryPrivateUseAreaB = wasmExports.xmlUCSIsSupplementaryPrivateUseAreaB)(e), _xmlUCSIsSyriac = Module._xmlUCSIsSyriac = (e) => (_xmlUCSIsSyriac = Module._xmlUCSIsSyriac = wasmExports.xmlUCSIsSyriac)(e), _xmlUCSIsTagalog = Module._xmlUCSIsTagalog = (e) => (_xmlUCSIsTagalog = Module._xmlUCSIsTagalog = wasmExports.xmlUCSIsTagalog)(e), _xmlUCSIsTagbanwa = Module._xmlUCSIsTagbanwa = (e) => (_xmlUCSIsTagbanwa = Module._xmlUCSIsTagbanwa = wasmExports.xmlUCSIsTagbanwa)(e), _xmlUCSIsTags = Module._xmlUCSIsTags = (e) => (_xmlUCSIsTags = Module._xmlUCSIsTags = wasmExports.xmlUCSIsTags)(e), _xmlUCSIsTaiLe = Module._xmlUCSIsTaiLe = (e) => (_xmlUCSIsTaiLe = Module._xmlUCSIsTaiLe = wasmExports.xmlUCSIsTaiLe)(e), _xmlUCSIsTaiXuanJingSymbols = Module._xmlUCSIsTaiXuanJingSymbols = (e) => (_xmlUCSIsTaiXuanJingSymbols = Module._xmlUCSIsTaiXuanJingSymbols = wasmExports.xmlUCSIsTaiXuanJingSymbols)(e), _xmlUCSIsTamil = Module._xmlUCSIsTamil = (e) => (_xmlUCSIsTamil = Module._xmlUCSIsTamil = wasmExports.xmlUCSIsTamil)(e), _xmlUCSIsTelugu = Module._xmlUCSIsTelugu = (e) => (_xmlUCSIsTelugu = Module._xmlUCSIsTelugu = wasmExports.xmlUCSIsTelugu)(e), _xmlUCSIsThaana = Module._xmlUCSIsThaana = (e) => (_xmlUCSIsThaana = Module._xmlUCSIsThaana = wasmExports.xmlUCSIsThaana)(e), _xmlUCSIsThai = Module._xmlUCSIsThai = (e) => (_xmlUCSIsThai = Module._xmlUCSIsThai = wasmExports.xmlUCSIsThai)(e), _xmlUCSIsTibetan = Module._xmlUCSIsTibetan = (e) => (_xmlUCSIsTibetan = Module._xmlUCSIsTibetan = wasmExports.xmlUCSIsTibetan)(e), _xmlUCSIsUgaritic = Module._xmlUCSIsUgaritic = (e) => (_xmlUCSIsUgaritic = Module._xmlUCSIsUgaritic = wasmExports.xmlUCSIsUgaritic)(e), _xmlUCSIsUnifiedCanadianAboriginalSyllabics = Module._xmlUCSIsUnifiedCanadianAboriginalSyllabics = (e) => (_xmlUCSIsUnifiedCanadianAboriginalSyllabics = Module._xmlUCSIsUnifiedCanadianAboriginalSyllabics = wasmExports.xmlUCSIsUnifiedCanadianAboriginalSyllabics)(e), _xmlUCSIsVariationSelectors = Module._xmlUCSIsVariationSelectors = (e) => (_xmlUCSIsVariationSelectors = Module._xmlUCSIsVariationSelectors = wasmExports.xmlUCSIsVariationSelectors)(e), _xmlUCSIsVariationSelectorsSupplement = Module._xmlUCSIsVariationSelectorsSupplement = (e) => (_xmlUCSIsVariationSelectorsSupplement = Module._xmlUCSIsVariationSelectorsSupplement = wasmExports.xmlUCSIsVariationSelectorsSupplement)(e), _xmlUCSIsYiRadicals = Module._xmlUCSIsYiRadicals = (e) => (_xmlUCSIsYiRadicals = Module._xmlUCSIsYiRadicals = wasmExports.xmlUCSIsYiRadicals)(e), _xmlUCSIsYiSyllables = Module._xmlUCSIsYiSyllables = (e) => (_xmlUCSIsYiSyllables = Module._xmlUCSIsYiSyllables = wasmExports.xmlUCSIsYiSyllables)(e), _xmlUCSIsYijingHexagramSymbols = Module._xmlUCSIsYijingHexagramSymbols = (e) => (_xmlUCSIsYijingHexagramSymbols = Module._xmlUCSIsYijingHexagramSymbols = wasmExports.xmlUCSIsYijingHexagramSymbols)(e), _xmlUCSIsCatCs = Module._xmlUCSIsCatCs = (e) => (_xmlUCSIsCatCs = Module._xmlUCSIsCatCs = wasmExports.xmlUCSIsCatCs)(e), ___small_fprintf = Module.___small_fprintf = (e, t2, r) => (___small_fprintf = Module.___small_fprintf = wasmExports.__small_fprintf)(e, t2, r), _xmlXPathBooleanFunction = Module._xmlXPathBooleanFunction = (e, t2) => (_xmlXPathBooleanFunction = Module._xmlXPathBooleanFunction = wasmExports.xmlXPathBooleanFunction)(e, t2), _xmlXPathCeilingFunction = Module._xmlXPathCeilingFunction = (e, t2) => (_xmlXPathCeilingFunction = Module._xmlXPathCeilingFunction = wasmExports.xmlXPathCeilingFunction)(e, t2), _xmlXPathCountFunction = Module._xmlXPathCountFunction = (e, t2) => (_xmlXPathCountFunction = Module._xmlXPathCountFunction = wasmExports.xmlXPathCountFunction)(e, t2), _xmlXPathConcatFunction = Module._xmlXPathConcatFunction = (e, t2) => (_xmlXPathConcatFunction = Module._xmlXPathConcatFunction = wasmExports.xmlXPathConcatFunction)(e, t2), _xmlXPathContainsFunction = Module._xmlXPathContainsFunction = (e, t2) => (_xmlXPathContainsFunction = Module._xmlXPathContainsFunction = wasmExports.xmlXPathContainsFunction)(e, t2), _xmlXPathIdFunction = Module._xmlXPathIdFunction = (e, t2) => (_xmlXPathIdFunction = Module._xmlXPathIdFunction = wasmExports.xmlXPathIdFunction)(e, t2), _xmlXPathFalseFunction = Module._xmlXPathFalseFunction = (e, t2) => (_xmlXPathFalseFunction = Module._xmlXPathFalseFunction = wasmExports.xmlXPathFalseFunction)(e, t2), _xmlXPathFloorFunction = Module._xmlXPathFloorFunction = (e, t2) => (_xmlXPathFloorFunction = Module._xmlXPathFloorFunction = wasmExports.xmlXPathFloorFunction)(e, t2), _xmlXPathLastFunction = Module._xmlXPathLastFunction = (e, t2) => (_xmlXPathLastFunction = Module._xmlXPathLastFunction = wasmExports.xmlXPathLastFunction)(e, t2), _xmlXPathLangFunction = Module._xmlXPathLangFunction = (e, t2) => (_xmlXPathLangFunction = Module._xmlXPathLangFunction = wasmExports.xmlXPathLangFunction)(e, t2), _xmlXPathLocalNameFunction = Module._xmlXPathLocalNameFunction = (e, t2) => (_xmlXPathLocalNameFunction = Module._xmlXPathLocalNameFunction = wasmExports.xmlXPathLocalNameFunction)(e, t2), _xmlXPathNotFunction = Module._xmlXPathNotFunction = (e, t2) => (_xmlXPathNotFunction = Module._xmlXPathNotFunction = wasmExports.xmlXPathNotFunction)(e, t2), _xmlXPathNamespaceURIFunction = Module._xmlXPathNamespaceURIFunction = (e, t2) => (_xmlXPathNamespaceURIFunction = Module._xmlXPathNamespaceURIFunction = wasmExports.xmlXPathNamespaceURIFunction)(e, t2), _xmlXPathNormalizeFunction = Module._xmlXPathNormalizeFunction = (e, t2) => (_xmlXPathNormalizeFunction = Module._xmlXPathNormalizeFunction = wasmExports.xmlXPathNormalizeFunction)(e, t2), _xmlXPathNumberFunction = Module._xmlXPathNumberFunction = (e, t2) => (_xmlXPathNumberFunction = Module._xmlXPathNumberFunction = wasmExports.xmlXPathNumberFunction)(e, t2), _xmlXPathPositionFunction = Module._xmlXPathPositionFunction = (e, t2) => (_xmlXPathPositionFunction = Module._xmlXPathPositionFunction = wasmExports.xmlXPathPositionFunction)(e, t2), _xmlXPathRoundFunction = Module._xmlXPathRoundFunction = (e, t2) => (_xmlXPathRoundFunction = Module._xmlXPathRoundFunction = wasmExports.xmlXPathRoundFunction)(e, t2), _xmlXPathStringFunction = Module._xmlXPathStringFunction = (e, t2) => (_xmlXPathStringFunction = Module._xmlXPathStringFunction = wasmExports.xmlXPathStringFunction)(e, t2), _xmlXPathStringLengthFunction = Module._xmlXPathStringLengthFunction = (e, t2) => (_xmlXPathStringLengthFunction = Module._xmlXPathStringLengthFunction = wasmExports.xmlXPathStringLengthFunction)(e, t2), _xmlXPathStartsWithFunction = Module._xmlXPathStartsWithFunction = (e, t2) => (_xmlXPathStartsWithFunction = Module._xmlXPathStartsWithFunction = wasmExports.xmlXPathStartsWithFunction)(e, t2), _xmlXPathSubstringFunction = Module._xmlXPathSubstringFunction = (e, t2) => (_xmlXPathSubstringFunction = Module._xmlXPathSubstringFunction = wasmExports.xmlXPathSubstringFunction)(e, t2), _xmlXPathSubstringBeforeFunction = Module._xmlXPathSubstringBeforeFunction = (e, t2) => (_xmlXPathSubstringBeforeFunction = Module._xmlXPathSubstringBeforeFunction = wasmExports.xmlXPathSubstringBeforeFunction)(e, t2), _xmlXPathSubstringAfterFunction = Module._xmlXPathSubstringAfterFunction = (e, t2) => (_xmlXPathSubstringAfterFunction = Module._xmlXPathSubstringAfterFunction = wasmExports.xmlXPathSubstringAfterFunction)(e, t2), _xmlXPathSumFunction = Module._xmlXPathSumFunction = (e, t2) => (_xmlXPathSumFunction = Module._xmlXPathSumFunction = wasmExports.xmlXPathSumFunction)(e, t2), _xmlXPathTrueFunction = Module._xmlXPathTrueFunction = (e, t2) => (_xmlXPathTrueFunction = Module._xmlXPathTrueFunction = wasmExports.xmlXPathTrueFunction)(e, t2), _xmlXPathTranslateFunction = Module._xmlXPathTranslateFunction = (e, t2) => (_xmlXPathTranslateFunction = Module._xmlXPathTranslateFunction = wasmExports.xmlXPathTranslateFunction)(e, t2), _xmlXPathNextSelf = Module._xmlXPathNextSelf = (e, t2) => (_xmlXPathNextSelf = Module._xmlXPathNextSelf = wasmExports.xmlXPathNextSelf)(e, t2), _xmlXPathNextChild = Module._xmlXPathNextChild = (e, t2) => (_xmlXPathNextChild = Module._xmlXPathNextChild = wasmExports.xmlXPathNextChild)(e, t2), _xmlXPathNextDescendant = Module._xmlXPathNextDescendant = (e, t2) => (_xmlXPathNextDescendant = Module._xmlXPathNextDescendant = wasmExports.xmlXPathNextDescendant)(e, t2), _xmlXPathNextDescendantOrSelf = Module._xmlXPathNextDescendantOrSelf = (e, t2) => (_xmlXPathNextDescendantOrSelf = Module._xmlXPathNextDescendantOrSelf = wasmExports.xmlXPathNextDescendantOrSelf)(e, t2), _xmlXPathNextParent = Module._xmlXPathNextParent = (e, t2) => (_xmlXPathNextParent = Module._xmlXPathNextParent = wasmExports.xmlXPathNextParent)(e, t2), _xmlXPathNextAncestor = Module._xmlXPathNextAncestor = (e, t2) => (_xmlXPathNextAncestor = Module._xmlXPathNextAncestor = wasmExports.xmlXPathNextAncestor)(e, t2), _xmlXPathNextAncestorOrSelf = Module._xmlXPathNextAncestorOrSelf = (e, t2) => (_xmlXPathNextAncestorOrSelf = Module._xmlXPathNextAncestorOrSelf = wasmExports.xmlXPathNextAncestorOrSelf)(e, t2), _xmlXPathNextFollowingSibling = Module._xmlXPathNextFollowingSibling = (e, t2) => (_xmlXPathNextFollowingSibling = Module._xmlXPathNextFollowingSibling = wasmExports.xmlXPathNextFollowingSibling)(e, t2), _xmlXPathNextPrecedingSibling = Module._xmlXPathNextPrecedingSibling = (e, t2) => (_xmlXPathNextPrecedingSibling = Module._xmlXPathNextPrecedingSibling = wasmExports.xmlXPathNextPrecedingSibling)(e, t2), _xmlXPathNextFollowing = Module._xmlXPathNextFollowing = (e, t2) => (_xmlXPathNextFollowing = Module._xmlXPathNextFollowing = wasmExports.xmlXPathNextFollowing)(e, t2), _xmlXPathNextNamespace = Module._xmlXPathNextNamespace = (e, t2) => (_xmlXPathNextNamespace = Module._xmlXPathNextNamespace = wasmExports.xmlXPathNextNamespace)(e, t2), _xmlXPathNextAttribute = Module._xmlXPathNextAttribute = (e, t2) => (_xmlXPathNextAttribute = Module._xmlXPathNextAttribute = wasmExports.xmlXPathNextAttribute)(e, t2), _zcalloc = Module._zcalloc = (e, t2, r) => (_zcalloc = Module._zcalloc = wasmExports.zcalloc)(e, t2, r), _zcfree = Module._zcfree = (e, t2) => (_zcfree = Module._zcfree = wasmExports.zcfree)(e, t2), _memset = Module._memset = (e, t2, r) => (_memset = Module._memset = wasmExports.memset)(e, t2, r), _strerror = Module._strerror = (e) => (_strerror = Module._strerror = wasmExports.strerror)(e), _memmove = Module._memmove = (e, t2, r) => (_memmove = Module._memmove = wasmExports.memmove)(e, t2, r), _sysconf = Module._sysconf = (e) => (_sysconf = Module._sysconf = wasmExports.sysconf)(e), ___multf3 = Module.___multf3 = (e, t2, r, a, o3) => (___multf3 = Module.___multf3 = wasmExports.__multf3)(e, t2, r, a, o3), ___subtf3 = Module.___subtf3 = (e, t2, r, a, o3) => (___subtf3 = Module.___subtf3 = wasmExports.__subtf3)(e, t2, r, a, o3), ___lttf2 = Module.___lttf2 = (e, t2, r, a) => (___lttf2 = Module.___lttf2 = wasmExports.__lttf2)(e, t2, r, a), ___fixtfsi = Module.___fixtfsi = (e, t2) => (___fixtfsi = Module.___fixtfsi = wasmExports.__fixtfsi)(e, t2), ___floatsitf = Module.___floatsitf = (e, t2) => (___floatsitf = Module.___floatsitf = wasmExports.__floatsitf)(e, t2), ___extenddftf2 = Module.___extenddftf2 = (e, t2) => (___extenddftf2 = Module.___extenddftf2 = wasmExports.__extenddftf2)(e, t2), ___getf2 = Module.___getf2 = (e, t2, r, a) => (___getf2 = Module.___getf2 = wasmExports.__getf2)(e, t2, r, a), _pthread_mutex_lock = Module._pthread_mutex_lock = (e) => (_pthread_mutex_lock = Module._pthread_mutex_lock = wasmExports.pthread_mutex_lock)(e), _pthread_mutex_unlock = Module._pthread_mutex_unlock = (e) => (_pthread_mutex_unlock = Module._pthread_mutex_unlock = wasmExports.pthread_mutex_unlock)(e), _strcasecmp = Module._strcasecmp = (e, t2) => (_strcasecmp = Module._strcasecmp = wasmExports.strcasecmp)(e, t2), ___dl_seterr = (e, t2) => (___dl_seterr = wasmExports.__dl_seterr)(e, t2), _emscripten_builtin_memalign = (e, t2) => (_emscripten_builtin_memalign = wasmExports.emscripten_builtin_memalign)(e, t2), _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports.emscripten_stack_get_current)(), _perror = Module._perror = (e) => (_perror = Module._perror = wasmExports.perror)(e), _putc = Module._putc = (e, t2) => (_putc = Module._putc = wasmExports.putc)(e, t2), ___letf2 = Module.___letf2 = (e, t2, r, a) => (___letf2 = Module.___letf2 = wasmExports.__letf2)(e, t2, r, a), _pthread_sigmask = Module._pthread_sigmask = (e, t2, r) => (_pthread_sigmask = Module._pthread_sigmask = wasmExports.pthread_sigmask)(e, t2, r), _freelocale = Module._freelocale = (e) => (_freelocale = Module._freelocale = wasmExports.freelocale)(e), _getentropy = Module._getentropy = (e, t2) => (_getentropy = Module._getentropy = wasmExports.getentropy)(e, t2), _getgid = Module._getgid = () => (_getgid = Module._getgid = wasmExports.getgid)(), _htons = (e) => (_htons = wasmExports.htons)(e), _ntohs = Module._ntohs = (e) => (_ntohs = Module._ntohs = wasmExports.ntohs)(e), _getuid = Module._getuid = () => (_getuid = Module._getuid = wasmExports.getuid)(), _qsort = Module._qsort = (e, t2, r, a) => (_qsort = Module._qsort = wasmExports.qsort)(e, t2, r, a), _gmtime = Module._gmtime = (e) => (_gmtime = Module._gmtime = wasmExports.gmtime)(e), _htonl = (e) => (_htonl = wasmExports.htonl)(e), _ioctl = Module._ioctl = (e, t2, r) => (_ioctl = Module._ioctl = wasmExports.ioctl)(e, t2, r), _pthread_getspecific = Module._pthread_getspecific = (e) => (_pthread_getspecific = Module._pthread_getspecific = wasmExports.pthread_getspecific)(e), _pthread_setspecific = Module._pthread_setspecific = (e, t2) => (_pthread_setspecific = Module._pthread_setspecific = wasmExports.pthread_setspecific)(e, t2), _pthread_atfork = Module._pthread_atfork = (e, t2, r) => (_pthread_atfork = Module._pthread_atfork = wasmExports.pthread_atfork)(e, t2, r), _pthread_rwlock_init = Module._pthread_rwlock_init = (e, t2) => (_pthread_rwlock_init = Module._pthread_rwlock_init = wasmExports.pthread_rwlock_init)(e, t2), _pthread_rwlock_destroy = Module._pthread_rwlock_destroy = (e) => (_pthread_rwlock_destroy = Module._pthread_rwlock_destroy = wasmExports.pthread_rwlock_destroy)(e), _pthread_rwlock_rdlock = Module._pthread_rwlock_rdlock = (e) => (_pthread_rwlock_rdlock = Module._pthread_rwlock_rdlock = wasmExports.pthread_rwlock_rdlock)(e), _pthread_rwlock_wrlock = Module._pthread_rwlock_wrlock = (e) => (_pthread_rwlock_wrlock = Module._pthread_rwlock_wrlock = wasmExports.pthread_rwlock_wrlock)(e), _pthread_rwlock_unlock = Module._pthread_rwlock_unlock = (e) => (_pthread_rwlock_unlock = Module._pthread_rwlock_unlock = wasmExports.pthread_rwlock_unlock)(e), _pthread_key_delete = Module._pthread_key_delete = (e) => (_pthread_key_delete = Module._pthread_key_delete = wasmExports.pthread_key_delete)(e), _pthread_key_create = Module._pthread_key_create = (e, t2) => (_pthread_key_create = Module._pthread_key_create = wasmExports.pthread_key_create)(e, t2), _pthread_once = Module._pthread_once = (e, t2) => (_pthread_once = Module._pthread_once = wasmExports.pthread_once)(e, t2), _madvise = Module._madvise = (e, t2, r) => (_madvise = Module._madvise = wasmExports.madvise)(e, t2, r), _gmtime_r = Module._gmtime_r = (e, t2) => (_gmtime_r = Module._gmtime_r = wasmExports.gmtime_r)(e, t2), _mlock = Module._mlock = (e, t2) => (_mlock = Module._mlock = wasmExports.mlock)(e, t2), _mprotect = Module._mprotect = (e, t2, r) => (_mprotect = Module._mprotect = wasmExports.mprotect)(e, t2, r), _tcsetattr = Module._tcsetattr = (e, t2, r) => (_tcsetattr = Module._tcsetattr = wasmExports.tcsetattr)(e, t2, r), _pthread_self = Module._pthread_self = () => (_pthread_self = Module._pthread_self = wasmExports.pthread_self)(), _sigismember = Module._sigismember = (e, t2) => (_sigismember = Module._sigismember = wasmExports.sigismember)(e, t2), _sigpending = Module._sigpending = (e) => (_sigpending = Module._sigpending = wasmExports.sigpending)(e), _srand = Module._srand = (e) => (_srand = Module._srand = wasmExports.srand)(e), _rand = Module._rand = () => (_rand = Module._rand = wasmExports.rand)(), _setbuf = Module._setbuf = (e, t2) => (_setbuf = Module._setbuf = wasmExports.setbuf)(e, t2), __emscripten_timeout = (e, t2) => (__emscripten_timeout = wasmExports._emscripten_timeout)(e, t2), _signal = Module._signal = (e, t2) => (_signal = Module._signal = wasmExports.signal)(e, t2), _sigwait = Module._sigwait = (e, t2) => (_sigwait = Module._sigwait = wasmExports.sigwait)(e, t2), _strncasecmp = Module._strncasecmp = (e, t2, r) => (_strncasecmp = Module._strncasecmp = wasmExports.strncasecmp)(e, t2, r), _strncat = Module._strncat = (e, t2, r) => (_strncat = Module._strncat = wasmExports.strncat)(e, t2, r), _strxfrm_l = Module._strxfrm_l = (e, t2, r, a) => (_strxfrm_l = Module._strxfrm_l = wasmExports.strxfrm_l)(e, t2, r, a), _tcgetattr = Module._tcgetattr = (e, t2) => (_tcgetattr = Module._tcgetattr = wasmExports.tcgetattr)(e, t2), _setThrew = (e, t2) => (_setThrew = wasmExports.setThrew)(e, t2), __emscripten_tempret_set = (e) => (__emscripten_tempret_set = wasmExports._emscripten_tempret_set)(e), __emscripten_tempret_get = () => (__emscripten_tempret_get = wasmExports._emscripten_tempret_get)(), __emscripten_stack_restore = (e) => (__emscripten_stack_restore = wasmExports._emscripten_stack_restore)(e), __emscripten_stack_alloc = (e) => (__emscripten_stack_alloc = wasmExports._emscripten_stack_alloc)(e), _gethostbyname = Module._gethostbyname = (e) => (_gethostbyname = Module._gethostbyname = wasmExports.gethostbyname)(e), _getsockname = Module._getsockname = (e, t2, r) => (_getsockname = Module._getsockname = wasmExports.getsockname)(e, t2, r), _shutdown = Module._shutdown = (e, t2) => (_shutdown = Module._shutdown = wasmExports.shutdown)(e, t2), ___wasm_apply_data_relocs = () => (___wasm_apply_data_relocs = wasmExports.__wasm_apply_data_relocs)(), _stderr = Module._stderr = 15161616, _InterruptPending = Module._InterruptPending = 15306048, _MyLatch = Module._MyLatch = 15306236, _CritSectionCount = Module._CritSectionCount = 15306100, _MyProc = Module._MyProc = 15275852, _pg_global_prng_state = Module._pg_global_prng_state = 15252432, _error_context_stack = Module._error_context_stack = 15304344, _GUC_check_errdetail_string = Module._GUC_check_errdetail_string = 15309996, _IsUnderPostmaster = Module._IsUnderPostmaster = 15306129, _CurrentMemoryContext = Module._CurrentMemoryContext = 15311424, _stdout = Module._stdout = 15161920, _debug_query_string = Module._debug_query_string = 15166860, _MyProcPort = Module._MyProcPort = 15306224, ___THREW__ = Module.___THREW__ = 15331188, ___threwValue = Module.___threwValue = 15331192, _MyDatabaseId = Module._MyDatabaseId = 15306108, _TopMemoryContext = Module._TopMemoryContext = 15311428, _PG_exception_stack = Module._PG_exception_stack = 15304348, _MyProcPid = Module._MyProcPid = 15306200, _stdin = Module._stdin = 15161768, _ScanKeywords = Module._ScanKeywords = 14994472, _pg_number_of_ones = Module._pg_number_of_ones = 13560256, _LocalBufferBlockPointers = Module._LocalBufferBlockPointers = 15272428, _BufferBlocks = Module._BufferBlocks = 15267164, _wal_level = Module._wal_level = 15008352, _SnapshotAnyData = Module._SnapshotAnyData = 15094528, _maintenance_work_mem = Module._maintenance_work_mem = 15042008, _ParallelWorkerNumber = Module._ParallelWorkerNumber = 14999912, _MainLWLockArray = Module._MainLWLockArray = 15274036, _CurrentResourceOwner = Module._CurrentResourceOwner = 15311472, _work_mem = Module._work_mem = 15041992, _NBuffers = Module._NBuffers = 15042016, _bsysscan = Module._bsysscan = 15253668, _CheckXidAlive = Module._CheckXidAlive = 15253664, _RecentXmin = Module._RecentXmin = 15094620, _TTSOpsHeapTuple = Module._TTSOpsHeapTuple = 15012092, _XactIsoLevel = Module._XactIsoLevel = 15008216, _pgWalUsage = Module._pgWalUsage = 15257136, _pgBufferUsage = Module._pgBufferUsage = 15257008, _TTSOpsVirtual = Module._TTSOpsVirtual = 15012040, _TransamVariables = Module._TransamVariables = 15253656, _TopTransactionContext = Module._TopTransactionContext = 15311448, _RmgrTable = Module._RmgrTable = 14999936, _process_shared_preload_libraries_in_progress = Module._process_shared_preload_libraries_in_progress = 15309392, _wal_segment_size = Module._wal_segment_size = 15008372, _TopTransactionResourceOwner = Module._TopTransactionResourceOwner = 15311480, _arch_module_check_errdetail_string = Module._arch_module_check_errdetail_string = 15266548, _object_access_hook = Module._object_access_hook = 15255776, _InvalidObjectAddress = Module._InvalidObjectAddress = 14155804, _check_function_bodies = Module._check_function_bodies = 15042182, _post_parse_analyze_hook = Module._post_parse_analyze_hook = 15255816, _ScanKeywordTokens = Module._ScanKeywordTokens = 14186880, _SPI_processed = Module._SPI_processed = 15257160, _SPI_tuptable = Module._SPI_tuptable = 15257168, _CacheMemoryContext = Module._CacheMemoryContext = 15311440, _WalReceiverFunctions = Module._WalReceiverFunctions = 15266940, _TTSOpsMinimalTuple = Module._TTSOpsMinimalTuple = 15012144, _check_password_hook = Module._check_password_hook = 15256084, _ConfigReloadPending = Module._ConfigReloadPending = 15266536, _max_parallel_maintenance_workers = Module._max_parallel_maintenance_workers = 15042012, _DateStyle = Module._DateStyle = 15041980, _ExecutorStart_hook = Module._ExecutorStart_hook = 15256984, _ExecutorRun_hook = Module._ExecutorRun_hook = 15256988, _ExecutorFinish_hook = Module._ExecutorFinish_hook = 15256992, _ExecutorEnd_hook = Module._ExecutorEnd_hook = 15256996, _SPI_result = Module._SPI_result = 15257172, _ClientAuthentication_hook = Module._ClientAuthentication_hook = 15257344, _cpu_tuple_cost = Module._cpu_tuple_cost = 15012600, _cpu_operator_cost = Module._cpu_operator_cost = 15012616, _seq_page_cost = Module._seq_page_cost = 15012584, _planner_hook = Module._planner_hook = 15266232, _ShutdownRequestPending = Module._ShutdownRequestPending = 15266540, _MyStartTime = Module._MyStartTime = 15306208, _cluster_name = Module._cluster_name = 15042232, _application_name = Module._application_name = 15310220, _BufferDescriptors = Module._BufferDescriptors = 15267160, _shmem_startup_hook = Module._shmem_startup_hook = 15273108, _ProcessUtility_hook = Module._ProcessUtility_hook = 15275940, _IntervalStyle = Module._IntervalStyle = 15306132, _extra_float_digits = Module._extra_float_digits = 15032408, _pg_crc32_table = Module._pg_crc32_table = 14747456, _xmlFree = Module._xmlFree = 15143832, _xmlStructuredError = Module._xmlStructuredError = 15312996, _xmlStructuredErrorContext = Module._xmlStructuredErrorContext = 15313004, _xmlGenericErrorContext = Module._xmlGenericErrorContext = 15313e3, _xmlGenericError = Module._xmlGenericError = 15143868, _xmlIsBaseCharGroup = Module._xmlIsBaseCharGroup = 15143232, _xmlIsDigitGroup = Module._xmlIsDigitGroup = 15143264, _xmlIsCombiningGroup = Module._xmlIsCombiningGroup = 15143248, _xmlIsExtenderGroup = Module._xmlIsExtenderGroup = 15143280, _ErrorContext = Module._ErrorContext = 15311432, _shmem_request_hook = Module._shmem_request_hook = 15309396, _xmlIsPubidChar_tab = Module._xmlIsPubidChar_tab = 14788752, _xmlMalloc = Module._xmlMalloc = 15143836, _xmlRealloc = Module._xmlRealloc = 15143844, _xmlGetWarningsDefaultValue = Module._xmlGetWarningsDefaultValue = 15143860, _xmlLastError = Module._xmlLastError = 15313016, _xmlMallocAtomic = Module._xmlMallocAtomic = 15143840, _xmlMemStrdup = Module._xmlMemStrdup = 15143848, _xmlBufferAllocScheme = Module._xmlBufferAllocScheme = 15143852, _xmlDefaultBufferSize = Module._xmlDefaultBufferSize = 15143856, _xmlParserDebugEntities = Module._xmlParserDebugEntities = 15312956, _xmlDoValidityCheckingDefaultValue = Module._xmlDoValidityCheckingDefaultValue = 15312960, _xmlLoadExtDtdDefaultValue = Module._xmlLoadExtDtdDefaultValue = 15312964, _xmlPedanticParserDefaultValue = Module._xmlPedanticParserDefaultValue = 15312968, _xmlLineNumbersDefaultValue = Module._xmlLineNumbersDefaultValue = 15312972, _xmlKeepBlanksDefaultValue = Module._xmlKeepBlanksDefaultValue = 15143864, _xmlSubstituteEntitiesDefaultValue = Module._xmlSubstituteEntitiesDefaultValue = 15312976, _xmlRegisterNodeDefaultValue = Module._xmlRegisterNodeDefaultValue = 15312980, _xmlDeregisterNodeDefaultValue = Module._xmlDeregisterNodeDefaultValue = 15312984, _xmlParserInputBufferCreateFilenameValue = Module._xmlParserInputBufferCreateFilenameValue = 15312988, _xmlOutputBufferCreateFilenameValue = Module._xmlOutputBufferCreateFilenameValue = 15312992, _xmlIndentTreeOutput = Module._xmlIndentTreeOutput = 15143872, _xmlTreeIndentString = Module._xmlTreeIndentString = 15143876, _xmlSaveNoEmptyTags = Module._xmlSaveNoEmptyTags = 15313008, _xmlDefaultSAXHandler = Module._xmlDefaultSAXHandler = 15143880, _xmlDefaultSAXLocator = Module._xmlDefaultSAXLocator = 15143992, _xmlParserMaxDepth = Module._xmlParserMaxDepth = 15144260, _xmlStringText = Module._xmlStringText = 14790560, _xmlStringComment = Module._xmlStringComment = 14790575, _xmlStringTextNoenc = Module._xmlStringTextNoenc = 14790565, _xmlXPathNAN = Module._xmlXPathNAN = 15313672, _xmlXPathNINF = Module._xmlXPathNINF = 15313688, _xmlXPathPINF = Module._xmlXPathPINF = 15313680, _z_errmsg = Module._z_errmsg = 15160816, __length_code = Module.__length_code = 14810224, __dist_code = Module.__dist_code = 14809712;
    function invoke_iii(e, t2, r) {
      var a = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiii(e, t2, r, a, o3) {
      var s2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3);
      } catch (l2) {
        if (stackRestore(s2), l2 !== l2 + 0) throw l2;
        _setThrew(1, 0);
      }
    }
    function invoke_vi(e, t2) {
      var r = stackSave();
      try {
        getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_v(e) {
      var t2 = stackSave();
      try {
        getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0) throw r;
        _setThrew(1, 0);
      }
    }
    function invoke_j(e) {
      var t2 = stackSave();
      try {
        return getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0) throw r;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_viiiiii(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        _setThrew(1, 0);
      }
    }
    function invoke_vii(e, t2, r) {
      var a = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiii(e, t2, r, a, o3, s2) {
      var l2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2);
      } catch (_2) {
        if (stackRestore(l2), _2 !== _2 + 0) throw _2;
        _setThrew(1, 0);
      }
    }
    function invoke_i(e) {
      var t2 = stackSave();
      try {
        return getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0) throw r;
        _setThrew(1, 0);
      }
    }
    function invoke_ii(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_viii(e, t2, r, a) {
      var o3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiii(e, t2, r, a) {
      var o3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_vji(e, t2, r) {
      var a = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiii(e, t2, r, a, o3, s2, l2, _2) {
      var n = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2);
      } catch (m3) {
        if (stackRestore(n), m3 !== m3 + 0) throw m3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiii(e, t2, r, a, o3) {
      var s2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3);
      } catch (l2) {
        if (stackRestore(s2), l2 !== l2 + 0) throw l2;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3) {
      var p2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3);
      } catch (d2) {
        if (stackRestore(p2), d2 !== d2 + 0) throw d2;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiii(e, t2, r, a, o3, s2) {
      var l2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2);
      } catch (_2) {
        if (stackRestore(l2), _2 !== _2 + 0) throw _2;
        _setThrew(1, 0);
      }
    }
    function invoke_jii(e, t2, r) {
      var a = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_ji(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_jiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3) {
      var p2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3);
      } catch (d2) {
        if (stackRestore(p2), d2 !== d2 + 0) throw d2;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_jiiiiii(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_iiiiiiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3, u2) {
      var f = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3, u2);
      } catch (c) {
        if (stackRestore(f), c !== c + 0) throw c;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiijii(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        _setThrew(1, 0);
      }
    }
    function invoke_vijiji(e, t2, r, a, o3, s2) {
      var l2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2);
      } catch (_2) {
        if (stackRestore(l2), _2 !== _2 + 0) throw _2;
        _setThrew(1, 0);
      }
    }
    function invoke_viji(e, t2, r, a) {
      var o3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiji(e, t2, r, a) {
      var o3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n) {
      var m3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n);
      } catch (p2) {
        if (stackRestore(m3), p2 !== p2 + 0) throw p2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiiiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3, u2, f, c, w2, v2) {
      var S2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3, u2, f, c, w2, v2);
      } catch (x4) {
        if (stackRestore(S2), x4 !== x4 + 0) throw x4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiij(e, t2, r, a, o3) {
      var s2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3);
      } catch (l2) {
        if (stackRestore(s2), l2 !== l2 + 0) throw l2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiii(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        _setThrew(1, 0);
      }
    }
    function invoke_vj(e, t2) {
      var r = stackSave();
      try {
        getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3) {
      var p2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3);
      } catch (d2) {
        if (stackRestore(p2), d2 !== d2 + 0) throw d2;
        _setThrew(1, 0);
      }
    }
    function invoke_viiji(e, t2, r, a, o3) {
      var s2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3);
      } catch (l2) {
        if (stackRestore(s2), l2 !== l2 + 0) throw l2;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiiii(e, t2, r, a, o3, s2, l2, _2, n) {
      var m3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n);
      } catch (p2) {
        if (stackRestore(m3), p2 !== p2 + 0) throw p2;
        _setThrew(1, 0);
      }
    }
    function invoke_vij(e, t2, r) {
      var a = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        _setThrew(1, 0);
      }
    }
    function invoke_ij(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiii(e, t2, r, a, o3, s2, l2, _2) {
      var n = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2);
      } catch (m3) {
        if (stackRestore(n), m3 !== m3 + 0) throw m3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiji(e, t2, r, a, o3, s2) {
      var l2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2);
      } catch (_2) {
        if (stackRestore(l2), _2 !== _2 + 0) throw _2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiij(e, t2, r, a) {
      var o3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_vid(e, t2, r) {
      var a = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o3) {
        if (stackRestore(a), o3 !== o3 + 0) throw o3;
        _setThrew(1, 0);
      }
    }
    function invoke_ijiiiiii(e, t2, r, a, o3, s2, l2, _2) {
      var n = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2);
      } catch (m3) {
        if (stackRestore(n), m3 !== m3 + 0) throw m3;
        _setThrew(1, 0);
      }
    }
    function invoke_viijii(e, t2, r, a, o3, s2) {
      var l2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2);
      } catch (_2) {
        if (stackRestore(l2), _2 !== _2 + 0) throw _2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiji(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        _setThrew(1, 0);
      }
    }
    function invoke_viijiiii(e, t2, r, a, o3, s2, l2, _2) {
      var n = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2);
      } catch (m3) {
        if (stackRestore(n), m3 !== m3 + 0) throw m3;
        _setThrew(1, 0);
      }
    }
    function invoke_viij(e, t2, r, a) {
      var o3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a);
      } catch (s2) {
        if (stackRestore(o3), s2 !== s2 + 0) throw s2;
        _setThrew(1, 0);
      }
    }
    function invoke_jiiii(e, t2, r, a, o3) {
      var s2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3);
      } catch (l2) {
        if (stackRestore(s2), l2 !== l2 + 0) throw l2;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_viiiiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3) {
      var u2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3, p2, d2, g3);
      } catch (f) {
        if (stackRestore(u2), f !== f + 0) throw f;
        _setThrew(1, 0);
      }
    }
    function invoke_di(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_id(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a) {
        if (stackRestore(r), a !== a + 0) throw a;
        _setThrew(1, 0);
      }
    }
    function invoke_ijiiiii(e, t2, r, a, o3, s2, l2) {
      var _2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2);
      } catch (n) {
        if (stackRestore(_2), n !== n + 0) throw n;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiiii(e, t2, r, a, o3, s2, l2, _2, n, m3, p2) {
      var d2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a, o3, s2, l2, _2, n, m3, p2);
      } catch (g3) {
        if (stackRestore(d2), g3 !== g3 + 0) throw g3;
        _setThrew(1, 0);
      }
    }
    Module.addRunDependency = addRunDependency, Module.removeRunDependency = removeRunDependency, Module.getTempRet0 = getTempRet0, Module.setTempRet0 = setTempRet0, Module.setValue = setValue, Module.getValue = getValue, Module.UTF8ToString = UTF8ToString, Module.stringToNewUTF8 = stringToNewUTF8, Module.stringToUTF8OnStack = stringToUTF8OnStack, Module.FS_createPreloadedFile = FS_createPreloadedFile, Module.FS_unlink = FS_unlink, Module.FS_createPath = FS_createPath, Module.FS_createDevice = FS_createDevice, Module.FS = FS, Module.FS_createDataFile = FS_createDataFile, Module.FS_createLazyFile = FS_createLazyFile, Module.MEMFS = MEMFS, Module.IDBFS = IDBFS;
    var calledRun;
    dependenciesFulfilled = function e() {
      calledRun || run(), calledRun || (dependenciesFulfilled = e);
    };
    function callMain(e = []) {
      var t2 = resolveGlobalSymbol("main").sym;
      if (t2) {
        e.unshift(thisProgram);
        var r = e.length, a = stackAlloc((r + 1) * 4), o3 = a;
        e.forEach((l2) => {
          HEAPU32[o3 >> 2] = stringToUTF8OnStack(l2), o3 += 4;
        }), HEAPU32[o3 >> 2] = 0;
        try {
          var s2 = t2(r, a);
          return exitJS(s2, true), s2;
        } catch (l2) {
          return handleException(l2);
        }
      }
    }
    function run(e = arguments_) {
      if (runDependencies > 0 || (preRun(), runDependencies > 0)) return;
      function t2() {
        calledRun || (calledRun = true, Module.calledRun = true, !ABORT && (initRuntime(), preMain(), readyPromiseResolve(Module), Module.onRuntimeInitialized?.(), shouldRunNow && callMain(e), postRun()));
      }
      Module.setStatus ? (Module.setStatus("Running..."), setTimeout(() => {
        setTimeout(() => Module.setStatus(""), 1), t2();
      }, 1)) : t2();
    }
    if (Module.preInit) for (typeof Module.preInit == "function" && (Module.preInit = [Module.preInit]); Module.preInit.length > 0; ) Module.preInit.pop()();
    var shouldRunNow = true;
    return Module.noInitialRun && (shouldRunNow = false), run(), moduleRtn = readyPromise, moduleRtn;
  };
})();
var Ue2 = Ze2;
var Re2 = Ue2;
var J2;
var j2;
var V2;
var Q2;
var $2;
var ie;
var me2;
var pe2;
var de2;
var Z2;
var ae;
var oe;
var se2;
var le2;
var K2;
var H2;
var A2;
var Y2;
var T2;
var De2;
var re2;
var ze2;
var Ne2;
var ue2 = class ue3 extends F3 {
  constructor(r = {}, a = {}) {
    super();
    R(this, T2);
    R(this, J2, false);
    R(this, j2, false);
    R(this, V2, false);
    R(this, Q2, false);
    R(this, $2, false);
    R(this, ie, new X2());
    R(this, me2, new X2());
    R(this, pe2, new X2());
    R(this, de2, new X2());
    R(this, Z2, false);
    R(this, ae, "cma");
    this.debug = 0;
    R(this, oe);
    R(this, se2, []);
    R(this, le2, new ye());
    R(this, K2);
    R(this, H2);
    R(this, A2, /* @__PURE__ */ new Map());
    R(this, Y2, /* @__PURE__ */ new Set());
    typeof r == "string" ? a = { dataDir: r, ...a } : a = r, this.dataDir = a.dataDir, a.parsers !== void 0 && (this.parsers = { ...this.parsers, ...a.parsers }), a.serializers !== void 0 && (this.serializers = { ...this.serializers, ...a.serializers }), a?.debug !== void 0 && (this.debug = a.debug), a?.relaxedDurability !== void 0 && x(this, $2, a.relaxedDurability), a?.defaultDataTransferContainer !== void 0 && x(this, ae, a.defaultDataTransferContainer), x(this, oe, a.extensions ?? {}), this.waitReady = T(this, T2, De2).call(this, a ?? {});
  }
  static async create(r, a) {
    let o3 = typeof r == "string" ? { dataDir: r, ...a ?? {} } : r ?? {}, s2 = new ue3(o3);
    return await s2.waitReady, s2;
  }
  get Module() {
    return this.mod;
  }
  get ready() {
    return h(this, J2) && !h(this, j2) && !h(this, V2);
  }
  get closed() {
    return h(this, V2);
  }
  async close() {
    await this._checkReady(), x(this, j2, true);
    for (let r of h(this, se2)) await r();
    try {
      await this.execProtocol(O.end()), this.mod._pgl_shutdown();
    } catch (r) {
      let a = r;
      if (!(a.name === "ExitStatus" && a.status === 0)) throw r;
    }
    await this.fs.closeFs(), x(this, V2, true), x(this, j2, false);
  }
  async [Symbol.asyncDispose]() {
    await this.close();
  }
  async _handleBlob(r) {
    x(this, K2, r ? await r.arrayBuffer() : void 0);
  }
  async _cleanupBlob() {
    x(this, K2, void 0);
  }
  async _getWrittenBlob() {
    if (!h(this, H2)) return;
    let r = new Blob(h(this, H2));
    return x(this, H2, void 0), r;
  }
  async _checkReady() {
    if (h(this, j2)) throw new Error("PGlite is closing");
    if (h(this, V2)) throw new Error("PGlite is closed");
    h(this, J2) || await this.waitReady;
  }
  execProtocolRawSync(r, a = {}) {
    let o3, s2 = this.mod;
    s2._use_wire(1);
    let l2 = r.length, _2 = a.dataTransferContainer ?? h(this, ae);
    switch (r.length >= s2.FD_BUFFER_MAX && (_2 = "file"), _2) {
      case "cma": {
        s2._interactive_write(r.length), s2.HEAPU8.set(r, 1);
        break;
      }
      case "file": {
        let m3 = "/tmp/pglite/base/.s.PGSQL.5432.lck.in", p2 = "/tmp/pglite/base/.s.PGSQL.5432.in";
        s2._interactive_write(0), s2.FS.writeFile(m3, r), s2.FS.rename(m3, p2);
        break;
      }
      default:
        throw new Error(`Unknown data transfer container: ${_2}`);
    }
    s2._interactive_one();
    let n = s2._get_channel();
    switch (n < 0 && (_2 = "file"), n > 0 && (_2 = "cma"), _2) {
      case "cma": {
        let m3 = l2 + 2, p2 = m3 + s2._interactive_read();
        o3 = s2.HEAPU8.subarray(m3, p2);
        break;
      }
      case "file": {
        let m3 = "/tmp/pglite/base/.s.PGSQL.5432.out";
        try {
          let p2 = s2.FS.stat(m3), d2 = s2.FS.open(m3, "r");
          o3 = new Uint8Array(p2.size), s2.FS.read(d2, o3, 0, p2.size, 0), s2.FS.unlink(m3);
        } catch {
          o3 = new Uint8Array(0);
        }
        break;
      }
      default:
        throw new Error(`Unknown data transfer container: ${_2}`);
    }
    return o3;
  }
  async execProtocolRaw(r, { syncToFs: a = true, dataTransferContainer: o3 } = {}) {
    let s2 = this.execProtocolRawSync(r, { dataTransferContainer: o3 });
    return a && await this.syncToFs(), s2;
  }
  async execProtocol(r, { syncToFs: a = true, throwOnError: o3 = true, onNotice: s2 } = {}) {
    let l2 = await this.execProtocolRaw(r, { syncToFs: a }), _2 = [];
    return h(this, le2).parse(l2, (n) => {
      if (n instanceof E) {
        if (x(this, le2, new ye()), o3) throw n;
      } else if (n instanceof te) this.debug > 0 && console.warn(n), s2 && s2(n);
      else if (n instanceof Z) switch (n.text) {
        case "BEGIN":
          x(this, Q2, true);
          break;
        case "COMMIT":
        case "ROLLBACK":
          x(this, Q2, false);
          break;
      }
      else if (n instanceof J) {
        let m3 = h(this, A2).get(n.channel);
        m3 && m3.forEach((p2) => {
          queueMicrotask(() => p2(n.payload));
        }), h(this, Y2).forEach((p2) => {
          queueMicrotask(() => p2(n.channel, n.payload));
        });
      }
      _2.push(n);
    }), { messages: _2, data: l2 };
  }
  isInTransaction() {
    return h(this, Q2);
  }
  async syncToFs() {
    if (h(this, Z2)) return;
    x(this, Z2, true);
    let r = async () => {
      await h(this, de2).runExclusive(async () => {
        x(this, Z2, false), await this.fs.syncToFs(h(this, $2));
      });
    };
    h(this, $2) ? r() : await r();
  }
  async listen(r, a, o3) {
    return this._runExclusiveListen(() => T(this, T2, ze2).call(this, r, a, o3));
  }
  async unlisten(r, a, o3) {
    return this._runExclusiveListen(() => T(this, T2, Ne2).call(this, r, a, o3));
  }
  onNotification(r) {
    return h(this, Y2).add(r), () => {
      h(this, Y2).delete(r);
    };
  }
  offNotification(r) {
    h(this, Y2).delete(r);
  }
  async dumpDataDir(r) {
    await this._checkReady();
    let a = this.dataDir?.split("/").pop() ?? "pgdata";
    return this.fs.dumpTar(a, r);
  }
  _runExclusiveQuery(r) {
    return h(this, ie).runExclusive(r);
  }
  _runExclusiveTransaction(r) {
    return h(this, me2).runExclusive(r);
  }
  async clone() {
    let r = await this.dumpDataDir("none");
    return ue3.create({ loadDataDir: r });
  }
  _runExclusiveListen(r) {
    return h(this, pe2).runExclusive(r);
  }
};
J2 = /* @__PURE__ */ new WeakMap(), j2 = /* @__PURE__ */ new WeakMap(), V2 = /* @__PURE__ */ new WeakMap(), Q2 = /* @__PURE__ */ new WeakMap(), $2 = /* @__PURE__ */ new WeakMap(), ie = /* @__PURE__ */ new WeakMap(), me2 = /* @__PURE__ */ new WeakMap(), pe2 = /* @__PURE__ */ new WeakMap(), de2 = /* @__PURE__ */ new WeakMap(), Z2 = /* @__PURE__ */ new WeakMap(), ae = /* @__PURE__ */ new WeakMap(), oe = /* @__PURE__ */ new WeakMap(), se2 = /* @__PURE__ */ new WeakMap(), le2 = /* @__PURE__ */ new WeakMap(), K2 = /* @__PURE__ */ new WeakMap(), H2 = /* @__PURE__ */ new WeakMap(), A2 = /* @__PURE__ */ new WeakMap(), Y2 = /* @__PURE__ */ new WeakMap(), T2 = /* @__PURE__ */ new WeakSet(), De2 = async function(r) {
  if (r.fs) this.fs = r.fs;
  else {
    let { dataDir: d2, fsType: g3 } = Ae2(r.dataDir);
    this.fs = await Te2(d2, g3);
  }
  let a = {}, o3 = [], s2 = [`PGDATA=${C}`, `PREFIX=${Vr}`, `PGUSER=${r.username ?? "postgres"}`, `PGDATABASE=${r.database ?? "template1"}`, "MODE=REACT", "REPL=N", ...this.debug ? ["-d", this.debug.toString()] : []];
  r.wasmModule || Rr();
  let l2 = r.fsBundle ? r.fsBundle.arrayBuffer() : Er(), _2;
  l2.then((d2) => {
    _2 = d2;
  });
  let n = { WASM_PREFIX: Vr, arguments: s2, INITIAL_MEMORY: r.initialMemory, noExitRuntime: true, ...this.debug > 0 ? { print: console.info, printErr: console.error } : { print: () => {
  }, printErr: () => {
  } }, instantiateWasm: (d2, g3) => (Tr(d2, r.wasmModule).then(({ instance: u2, module: f }) => {
    g3(u2, f);
  }), {}), getPreloadedPackage: (d2, g3) => {
    if (d2 === "pglite.data") {
      if (_2.byteLength !== g3) throw new Error(`Invalid FS bundle size: ${_2.byteLength} !== ${g3}`);
      return _2;
    }
    throw new Error(`Unknown package: ${d2}`);
  }, preRun: [(d2) => {
    let g3 = d2.FS.makedev(64, 0), u2 = { open: (f) => {
    }, close: (f) => {
    }, read: (f, c, w2, v2, S2) => {
      let x4 = h(this, K2);
      if (!x4) throw new Error("No /dev/blob File or Blob provided to read from");
      let y3 = new Uint8Array(x4);
      if (S2 >= y3.length) return 0;
      let M2 = Math.min(y3.length - S2, v2);
      for (let E3 = 0; E3 < M2; E3++) c[w2 + E3] = y3[S2 + E3];
      return M2;
    }, write: (f, c, w2, v2, S2) => (h(this, H2) ?? x(this, H2, []), h(this, H2).push(c.slice(w2, w2 + v2)), v2), llseek: (f, c, w2) => {
      let v2 = h(this, K2);
      if (!v2) throw new Error("No /dev/blob File or Blob provided to llseek");
      let S2 = c;
      if (w2 === 1 ? S2 += f.position : w2 === 2 && (S2 = new Uint8Array(v2).length), S2 < 0) throw new d2.FS.ErrnoError(28);
      return S2;
    } };
    d2.FS.registerDevice(g3, u2), d2.FS.mkdev("/dev/blob", g3);
  }] }, { emscriptenOpts: m3 } = await this.fs.init(this, n);
  n = m3;
  for (let [d2, g3] of Object.entries(h(this, oe))) if (g3 instanceof URL) a[d2] = xe2(g3);
  else {
    let u2 = await g3.setup(this, n);
    if (u2.emscriptenOpts && (n = u2.emscriptenOpts), u2.namespaceObj) {
      let f = this;
      f[d2] = u2.namespaceObj;
    }
    u2.bundlePath && (a[d2] = xe2(u2.bundlePath)), u2.init && o3.push(u2.init), u2.close && h(this, se2).push(u2.close);
  }
  if (n.pg_extensions = a, await l2, this.mod = await Re2(n), await this.fs.initialSyncFs(), r.loadDataDir) {
    if (this.mod.FS.analyzePath(C + "/PG_VERSION").exists) throw new Error("Database already exists, cannot load from tarball");
    T(this, T2, re2).call(this, "pglite: loading data from tarball"), await ce(this.mod.FS, r.loadDataDir, C);
  }
  this.mod.FS.analyzePath(C + "/PG_VERSION").exists ? T(this, T2, re2).call(this, "pglite: found DB, resuming") : T(this, T2, re2).call(this, "pglite: no db"), await ke2(this.mod, (...d2) => T(this, T2, re2).call(this, ...d2));
  let p2 = this.mod._pgl_initdb();
  if (!p2) throw new Error("INITDB failed to return value");
  if (p2 & 1) throw new Error("INITDB: failed to execute");
  if (p2 & 2) {
    let d2 = r.username ?? "postgres", g3 = r.database ?? "template1";
    if (p2 & 4) {
      if (!(p2 & 12)) throw new Error(`INITDB: Invalid db ${g3}/user ${d2} combination`);
    } else if (g3 !== "template1" && d2 !== "postgres") throw new Error(`INITDB: created a new datadir ${C}, but an alternative db ${g3}/user ${d2} was requested`);
  }
  this.mod._pgl_backend(), await this.syncToFs(), x(this, J2, true), await this.exec("SET search_path TO public;"), await this._initArrayTypes();
  for (let d2 of o3) await d2();
}, re2 = function(...r) {
  this.debug > 0 && console.log(...r);
}, ze2 = async function(r, a, o3) {
  let s2 = Nr(r), l2 = o3 ?? this;
  h(this, A2).has(s2) || h(this, A2).set(s2, /* @__PURE__ */ new Set()), h(this, A2).get(s2).add(a);
  try {
    await l2.exec(`LISTEN ${r}`);
  } catch (_2) {
    throw h(this, A2).get(s2).delete(a), h(this, A2).get(s2)?.size === 0 && h(this, A2).delete(s2), _2;
  }
  return async (_2) => {
    await this.unlisten(s2, a, _2);
  };
}, Ne2 = async function(r, a, o3) {
  let s2 = Nr(r), l2 = o3 ?? this, _2 = async () => {
    await l2.exec(`UNLISTEN ${r}`), h(this, A2).get(s2)?.size === 0 && h(this, A2).delete(s2);
  };
  a ? (h(this, A2).get(s2)?.delete(a), h(this, A2).get(s2)?.size === 0 && await _2()) : await _2();
};
var qe2 = ue2;
u();

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/entity.js
var entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
    this.name = config2.name;
    this.keyAsName = config2.keyAsName;
    this.notNull = config2.notNull;
    this.default = config2.default;
    this.defaultFn = config2.defaultFn;
    this.onUpdateFn = config2.onUpdateFn;
    this.hasDefault = config2.hasDefault;
    this.primary = config2.primaryKey;
    this.isUnique = config2.isUnique;
    this.uniqueName = config2.uniqueName;
    this.uniqueType = config2.uniqueType;
    this.dataType = config2.dataType;
    this.columnType = config2.columnType;
    this.generated = config2.generated;
    this.generatedIdentity = config2.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name2, dataType, columnType) {
    this.config = {
      name: name2,
      keyAsName: name2 === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn2) {
    this.config.defaultFn = fn2;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn2) {
    this.config.onUpdateFn = fn2;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name2) {
    if (this.config.name !== "") return;
    this.config.name = name2;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/table.utils.js
var TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config2, actions) {
    this.reference = () => {
      const { name: name2, columns, foreignColumns } = config2();
      return { name: name2, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name: name2, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name2 ?? `${chunks.join("_")}_fk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/tracing-utils.js
function iife(fn2, ...args2) {
  return fn2(...args2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name2) {
    this.name = name2;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name2) {
    this.name = name2;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name2) {
    this.table = table;
    this.columns = columns;
    this.name = name2 ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i2 = startFrom; i2 < arrayString.length; i2++) {
    const char2 = arrayString[i2];
    if (char2 === "\\") {
      i2++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i2).replace(/\\/g, ""), i2 + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i2).replace(/\\/g, ""), i2];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i2 = startFrom;
  let lastCharIsComma = false;
  while (i2 < arrayString.length) {
    const char2 = arrayString[i2];
    if (char2 === ",") {
      if (lastCharIsComma || i2 === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i2++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i2 += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i2 + 1, true);
      result.push(value2);
      i2 = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i2 + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i2 + 1);
      result.push(value2);
      i2 = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i2, false);
    result.push(value);
    i2 = newStartFrom;
  }
  return [result, i2];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name2, config2) {
    this.config.isUnique = true;
    this.config.uniqueName = name2;
    this.config.uniqueType = config2?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config2) {
    if (!config2.uniqueName) {
      config2.uniqueName = uniqueKeyName(table, [config2.name]);
    }
    super(table, config2);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name2, keyAsName, type, indexConfig) {
    this.name = name2;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name2, baseBuilder, size) {
    super(name2, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config2, baseColumn, range) {
    super(table, config2);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config2.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v2) => this.baseColumn.mapFromDriverValue(v2));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v2) => v2 === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v2, true) : this.baseColumn.mapToDriverValue(v2)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name2, enumInstance) {
    super(name2, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config2) {
    super(table, config2);
    this.enum = config2.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name2, enumInstance) {
    super(name2, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config2) {
    super(table, config2);
    this.enum = config2.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/version.js
var version = "0.45.2";

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name2, fn2) {
    if (!otel) {
      return fn2();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name2,
        (span) => {
          try {
            return fn2(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/table.js
var Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
var Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
var ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
var BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
var IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name2, schema, baseName) {
    this[TableName] = this[OriginalName] = name2;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config2) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config2);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config2 = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config2;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i2, p2] of chunk.entries()) {
          result.push(p2);
          if (i2 < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config2);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config2,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config2);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config2), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config2);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config2);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config2);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config2), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i2, chunk] of chunks.entries()) {
      if (i2 > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p2) => {
    if (is(p2, Placeholder)) {
      if (!(p2.name in values)) {
        throw new Error(`No value for placeholder "${p2.name}" was provided`);
      }
      return values[p2.name];
    }
    if (is(p2, Param) && is(p2.value, Placeholder)) {
      if (!(p2.value.name in values)) {
        throw new Error(`No value for placeholder "${p2.value.name}" was provided`);
      }
      return p2.encoder.mapToDriverValue(values[p2.value.name]);
    }
    return p2;
  });
}
var IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var DrizzleQueryError = class _DrizzleQueryError extends Error {
  constructor(query, params, cause) {
    super(`Failed query: ${query}
params: ${params}`);
    this.query = query;
    this.params = params;
    this.cause = cause;
    Error.captureStackTrace(this, _DrizzleQueryError);
    if (cause) this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config2) {
    this.writer = config2?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p2) => {
      try {
        return JSON.stringify(p2);
      } catch {
        return String(p2);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else if (is(field, Subquery)) {
        decoder = field._.sql.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name2, field]) => {
    if (typeof name2 !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name2] : [name2];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name2 of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name2 === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name2,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name2) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b2) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b2
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null) return false;
  if (data.constructor.name !== "Object") return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined") return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["schema"];
    if (type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["casing"];
    if (type !== "string" && type !== "undefined") return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0) return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined") return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined") return false;
    return true;
  }
  if (Object.keys(data).length === 0) return true;
  return false;
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name: name2, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name2,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name: name2, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name2,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name2) {
    super(name2, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
};
var PgBigInt53 = class extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name2) {
    super(name2, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
};
var PgBigInt64 = class extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (config2.mode === "number") {
    return new PgBigInt53Builder(name2);
  }
  return new PgBigInt64Builder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name2) {
    super(name2, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
};
var PgBigSerial53 = class extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name2) {
    super(name2, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
};
var PgBigSerial64 = class extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigserial(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (config2.mode === "number") {
    return new PgBigSerial53Builder(name2);
  }
  return new PgBigSerial64Builder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name2) {
    super(name2, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
};
var PgBoolean = class extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
};
function boolean(name2) {
  return new PgBooleanBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name2, config2) {
    super(name2, "string", "PgChar");
    this.config.length = config2.length;
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(
      table,
      this.config
    );
  }
};
var PgChar = class extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgCharBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name2) {
    super(name2, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
};
var PgCidr = class extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
};
function cidr(name2) {
  return new PgCidrBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name2, fieldConfig, customTypeParams) {
    super(name2, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
};
var PgCustomColumn = class extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config2) {
    super(table, config2);
    this.sqlName = config2.customTypeParams.dataType(config2.fieldConfig);
    this.mapTo = config2.customTypeParams.toDriver;
    this.mapFrom = config2.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b2) => {
    const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
    return new PgCustomColumnBuilder(name2, config2, customTypeParams);
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name2) {
    super(name2, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(value);
    return value;
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name2) {
    super(name2, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return value.toISOString().slice(0, -14);
  }
};
function date(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (config2?.mode === "date") {
    return new PgDateBuilder(name2);
  }
  return new PgDateStringBuilder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name2) {
    super(name2, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
};
var PgDoublePrecision = class extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
};
function doublePrecision(name2) {
  return new PgDoublePrecisionBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name2) {
    super(name2, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
};
var PgInet = class extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
};
function inet(name2) {
  return new PgInetBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name2) {
    super(name2, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
};
var PgInteger = class extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
};
function integer(name2) {
  return new PgIntegerBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name2, intervalConfig) {
    super(name2, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
};
var PgInterval = class extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
};
function interval(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgIntervalBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name2) {
    super(name2, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function json(name2) {
  return new PgJsonBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name2) {
    super(name2, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function jsonb(name2) {
  return new PgJsonbBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name2) {
    super(name2, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
};
var PgLineTuple = class extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b2, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b2), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
};
var PgLineABCBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name2) {
    super(name2, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
};
var PgLineABC = class extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b2, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b2), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
};
function line(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgLineBuilder(name2);
  }
  return new PgLineABCBuilder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name2) {
    super(name2, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
};
var PgMacaddr = class extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
};
function macaddr(name2) {
  return new PgMacaddrBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name2) {
    super(name2, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
};
var PgMacaddr8 = class extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
};
function macaddr8(name2) {
  return new PgMacaddr8Builder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name2, precision, scale) {
    super(name2, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config2) {
    super(table, config2);
    this.precision = config2.precision;
    this.scale = config2.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericNumberBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericNumberBuilder";
  constructor(name2, precision, scale) {
    super(name2, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericNumber(
      table,
      this.config
    );
  }
};
var PgNumericNumber = class extends PgColumn {
  static [entityKind] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config2) {
    super(table, config2);
    this.precision = config2.precision;
    this.scale = config2.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericBigIntBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBigIntBuilder";
  constructor(name2, precision, scale) {
    super(name2, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericBigInt(
      table,
      this.config
    );
  }
};
var PgNumericBigInt = class extends PgColumn {
  static [entityKind] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config2) {
    super(table, config2);
    this.precision = config2.precision;
    this.scale = config2.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
function numeric(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  const mode = config2?.mode;
  return mode === "number" ? new PgNumericNumberBuilder(name2, config2?.precision, config2?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name2, config2?.precision, config2?.scale) : new PgNumericBuilder(name2, config2?.precision, config2?.scale);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name2) {
    super(name2, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
};
var PgPointTuple = class extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x4, y3] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x4), Number.parseFloat(y3)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name2) {
    super(name2, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
};
var PgPointObject = class extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x4, y3] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x4), y: Number.parseFloat(y3) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
};
function point(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgPointTupleBuilder(name2);
  }
  return new PgPointObjectBuilder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i2 = 0; i2 < 8; i2++) {
    view.setUint8(i2, bytes[offset + i2]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x4 = bytesToFloat64(bytes, offset);
    offset += 8;
    const y3 = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x4, y3];
  }
  throw new Error("Unsupported geometry type");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name2) {
    super(name2, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
};
var PgGeometry = class extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name2) {
    super(name2, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
};
var PgGeometryObject = class extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
};
function geometry(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (!config2?.mode || config2.mode === "tuple") {
    return new PgGeometryBuilder(name2);
  }
  return new PgGeometryObjectBuilder(name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name2, length) {
    super(name2, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
};
var PgReal = class extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config2) {
    super(table, config2);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
};
function real(name2) {
  return new PgRealBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name2) {
    super(name2, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
};
var PgSerial = class extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
};
function serial(name2) {
  return new PgSerialBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name2) {
    super(name2, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
};
var PgSmallInt = class extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
};
function smallint(name2) {
  return new PgSmallIntBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name2) {
    super(name2, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
};
var PgSmallSerial = class extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
};
function smallserial(name2) {
  return new PgSmallSerialBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name2, config2) {
    super(name2, "string", "PgText");
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
};
var PgText = class extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
};
function text(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgTextBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name2, withTimezone, precision) {
    super(name2, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function time(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgTimeBuilder(name2, config2.withTimezone ?? false, config2.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name2, withTimezone, precision) {
    super(name2, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(this.withTimezone ? value : value + "+0000");
    return value;
  }
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name2, withTimezone, precision) {
    super(name2, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config2) {
    super(table, config2);
    this.withTimezone = config2.withTimezone;
    this.precision = config2.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    const shortened = value.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const offset = value.getTimezoneOffset();
      const sign = offset <= 0 ? "+" : "-";
      return `${shortened}${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0")}`;
    }
    return shortened;
  }
};
function timestamp(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  if (config2?.mode === "string") {
    return new PgTimestampStringBuilder(name2, config2.withTimezone ?? false, config2.precision);
  }
  return new PgTimestampBuilder(name2, config2?.withTimezone ?? false, config2?.precision);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name2) {
    super(name2, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};
function uuid(name2) {
  return new PgUUIDBuilder(name2 ?? "");
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name2, config2) {
    super(name2, "string", "PgVarchar");
    this.config.length = config2.length;
    this.config.enumValues = config2.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(
      table,
      this.config
    );
  }
};
var PgVarchar = class extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b2 = {}) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgVarcharBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name2, config2) {
    super(name2, "string", "PgBinaryVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
};
var PgBinaryVector = class extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
};
function bit(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgBinaryVectorBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name2, config2) {
    super(name2, "array", "PgHalfVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
};
var PgHalfVector = class extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v2) => Number.parseFloat(v2));
  }
};
function halfvec(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgHalfVectorBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name2, config2) {
    super(name2, "string", "PgSparseVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
};
var PgSparseVector = class extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
};
function sparsevec(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgSparseVectorBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name2, config2) {
    super(name2, "array", "PgVector");
    this.config.dimensions = config2.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(
      table,
      this.config
    );
  }
};
var PgVector = class extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v2) => Number.parseFloat(v2));
  }
};
function vector(a, b2) {
  const { name: name2, config: config2 } = getColumnNameAndConfig(a, b2);
  return new PgVectorBuilder(name2, config2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};
function pgTableWithSchema(name2, columns, extraConfig, schema, baseName = name2) {
  const rawTable = new PgTable(name2, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name22, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name22);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name22, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name22, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name22);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name22, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name2, columns, extraConfig) => {
  return pgTableWithSchema(name2, columns, extraConfig, void 0);
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name2) {
    this.columns = columns;
    this.name = name2;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name2) {
    this.table = table;
    this.columns = columns;
    this.name = name2;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne2 = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or2(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt2 = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt2 = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v2) => bindIfParam(v2, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v2) => bindIfParam(v2, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config2) {
    this.table = table;
    this.config = config2;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config2, isNullable) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config2) {
    super(sourceTable, referencedTable, config2?.relationName);
    this.config = config2;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt: gt2,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt: lt2,
    lte,
    ne: ne2,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or: or2,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config2) {
    return new One(
      sourceTable,
      table,
      config2,
      config2?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config2) {
    return new Many(sourceTable, referencedTable, config2);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config2) {
    this.config = { ...config2 };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/indexes.js
var IndexBuilderOn = class {
  constructor(unique, name2) {
    this.unique = unique;
    this.name = name2;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(
      columns.map((it2) => {
        if (is(it2, SQL)) {
          return it2;
        }
        it2 = it2;
        const clonedIndexedColumn = new IndexedColumn(it2.name, !!it2.keyAsName, it2.columnType, it2.indexConfig);
        it2.indexConfig = JSON.parse(JSON.stringify(it2.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      false,
      this.name
    );
  }
  onOnly(...columns) {
    return new IndexBuilder(
      columns.map((it2) => {
        if (is(it2, SQL)) {
          return it2;
        }
        it2 = it2;
        const clonedIndexedColumn = new IndexedColumn(it2.name, !!it2.keyAsName, it2.columnType, it2.indexConfig);
        it2.indexConfig = it2.defaultConfig;
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name
    );
  }
  /**
   * Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
   *
   * If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
   *
   * **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
   *
   * @param method The name of the index method to be used
   * @param columns
   * @returns
   */
  using(method, ...columns) {
    return new IndexBuilder(
      columns.map((it2) => {
        if (is(it2, SQL)) {
          return it2;
        }
        it2 = it2;
        const clonedIndexedColumn = new IndexedColumn(it2.name, !!it2.keyAsName, it2.columnType, it2.indexConfig);
        it2.indexConfig = JSON.parse(JSON.stringify(it2.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name,
      method
    );
  }
};
var IndexBuilder = class {
  static [entityKind] = "PgIndexBuilder";
  /** @internal */
  config;
  constructor(columns, unique, only, name2, method = "btree") {
    this.config = {
      name: name2,
      columns,
      unique,
      only,
      method
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  with(obj) {
    this.config.with = obj;
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static [entityKind] = "PgIndex";
  config;
  constructor(config2, table) {
    this.config = { ...config2, table };
  }
};
function uniqueIndex(name2) {
  return new IndexBuilderOn(true, name2);
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i2) => {
    const formattedWord = i2 === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName) return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
  static [entityKind] = "PgViewBase";
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
  static [entityKind] = "PgDialect";
  /** @internal */
  casing;
  constructor(config2) {
    this.casing = new CasingCache(config2?.casing);
  }
  async migrate(migrations, session, config2) {
    const migrationsTable = typeof config2 === "string" ? "__drizzle_migrations" : config2.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config2 === "string" ? "drizzle" : config2.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name2) {
    return `"${name2.replace(/"/g, '""')}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str) {
    return `'${str.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length) return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i2, w2] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w2._.alias)} as (${w2._.sql})`);
      if (i2 < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i2) => {
      const col = tableColumns[colName];
      const onUpdateFnResult = col.onUpdateFn?.();
      const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i2 < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[PgTable.Symbol.Name];
    const tableSchema = table[PgTable.Symbol.Schema];
    const origTableName = table[PgTable.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = sql`${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i2) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      } else if (is(field, Subquery)) {
        const entries = Object.entries(field._.selectedFields);
        if (entries.length === 1) {
          const entry = entries[0][1];
          const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: (v2) => entry.mapFromDriverValue(v2) } : entry.sql.decoder;
          if (fieldDecoder) {
            field._.sql.decoder = fieldDecoder;
          }
        }
        chunk.push(field);
      }
      if (i2 < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index, joinMeta] of joins.entries()) {
      if (index === 0) {
        joinsArray.push(sql` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
      const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
      if (is(table, PgTable)) {
        const tableName = table[PgTable.Symbol.Name];
        const tableSchema = table[PgTable.Symbol.Schema];
        const origTableName = table[PgTable.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else if (is(table, View)) {
        const viewName = table[ViewBaseConfig].name;
        const viewSchema = table[ViewBaseConfig].schema;
        const origViewName = table[ViewBaseConfig].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
        );
      } else {
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table}${onSql}`
        );
      }
      if (index < joins.length - 1) {
        joinsArray.push(sql` `);
      }
    }
    return sql.join(joinsArray);
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.IsAlias]) {
      let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
      if (table[Table.Symbol.Schema]) {
        fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
      }
      return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` nowait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i2 = 0; i2 < singleOrderBy.queryChunks.length; i2++) {
            const chunk = singleOrderBy.queryChunks[i2];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i2] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_2, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql.identifier(this.casing.getColumnCasing(column))
    );
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? sql`overriding system value ` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp) || is(encoder, PgTimestampString)) {
      return "timestamp";
    } else if (is(encoder, PgDate) || is(encoder, PgDateString)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config2,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit, offset, orderBy = [], where;
    const joins = [];
    if (config2 === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config2.where) {
        const whereSql = typeof config2.where === "function" ? config2.where(aliasedColumns, getOperators()) : config2.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config2.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config2.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config2.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config2.with) {
        selectedRelations = Object.entries(config2.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config2.extras) {
        extras = typeof config2.extras === "function" ? config2.extras(aliasedColumns, { sql }) : config2.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config2.orderBy === "function" ? config2.orderBy(aliasedColumns, getOrderByOperators()) : config2.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit = config2.limit;
      offset = config2.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i2) => eq(
              aliasedTableColumn(normalizedRelation.references[i2], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_agg(${field}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config2) {
    this.fields = config2.fields;
    this.session = config2.session;
    this.dialect = config2.dialect;
    if (config2.withList) {
      this.withList = config2.withList;
    }
    this.distinct = config2.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    const src = source;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(src, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(src._.selectedFields).map((key) => [key, src[key]])
      );
    } else if (is(src, PgViewBase)) {
      fields = src[ViewBaseConfig].selectedFields;
    } else if (is(src, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(src);
    }
    return new PgSelectBase({
      table: src,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  cacheConfig = void 0;
  usedTables = /* @__PURE__ */ new Set();
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields,
      config: this.config
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
    for (const item of extractUsedTable(table)) this.usedTables.add(item);
  }
  /** @internal */
  getUsedTables() {
    return [...this.usedTables];
  }
  createJoin(joinType, lateral) {
    return (table, on2) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      for (const item of extractUsedTable(table)) this.usedTables.add(item);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on2 === "function") {
        on2 = on2(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on: on2, table, joinType, alias: tableName, lateral });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "cross":
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left", false);
  /**
   * Executes a `left join lateral` operation by adding subquery to the current query.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  leftJoinLateral = this.createJoin("left", true);
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right", false);
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner", false);
  /**
   * Executes an `inner join lateral` operation, creating a new table by combining rows from two queries that have matching values.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join-lateral}
   *
   * @param table the subquery to join.
   * @param on the `on` clause.
   */
  innerJoinLateral = this.createJoin("inner", true);
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full", false);
  /**
   * Executes a `cross join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
   *
   * @param table the table to join.
   *
   * @example
   *
   * ```ts
   * // Select all users, each user with every pet
   * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
   *   .from(users)
   *   .crossJoin(pets)
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .crossJoin(pets)
   * ```
   */
  crossJoin = this.createJoin("cross", false);
  /**
   * Executes a `cross join lateral` operation by combining rows from two queries into a new table.
   *
   * A `lateral` join allows the right-hand expression to refer to columns from the left-hand side.
   *
   * Calling this method retrieves all rows from both main and joined queries, merging all rows from each query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join-lateral}
   *
   * @param table the query to join.
   */
  crossJoinLateral = this.createJoin("cross", true);
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit;
    } else {
      this.config.limit = limit;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config2 = {}) {
    this.config.lockingClause = { strength, config: config2 };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    const usedTables = [];
    usedTables.push(...extractUsedTable(this.config.table));
    if (this.config.joins) {
      for (const it2 of this.config.joins) usedTables.push(...extractUsedTable(it2.table));
    }
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
  $withCache(config2) {
    this.cacheConfig = config2 === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config2 === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config2 };
    return this;
  }
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name2) {
    const { session, config: config2, dialect, joinsNotNullableMap, authToken, cacheConfig, usedTables } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    const { fields } = config2;
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name2, true, void 0, {
        type: "select",
        tables: [...usedTables]
      }, cacheConfig);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name2) {
    return this._prepare(name2);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, PgDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self2 = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self2.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self2.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on2, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self2.getDialect(),
        distinct: { on: on2 }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on2, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on: on2 }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/utils.js
function extractUsedTable(table) {
  if (is(table, PgTable)) {
    return [table[Schema] ? `${table[Schema]}.${table[Table.Symbol.BaseName]}` : table[Table.Symbol.BaseName]];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  cacheConfig;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name2) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name2, true, void 0, {
        type: "delete",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name2) {
    return this._prepare(name2);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entityKind] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var PgInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select, overridingSystemValue_ };
  }
  static [entityKind] = "PgInsert";
  config;
  cacheConfig;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config2 = {}) {
    if (config2.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config2.target) ? config2.target.map((it2) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it2))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config2.target));
      const whereSql = config2.where ? sql` where ${config2.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config2) {
    if (config2.where && (config2.targetWhere || config2.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config2.where ? sql` where ${config2.where}` : void 0;
    const targetWhereSql = config2.targetWhere ? sql` where ${config2.targetWhere}` : void 0;
    const setWhereSql = config2.setWhere ? sql` where ${config2.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config2.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config2.target) ? config2.target.map((it2) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it2))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config2.target));
    this.config.onConflict = sql`(${sql.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name2) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name2, true, void 0, {
        type: "insert",
        tables: extractUsedTable(this.config.table)
      }, this.cacheConfig);
    });
  }
  prepare(name2) {
    return this._prepare(name2);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name2) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name2, true);
    });
  }
  prepare(name2) {
    return this._prepare(name2);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values) {
    return new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
};
var PgUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entityKind] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  cacheConfig;
  from(source) {
    const src = source;
    const tableName = getTableLikeName(src);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = src;
    return this;
  }
  getTableLikeFields(table) {
    if (is(table, PgTable)) {
      return table[Table.Symbol.Columns];
    } else if (is(table, Subquery)) {
      return table._.selectedFields;
    }
    return table[ViewBaseConfig].selectedFields;
  }
  createJoin(joinType) {
    return (table, on2) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on2 === "function") {
        const from = this.config.from && !is(this.config.from, SQL) ? this.getTableLikeFields(this.config.from) : void 0;
        on2 = on2(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on: on2, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
      if (this.config.from) {
        const tableName = getTableLikeName(this.config.from);
        if (typeof tableName === "string" && this.config.from && !is(this.config.from, SQL)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = getTableLikeName(join.table);
          if (typeof tableName2 === "string" && !is(join.table, SQL)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name2) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name2, true, void 0, {
      type: "insert",
      tables: extractUsedTable(this.config.table)
    }, this.cacheConfig);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name2) {
    return this._prepare(name2);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class _PgCountBuilder extends SQL {
  constructor(params) {
    super(_PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = _PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entityKind] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) as count from ${source}${sql.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config2) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? config2 : {},
      "many"
    );
  }
  findFirst(config2) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config2 ? { ...config2, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var PgRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config2, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config2;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name2) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name2,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name2) {
    return this._prepare(name2);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
  constructor(execute, sql2, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql2;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
    this.$cache = { invalidate: async (_params) => {
    } };
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self2 = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self2.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  $cache;
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self2 = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self2.session,
        dialect: self2.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self2.session,
        dialect: self2.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on2, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self2.session,
        dialect: self2.dialect,
        withList: queries,
        distinct: { on: on2 }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self2.session, self2.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self2.session, self2.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self2.session, self2.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on2, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on: on2 }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config2) {
    return this.session.transaction(transaction, config2);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/cache/core/cache.js
var Cache = class {
  static [entityKind] = "Cache";
};
var NoopCache = class extends Cache {
  strategy() {
    return "all";
  }
  static [entityKind] = "NoopCache";
  async get(_key) {
    return void 0;
  }
  async put(_hashedQuery, _response, _tables, _config) {
  }
  async onMutate(_params) {
  }
};
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b2) => b2.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
  constructor(query, cache, queryMetadata, cacheConfig) {
    this.query = query;
    this.cache = cache;
    this.queryMetadata = queryMetadata;
    this.cacheConfig = cacheConfig;
    if (cache && cache.strategy() === "all" && cacheConfig === void 0) {
      this.cacheConfig = { enable: true, autoInvalidate: true };
    }
    if (!this.cacheConfig?.enable) {
      this.cacheConfig = void 0;
    }
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
  /** @internal */
  async queryWithCache(queryString, params, query) {
    if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.cacheConfig && !this.cacheConfig.enable) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
      try {
        const [res] = await Promise.all([
          query(),
          this.cache.onMutate({ tables: this.queryMetadata.tables })
        ]);
        return res;
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (!this.cacheConfig) {
      try {
        return await query();
      } catch (e) {
        throw new DrizzleQueryError(queryString, params, e);
      }
    }
    if (this.queryMetadata.type === "select") {
      const fromCache = await this.cache.get(
        this.cacheConfig.tag ?? await hashQuery(queryString, params),
        this.queryMetadata.tables,
        this.cacheConfig.tag !== void 0,
        this.cacheConfig.autoInvalidate
      );
      if (fromCache === void 0) {
        let result;
        try {
          result = await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
        await this.cache.put(
          this.cacheConfig.tag ?? await hashQuery(queryString, params),
          result,
          // make sure we send tables that were used in a query only if user wants to invalidate it on each write
          this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
          this.cacheConfig.tag !== void 0,
          this.cacheConfig.config
        );
        return result;
      }
      return fromCache;
    }
    try {
      return await query();
    } catch (e) {
      throw new DrizzleQueryError(queryString, params, e);
    }
  }
};
var PgSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql2, token) {
    const res = await this.execute(sql2, token);
    return Number(
      res[0]["count"]
    );
  }
};
var PgTransaction = class extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config2) {
    const chunks = [];
    if (config2.isolationLevel) {
      chunks.push(`isolation level ${config2.isolationLevel}`);
    }
    if (config2.accessMode) {
      chunks.push(config2.accessMode);
    }
    if (typeof config2.deferrable === "boolean") {
      chunks.push(config2.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config2) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config2)}`);
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pglite/session.js
var PglitePreparedQuery = class extends PgPreparedQuery {
  constructor(client, queryString, params, logger, cache, queryMetadata, cacheConfig, fields, name2, _isResponseInArrayMode, customResultMapper) {
    super({ sql: queryString, params }, cache, queryMetadata, cacheConfig);
    this.client = client;
    this.queryString = queryString;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.rawQueryConfig = {
      rowMode: "object",
      parsers: {
        [hn.TIMESTAMP]: (value) => value,
        [hn.TIMESTAMPTZ]: (value) => value,
        [hn.INTERVAL]: (value) => value,
        [hn.DATE]: (value) => value,
        // numeric[]
        [1231]: (value) => value,
        // timestamp[]
        [1115]: (value) => value,
        // timestamp with timezone[]
        [1185]: (value) => value,
        // interval[]
        [1187]: (value) => value,
        // date[]
        [1182]: (value) => value
      }
    };
    this.queryConfig = {
      rowMode: "array",
      parsers: {
        [hn.TIMESTAMP]: (value) => value,
        [hn.TIMESTAMPTZ]: (value) => value,
        [hn.INTERVAL]: (value) => value,
        [hn.DATE]: (value) => value,
        // numeric[]
        [1231]: (value) => value,
        // timestamp[]
        [1115]: (value) => value,
        // timestamp with timezone[]
        [1185]: (value) => value,
        // interval[]
        [1187]: (value) => value,
        // date[]
        [1182]: (value) => value
      }
    };
  }
  static [entityKind] = "PglitePreparedQuery";
  rawQueryConfig;
  queryConfig;
  async execute(placeholderValues = {}) {
    const params = fillPlaceholders(this.params, placeholderValues);
    this.logger.logQuery(this.queryString, params);
    const { fields, client, queryConfig, joinsNotNullableMap, customResultMapper, queryString, rawQueryConfig } = this;
    if (!fields && !customResultMapper) {
      return this.queryWithCache(queryString, params, async () => {
        return await client.query(queryString, params, rawQueryConfig);
      });
    }
    const result = await this.queryWithCache(queryString, params, async () => {
      return await client.query(queryString, params, queryConfig);
    });
    return customResultMapper ? customResultMapper(result.rows) : result.rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
  }
  all(placeholderValues = {}) {
    const params = fillPlaceholders(this.params, placeholderValues);
    this.logger.logQuery(this.queryString, params);
    return this.queryWithCache(this.queryString, params, async () => {
      return await this.client.query(this.queryString, params, this.rawQueryConfig);
    }).then((result) => result.rows);
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var PgliteSession = class _PgliteSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
    this.cache = options.cache ?? new NoopCache();
  }
  static [entityKind] = "PgliteSession";
  logger;
  cache;
  prepareQuery(query, fields, name2, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
    return new PglitePreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      this.cache,
      queryMetadata,
      cacheConfig,
      fields,
      name2,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async transaction(transaction, config2) {
    return this.client.transaction(async (client) => {
      const session = new _PgliteSession(
        client,
        this.dialect,
        this.schema,
        this.options
      );
      const tx = new PgliteTransaction(this.dialect, session, this.schema);
      if (config2) {
        await tx.setTransaction(config2);
      }
      return transaction(tx);
    });
  }
  async count(sql2) {
    const res = await this.execute(sql2);
    return Number(
      res["rows"][0]["count"]
    );
  }
};
var PgliteTransaction = class _PgliteTransaction extends PgTransaction {
  static [entityKind] = "PgliteTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex + 1}`;
    const tx = new _PgliteTransaction(
      this.dialect,
      this.session,
      this.schema,
      this.nestedIndex + 1
    );
    await tx.execute(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await tx.execute(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err2) {
      await tx.execute(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err2;
    }
  }
};

// ../../node_modules/.pnpm/drizzle-orm@0.45.2_@electric-sql+pglite@0.3.8/node_modules/drizzle-orm/pglite/driver.js
var PgliteDriver = class {
  constructor(client, dialect, options = {}) {
    this.client = client;
    this.dialect = dialect;
    this.options = options;
  }
  static [entityKind] = "PgliteDriver";
  createSession(schema) {
    return new PgliteSession(this.client, this.dialect, schema, {
      logger: this.options.logger,
      cache: this.options.cache
    });
  }
};
var PgliteDatabase = class extends PgDatabase {
  static [entityKind] = "PgliteDatabase";
};
function construct(client, config2 = {}) {
  const dialect = new PgDialect({ casing: config2.casing });
  let logger;
  if (config2.logger === true) {
    logger = new DefaultLogger();
  } else if (config2.logger !== false) {
    logger = config2.logger;
  }
  let schema;
  if (config2.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config2.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config2.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const driver = new PgliteDriver(client, dialect, { logger, cache: config2.cache });
  const session = driver.createSession(schema);
  const db = new PgliteDatabase(dialect, session, schema);
  db.$client = client;
  db.$cache = config2.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config2.cache?.onMutate;
  }
  return db;
}
function drizzle(...params) {
  if (params[0] === void 0 || typeof params[0] === "string") {
    const instance2 = new qe2(params[0]);
    return construct(instance2, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client) return construct(client, drizzleConfig);
    if (typeof connection === "object") {
      const { dataDir, ...options } = connection;
      const instance22 = new qe2(dataDir, options);
      return construct(instance22, drizzleConfig);
    }
    const instance2 = new qe2(connection);
    return construct(instance2, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config2) {
    return construct({}, config2);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// ../../packages/db/src/schema.ts
var actors = pgTable(
  "actors",
  {
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    displayName: text("display_name").notNull(),
    id: text("id").primaryKey(),
    passwordHash: text("password_hash"),
    username: text("username").notNull()
  },
  (table) => [uniqueIndex("actors_username_unique").on(table.username)]
);
var sessions = pgTable(
  "sessions",
  {
    actorId: text("actor_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull()
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)]
);
var projects = pgTable("projects", {
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  description: text("description").notNull().default(""),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => actors.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull()
});
var diagnosticJobs = pgTable("diagnostic_jobs", {
  attempt: integer("attempt").notNull().default(0),
  claimTokenHash: text("claim_token_hash"),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
  correlationId: text("correlation_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  id: text("id").primaryKey(),
  lastError: text("last_error"),
  leaseExpiresAt: timestamp("lease_expires_at", { mode: "date", withTimezone: true }),
  message: text("message").notNull(),
  result: text("result"),
  status: text("status").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
  workerId: text("worker_id")
});
var diagnosticJobAttempts = pgTable(
  "diagnostic_job_attempts",
  {
    attempt: integer("attempt").notNull(),
    completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
    error: text("error"),
    heartbeatAt: timestamp("heartbeat_at", { mode: "date", withTimezone: true }),
    id: text("id").primaryKey(),
    jobId: text("job_id").notNull().references(() => diagnosticJobs.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }).notNull(),
    status: text("status").notNull(),
    workerId: text("worker_id").notNull()
  },
  (table) => [uniqueIndex("diagnostic_job_attempt_unique").on(table.jobId, table.attempt)]
);

// ../../packages/db/src/pglite.ts
var foundationStatements = [
  `CREATE TABLE IF NOT EXISTS actors (
    id text PRIMARY KEY,
    username text NOT NULL UNIQUE,
    display_name text NOT NULL,
    password_hash text,
    created_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    actor_id text NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_actor_id_index ON sessions(actor_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id text PRIMARY KEY,
    owner_id text NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    archived boolean NOT NULL DEFAULT false,
    revision integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS projects_owner_id_index ON projects(owner_id)`,
  `CREATE TABLE IF NOT EXISTS diagnostic_jobs (
    id text PRIMARY KEY,
    correlation_id text NOT NULL,
    message text NOT NULL,
    status text NOT NULL,
    result text,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    completed_at timestamptz
  )`
];
var durableJobStatements = [
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS worker_id text`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS claim_token_hash text`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz`,
  `ALTER TABLE diagnostic_jobs ADD COLUMN IF NOT EXISTS last_error text`,
  `CREATE INDEX IF NOT EXISTS diagnostic_jobs_claim_index
    ON diagnostic_jobs(status, lease_expires_at, created_at)`,
  `CREATE TABLE IF NOT EXISTS diagnostic_job_attempts (
    id text PRIMARY KEY,
    job_id text NOT NULL REFERENCES diagnostic_jobs(id) ON DELETE CASCADE,
    attempt integer NOT NULL,
    worker_id text NOT NULL,
    status text NOT NULL,
    started_at timestamptz NOT NULL,
    heartbeat_at timestamptz,
    completed_at timestamptz,
    error text,
    UNIQUE(job_id, attempt)
  )`
];
function migrationChecksum(statements) {
  return createHash("sha256").update(statements.join("\n-- statement --\n")).digest("hex");
}
var hymuiMigrations = [
  {
    checksum: migrationChecksum(foundationStatements),
    id: "0001",
    name: "persistence_identity_projects",
    statements: foundationStatements
  },
  {
    checksum: migrationChecksum(durableJobStatements),
    id: "0002",
    name: "durable_diagnostic_job_leases",
    statements: durableJobStatements
  }
];
function actorRecord(row) {
  return {
    createdAt: row.createdAt.toISOString(),
    displayName: row.displayName,
    id: row.id,
    passwordHash: row.passwordHash,
    username: row.username
  };
}
function sessionRecord(row) {
  return {
    actorId: row.actorId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    tokenHash: row.tokenHash
  };
}
function projectRecord(row) {
  return {
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    description: row.description,
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    revision: row.revision,
    updatedAt: row.updatedAt.toISOString()
  };
}
function diagnosticJobRecord(row) {
  return {
    attempt: row.attempt,
    completedAt: row.completedAt?.toISOString() ?? null,
    correlationId: row.correlationId,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    leaseExpiresAt: row.leaseExpiresAt,
    message: row.message,
    result: row.result,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    workerId: row.workerId
  };
}
function isDuplicateError(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
async function createPgliteDatabase(options = {}) {
  const client = options.dataDirectory ? new qe2(options.dataDirectory) : new qe2();
  await client.waitReady;
  const database = drizzle(client);
  async function ensureMigrationTable() {
    await client.exec(`CREATE TABLE IF NOT EXISTS hymui_schema_migrations (
      id text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL
    )`);
  }
  async function migrationStatus() {
    await ensureMigrationTable();
    const result = await client.query("SELECT id, name, checksum, applied_at FROM hymui_schema_migrations ORDER BY id");
    return result.rows.map((row) => ({
      appliedAt: row.applied_at instanceof Date ? row.applied_at : new Date(row.applied_at),
      checksum: row.checksum,
      id: row.id,
      name: row.name,
      statements: []
    }));
  }
  const migrations = {
    async apply(pending) {
      const applied = await migrationStatus();
      const appliedById = new Map(applied.map((migration) => [migration.id, migration]));
      for (const migration of pending) {
        const existing = appliedById.get(migration.id);
        if (existing && existing.checksum !== migration.checksum) {
          throw new PersistenceError(
            "MIGRATION_CONFLICT",
            `Migration ${migration.id} has a different checksum.`
          );
        }
        if (existing) continue;
        await client.exec("BEGIN");
        try {
          for (const statement of migration.statements) await client.exec(statement);
          await client.query(
            "INSERT INTO hymui_schema_migrations (id, name, checksum, applied_at) VALUES ($1, $2, $3, $4)",
            [migration.id, migration.name, migration.checksum, (/* @__PURE__ */ new Date()).toISOString()]
          );
          await client.exec("COMMIT");
        } catch (error) {
          await client.exec("ROLLBACK");
          throw new PersistenceError(
            "DATABASE_UNAVAILABLE",
            error instanceof Error ? error.message : "Migration failed."
          );
        }
      }
      return migrationStatus();
    },
    status: migrationStatus
  };
  await migrations.apply(hymuiMigrations);
  const projectRepository = {
    async create(input) {
      const [created] = await database.insert(projects).values({
        archived: false,
        createdAt: input.timestamp,
        description: input.description ?? "",
        id: input.id,
        name: input.name,
        ownerId: input.ownerId,
        revision: 1,
        updatedAt: input.timestamp
      }).returning();
      if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Project was not created.");
      return projectRecord(created);
    },
    async findById(id, actorId) {
      const [project] = await database.select().from(projects).where(and(eq(projects.id, id), eq(projects.ownerId, actorId))).limit(1);
      return project ? projectRecord(project) : null;
    },
    async listByActor(actorId) {
      const records = await database.select().from(projects).where(eq(projects.ownerId, actorId)).orderBy(asc(projects.createdAt));
      return records.map(projectRecord);
    },
    async update(input) {
      const [existing] = await database.select().from(projects).where(and(eq(projects.id, input.id), eq(projects.ownerId, input.ownerId))).limit(1);
      if (!existing) return null;
      if (existing.revision !== input.revision) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed after it was loaded."
        );
      }
      const [updated] = await database.update(projects).set({
        archived: input.archived ?? existing.archived,
        description: input.description ?? existing.description,
        name: input.name ?? existing.name,
        revision: existing.revision + 1,
        updatedAt: input.timestamp
      }).where(
        and(
          eq(projects.id, input.id),
          eq(projects.ownerId, input.ownerId),
          eq(projects.revision, input.revision)
        )
      ).returning();
      if (!updated) {
        throw new PersistenceError(
          "PERSISTENCE_CONFLICT",
          "The project changed while it was being saved."
        );
      }
      return projectRecord(updated);
    }
  };
  return {
    accounts: {
      async count() {
        const result = await database.select({ id: actors.id }).from(actors);
        return result.length;
      },
      async create(input) {
        try {
          const [created] = await database.insert(actors).values({
            createdAt: input.timestamp,
            displayName: input.displayName,
            id: input.id,
            passwordHash: input.passwordHash,
            username: input.username.toLowerCase()
          }).returning();
          if (!created) {
            throw new PersistenceError("DATABASE_UNAVAILABLE", "Account was not created.");
          }
          return actorRecord(created);
        } catch (error) {
          if (isDuplicateError(error)) {
            throw new PersistenceError("PERSISTENCE_DUPLICATE", "Username is already in use.");
          }
          throw error;
        }
      },
      async findById(id) {
        const [actor] = await database.select().from(actors).where(eq(actors.id, id)).limit(1);
        return actor ? actorRecord(actor) : null;
      },
      async findByUsername(username) {
        const [actor] = await database.select().from(actors).where(eq(actors.username, username.toLowerCase())).limit(1);
        return actor ? actorRecord(actor) : null;
      }
    },
    async close() {
      await client.close();
    },
    diagnosticJobs: {
      async cancel(id, timestamp2) {
        const [existing] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, id)).limit(1);
        if (!existing) return null;
        if (existing.status === "completed" || existing.status === "failed" || existing.status === "cancelled") {
          return diagnosticJobRecord(existing);
        }
        const [cancelled] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: timestamp2,
          leaseExpiresAt: null,
          status: "cancelled",
          updatedAt: timestamp2,
          workerId: null
        }).where(eq(diagnosticJobs.id, id)).returning();
        if (existing.status === "running") {
          await database.update(diagnosticJobAttempts).set({ completedAt: timestamp2, status: "cancelled" }).where(
            and(
              eq(diagnosticJobAttempts.jobId, id),
              eq(diagnosticJobAttempts.attempt, existing.attempt)
            )
          );
        }
        return cancelled ? diagnosticJobRecord(cancelled) : null;
      },
      async claimNext(input) {
        await client.exec("BEGIN");
        try {
          const claimed = await client.query(
            `WITH candidate AS (
              SELECT id
              FROM diagnostic_jobs
              WHERE status = 'queued'
                 OR (status = 'running' AND lease_expires_at < $1)
              ORDER BY created_at ASC
              LIMIT 1
              FOR UPDATE
            )
            UPDATE diagnostic_jobs
            SET status = 'running',
                attempt = attempt + 1,
                worker_id = $2,
                claim_token_hash = $3,
                lease_expires_at = $4,
                updated_at = $1,
                completed_at = NULL,
                result = NULL,
                last_error = NULL
            WHERE id = (SELECT id FROM candidate)
            RETURNING id, attempt`,
            [
              input.timestamp.toISOString(),
              input.workerId,
              input.leaseTokenHash,
              input.leaseExpiresAt.toISOString()
            ]
          );
          const record = claimed.rows[0];
          if (!record) {
            await client.exec("COMMIT");
            return null;
          }
          if (record.attempt > 1) {
            await database.update(diagnosticJobAttempts).set({
              completedAt: input.timestamp,
              error: "Worker lease expired before completion.",
              status: "expired"
            }).where(
              and(
                eq(diagnosticJobAttempts.jobId, record.id),
                eq(diagnosticJobAttempts.attempt, record.attempt - 1),
                eq(diagnosticJobAttempts.status, "running")
              )
            );
          }
          await database.insert(diagnosticJobAttempts).values({
            attempt: record.attempt,
            completedAt: null,
            error: null,
            heartbeatAt: input.timestamp,
            id: randomUUID2(),
            jobId: record.id,
            startedAt: input.timestamp,
            status: "running",
            workerId: input.workerId
          });
          await client.exec("COMMIT");
          const [job] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, record.id)).limit(1);
          return job ? diagnosticJobRecord(job) : null;
        } catch (error) {
          await client.exec("ROLLBACK");
          throw error;
        }
      },
      async complete(input) {
        const [completed] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: input.timestamp,
          leaseExpiresAt: null,
          result: input.result,
          status: "completed",
          updatedAt: input.timestamp,
          workerId: null
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!completed) return null;
        await database.update(diagnosticJobAttempts).set({ completedAt: input.timestamp, status: "completed" }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, completed.attempt)
          )
        );
        return diagnosticJobRecord(completed);
      },
      async create(input) {
        const [created] = await database.insert(diagnosticJobs).values({
          attempt: 0,
          claimTokenHash: null,
          completedAt: null,
          correlationId: input.correlationId,
          createdAt: input.timestamp,
          id: input.id,
          lastError: null,
          leaseExpiresAt: null,
          message: input.request.message,
          result: null,
          status: "queued",
          updatedAt: input.timestamp,
          workerId: null
        }).returning();
        if (!created) throw new PersistenceError("DATABASE_UNAVAILABLE", "Job was not created.");
        return diagnosticJobRecord(created);
      },
      async fail(input) {
        const [failed] = await database.update(diagnosticJobs).set({
          claimTokenHash: null,
          completedAt: input.timestamp,
          lastError: input.error,
          leaseExpiresAt: null,
          result: null,
          status: "failed",
          updatedAt: input.timestamp,
          workerId: null
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!failed) return null;
        await database.update(diagnosticJobAttempts).set({ completedAt: input.timestamp, error: input.error, status: "failed" }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, failed.attempt)
          )
        );
        return diagnosticJobRecord(failed);
      },
      async get(id) {
        const [job] = await database.select().from(diagnosticJobs).where(eq(diagnosticJobs.id, id)).limit(1);
        return job ? diagnosticJobRecord(job) : null;
      },
      async heartbeat(input) {
        const [heartbeat] = await database.update(diagnosticJobs).set({
          leaseExpiresAt: input.leaseExpiresAt,
          updatedAt: input.timestamp
        }).where(
          and(
            eq(diagnosticJobs.id, input.id),
            eq(diagnosticJobs.status, "running"),
            eq(diagnosticJobs.claimTokenHash, input.leaseTokenHash)
          )
        ).returning();
        if (!heartbeat) return null;
        await database.update(diagnosticJobAttempts).set({ heartbeatAt: input.timestamp }).where(
          and(
            eq(diagnosticJobAttempts.jobId, input.id),
            eq(diagnosticJobAttempts.attempt, heartbeat.attempt)
          )
        );
        return diagnosticJobRecord(heartbeat);
      }
    },
    kind: "pglite",
    migrations,
    projects: projectRepository,
    sessions: {
      async create(input) {
        const [created] = await database.insert(sessions).values({
          actorId: input.actorId,
          createdAt: input.timestamp,
          expiresAt: input.expiresAt,
          id: input.id,
          tokenHash: input.tokenHash
        }).returning();
        if (!created)
          throw new PersistenceError("DATABASE_UNAVAILABLE", "Session was not created.");
        return sessionRecord(created);
      },
      async deleteByTokenHash(tokenHash2) {
        await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash2));
      },
      async deleteExpired(timestamp2) {
        const deleted = await database.delete(sessions).where(lt2(sessions.expiresAt, timestamp2)).returning({ id: sessions.id });
        return deleted.length;
      },
      async findByTokenHash(tokenHash2) {
        const [session] = await database.select().from(sessions).where(eq(sessions.tokenHash, tokenHash2)).limit(1);
        return session ? sessionRecord(session) : null;
      }
    }
  };
}

// ../../packages/db/src/index.ts
var PersistenceError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PersistenceError";
  }
  code;
};

// src/app.ts
import { Type as Type4 } from "@sinclair/typebox";
import Fastify from "fastify";

// src/routes/auth.ts
import { randomUUID as randomUUID4 } from "crypto";

// src/security.ts
import { createHash as createHash2, randomBytes, randomUUID as randomUUID3 } from "crypto";
import { hash, verify } from "@node-rs/argon2";
var SessionCookieName = "hymui_session";
var SessionLifetimeSeconds = 60 * 60 * 24 * 7;
var passwordOptions = {
  algorithm: 2,
  memoryCost: 19456,
  outputLen: 32,
  parallelism: 1,
  timeCost: 2
};
function sessionTokenHash(token) {
  return createHash2("sha256").update(token).digest("hex");
}
async function hashPassword(password) {
  return hash(password, passwordOptions);
}
async function verifyPassword(passwordHash, password) {
  return verify(passwordHash, password);
}
async function createSession(database, actorId) {
  const token = randomBytes(32).toString("base64url");
  const timestamp2 = /* @__PURE__ */ new Date();
  const expiresAt = new Date(timestamp2.getTime() + SessionLifetimeSeconds * 1e3);
  await database.sessions.create({
    actorId,
    expiresAt,
    id: randomUUID3(),
    timestamp: timestamp2,
    tokenHash: sessionTokenHash(token)
  });
  return { expiresAt, token };
}
function setSessionCookie(reply, token, secure) {
  reply.setCookie(SessionCookieName, token, {
    httpOnly: true,
    maxAge: SessionLifetimeSeconds,
    path: "/",
    sameSite: "strict",
    secure
  });
}
function clearSessionCookie(reply, secure) {
  reply.clearCookie(SessionCookieName, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure
  });
}
async function authenticatedActor(request, database) {
  const token = request.cookies[SessionCookieName];
  if (!token) return null;
  const tokenHash2 = sessionTokenHash(token);
  const session = await database.sessions.findByTokenHash(tokenHash2);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await database.sessions.deleteByTokenHash(tokenHash2);
    return null;
  }
  const account = await database.accounts.findById(session.actorId);
  if (!account) return null;
  return {
    createdAt: account.createdAt,
    displayName: account.displayName,
    id: account.id,
    username: account.username
  };
}

// src/routes/auth.ts
function errorResponse(correlationId, code, message) {
  return { code, correlationId, message };
}
function publicActor(account) {
  return {
    createdAt: account.createdAt,
    displayName: account.displayName,
    id: account.id,
    username: account.username
  };
}
async function registerAuthRoutes(app2, database, config2) {
  const typedApp = app2.withTypeProvider();
  const secureCookie = config2.mode === "hosted";
  typedApp.post(
    "/api/v1/auth/register",
    {
      schema: {
        body: RegisterRequestSchema,
        response: {
          201: AuthSessionSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (config2.edition !== "hosted" && await database.accounts.count() > 0) {
        return reply.status(403).send(
          errorResponse(
            correlationId,
            "REGISTRATION_CLOSED",
            "Create additional accounts through workspace membership."
          )
        );
      }
      try {
        const timestamp2 = /* @__PURE__ */ new Date();
        const account = await database.accounts.create({
          displayName: request.body.displayName.trim(),
          id: randomUUID4(),
          passwordHash: await hashPassword(request.body.password),
          timestamp: timestamp2,
          username: request.body.username.toLowerCase()
        });
        const session = await createSession(database, account.id);
        setSessionCookie(reply, session.token, secureCookie);
        return reply.status(201).send({
          actor: publicActor(account),
          expiresAt: session.expiresAt.toISOString()
        });
      } catch (error) {
        if (error instanceof PersistenceError && error.code === "PERSISTENCE_DUPLICATE") {
          return reply.status(409).send(errorResponse(correlationId, "USERNAME_TAKEN", "Username is already in use."));
        }
        throw error;
      }
    }
  );
  typedApp.post(
    "/api/v1/auth/login",
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: AuthSessionSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      const account = await database.accounts.findByUsername(request.body.username);
      const valid = account?.passwordHash && await verifyPassword(account.passwordHash, request.body.password);
      if (!account || !valid) {
        return reply.status(401).send(
          errorResponse(correlationId, "INVALID_CREDENTIALS", "Username or password is invalid.")
        );
      }
      const session = await createSession(database, account.id);
      setSessionCookie(reply, session.token, secureCookie);
      return reply.send({
        actor: publicActor(account),
        expiresAt: session.expiresAt.toISOString()
      });
    }
  );
  typedApp.post(
    "/api/v1/auth/local",
    {
      schema: {
        response: {
          200: AuthSessionSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (config2.edition !== "local") {
        return reply.status(403).send(
          errorResponse(correlationId, "LOCAL_AUTH_DISABLED", "Local profile is unavailable.")
        );
      }
      let account = await database.accounts.findByUsername("local");
      if (!account) {
        if (await database.accounts.count() > 0) {
          return reply.status(409).send(
            errorResponse(
              correlationId,
              "LOCAL_PROFILE_CONFLICT",
              "This Local installation already has an account."
            )
          );
        }
        account = await database.accounts.create({
          displayName: "Local profile",
          id: randomUUID4(),
          passwordHash: null,
          timestamp: /* @__PURE__ */ new Date(),
          username: "local"
        });
      }
      const session = await createSession(database, account.id);
      setSessionCookie(reply, session.token, secureCookie);
      return reply.send({
        actor: publicActor(account),
        expiresAt: session.expiresAt.toISOString()
      });
    }
  );
  typedApp.get(
    "/api/v1/auth/session",
    {
      schema: {
        response: {
          200: AuthSessionSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      const actor = await authenticatedActor(request, database);
      if (!actor) {
        return reply.status(401).send(errorResponse(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      const token = request.cookies[SessionCookieName];
      const session = token ? await database.sessions.findByTokenHash(sessionTokenHash(token)) : null;
      if (!session) {
        return reply.status(401).send(errorResponse(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      return reply.send({ actor, expiresAt: session.expiresAt.toISOString() });
    }
  );
  typedApp.post(
    "/api/v1/auth/logout",
    {
      schema: {
        response: {
          204: { type: "null" }
        }
      }
    },
    async (request, reply) => {
      const token = request.cookies[SessionCookieName];
      if (token) await database.sessions.deleteByTokenHash(sessionTokenHash(token));
      clearSessionCookie(reply, secureCookie);
      return reply.status(204).send(null);
    }
  );
}

// src/routes/internal-jobs.ts
import { createHash as createHash3, randomBytes as randomBytes2, timingSafeEqual } from "crypto";
import { Type as Type2 } from "@sinclair/typebox";
var JobParamsSchema = Type2.Object(
  {
    id: Type2.String({ format: "uuid" })
  },
  { additionalProperties: false }
);
function errorResponse2(correlationId, code, message) {
  return { code, correlationId, message };
}
function tokenHash(token) {
  return createHash3("sha256").update(token).digest("hex");
}
function publicJob(job) {
  return {
    completedAt: job.completedAt,
    correlationId: job.correlationId,
    createdAt: job.createdAt,
    id: job.id,
    message: job.message,
    result: job.result,
    status: job.status,
    updatedAt: job.updatedAt
  };
}
function isInternalRequest(request, internalToken) {
  const received = Buffer.from(request.headers.authorization ?? "");
  const expected = Buffer.from(`Bearer ${internalToken}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
async function registerInternalJobRoutes(app2, database, config2) {
  const typedApp = app2.withTypeProvider();
  typedApp.post(
    "/internal/v1/jobs/claim",
    {
      schema: {
        body: WorkerClaimRequestSchema,
        response: {
          200: DiagnosticJobClaimSchema,
          204: Type2.Null(),
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (!isInternalRequest(request, config2.internalToken)) {
        return reply.status(401).send(
          errorResponse2(
            correlationId,
            "INTERNAL_AUTH_REQUIRED",
            "Internal authorization failed."
          )
        );
      }
      const timestamp2 = /* @__PURE__ */ new Date();
      const leaseExpiresAt = new Date(timestamp2.getTime() + request.body.leaseSeconds * 1e3);
      const leaseToken = randomBytes2(32).toString("base64url");
      const job = await database.diagnosticJobs.claimNext({
        leaseExpiresAt,
        leaseTokenHash: tokenHash(leaseToken),
        timestamp: timestamp2,
        workerId: request.body.workerId
      });
      if (!job) return reply.status(204).send(null);
      return reply.send({
        attempt: job.attempt,
        job: publicJob(job),
        leaseExpiresAt: leaseExpiresAt.toISOString(),
        leaseToken
      });
    }
  );
  typedApp.post(
    "/internal/v1/jobs/:id/heartbeat",
    {
      schema: {
        body: WorkerHeartbeatRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (!isInternalRequest(request, config2.internalToken)) {
        return reply.status(401).send(
          errorResponse2(
            correlationId,
            "INTERNAL_AUTH_REQUIRED",
            "Internal authorization failed."
          )
        );
      }
      const timestamp2 = /* @__PURE__ */ new Date();
      const job = await database.diagnosticJobs.heartbeat({
        id: request.params.id,
        leaseExpiresAt: new Date(timestamp2.getTime() + request.body.leaseSeconds * 1e3),
        leaseTokenHash: tokenHash(request.body.leaseToken),
        timestamp: timestamp2
      });
      if (!job) {
        return reply.status(409).send(
          errorResponse2(
            correlationId,
            "JOB_LEASE_CONFLICT",
            "The job lease is no longer active."
          )
        );
      }
      return reply.send(publicJob(job));
    }
  );
  typedApp.post(
    "/internal/v1/jobs/:id/complete",
    {
      schema: {
        body: WorkerCompleteRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (!isInternalRequest(request, config2.internalToken)) {
        return reply.status(401).send(
          errorResponse2(
            correlationId,
            "INTERNAL_AUTH_REQUIRED",
            "Internal authorization failed."
          )
        );
      }
      const job = await database.diagnosticJobs.complete({
        id: request.params.id,
        leaseTokenHash: tokenHash(request.body.leaseToken),
        result: request.body.result,
        timestamp: /* @__PURE__ */ new Date()
      });
      if (!job) {
        return reply.status(409).send(
          errorResponse2(
            correlationId,
            "JOB_LEASE_CONFLICT",
            "The job lease is no longer active."
          )
        );
      }
      return reply.send(publicJob(job));
    }
  );
  typedApp.post(
    "/internal/v1/jobs/:id/fail",
    {
      schema: {
        body: WorkerFailRequestSchema,
        params: JobParamsSchema,
        response: {
          200: DiagnosticJobSchema,
          401: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      if (!isInternalRequest(request, config2.internalToken)) {
        return reply.status(401).send(
          errorResponse2(
            correlationId,
            "INTERNAL_AUTH_REQUIRED",
            "Internal authorization failed."
          )
        );
      }
      const job = await database.diagnosticJobs.fail({
        error: request.body.error,
        id: request.params.id,
        leaseTokenHash: tokenHash(request.body.leaseToken),
        timestamp: /* @__PURE__ */ new Date()
      });
      if (!job) {
        return reply.status(409).send(
          errorResponse2(
            correlationId,
            "JOB_LEASE_CONFLICT",
            "The job lease is no longer active."
          )
        );
      }
      return reply.send(publicJob(job));
    }
  );
}

// src/routes/projects.ts
import { randomUUID as randomUUID5 } from "crypto";
import { Type as Type3 } from "@sinclair/typebox";
var ProjectParamsSchema = Type3.Object(
  {
    id: Type3.String({ format: "uuid" })
  },
  { additionalProperties: false }
);
function errorResponse3(correlationId, code, message) {
  return { code, correlationId, message };
}
async function registerProjectRoutes(app2, database) {
  const typedApp = app2.withTypeProvider();
  typedApp.get(
    "/api/v1/projects",
    {
      schema: {
        response: {
          200: ProjectListSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      const actor = await authenticatedActor(request, database);
      if (!actor) {
        return reply.status(401).send(errorResponse3(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      return reply.send({ projects: [...await database.projects.listByActor(actor.id)] });
    }
  );
  typedApp.post(
    "/api/v1/projects",
    {
      schema: {
        body: CreateProjectRequestSchema,
        response: {
          201: ProjectSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      const actor = await authenticatedActor(request, database);
      if (!actor) {
        return reply.status(401).send(errorResponse3(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      const project = await database.projects.create({
        ...request.body.description === void 0 ? {} : { description: request.body.description },
        id: randomUUID5(),
        name: request.body.name.trim(),
        ownerId: actor.id,
        timestamp: /* @__PURE__ */ new Date()
      });
      return reply.status(201).send(project);
    }
  );
  typedApp.patch(
    "/api/v1/projects/:id",
    {
      schema: {
        body: UpdateProjectRequestSchema,
        params: ProjectParamsSchema,
        response: {
          200: ProjectSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id");
      const actor = await authenticatedActor(request, database);
      if (!actor) {
        return reply.status(401).send(errorResponse3(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      try {
        const project = await database.projects.update({
          ...request.body,
          id: request.params.id,
          ownerId: actor.id,
          timestamp: /* @__PURE__ */ new Date()
        });
        if (!project) {
          return reply.status(404).send(errorResponse3(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
        }
        return reply.send(project);
      } catch (error) {
        if (error instanceof PersistenceError && error.code === "PERSISTENCE_CONFLICT") {
          return reply.status(409).send(
            errorResponse3(
              correlationId,
              "PROJECT_REVISION_CONFLICT",
              "Project changed after it was loaded."
            )
          );
        }
        throw error;
      }
    }
  );
}

// src/app.ts
var JobParamsSchema2 = Type4.Object(
  {
    id: Type4.String({ format: "uuid" })
  },
  { additionalProperties: false }
);
function correlationIdFrom(headers) {
  const value = headers[CorrelationIdHeader];
  return resolveCorrelationId(typeof value === "string" ? value : void 0);
}
function errorResponse4(correlationId, code, message) {
  return { code, correlationId, message };
}
async function buildApiApp(options = {}) {
  const config2 = options.config ?? loadRuntimeConfig("api");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const ownsDatabase = options.database === void 0;
  if (ownsDatabase && config2.databaseDriver !== "pglite") {
    throw new Error(
      `Database driver "${config2.databaseDriver}" is not implemented in the current Plan 02 slice.`
    );
  }
  const database = options.database ?? await createPgliteDatabase(config2.databaseUrl ? { dataDirectory: config2.databaseUrl } : {});
  const app2 = Fastify({ logger: options.logger ?? true }).withTypeProvider();
  await app2.register(cookie);
  await app2.register(cors, {
    allowedHeaders: ["content-type", CorrelationIdHeader],
    credentials: true,
    exposedHeaders: [CorrelationIdHeader],
    origin: true
  });
  if (ownsDatabase) {
    app2.addHook("onClose", async () => {
      await database.close();
    });
  }
  app2.addHook("onRequest", async (request, reply) => {
    const correlationId = correlationIdFrom(request.headers);
    reply.header(CorrelationIdHeader, correlationId);
  });
  app2.setErrorHandler((error, request, reply) => {
    const correlationId = correlationIdFrom(request.headers);
    const isValidationError = typeof error === "object" && error !== null && "validation" in error;
    request.log.error({ correlationId, error }, "Request failed");
    reply.status(isValidationError ? 400 : 500).send(
      errorResponse4(
        correlationId,
        isValidationError ? "INVALID_REQUEST" : "INTERNAL_ERROR",
        isValidationError ? "The request does not match the API contract." : "The request failed."
      )
    );
  });
  app2.get(
    "/api/v1/health",
    {
      schema: {
        response: {
          200: HealthResponseSchema
        }
      }
    },
    async (request) => {
      const correlationId = correlationIdFrom(request.headers);
      let worker = "ready";
      try {
        const response = await fetchImpl(`${config2.workerUrl}/internal/v1/health`, {
          headers: { [CorrelationIdHeader]: correlationId },
          signal: AbortSignal.timeout(800)
        });
        if (!response.ok) worker = "degraded";
      } catch {
        worker = "unavailable";
      }
      return {
        apiVersion: ApiVersion,
        correlationId,
        edition: config2.edition,
        mode: config2.mode,
        service: "api",
        state: worker === "ready" ? "ready" : "degraded",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: HymuiVersion,
        worker
      };
    }
  );
  app2.post(
    "/api/v1/diagnostics/jobs",
    {
      schema: {
        body: DiagnosticJobRequestSchema,
        response: {
          202: DiagnosticJobSchema,
          503: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.create({
        correlationId,
        id: randomUUID6(),
        request: request.body,
        timestamp: /* @__PURE__ */ new Date()
      });
      request.log.info({ correlationId, jobId: job.id }, "Durable diagnostic job queued");
      return reply.status(202).send(job);
    }
  );
  app2.get(
    "/api/v1/diagnostics/jobs/:id",
    {
      schema: {
        params: JobParamsSchema2,
        response: {
          200: DiagnosticJobSchema,
          404: ErrorResponseSchema,
          503: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.get(request.params.id);
      if (!job) {
        return reply.status(404).send(errorResponse4(correlationId, "JOB_NOT_FOUND", "The job was not found."));
      }
      return reply.send(job);
    }
  );
  app2.post(
    "/api/v1/diagnostics/jobs/:id/cancel",
    {
      schema: {
        params: JobParamsSchema2,
        response: {
          200: DiagnosticJobSchema,
          404: ErrorResponseSchema,
          503: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const correlationId = correlationIdFrom(request.headers);
      const job = await database.diagnosticJobs.cancel(request.params.id, /* @__PURE__ */ new Date());
      if (!job) {
        return reply.status(404).send(errorResponse4(correlationId, "JOB_NOT_FOUND", "The job was not found."));
      }
      return reply.send(job);
    }
  );
  await registerAuthRoutes(app2, database, config2);
  await registerInternalJobRoutes(app2, database, config2);
  await registerProjectRoutes(app2, database);
  return app2;
}

// src/index.ts
var config = loadRuntimeConfig("api");
var app = await buildApiApp({ config });
async function shutdown(signal) {
  app.log.info({ signal }, "Stopping Hymui API");
  await app.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
try {
  await app.listen({ host: config.apiHost, port: config.apiPort });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
//# sourceMappingURL=index.js.map