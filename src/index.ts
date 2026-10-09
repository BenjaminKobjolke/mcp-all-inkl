#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

if (process.argv.length > 2) {
  const { runCli } = await import("./cli.js");
  await runCli(process.argv.slice(2));
} else {
  const server = createServer({ readonly: false });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
