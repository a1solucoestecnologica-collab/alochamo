-- ============================================
-- SCRIPT DE LIMPEZA: Pedidos de Teste sem Itens
-- ============================================
-- 
-- Este script remove pedidos que não possuem itens associados.
-- Útil para limpar pedidos de teste criados durante desenvolvimento.
--
-- ATENÇÃO: Execute apenas em ambiente de desenvolvimento ou após backup!
-- 
-- Para executar:
-- 1. Via MySQL CLI: mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < scripts/cleanup-test-orders.sql
-- 2. Via painel admin (futuro): Botão "Limpar pedidos de teste"
-- ============================================

-- Primeiro, visualizar quais pedidos serão removidos (DRY RUN)
SELECT 
    o.id AS orderId,
    o.createdAt,
    o.status,
    o.total,
    (SELECT COUNT(*) FROM orderItems oi WHERE oi.orderId = o.id) AS itemCount
FROM orders o
WHERE (SELECT COUNT(*) FROM orderItems oi WHERE oi.orderId = o.id) = 0
ORDER BY o.id;

-- ============================================
-- DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A LIMPEZA
-- ============================================

-- Remover pedidos sem itens
-- DELETE FROM orders 
-- WHERE id IN (
--     SELECT orderId FROM (
--         SELECT o.id AS orderId
--         FROM orders o
--         LEFT JOIN orderItems oi ON oi.orderId = o.id
--         GROUP BY o.id
--         HAVING COUNT(oi.id) = 0
--     ) AS empty_orders
-- );

-- ============================================
-- ALTERNATIVA: Remover pedidos específicos por ID
-- ============================================

-- DELETE FROM orders WHERE id BETWEEN 60001 AND 60013;
