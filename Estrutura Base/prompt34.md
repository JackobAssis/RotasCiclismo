# CONTEXTO

Estou realizando deploy do backend NestJS do projeto RotasCiclismo no Railway.

Stack:

* NestJS
* Prisma
* PostgreSQL (Neon)
* pnpm workspace
* Docker deploy
* Prisma Client

O deploy está falhando durante o build.

Diagnóstico do Railway:

```text
Failed to build an image.

Update the Dockerfile to remove the postinstall script before running the production install.

The build fails because apps/api/package.json has:

"postinstall": "prisma generate"

but prisma is a devDependency that gets skipped when:

pnpm install --prod

runs in the production stage.

The Prisma Client is already generated in the builder stage,
so the postinstall hook is not needed there.
```

---

# OBJETIVO

Analisar completamente a estrutura atual do backend e corrigir definitivamente o problema de build relacionado ao Prisma, Docker e Railway.

Não quero apenas uma correção rápida.

Quero uma solução seguindo boas práticas para:

* NestJS
* Prisma
* Docker multi-stage
* Railway
* pnpm workspaces

---

# TAREFAS

## ETAPA 1 — AUDITORIA

Analise:

```text
apps/api/package.json
apps/api/Dockerfile
package.json raiz
pnpm-workspace.yaml
```

Identifique:

* scripts problemáticos
* hooks postinstall
* dependências Prisma mal posicionadas
* possíveis erros futuros de deploy

---

## ETAPA 2 — VALIDAR DEPENDÊNCIAS

Verificar se:

```json
"@prisma/client"
```

está em:

```json
dependencies
```

e não em:

```json
devDependencies
```

Caso esteja incorreto:

corrigir.

Explicar o motivo.

---

## ETAPA 3 — VALIDAR PRISMA

Garantir que:

```bash
prisma generate
```

seja executado apenas onde necessário.

Identificar:

* onde está sendo executado atualmente
* onde deveria ser executado

Objetivo:

Gerar Prisma Client uma única vez.

---

## ETAPA 4 — CORRIGIR PACKAGE.JSON

Verificar existência de:

```json
"postinstall": "prisma generate"
```

Caso exista:

avaliar impacto.

Implementar a melhor solução.

Explicar:

* remover
* substituir
* mover para outro estágio

Justificar tecnicamente.

---

## ETAPA 5 — AUDITORIA DO DOCKERFILE

Analisar o Dockerfile completo.

Validar:

Builder Stage

```dockerfile
pnpm install
pnpm prisma generate
pnpm build
```

Runtime Stage

```dockerfile
pnpm install --prod
```

Confirmar que o Prisma Client gerado está sendo copiado corretamente para a imagem final.

Verificar:

```text
node_modules/.prisma
node_modules/@prisma/client
```

---

## ETAPA 6 — RAILWAY

Validar compatibilidade com:

* Railway Deploy
* Docker Build
* Neon Database
* Prisma Migrate Deploy

Garantir que após o deploy seja possível executar:

```bash
pnpm prisma migrate deploy
```

sem quebrar a imagem.

---

## ETAPA 7 — MELHORIAS

Caso encontre problemas adicionais relacionados a:

* build cache
* tamanho da imagem
* pnpm workspace
* prisma engines
* node_modules

propor melhorias.

---

# RESULTADO ESPERADO

Fornecer:

1. Diagnóstico da causa raiz.
2. Lista de arquivos alterados.
3. Código completo das correções.
4. Dockerfile final recomendado.
5. package.json final recomendado.
6. Checklist para validar o deploy no Railway.
7. Explicação técnica das decisões.

IMPORTANTE:

* Não criar soluções temporárias.
* Não remover funcionalidades.
* Não alterar a arquitetura do projeto.
* Focar exclusivamente em corrigir o pipeline de build Prisma + Docker + Railway.
* Garantir compatibilidade com o banco Neon já configurado.
