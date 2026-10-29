const API_URL = "http://localhost:3333/api/v1";
const FRONTEND_ORIGIN = "http://localhost:3000";

if (API_URL !== "http://localhost:3333/api/v1") {
  throw new Error("O smoke somente leitura só pode apontar para o backend local de desenvolvimento na porta 3333.");
}

const checks = [
  ["health", `${API_URL}/health`, (data) => data && typeof data === "object"],
  ["status", `${API_URL}/loja/status`, (data) => data && typeof data.aberta === "boolean"],
  ["cardapio", `${API_URL}/cardapio`, Array.isArray],
  ["pagamentos", `${API_URL}/metodos-pagamento`, Array.isArray],
  ["openapi", "http://localhost:3333/openapi.json", (data) => data && typeof data.openapi === "string"],
];

for (const [name, url, validate] of checks) {
  const response = await fetch(url, { method: "GET", headers: { Origin: FRONTEND_ORIGIN } });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  if (response.headers.get("access-control-allow-origin") !== FRONTEND_ORIGIN) throw new Error(`${name}: origem CORS inesperada`);
  if (response.headers.get("access-control-allow-credentials") !== "true") throw new Error(`${name}: credenciais CORS não habilitadas`);
  const envelope = await response.json();
  const data = name === "openapi" ? envelope : envelope?.data;
  if (name !== "openapi" && envelope?.status !== "success") throw new Error(`${name}: envelope incompatível`);
  if (!validate(data)) throw new Error(`${name}: formato incompatível`);
  console.log(`${name}: GET ${response.status} · CORS válido · formato válido`);
}

console.log("Smoke somente leitura concluído; nenhum método de escrita foi enviado.");
