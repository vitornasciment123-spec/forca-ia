// ============================================================
// LÓGICA E INTERFACE DO JOGO
// Modos: "solo" | "multi" (2 jogadores no mesmo dispositivo) | "ia"
// Tudo fica na memória da página: sem banco de dados.
// ============================================================
(() => {
  const MAX_ERROS = 6;
  const ATRASO_IA = 900; // ms entre as jogadas da IA
  const LETRAS = "abcdefghijklmnopqrstuvwxyz";

  const $ = id => document.getElementById(id);
  const el = {
    modos: document.querySelectorAll(".modo"),
    placar: $("placar"),
    setup: $("setup"),
    setupInstrucao: $("setup-instrucao"),
    setupErro: $("setup-erro"),
    palavraInput: $("palavra-input"),
    btnConfirmar: $("btn-confirmar"),
    btnSortear: $("btn-sortear"),
    jogo: $("jogo"),
    partes: document.querySelectorAll("#forca .parte"),
    palavra: $("palavra"),
    erradas: $("erradas"),
    status: $("status"),
    logIA: $("log-ia"),
    teclado: $("teclado"),
    btnProxima: $("btn-proxima")
  };

  const estado = {
    modo: "solo",
    palavra: "",
    tentadas: new Set(),
    erradas: [],
    fim: true,
    definidor: 1,            // multiplayer: quem define a palavra (1 ou 2)
    placar: { a: 0, b: 0 },  // a = jogador 1 / você ; b = jogador 2 / IA
    timerIA: null
  };

  // ---------- Teclado na tela ----------
  function criarTeclado() {
    el.teclado.innerHTML = "";
    for (const letra of LETRAS) {
      const b = document.createElement("button");
      b.className = "tecla";
      b.textContent = letra.toUpperCase();
      b.dataset.letra = letra;
      b.addEventListener("click", () => tentar(letra));
      el.teclado.appendChild(b);
    }
  }

  // ---------- Modos ----------
  function trocarModo(modo) {
    clearTimeout(estado.timerIA);
    estado.modo = modo;
    estado.placar = { a: 0, b: 0 };
    estado.definidor = 1;
    el.modos.forEach(m => m.classList.toggle("ativo", m.dataset.modo === modo));
    if (modo === "solo") {
      iniciarRodada(AgenteSorteador.sortear());
    } else {
      pedirPalavra();
    }
    renderPlacar();
  }

  function pedirPalavra() {
    el.jogo.classList.add("oculto");
    el.setup.classList.remove("oculto");
    el.palavraInput.value = "";
    el.setupErro.textContent = "";
    if (estado.modo === "multi") {
      const quem = estado.definidor === 1 ? "Jogador 1" : "Jogador 2";
      const outro = estado.definidor === 1 ? "Jogador 2" : "Jogador 1";
      el.setupInstrucao.textContent =
        `${quem}, digite a palavra secreta. ${outro} não pode olhar!`;
    } else {
      el.setupInstrucao.textContent =
        "Digite a palavra que a IA vai tentar adivinhar.";
    }
    el.palavraInput.focus();
  }

  function confirmarPalavra() {
    const palavra = normalizarPalavra(el.palavraInput.value);
    if (!palavra) {
      el.setupErro.textContent = "Use apenas letras (3 a 20), sem espaços ou números.";
      return;
    }
    iniciarRodada(palavra);
  }

  // ---------- Rodada ----------
  function iniciarRodada(palavra) {
    clearTimeout(estado.timerIA);
    estado.palavra = palavra;
    estado.tentadas = new Set();
    estado.erradas = [];
    estado.fim = false;
    el.setup.classList.add("oculto");
    el.jogo.classList.remove("oculto");
    el.btnProxima.classList.add("oculto");
    el.logIA.textContent = "";
    criarTeclado();
    renderizar();
    if (estado.modo === "ia") agendarJogadaIA();
  }

  function tentar(letra) {
    if (estado.fim || estado.tentadas.has(letra)) return;
    estado.tentadas.add(letra);
    if (!estado.palavra.includes(letra)) estado.erradas.push(letra);
    renderizar();
    verificarFim();
  }

  function padraoAtual() {
    return [...estado.palavra].map(l => (estado.tentadas.has(l) ? l : null));
  }

  function verificarFim() {
    const venceu = padraoAtual().every(l => l !== null);
    const perdeu = estado.erradas.length >= MAX_ERROS;
    if (!venceu && !perdeu) return;

    estado.fim = true;
    clearTimeout(estado.timerIA);
    el.status.className = "status " + (venceu ? "vitoria" : "derrota");
    el.status.textContent = mensagemFinal(venceu);
    if (!venceu) el.palavra.textContent = [...estado.palavra].join(" ").toUpperCase();
    atualizarPlacar(venceu);
    if (estado.modo === "solo") {
      el.btnProxima.textContent = "Nova palavra";
    } else {
      el.btnProxima.textContent = "Próxima rodada";
    }
    el.btnProxima.classList.remove("oculto");
    el.teclado.querySelectorAll("button").forEach(b => (b.disabled = true));
  }

  function mensagemFinal(venceu) {
    if (estado.modo === "ia") {
      return venceu
        ? `A IA acertou: ${estado.palavra.toUpperCase()}!`
        : "A IA errou! Você venceu esta rodada.";
    }
    if (estado.modo === "multi") {
      const adivinha = estado.definidor === 1 ? "Jogador 2" : "Jogador 1";
      return venceu ? `${adivinha} acertou!` : `${adivinha} foi enforcado!`;
    }
    return venceu ? "Você venceu!" : "Você perdeu!";
  }

  function atualizarPlacar(venceu) {
    if (estado.modo === "solo") {
      venceu ? estado.placar.a++ : estado.placar.b++;
    } else if (estado.modo === "multi") {
      // ponto para quem adivinhou (se venceu) ou para quem definiu (se o outro perdeu)
      const adivinha = estado.definidor === 1 ? "b" : "a";
      const definidor = estado.definidor === 1 ? "a" : "b";
      estado.placar[venceu ? adivinha : definidor]++;
    } else {
      venceu ? estado.placar.b++ : estado.placar.a++; // b = IA
    }
    renderPlacar();
  }

  function proximaRodada() {
    if (estado.modo === "solo") {
      iniciarRodada(AgenteSorteador.sortear());
    } else {
      if (estado.modo === "multi") estado.definidor = estado.definidor === 1 ? 2 : 1;
      pedirPalavra();
    }
  }

  // ---------- IA jogando ----------
  function agendarJogadaIA() {
    estado.timerIA = setTimeout(() => {
      if (estado.fim) return;
      const letra = AgenteJogador.escolherLetra(padraoAtual(), estado.tentadas);
      el.logIA.textContent = `A IA escolheu a letra ${letra.toUpperCase()}`;
      tentar(letra);
      if (!estado.fim) agendarJogadaIA();
    }, ATRASO_IA);
  }

  // ---------- Desenho ----------
  function renderizar() {
    const padrao = padraoAtual();
    el.palavra.textContent = padrao.map(l => (l ? l.toUpperCase() : "_")).join(" ");
    el.erradas.textContent = estado.erradas.length
      ? `Erros (${estado.erradas.length}/${MAX_ERROS}): ` +
        estado.erradas.map(l => l.toUpperCase()).join(" ")
      : "";
    el.partes.forEach((p, i) => p.classList.toggle("visivel", i < estado.erradas.length));
    if (!estado.fim) {
      el.status.className = "status";
      el.status.textContent = "";
    }
    el.teclado.querySelectorAll("button").forEach(b => {
      const l = b.dataset.letra;
      const usada = estado.tentadas.has(l);
      b.disabled = usada || estado.modo === "ia";
      b.classList.toggle("certa", usada && estado.palavra.includes(l));
      b.classList.toggle("errada", usada && !estado.palavra.includes(l));
    });
  }

  function renderPlacar() {
    const { a, b } = estado.placar;
    if (estado.modo === "solo") el.placar.textContent = `Vitórias: ${a} | Derrotas: ${b}`;
    else if (estado.modo === "multi") el.placar.textContent = `Jogador 1: ${a} | Jogador 2: ${b}`;
    else el.placar.textContent = `Você: ${a} | IA: ${b}`;
  }

  // ---------- Eventos ----------
  el.modos.forEach(m => m.addEventListener("click", () => trocarModo(m.dataset.modo)));
  el.btnConfirmar.addEventListener("click", confirmarPalavra);
  el.btnSortear.addEventListener("click", () => iniciarRodada(AgenteSorteador.sortear()));
  el.btnProxima.addEventListener("click", proximaRodada);
  el.palavraInput.addEventListener("keydown", e => {
    if (e.key === "Enter") confirmarPalavra();
  });
  document.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (estado.modo === "ia" || !el.setup.classList.contains("oculto")) return;
    if (document.activeElement === el.palavraInput) return;
    const letra = e.key.toLowerCase();
    if (letra.length === 1 && LETRAS.includes(letra)) tentar(letra);
  });

  trocarModo("solo");
})();
