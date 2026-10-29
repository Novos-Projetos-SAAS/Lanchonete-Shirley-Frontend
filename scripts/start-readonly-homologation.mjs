import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "localhost", "-p", "3000"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: "http://localhost:3333/api/v1",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
