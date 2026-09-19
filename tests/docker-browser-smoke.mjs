// The current workflow is MCP-first. This entry point now runs the isolated
// end-to-end harness instead of writing fixtures to a user-supplied preview URL.
// Set PLAYWRIGHT_MODULE to include browser checks.
await import('./mcp-smoke.mjs');
