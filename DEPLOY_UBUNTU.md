# Deploy do Chamo em Ubuntu

Este projeto roda como uma aplicacao Node.js com MySQL. As lojas publicas ficam na mesma porta:

- `/`
- `/painel-restaurante`
- `/loja/frango-galactico/catalogo`
- `/loja/rancho-figueira/catalogo`
- `/loja/om-sushi/catalogo`

## 1. Preparar a VM

Use Ubuntu 22.04 ou 24.04.

```bash
sudo apt update
sudo apt install -y git curl nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.4.1 --activate
```

## 2. Banco de dados

Crie o banco e usuario:

```bash
sudo mysql
```

```sql
CREATE DATABASE chamo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chamo_user'@'localhost' IDENTIFIED BY 'troque_essa_senha';
GRANT ALL PRIVILEGES ON chamo.* TO 'chamo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Clonar o projeto

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
git clone URL_DO_SEU_REPOSITORIO /var/www/chamo
cd /var/www/chamo
```

## 4. Configurar ambiente

```bash
cp .env.example .env
nano .env
```

Configure pelo menos:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://chamo_user:troque_essa_senha@127.0.0.1:3306/chamo
JWT_SECRET=gere_um_segredo_forte
OAUTH_SERVER_URL=https://seu-dominio.com
```

## 5. Instalar dependencias e buildar

O Chamo principal e o OM Sushi possuem builds separados.

```bash
pnpm install --frozen-lockfile
pnpm --dir OMSUSHI install --frozen-lockfile
pnpm build:all
```

## 6. Banco: migrations e seeds

Se for uma VM nova:

```bash
pnpm db:push
pnpm seed
```

Se ja existir banco com dados reais, nao rode seed sem antes fazer backup.

## 7. Testar localmente na VM

```bash
NODE_ENV=production PORT=3000 node dist/index.js
```

Em outro terminal:

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/loja/frango-galactico/catalogo
curl -I http://127.0.0.1:3000/loja/rancho-figueira/catalogo
curl -I http://127.0.0.1:3000/loja/om-sushi/catalogo
```

## 8. Instalar como servico systemd

```bash
sudo cp deploy/chamo.service.example /etc/systemd/system/chamo.service
sudo chown -R www-data:www-data /var/www/chamo
sudo systemctl daemon-reload
sudo systemctl enable chamo
sudo systemctl start chamo
sudo systemctl status chamo
```

Logs:

```bash
sudo journalctl -u chamo -f
```

## 9. Nginx

```bash
sudo cp deploy/nginx-chamo.conf.example /etc/nginx/sites-available/chamo
sudo nano /etc/nginx/sites-available/chamo
sudo ln -s /etc/nginx/sites-available/chamo /etc/nginx/sites-enabled/chamo
sudo nginx -t
sudo systemctl reload nginx
```

Depois de apontar o dominio para a VM, instale HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 10. Atualizar deploy depois

```bash
cd /var/www/chamo
git pull
pnpm install --frozen-lockfile
pnpm --dir OMSUSHI install --frozen-lockfile
pnpm build:all
sudo systemctl restart chamo
```

## Observacoes importantes

- Nao suba `.env` para o Git.
- Nao suba `node_modules`, `dist` nem `uploads`.
- `uploads/` deve ser preservado na VM, porque contem imagens enviadas pelo painel.
- Antes de rodar seed em producao, faca backup.
