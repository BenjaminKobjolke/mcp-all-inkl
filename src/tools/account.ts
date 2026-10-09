import { kasCall, kasPassword, requireParams } from "../kas-client.js";
import type { ToolInput, McpResult } from "../types.js";

const A: Record<string, string> = {
  list: "get_accounts",
  get_resources: "get_accountresources",
  get_settings: "get_accountsettings",
  get_server_info: "get_server_information",
  create: "add_account",
  update: "update_account",
  update_settings: "update_accountsettings",
  update_superuser: "update_superusersettings",
  delete: "delete_account",
};

const REQ: Record<string, string[]> = {
  create: ["account_kas_password", "account_ftp_password"],
  update: ["account_login", "account_kas_password"],
  update_superuser: ["account_login"],
  delete: ["account_login"],
};

type Res = Record<string, { max: number; reserved: number; created: number; used: number; free: number; exceeded: string }>;
type Acc = Record<string, unknown>;

// report key -> [key in get_accountresources, quota key in get_accounts]
const COUNTED: Record<string, [string, string]> = {
  cronjobs: ["max_cronjobs", "max_cronjobs"],
  databases: ["max_database", "max_databases"],
  ftpusers: ["max_ftpuser", "max_ftpuser"],
};

// sub: per subaccount login its own get_accountresources, or an error text. Missing = no password configured.
export function buildUsage(main: Res, accounts: Acc[], sub: Record<string, Res | string>) {
  const total = (k: string) => ({ max: main[k].max, reserved: main[k].reserved, own: main[k].created, free: main[k].free });
  return {
    main: {
      webspace_mb: { ...total("max_webspace"), exceeded: main.max_webspace.exceeded === "true" },
      ...Object.fromEntries(Object.entries(COUNTED).map(([name, [k]]) => [name, total(k)])),
    },
    subaccounts: accounts.map((a) => {
      const res = sub[String(a.account_login)];
      // ponytail: used_account_space assumed KB (KAS does not label the unit), change divisor if wrong
      const usedMb = Math.round(Number(a.used_account_space) / 1024);
      return {
        login: a.account_login,
        comment: a.account_comment,
        webspace_mb: { max: a.max_webspace, used: usedMb, over: usedMb > Number(a.max_webspace) },
        ...Object.fromEntries(Object.entries(COUNTED).map(([name, [k, quota]]) =>
          [name, { max: a[quota], used: typeof res === "object" ? res[k]?.used ?? null : null }])),
        ...(typeof res === "string" ? { error: res } : {}),
      };
    }),
  };
}

async function usage(): Promise<McpResult> {
  const main = await kasCall("get_accountresources");
  if (main.isError) return main;
  const list = await kasCall("get_accounts");
  if (list.isError) return list;
  const parsed = JSON.parse(list.content[0].text);
  const accounts: Acc[] = Array.isArray(parsed) ? parsed : [];
  const sub: Record<string, Res | string> = {};
  for (const a of accounts) {
    const login = String(a.account_login);
    if (!kasPassword(login)) continue;
    const r = await kasCall("get_accountresources", {}, login);
    sub[login] = r.isError ? r.content[0].text : JSON.parse(r.content[0].text);
  }
  return { content: [{ type: "text", text: JSON.stringify(buildUsage(JSON.parse(main.content[0].text), accounts, sub), null, 2) }] };
}

export async function handleAccount(input: ToolInput): Promise<McpResult> {
  if (input.action === "usage") return usage();
  const fn = A[input.action];
  if (!fn) return { isError: true, content: [{ type: "text", text: `Unbekannte Action: ${input.action}` }] };
  const e = requireParams(input.params, REQ[input.action] ?? []);
  if (e) return { isError: true, content: [{ type: "text", text: e }] };
  return kasCall(fn, input.params ?? {});
}
