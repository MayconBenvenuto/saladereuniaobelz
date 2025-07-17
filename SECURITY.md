# 🔒 GUIA DE SEGURANÇA

## ⚠️ ALERTA DE SEGURANÇA RESOLVIDO

**Data**: 17 de julho de 2025  
**Problema**: Chaves de API expostas no repositório GitHub  
**Status**: ✅ RESOLVIDO  

### 🚨 O que foi corrigido:

1. **Removidas chaves expostas** dos seguintes arquivos:
   - `SUMMARY.md`
   - `FIX-HORARIOS-PRODUCAO.md`
   - `FIX-404-FINAL.md`
   - `DEPLOY.md`
   - `DEPLOY-GUIDE.md`
   - `CORRECOES-TIMEOUT-FINAL.md`

2. **Melhorado `.gitignore`** para prevenir futuros vazamentos

## 🛡️ AÇÕES OBRIGATÓRIAS AGORA:

### 1. **REGENERAR CHAVES IMEDIATAMENTE**
```bash
# Vá para o Supabase Dashboard
# 1. Settings > API
# 2. Gere novas chaves (Reset API Key)
# 3. Atualize todas as variáveis de ambiente
```

### 2. **Atualizar Variáveis de Ambiente**
Na Vercel:
```
SUPABASE_URL=<NOVA_URL>
SUPABASE_KEY=<NOVA_CHAVE>
REACT_APP_SUPABASE_URL=<NOVA_URL>
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<NOVA_CHAVE>
```

### 3. **Verificar Logs de Acesso**
- Verificar logs do Supabase para acessos suspeitos
- Monitorar uso da API nas últimas 24h

## 🔐 MELHORES PRÁTICAS DE SEGURANÇA:

### ✅ DO:
- Sempre usar variáveis de ambiente para chaves
- Usar `.env.example` com valores fictícios
- Regenerar chaves após exposição
- Usar chaves específicas por ambiente (dev/prod)
- Configurar RLS (Row Level Security) no Supabase

### ❌ DON'T:
- NUNCA commitar arquivos `.env`
- NUNCA hardcodar chaves no código
- NUNCA compartilhar chaves em documentação
- NUNCA usar chaves de produção em desenvolvimento

## 📋 CHECKLIST PÓS-INCIDENTE:

- [ ] Regenerar todas as chaves do Supabase
- [ ] Atualizar variáveis na Vercel
- [ ] Verificar se nenhum arquivo `.env` está no git
- [ ] Revisar logs de acesso no Supabase
- [ ] Testar aplicação com novas chaves
- [ ] Configurar alertas de segurança no GitHub
- [ ] Configurar GitGuardian para monitoramento

## 🚨 EM CASO DE NOVA EXPOSIÇÃO:

1. **IMEDIATO**: Regenerar chaves
2. **5 min**: Atualizar todas as variáveis
3. **10 min**: Verificar logs de acesso
4. **15 min**: Redeploy da aplicação
5. **30 min**: Revisar todo o código

## 📞 CONTATOS DE EMERGÊNCIA:

- **GitHub Support**: Para remoção de dados sensíveis do histórico
- **Supabase Support**: Para verificação de segurança da conta
- **Vercel Support**: Para auditoria de variáveis de ambiente

---
**🔒 Mantenha este arquivo atualizado e revise regularmente as práticas de segurança!**
