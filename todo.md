# Chamô - TODO List

## REESTRUTURAÇÃO COMPLETA DO SISTEMA

**Objetivo:** Transformar Chamô em sistema de pedidos por link exclusivo para cada restaurante, removendo vouchers, marketplace e login de cliente.

**Regra Crítica:** NÃO mexer em nada que já funciona. Preservar sistema de pedidos existente.

---

## FASE 1: Remover Vouchers Completamente
- [x] Remover componente de vouchers da home
- [x] Remover rotas de vouchers do backend
- [x] Remover componente VouchersManagement.tsx
- [x] Remover referências em CouponsManagement.tsx e Checkout.tsx
- [x] Validar que nada quebrou

## FASE 2: Criar Landing Page Institucional
- [x] Criar página inicial (/) como landing page
- [x] Explicar o que é Chamô
- [x] Explicar como funciona
- [x] Design profissional e clean
- [x] Mobile-first
- [x] Sem mostrar lista de restaurantes
- [x] Sem mostrar login para cliente
- [x] Sem exigir cadastro

## FASE 3: Implementar Tela /r/{slug} para Restaurante
- [x] Criar rota /r/{slug}
- [x] Buscar restaurante pelo slug
- [x] Exibir tela de pedidos do restaurante
- [x] Usar sistema de pedidos JÁ EXISTENTE (sem alterações)
- [x] Aplicar cores e logo do restaurante (personalização)
- [x] Mobile-first

## FASE 4: Sistema de Identificação de Cliente (Nome + Telefone)
- [x] Criar formulário de identificação (Nome + Telefone)
- [x] Sem senha
- [x] Sem SMS de confirmação
- [x] Sem login
- [x] Armazenar telefone como identificador único
- [x] Permitir mesmo cliente em múltiplos restaurantes
- [x] Manter histórico interno (restaurante vê só seus pedidos)

## FASE 5: Link Único para Cada Restaurante
- [x] Adicionar campo "slug" na tabela de restaurantes (já existe)
- [x] Gerar link único no painel de admin (ex: chamo.com/r/sushi-master)
- [x] Botão "Copiar Link" no painel
- [x] Botão "Compartilhar no WhatsApp"
- [x] Dica de QR Code para colocar nas mesas

## FASE 6: Testes e Validação
- [x] Testar acesso via link /r/{slug}
- [x] Testar identificação de cliente
- [x] Testar fluxo de pedidos
- [x] Testar personalização (cores, logo)
- [x] Testar landing page
- [x] Validar que nada que funcionava antes quebrou
- [x] Servidor rodando sem erros

---

## DECISÕES FECHADAS (NÃO ALTERAR)
- ❌ Sem aplicativo
- ❌ Sem marketplace
- ❌ Sem vouchers
- ❌ Sem login para cliente
- ❌ Sem cadastro com senha
- ✅ Apenas navegador (mobile-first)

---

## BANNERS (CONCLUÍDO)
- [x] Gerar 5 banners em proporção 3:1 ultra-wide
- [x] Remover banner 4
- [x] Validar que 4 banners aparecem perfeitamente


---

## PAINEL ADMINISTRATIVO (NOVO)
- [x] Implementar login OAuth Manus para admin
- [x] Criar rota `/api/oauth/admin/callback` para callback OAuth
- [x] Criar função `getAdminLoginUrl()` para gerar URL de login OAuth
- [x] Modificar aba Admin na página de login para usar email + senha simples
- [x] Garantir que usuários admin possam fazer login com email + senha
- [x] Criar usuário admin de teste com credenciais
- [x] Página AdminDashboard com verificação de permissão admin
- [x] Exibir estatísticas globais (restaurantes, pedidos, categorias, banners)
- [x] Tab de Restaurantes com lista e ações (editar, desativar)
- [x] Tab de Categorias com lista e ações
- [x] Tab de Banners com lista e ações
- [x] Tab de Vouchers (placeholder para implementação futura)
- [ ] Implementar funcionalidade de adicionar restaurante
- [ ] Implementar funcionalidade de editar restaurante
- [ ] Implementar funcionalidade de desativar restaurante
- [ ] Implementar funcionalidade de adicionar categoria
- [ ] Implementar funcionalidade de editar categoria
- [ ] Implementar funcionalidade de adicionar banner
- [ ] Implementar funcionalidade de editar banner
- [ ] Implementar sistema de vouchers
- [ ] Implementar hash de senha com bcryptjs (atualmente em texto plano)
- [ ] Adicionar validação de permissões em todas as rotas admin
- [ ] Implementar rate limiting para login
- [ ] Adicionar logs de auditoria para ações admin
- [ ] Criar testes vitest para fluxo de login admin
- [ ] Criar testes vitest para verificação de permissão admin
- [ ] Criar testes vitest para operações CRUD no painel admin
