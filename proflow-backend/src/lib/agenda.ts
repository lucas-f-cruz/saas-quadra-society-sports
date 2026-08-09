// Converte "19:30" em minutos desde a meia-noite (1170), pra facilitar somar duração.
function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutos % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export interface RegraPrecoSlot {
  periodo: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  preco: number;
}

export interface SlotGerado {
  horaInicio: string;
  horaFim: string;
  periodo: string;
  preco: number;
}

// Fatia cada regra de preço (ex: manhã 08:00–13:00, blocos de 60min) em horários individuais.
export function gerarSlots(regras: RegraPrecoSlot[]): SlotGerado[] {
  const slots: SlotGerado[] = [];

  for (const regra of regras) {
    let inicio = paraMinutos(regra.horaInicio);
    const fim = paraMinutos(regra.horaFim);

    while (inicio + regra.duracaoMinutos <= fim) {
      slots.push({
        horaInicio: paraHora(inicio),
        horaFim: paraHora(inicio + regra.duracaoMinutos),
        periodo: regra.periodo,
        preco: regra.preco,
      });
      inicio += regra.duracaoMinutos;
    }
  }

  return slots.sort((a, b) => (a.horaInicio > b.horaInicio ? 1 : -1));
}

export type StatusDia = 'disponivel' | 'lotado' | 'sem-horario';

// Compara o total de slots gerados pelas regras com quantos já foram reservados
// naquele dia, pra decidir a cor do dia no calendário (verde/vermelho/neutro).
export function calcularStatusDia(totalSlots: number, slotsOcupados: number): StatusDia {
  if (totalSlots === 0) return 'sem-horario';
  return slotsOcupados >= totalSlots ? 'lotado' : 'disponivel';
}
