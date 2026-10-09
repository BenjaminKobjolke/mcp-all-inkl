import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUsage } from "./account.js";

const r = (max: number, reserved: number, created: number, exceeded = "false") =>
  ({ max, reserved, created, used: reserved + created, free: max - reserved - created, exceeded });

const main = {
  max_webspace: { ...r(3072, 2724, 1661, "true"), used: 2724, free: 348 },
  max_cronjobs: r(5, 3, 0),
  max_database: r(6, 4, 1),
  max_ftpuser: r(20, 6, 2),
};

const acc = (login: string, usedKb: number) => ({
  account_login: login, account_comment: login, max_webspace: 500, used_account_space: usedKb,
  max_cronjobs: 1, max_databases: 1, max_ftpuser: 2,
});

test("buildUsage", () => {
  const out = buildUsage(
    main,
    [acc("with", 616016.23), acc("without", 69039.94), acc("broken", 0)],
    { with: { max_cronjobs: r(1, 0, 1), max_database: r(1, 0, 0), max_ftpuser: r(2, 0, 2) }, broken: "Fehler: Auth-Fehler" },
  );

  assert.deepEqual(out.main.webspace_mb, { max: 3072, reserved: 2724, own: 1661, free: 348, exceeded: true });
  assert.deepEqual((out.main as Record<string, unknown>).databases, { max: 6, reserved: 4, own: 1, free: 1 });

  const [withPw, withoutPw, broken] = out.subaccounts as Record<string, unknown>[];
  assert.deepEqual(withPw.webspace_mb, { max: 500, used: 602, over: true });
  assert.deepEqual(withPw.cronjobs, { max: 1, used: 1 });
  assert.deepEqual(withPw.databases, { max: 1, used: 0 });
  assert.deepEqual(withPw.ftpusers, { max: 2, used: 2 });

  assert.deepEqual(withoutPw.webspace_mb, { max: 500, used: 67, over: false });
  assert.deepEqual(withoutPw.ftpusers, { max: 2, used: null });
  assert.equal("error" in withoutPw, false);

  assert.equal(broken.error, "Fehler: Auth-Fehler");
  assert.deepEqual(broken.cronjobs, { max: 1, used: null });
});
