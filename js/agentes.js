// ============================================================
// AGENTES DO JOGO (rodam no navegador, sem servidor e sem API)
//   1) AgenteSorteador -> define palavras aleatórias do dicionário
//   2) AgenteJogador   -> joga: adivinha a palavra que VOCÊ definiu
// (O agente revisor de código fica em .claude/agents/, no VS Code)
// ============================================================

// Remove acentos, deixa minúsculo e valida (só letras, 3 a 20 caracteres).
// Retorna a palavra limpa ou null se for inválida.
function normalizarPalavra(texto) {
  const limpa = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  return /^[a-z]{3,20}$/.test(limpa) ? limpa : null;
}

const AgenteSorteador = {
  // Sorteia uma palavra do dicionário, evitando repetir as já usadas.
  usadas: new Set(),

  sortear() {
    if (this.usadas.size >= PALAVRAS.length) this.usadas.clear();
    let palavra;
    do {
      palavra = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
    } while (this.usadas.has(palavra));
    this.usadas.add(palavra);
    return palavra;
  }
};

const AgenteJogador = {
  // Ordem de frequência das letras no português (usada se não houver candidatas).
  frequencia: "aeosrindmtucplvgqbfhzjxkwy",

  // padrao: array com letras reveladas ou null (ex.: ["c", null, "s", null])
  // tentadas: Set com todas as letras já jogadas
  escolherLetra(padrao, tentadas) {
    // 1) Filtra o dicionário: mesmo tamanho e compatível com o que já se sabe.
    const candidatas = PALAVRAS.filter(p => {
      if (p.length !== padrao.length) return false;
      for (let i = 0; i < p.length; i++) {
        if (padrao[i]) {
          if (p[i] !== padrao[i]) return false;
        } else if (tentadas.has(p[i])) {
          return false; // letra já tentada e não revelada nesta posição
        }
      }
      return true;
    });

    // 2) Conta em quantas candidatas cada letra restante aparece.
    const contagem = {};
    for (const p of candidatas) {
      for (const letra of new Set(p)) {
        if (!tentadas.has(letra)) contagem[letra] = (contagem[letra] || 0) + 1;
      }
    }

    // 3) Escolhe a mais frequente; se não houver candidatas, usa a tabela geral.
    const ordenadas = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
    if (ordenadas.length > 0) return ordenadas[0][0];
    return [...this.frequencia].find(l => !tentadas.has(l));
  }
};
