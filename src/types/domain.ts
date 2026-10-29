export type BigIntId = string;
export type Money = string;
export type ProductType = "LANCHE" | "PORCAO" | "BEBIDA" | "OUTRO";
export type DeliveryType = "ENTREGA" | "RETIRADA";
export type OrderStatus =
  | "PENDENTE"
  | "EM_PREPARO"
  | "PRONTO_PARA_RETIRADA"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";
export type PaymentStatus = "PENDENTE" | "PAGO" | "ESTORNADO";
export type InvitationStatus = "PENDENTE" | "ACEITO" | "EXPIRADO" | "REVOGADO";

export interface Invitation {
  id: BigIntId;
  email: string;
  nivel_acesso_id: BigIntId;
  nivel?: string;
  status: InvitationStatus;
  expira_em: string;
  aceito_em?: string | null;
  revogado_em?: string | null;
  criado_em: string;
  criado_por_nome?: string | null;
}

export interface InvitationSecretResponse {
  convite: Invitation;
  token: string;
}

export interface InvitationValidation {
  valido: boolean;
  email_mascarado?: string;
  nivel?: string;
  expira_em?: string;
}

export interface Category {
  id: BigIntId;
  nome: string;
  slug: string;
  descricao?: string | null;
  ordem_exibicao?: number;
  ativo?: boolean;
  produtos?: Product[];
}

export interface BreadOption {
  id: BigIntId;
  tipo_pao_id?: BigIntId;
  codigo?: string;
  nome: string;
  acrescimo: Money | null;
  ativo?: boolean;
}

export interface AdditionalOption {
  id: BigIntId;
  adicional_id?: BigIntId;
  nome: string;
  descricao?: string | null;
  preco: Money;
  ativo?: boolean;
  disponivel_hoje?: boolean;
  max_quantidade_por_item?: number;
}

export interface Product {
  id: BigIntId;
  categoria_id: BigIntId;
  nome: string;
  descricao?: string | null;
  tipo: ProductType;
  preco_base: Money | null;
  imagem_url?: string | null;
  ativo: boolean;
  disponivel_hoje: boolean;
  ordem_exibicao?: number;
  tipos_pao?: BreadOption[];
  paes?: BreadOption[];
  adicionais?: AdditionalOption[];
}

export type PublicMenu = Category[];

export interface StoreStatus {
  aberta: boolean;
  modo_horario?: "MANUAL" | "HORARIO" | string;
  mensagem: string;
  loja?: {
    nome_fantasia?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    endereco_trailer?: string | null;
    referencia_trailer?: string | null;
    logo_url?: string | null;
    taxa_entrega?: Money | null;
    tempo_estimado_min?: number | null;
    timezone?: string;
  };
  horarios?: Array<Record<string, unknown>>;
}

export interface PaymentMethod {
  id: BigIntId;
  codigo: string;
  nome: string;
  ativo?: boolean;
}

export interface AddressInput {
  logradouro: string;
  numero?: string | null;
  sem_numero: boolean;
  bairro: string;
  cidade: string;
  uf: string;
  complemento?: string | null;
  referencia?: string | null;
}

export interface OrderItemInput {
  produto_id: BigIntId;
  quantidade: number;
  tipo_pao_id?: BigIntId | null;
  adicionais: Array<{ adicional_id: BigIntId; quantidade: number }>;
  observacoes?: string | null;
}

export interface CreateOrderInput {
  cliente: { nome: string; telefone: string };
  tipo_entrega: DeliveryType;
  endereco?: AddressInput | null;
  metodo_pagamento_id: BigIntId;
  precisa_troco: boolean;
  troco_para?: Money | null;
  observacoes?: string | null;
  itens: OrderItemInput[];
}

export interface OrderSummary {
  id?: BigIntId;
  pedido_id?: BigIntId;
  codigo_acompanhamento?: string;
  codigo?: string;
  status: OrderStatus;
  status_pagamento?: PaymentStatus;
  cliente_nome?: string;
  tipo_entrega?: DeliveryType;
  canal?: "WEB" | "PAINEL";
  total?: Money;
  subtotal?: Money;
  taxa_entrega?: Money;
  valor_total?: Money;
  criado_em?: string;
  versao?: number;
  itens?: unknown[];
  historico?: unknown[];
  [key: string]: unknown;
}

export interface SessionUser {
  id: BigIntId;
  nome: string;
  email: string;
  nivel?: string;
  nivel_acesso?: string;
  permissoes: string[];
  [key: string]: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

