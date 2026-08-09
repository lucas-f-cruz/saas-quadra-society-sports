// Lê um arquivo de imagem escolhido pelo usuário, redimensiona (mantendo proporção,
// máximo 300px no maior lado) e comprime como JPEG — evita guardar imagens gigantes
// como texto no banco de dados.
export function lerImagemComoBase64(arquivo: File, tamanhoMaximo = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, tamanhoMaximo / Math.max(img.width, img.height));
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Não foi possível processar a imagem'));

        ctx.drawImage(img, 0, 0, largura, altura);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Arquivo de imagem inválido'));
      img.src = leitor.result as string;
    };

    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
    leitor.readAsDataURL(arquivo);
  });
}
