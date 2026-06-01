#!/usr/bin/env bash
#
# Registers the Mavra MCP server in the local AI client.
# Defaults to production; pass --dev to target the dev environment.
# Pass --print to only print the resolved URL + command without executing.
#
set -euo pipefail

URL="https://api.maiacompany.io/mcp"
ENV_NAME="production"
PRINT_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --dev)
      URL="https://dev.api.maiacompany.io/mcp"
      ENV_NAME="development"
      ;;
    --print)
      PRINT_ONLY=1
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: connect.sh [--dev] [--print]" >&2
      exit 2
      ;;
  esac
done

echo "Mavra MCP server (${ENV_NAME}): ${URL}"

CMD=(claude mcp add --transport http mavra "${URL}")

if [ "$PRINT_ONLY" -eq 1 ]; then
  printf 'Command: %s\n' "${CMD[*]}"
  exit 0
fi

if command -v claude >/dev/null 2>&1; then
  if "${CMD[@]}"; then
    echo "Connected. Next: ask your AI to log in to Mavra (the 'login' tool)."
  else
    echo "If the server 'mavra' already exists, remove it first:" >&2
    echo "  claude mcp remove mavra" >&2
    echo "then re-run this script." >&2
    exit 1
  fi
else
  echo "The 'claude' CLI was not found. Add the server manually in your client:"
  echo "  - Claude Desktop / Cursor: add a remote (HTTP) MCP server with URL ${URL}"
  echo "  - Or install Claude Code and run: ${CMD[*]}"
fi
