# DULCES AROMAS POS — CONTEXTO PARA KIMI

## Estado: 175 productos, build OK, todo funcionando
## Fecha: 2026-07-01
## URL: https://kiampo007.github.io/dulces-aromas-posSantogrial92254
## Diagnóstico: https://kiampo007.github.io/dulces-aromas-posSantogrial92254/#/diagnostico
## Clave: 2525

## Stack: React 19 + Vite + TypeScript + Tailwind + shadcn/ui
## Router: HashRouter
## Locale: es-CL (pesos chilenos)

## Archivos clave:
- src/hooks/useSales.ts (ventas + stock)
- src/hooks/useProducts.ts (productos)
- src/hooks/useCuotas.ts (créditos)
- src/hooks/useDashboardData.ts (dashboard)
- src/pages/VentaPage.tsx (punto de venta)
- src/pages/Dashboard.tsx (panel principal)
- src/pages/DeudasPage.tsx (deudas)
- src/pages/CatalogoPage.tsx (catálogo)
- src/pages/ConfiguracionPage.tsx (config)
- src/pages/DiagnosticoPage.tsx (diagnóstico automático)
- src/data/productData.ts (175 productos)

## Mejoras aplicadas:
- Stock reduce automático al vender
- QR Tienda apunta a catálogo real
- Locale es-CL en todo
- Bot de Ventas Automáticas
- Sistema de Cuotas (3-12 meses)
- Cierre de Caja Diario
- Backup/Restore JSON
- Diagnóstico automático completo
- Receipt key correcta: dulces_aromas_sales
- Meta mensual dinámica desde localStorage
- Navigate React Router (sin recarga)
- .gitignore excluye node_modules y backups

## Keys localStorage (NO CAMBIAR):
- dulces_aromas_products (175 items)
- dulces_aromas_sales (ventas)
- dulces_aromas_debts (deudas)
- dulces_aromas_creditos (cuotas)
- dulces_aromas_clients (clientes)
- dulces_aromas_meta_mes (meta)
- dulces_aromas_config (config)
- dulces_aromas_pin-hash (PIN 2525)
- dulces_aromas_pedidos (pedidos)

## Commits recientes:
- 79aa0fd: 175 productos reales
- e94949b: Diagnóstico automático
- 267700f: Fix navigate Dashboard
- 09183e0: Fix receipt, locale, meta

## Reglas para Kimi:
1. NUNCA modificar sin ver archivo primero
2. Siempre backup antes de cambiar
3. Verificar build despues de CADA cambio
4. NUNCA regex complejos en PowerShell
5. Si error TS -> restaurar backup inmediato
6. Preferir reescribir archivos completos
7. NO modificar productData.ts sin contar (debe ser 175)
8. NUNCA subir node_modules al repo

## Comandos útiles:
cd 'C:\Users\josel\OneDrive\Desktop\Kimi_Agent_POS Dulces Aromas completo\app\dulces-aromas-posSantogrial92254'
npm run build
git status
git log --oneline -5
Copy-Item 'src/archivo.tsx' 'src/archivo.tsx.backup' -Force
(Select-String -Path 'src/data/productData.ts' -Pattern 'createProduct\(').Count
git checkout <commit> -- src/data/productData.ts

## Si todo se rompe:
git reset --hard b10a00e
git push origin main --force
npm run build

## Negocio:
- Nombre: Dulces Aromas
- Tipo: Perfumería / Boutique de fragancias
- Ubicación: Chile (pesos chilenos)
- Productos: 175 perfumes (Lancôme, Armani, Chanel, Dior, etc.)
- Colaborador: Reinaldo (pareja, inventario)
