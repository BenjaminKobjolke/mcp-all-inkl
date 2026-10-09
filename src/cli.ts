import { parseArgs } from "node:util";
import { TOOLS, callTool } from "./server.js";

const USAGE = `Usage: mcp-all-inkl <tool> <action> [key=value ...] [--pick a,b] [--filter key=value]...
       mcp-all-inkl            (no arguments: start MCP stdio server)

Tools and actions:
${TOOLS.map((t) => `  ${t.name.replace(/^kas_/, "")}: ${t.actions.join(", ")}`).join("\n")}`;

function toObject(pairs: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of pairs) {
    const i = pair.indexOf("=");
    if (i < 1) throw new Error(`Erwartet key=value, erhalten: ${pair}`);
    out[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return out;
}

export async function runCli(argv: string[]): Promise<void> {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        pick: { type: "string" },
        filter: { type: "string", multiple: true },
        help: { type: "boolean", short: "h" },
      },
    });
    const [tool, action, ...pairs] = positionals;
    if (values.help) { console.log(USAGE); return; }
    if (!tool || !action) { console.error(USAGE); process.exitCode = 1; return; }

    const result = await callTool(
      tool.startsWith("kas_") ? tool : `kas_${tool}`,
      {
        action,
        params: toObject(pairs),
        pick: values.pick?.split(","),
        filter: values.filter && toObject(values.filter),
      },
      process.env.READONLY === "true",
    );
    const text = result.content[0].text;
    if (result.isError) { console.error(text); process.exitCode = 1; }
    else console.log(text);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  }
}
