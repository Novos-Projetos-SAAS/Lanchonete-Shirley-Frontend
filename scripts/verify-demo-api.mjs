const API_URL = "http://localhost:3333/api/v1";
const FRONTEND_ORIGIN = "http://localhost:3000";
const DEMO_MARKER = "[DEMO-SHIRLEY-V1]";

const expectedProducts = new Set([
  "Hamburguer Classico", "X-Salada", "X-Bacon", "X-Egg", "X-Tudo", "X-Frango", "X-Calabresa",
  "Batata Frita Pequena", "Batata Frita Grande", "Calabresa Acebolada", "Agua Mineral 500 ml",
  "Refrigerante Lata 350 ml", "Suco Natural 300 ml", "Refrigerante 2 Litros",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path) {
  const response = await fetch(`${API_URL}${path}`, { method: "GET", headers: { Origin: FRONTEND_ORIGIN } });
  assert(response.ok, `GET ${path}: HTTP ${response.status}`);
  assert(response.headers.get("access-control-allow-origin") === FRONTEND_ORIGIN, `GET ${path}: CORS inesperado`);
  const envelope = await response.json();
  assert(envelope?.status === "success", `GET ${path}: envelope incompatível`);
  return envelope.data;
}

const status = await get("/loja/status");
assert(status.aberta === false, "A loja deve permanecer fechada durante a demonstração.");

const menu = await get("/cardapio");
assert(Array.isArray(menu) && menu.length === 3, "O cardápio demonstrativo deve expor 3 categorias.");
const products = menu.flatMap((category) => category.produtos || []);
assert(products.length === 14, "O cardápio demonstrativo deve expor 14 produtos.");
assert(products.every((product) => expectedProducts.has(product.nome)), "O cardápio contém produto fora do manifesto demonstrativo.");
assert(products.every((product) => product.descricao?.includes(DEMO_MARKER)), "Todos os produtos devem carregar o marcador de demonstração.");

const counts = products.reduce((result, product) => ({ ...result, [product.tipo]: (result[product.tipo] || 0) + 1 }), {});
assert(counts.LANCHE === 7 && counts.PORCAO === 3 && counts.BEBIDA === 4, "A divisão esperada é 7 lanches, 3 porções e 4 bebidas.");

const sandwiches = products.filter((product) => product.tipo === "LANCHE");
for (const product of sandwiches) {
  const breads = product.tipos_pao || [];
  assert(breads.length === 2, `${product.nome}: devem existir exatamente 2 pães.`);
  assert(breads.some((bread) => bread.codigo === "HAMBURGUER" && bread.acrescimo === "0.00"), `${product.nome}: pão de hambúrguer inválido.`);
  assert(breads.some((bread) => bread.codigo === "FRANCES" && bread.acrescimo === "2.50"), `${product.nome}: pão francês deve acrescentar 2.50.`);
}

const simpleProducts = products.filter((product) => product.tipo !== "LANCHE");
assert(simpleProducts.every((product) => !(product.tipos_pao || []).length && !(product.adicionais || []).length), "Porções e bebidas não devem receber vínculos de personalização.");

const additionalLinks = sandwiches.flatMap((product) => product.adicionais || []);
assert(additionalLinks.length === 42, "Os lanches devem expor 42 vínculos de adicionais.");
assert(new Set(additionalLinks.map((item) => item.nome)).size === 8, "O manifesto deve expor 8 adicionais distintos.");

const xSalad = products.find((product) => product.nome === "X-Salada");
assert(xSalad, "X-Salada não encontrado no cardápio.");
const detail = await get(`/cardapio/produtos/${encodeURIComponent(xSalad.id)}`);
assert(detail.id === xSalad.id && detail.nome === "X-Salada", "O detalhe público do X-Salada diverge do cardápio.");
assert(detail.tipos_pao?.length === 2 && detail.adicionais?.length === 5, "O detalhe do X-Salada não preservou seus vínculos.");

const payments = await get("/metodos-pagamento");
assert(Array.isArray(payments) && payments.length === 4, "Devem existir 4 métodos de pagamento públicos.");

console.log("Demo real validada por GET: loja fechada; 3 categorias; 14 produtos (7/3/4); 2 pães por lanche; pão francês +2.50; 8 adicionais/42 vínculos; 4 pagamentos.");
console.log("Nenhum método de escrita foi enviado.");
