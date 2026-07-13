# Configuração do Banco de Dados - Chamô

## Situação Atual

- **Banco esperado**: MySQL 8.0
- **ORM**: Drizzle ORM
- **Driver**: mysql2
- **Formato DATABASE_URL**: `mysql://usuario:senha@host:porta/database`

## Opção 1: MySQL via Docker (Recomendado)

### Passo 1: Iniciar MySQL
```bash
docker-compose up -d
```

Isso criará um container MySQL com:
- **Host**: localhost
- **Porta**: 3306
- **Database**: chamo
- **Usuário**: chamo_user
- **Senha**: chamo_password

### Passo 2: Configurar .env
Crie/edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=mysql://chamo_user:chamo_password@localhost:3306/chamo
```

### Passo 3: Rodar Migrações
```bash
pnpm db:push
```

## Opção 2: MySQL Local Existente

Se você já tem MySQL instalado localmente:

1. Crie o banco de dados:
```sql
CREATE DATABASE chamo;
CREATE USER 'chamo_user'@'localhost' IDENTIFIED BY 'chamo_password';
GRANT ALL PRIVILEGES ON chamo.* TO 'chamo_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Configure o `.env`:
```env
DATABASE_URL=mysql://chamo_user:chamo_password@localhost:3306/chamo
```

3. Rode as migrações:
```bash
pnpm db:push
```

## Opção 3: MySQL Remoto (Produção/Desenvolvimento)

Se você tem um MySQL remoto:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/nome_do_banco
```

## Verificar Conexão

Após configurar, teste:

```bash
# Verificar se o banco está acessível
pnpm db:push

# Se funcionar, iniciar o servidor
pnpm dev
```

## Troubleshooting

### Erro: "DATABASE_URL is required"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável `DATABASE_URL` está definida

### Erro: "Database not available"
- Verifique se o MySQL está rodando
- Verifique se as credenciais estão corretas
- Teste a conexão manualmente

### Erro de conexão
- Verifique se a porta 3306 está livre (ou ajuste no docker-compose.yml)
- Verifique firewall/antivírus bloqueando conexões
