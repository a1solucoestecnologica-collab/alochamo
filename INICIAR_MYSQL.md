# Como Iniciar MySQL Localmente

## ⚠️ MySQL não está rodando!

Para continuar o setup, você precisa iniciar o MySQL. Escolha uma opção:

## Opção 1: XAMPP (Recomendado para desenvolvimento)

1. Abra o **XAMPP Control Panel**
2. Clique em **Start** ao lado de **MySQL**
3. Aguarde até aparecer "Running" em verde

## Opção 2: MySQL como Serviço do Windows

1. Abra o **Services** (services.msc):
   - Pressione `Win + R`
   - Digite `services.msc` e pressione Enter
2. Procure por **MySQL** ou **MySQL80**
3. Clique com botão direito → **Start**

## Opção 3: Linha de Comando

Se o MySQL estiver instalado mas não como serviço:

```powershell
# Navegue até a pasta bin do MySQL
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Inicie o MySQL
.\mysqld.exe --console
```

## Verificar se está rodando

Após iniciar, teste a conexão:

```powershell
Test-NetConnection -ComputerName localhost -Port 3306
```

Se retornar `TcpTestSucceeded : True`, o MySQL está rodando!

## Criar o banco de dados

Após iniciar o MySQL, conecte e crie o banco:

```sql
CREATE DATABASE IF NOT EXISTS chamo;
```

Ou via linha de comando:

```powershell
mysql -u root -e "CREATE DATABASE IF NOT EXISTS chamo;"
```

## Próximos Passos

Depois que o MySQL estiver rodando:
1. Verifique o `.env` (já configurado com DATABASE_URL)
2. Execute `pnpm db:push` para aplicar migrações
3. Inicie o servidor com `pnpm dev`
