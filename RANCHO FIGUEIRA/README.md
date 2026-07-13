# Rancho Figueira

Vitrine tematica do Rancho Figueira. O visual continua local nesta pasta, mas categorias, produtos, destaques, imagens, preco e dados da loja sao carregados pelo motor do Chamo.

## Rodar localmente

1. Inicie o motor do Chamo na pasta principal.
2. Garanta que exista uma loja com o slug `rancho-figueira`.
3. Inicie esta vitrine:

```bash
npm run dev
```

Depois acesse `http://127.0.0.1:4173/loja/rancho-figueira`.

## Ligacao com o Chamo

O servidor desta vitrine expoe `/api/chamo/store` e busca os dados no motor em `CHAMO_ENGINE_URL`, por padrao `http://127.0.0.1:3000`.

Variaveis uteis:

```bash
CHAMO_ENGINE_URL=http://127.0.0.1:3000
CHAMO_STORE_SLUG=rancho-figueira
PORT=4173
```

Para popular o Rancho no banco local do Chamo, rode na pasta principal do Chamo:

```bash
node scripts/seed-rancho-figueira.mjs
```
