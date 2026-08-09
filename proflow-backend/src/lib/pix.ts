// Gera o código Pix "Copia e Cola" (padrão EMV QR Code do Banco Central).
// Referência: manual de padrões para iniciação do Pix (BR Code).

function campo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

// Remove acentos e caracteres especiais — o padrão Pix exige texto simples (ASCII).
function limpar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim();
}

// CRC16/CCITT-FALSE — checksum obrigatório no final do payload Pix.
function crc16(payload: string): string {
  let crc = 0xffff;
  const polinomio = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ polinomio) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixPayloadInput {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor?: number; // se omitido, o pagador digita o valor no app do banco
  identificador?: string; // txid — opcional, usa "***" se não informado
}

export function gerarPayloadPix({ chave, nomeRecebedor, cidade, valor, identificador }: PixPayloadInput): string {
  const nome = limpar(nomeRecebedor).slice(0, 25) || 'RECEBEDOR';
  const cidadeLimpa = limpar(cidade).slice(0, 15) || 'BRASIL';
  const txid = (identificador ?? '***').slice(0, 25);

  const merchantAccountInfo =
    campo('00', 'br.gov.bcb.pix') + campo('01', chave);

  let payload =
    campo('00', '01') + // Payload Format Indicator
    campo('01', '11') + // Point of Initiation Method (11 = estático, reutilizável)
    campo('26', merchantAccountInfo) + // Informações da conta Pix
    campo('52', '0000') + // Merchant Category Code
    campo('53', '986'); // Moeda: Real (BRL)

  if (valor && valor > 0) {
    payload += campo('54', valor.toFixed(2));
  }

  payload +=
    campo('58', 'BR') +
    campo('59', nome) +
    campo('60', cidadeLimpa) +
    campo('62', campo('05', txid));

  payload += '6304'; // abre o campo do CRC (ID 63, tamanho 04) sem o valor ainda
  const checksum = crc16(payload);

  return payload + checksum;
}
