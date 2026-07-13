# Script de Configuração do Banco de Dados - Chamô

Write-Host "=== Configuração do Banco de Dados Chamô ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    New-Item -Path .env -ItemType File | Out-Null
}

# Ler .env atual
$envContent = @{}
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envContent[$key] = $value
        }
    }
}

# Verificar DATABASE_URL
if ($envContent.ContainsKey('DATABASE_URL') -and $envContent['DATABASE_URL'] -ne '') {
    Write-Host "DATABASE_URL encontrado: $($envContent['DATABASE_URL'])" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deseja manter esta configuração? (S/N)" -ForegroundColor Yellow
    $keep = Read-Host
    if ($keep -eq 'S' -or $keep -eq 's' -or $keep -eq '') {
        Write-Host "Mantendo configuração atual." -ForegroundColor Green
        exit 0
    }
}

# Opções de configuração
Write-Host ""
Write-Host "Escolha uma opção:" -ForegroundColor Cyan
Write-Host "1. MySQL via Docker (localhost:3306/chamo)"
Write-Host "2. MySQL local existente"
Write-Host "3. MySQL remoto"
Write-Host "4. Cancelar"
Write-Host ""
$option = Read-Host "Opção"

switch ($option) {
    '1' {
        $databaseUrl = "mysql://chamo_user:chamo_password@localhost:3306/chamo"
        Write-Host ""
        Write-Host "Configurando para MySQL via Docker..." -ForegroundColor Yellow
        Write-Host "Certifique-se de que o Docker está rodando e execute: docker-compose up -d" -ForegroundColor Yellow
    }
    '2' {
        Write-Host ""
        $host = Read-Host "Host (padrão: localhost)"
        if ([string]::IsNullOrWhiteSpace($host)) { $host = "localhost" }
        
        $port = Read-Host "Porta (padrão: 3306)"
        if ([string]::IsNullOrWhiteSpace($port)) { $port = "3306" }
        
        $database = Read-Host "Nome do banco (padrão: chamo)"
        if ([string]::IsNullOrWhiteSpace($database)) { $database = "chamo" }
        
        $user = Read-Host "Usuário"
        $password = Read-Host "Senha" -AsSecureString
        $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        $databaseUrl = "mysql://${user}:${passwordPlain}@${host}:${port}/${database}"
    }
    '3' {
        Write-Host ""
        $databaseUrl = Read-Host "DATABASE_URL completo (mysql://user:pass@host:port/db)"
    }
    default {
        Write-Host "Cancelado." -ForegroundColor Yellow
        exit 0
    }
}

# Atualizar .env
Write-Host ""
Write-Host "Atualizando arquivo .env..." -ForegroundColor Yellow

$newEnvContent = @()
$databaseUrlSet = $false

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*DATABASE_URL\s*=') {
            $newEnvContent += "DATABASE_URL=$databaseUrl"
            $databaseUrlSet = $true
        } elseif ($_ -match '^\s*#') {
            $newEnvContent += $_
        } elseif ($_ -match '^\s*([^#=]+)=(.*)$') {
            $newEnvContent += $_
        } else {
            $newEnvContent += $_
        }
    }
}

if (-not $databaseUrlSet) {
    $newEnvContent += ""
    $newEnvContent += "# Database"
    $newEnvContent += "DATABASE_URL=$databaseUrl"
}

$newEnvContent | Set-Content .env

Write-Host ""
Write-Host "✓ DATABASE_URL configurado: $databaseUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Se usar Docker: docker-compose up -d"
Write-Host "2. Rodar migrações: pnpm db:push"
Write-Host "3. Iniciar servidor: pnpm dev"
Write-Host ""
