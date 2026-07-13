# OM Sushi

Vitrine propria do OM Sushi ligada ao motor do Chamo.

- Slug: `om-sushi`
- Porta local sugerida: `4322`
- URL local: `http://127.0.0.1:4322/loja/om-sushi`

## Como rodar

Na pasta do OMSUSHI:

```bash
pnpm dev
```

No Windows/PowerShell, use as variaveis:

```powershell
$env:NODE_ENV="development"
$env:PORT="4322"
$env:CHAMO_STORE_SLUG="om-sushi"
$env:CHAMO_ENGINE_URL="http://127.0.0.1:3000"
pnpm dev
```

## Popular no motor Chamo

Na pasta principal do Chamo:

```bash
node scripts/seed-om-sushi.mjs
```
