export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface RegraPreco {
  id: string;
  periodo: 'MANHA' | 'TARDE' | 'NOITE';
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  preco: string;
  quadraId: string;
}

export interface Quadra {
  id: string;
  nome: string;
  tipo: string;
  regrasPreco: RegraPreco[];
}

export type StatusReserva = 'PENDENTE_PAGAMENTO' | 'CONFIRMADO' | 'CANCELADO';

export interface Reserva {
  id: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: StatusReserva;
  valor: string;
  jogadorNome: string;
  jogadorTelefone: string;
  jogadorEmail?: string;
  quadraId: string;
  quadra?: { nome: string };
}

export interface QuadraPublica {
  id: string;
  nome: string;
  tipo: string;
}

export interface ArenaPublica {
  id: string;
  nome: string;
  slug: string;
  quadras: QuadraPublica[];
  logoUrl: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  aceitaPagamento: boolean;
  tipoPagamento: 'CINQUENTA_ANTES' | 'CEM_ANTES' | 'SEM_ANTECIPACAO';
}

export interface PagamentoPix {
  tipo: 'CINQUENTA_ANTES' | 'CEM_ANTES';
  valorAPagar: number;
  chavePix: string;
  payload: string;
}

export interface ArenaConfig {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  chavePix: string | null;
  cidadePix: string | null;
  tipoPagamento: 'CINQUENTA_ANTES' | 'CEM_ANTES' | 'SEM_ANTECIPACAO';
}

export interface MasterAdmin {
  id: string;
  email: string;
}

export interface ArenaResumo {
  id: string;
  nome: string;
  slug: string;
  criadoEm: string;
  totalQuadras: number;
  donoEmail: string | null;
  donoNome: string | null;
}

export interface SlotPublico {
  horaInicio: string;
  horaFim: string;
  periodo: 'MANHA' | 'TARDE' | 'NOITE';
  preco: number;
  disponivel: boolean;
  status: StatusReserva | null;
}

export type StatusDia = 'disponivel' | 'lotado' | 'sem-horario';

export interface DisponibilidadeDia {
  dia: string;
  status: StatusDia;
}
