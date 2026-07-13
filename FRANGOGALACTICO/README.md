# Frango Galactico

Vitrine tematica do Frango Galactico. O visual continua local nesta pasta, mas categorias, produtos, destaques, imagens cadastradas, preco e dados da loja sao carregados pelo motor do Chamo.

## Rodar localmente

1. Inicie o motor do Chamo na pasta principal.
2. Garanta que exista uma loja com o slug `frango-galactico`.
3. Inicie esta vitrine:

```bash
npm run dev
```

Depois acesse `http://127.0.0.1:4317`.

## Ligacao com o Chamo

O servidor desta vitrine expoe `/api/chamo/store` e busca os dados no motor em `CHAMO_ENGINE_URL`, por padrao `http://127.0.0.1:3000`.

Variaveis uteis:

```bash
CHAMO_ENGINE_URL=http://127.0.0.1:3000
CHAMO_STORE_SLUG=frango-galactico
PORT=4317
```

Para popular o Frango no banco local do Chamo, rode na pasta principal do Chamo:

```bash
node scripts/seed-frango-galactico.mjs
```
