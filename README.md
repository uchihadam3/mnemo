# 🃏 MNEMO — o roguelike da memória

**MNEMO** é um roguelike de construção de baralho em cima do bom e velho **jogo da memória**.
Vire cartas, forme pares, encadeie **combos**, monte builds absurdas com **Relíquias** e derrote os **Chefes** dos 8 Círculos da Memória.

### ▶️ [Jogar agora no navegador](https://uchihadam3.github.io/mnemo/) · [⬇️ Baixar instaladores](https://github.com/uchihadam3/mnemo/releases/latest)

> Feito em HTML/CSS/JS puro — roda no navegador, instala como app (PWA) e tem instalador para Windows, Linux e macOS.

---

## ⬇️ Como jogar

| Opção | Como |
|---|---|
| **Instalador Windows** | Baixe `MNEMO-x.y.z-Instalador.exe` na página de [Releases](../../releases) e execute. Cria atalho na Área de Trabalho e no Menu Iniciar. |
| **Windows portátil** | `MNEMO-x.y.z-portatil.exe` — roda sem instalar. |
| **Linux** | `.AppImage` (dê permissão de execução) ou `.deb`. |
| **macOS** | `.dmg` (pode ser preciso liberar em *Ajustes › Privacidade e Segurança*). |
| **Navegador** | Abra https://uchihadam3.github.io/mnemo/. No Chrome/Edge aparece o botão **Instalar** no menu do jogo. |
| **Local** | Basta abrir `index.html` — ou `npm install && npm start` para o app de desktop. |

O progresso é **salvo automaticamente** a cada jogada. Feche quando quiser e use **Continuar jornada**.
Em *Opções* dá para **exportar/importar o save** (backup ou levar para outro computador).

---

## 🎮 Regras

- Vire **duas cartas**. Iguais = **par** (pontua). Diferentes = perde **1 Tentativa**.
- Cada par vale **Fichas × Mult**. Pares seguidos aumentam o **Combo** (+Mult). Errar zera o combo.
- **Lembrança**: a 2ª carta já tinha sido vista. **Sorte Cega**: nenhuma das duas tinha sido vista → **x2 Mult**.
- **Vislumbres** espiam uma carta sem custo (botão direito ou tecla Espaço).
- **Tabuleiro limpo** = +2 Tentativas e um novo tabuleiro.
- 3 salões por Círculo: **Pequeno**, **Grande** e **Chefe**. Vença o 8º Círculo — ou continue no **modo sem fim**.

Cuidado: o mesmo símbolo em **naipes diferentes** (Chama, Maré, Folha, Astro) **não** forma par!

## ✨ Conteúdo

- **52 Relíquias** (comuns, incomuns, raras e lendárias) com edições Laminada, Holográfica, Policromo e Negativa
- **19 Pergaminhos** de uso único e **5 Astros** que sobem o nível dos naipes
- **7 Encantamentos** de carta (Dourada, Vidro, Aço, Pedra, Sortuda…)
- **16 Chefes** com regras malvadas (O Embaralhador, O Mímico, O Relógio, Lete…)
- **10 Runas** permanentes, **8 Bênçãos** para quem pula salões
- **10 Baralhos** iniciais e **5 Selos** de dificuldade
- **23 Conquistas**, níveis de perfil, **8 versos de carta**, **Compêndio** e **Desafio Diário** com semente fixa
- Trilha synthwave/hipnótica que muda por tela e efeitos sonoros escolhidos a dedo
- Modo **FEBRE**: combo 4+ dobra todos os pontos

## ⌨️ Atalhos

`Espaço` Vislumbre · `1–5` usar pergaminho · `Esc` pausa/menu · `F11` tela cheia (app)

## 🛠️ Desenvolvimento

```bash
npm install
npm start          # abre o app de desktop
npm run dist:win   # gera o instalador do Windows em dist/
```

Ao criar uma tag `v*` (ex.: `git tag v1.0.0 && git push --tags`), o GitHub Actions gera os instaladores de **Windows, Linux e macOS** e anexa ao Release. Todo push na `main` publica a versão web no **GitHub Pages**.

## 🎵 Créditos

- **Músicas** (escolhidas na [página de audição](https://uchihadam3.github.io/mnemo/audicao/)):
  - Menu: "Chillwave Nightdrive" — [Bogart VGM](https://opengameart.org/content/chillwave-nightdrive), CC BY 3.0
  - Jogo: "Electro" — [Pro Sensory](https://opengameart.org/content/electro), CC0
  - Chefe: "Deep Haze" — Kevin MacLeod ([incompetech.com](https://incompetech.com)), CC BY 4.0
  - Loja: "Look Trippy" — [Pro Sensory](https://opengameart.org/content/look-trippy), CC0
- **Efeitos sonoros:** [Kenney](https://kenney.nl) e [Juhani Junkala](https://opengameart.org/content/512-sound-effects-8-bit-style) (CC0).
- **Fontes:** Lilita One e Nunito (SIL Open Font License).
