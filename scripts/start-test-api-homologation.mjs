import { spawn } from "node:child_process";

const expectedApi = "http://localhost:3334/api/v1";
if (process.env.RUN_REAL_TEST_E2E !== "true" || process.env.TEST_DATABASE_ISOLATION_VERIFIED !== "true") {
  throw new Error("Homologação TEST bloqueada: exija opt-in e prova prévia de isolamento do banco.");
}
if (process.env.REAL_TEST_API_URL !== expectedApi) {
  throw new Error("Homologação TEST bloqueada: REAL_TEST_API_URL deve apontar exatamente para localhost:3334/api/v1.");
}
if (!process.env.REAL_TEST_ADMIN_EMAIL?.endsWith("@example.invalid") || !process.env.REAL_TEST_ADMIN_PASSWORD) {
  throw new Error("Homologação TEST bloqueada: use somente credencial efêmera example.invalid criada pela fixture rastreável.");
}

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-H", "localhost", "-p", "3000"], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_API_URL: expectedApi, NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
