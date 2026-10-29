# Jogo da Forca com IA

Site estático (HTML + CSS + JavaScript puro), sem banco de dados e sem servidor.

## Estrutura

```
forca-ia/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── palavras.js     # dicionário com 1000 palavras
│   ├── agentes.js      # AgenteSorteador e AgenteJogador
│   └── jogo.js         # lógica e interface
├── .claude/
│   └── agents/
│       ├── revisor-codigo.md
│       ├── definidor-palavras.md
│       └── jogador-forca.md
└── README.md
```

## Como rodar

Abra o `index.html` no navegador (ou use a extensão Live Server no VS Code).

## Modos

- **Solo**: o sorteador escolhe uma palavra e você adivinha.
- **Multiplayer**: dois jogadores no mesmo dispositivo. Um digita a palavra, o outro adivinha; os papéis alternam a cada rodada.
- **IA adivinha**: você define a palavra e a IA joga sozinha.

## Agentes no VS Code (Claude Code)

No terminal do VS Code, dentro da pasta do projeto, rode `claude` e peça, por exemplo:

- `use o revisor-codigo para revisar o projeto`
- `use o definidor-palavras para validar o dicionário`
- `use o jogador-forca, vou pensar em uma palavra`
