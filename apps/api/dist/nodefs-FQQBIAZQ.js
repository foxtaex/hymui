import {
  C,
  u,
  ur
} from "./chunk-O57GPHJY.js";

// ../../node_modules/.pnpm/@electric-sql+pglite@0.3.8/node_modules/@electric-sql/pglite/dist/fs/nodefs.js
import * as s from "fs";
import * as o from "path";
u();
var m = class extends ur {
  constructor(t) {
    super(t), this.rootDir = o.resolve(t), s.existsSync(o.join(this.rootDir)) || s.mkdirSync(this.rootDir);
  }
  async init(t, e) {
    return this.pg = t, { emscriptenOpts: { ...e, preRun: [...e.preRun || [], (r) => {
      let c = r.FS.filesystems.NODEFS;
      r.FS.mkdir(C), r.FS.mount(c, { root: this.rootDir }, C);
    }] } };
  }
  async closeFs() {
    this.pg.Module.FS.quit();
  }
};
export {
  m as NodeFS
};
//# sourceMappingURL=nodefs-FQQBIAZQ.js.map