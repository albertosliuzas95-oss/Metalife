# Metalife

Aplicação web para gestão financeira com fluxo completo: cadastro/login, assinatura e dashboard em abas com visual clean dark roxo.

## O que foi implementado

- Onboarding inicial.
- Cadastro e login com persistência em `localStorage`.
- Assinatura com validação de cartão (Luhn, validade e CVV).
- Dashboard organizado por abas:
  - **Visão geral** (KPIs + gráficos animados + fechamento mensal)
  - **Metas**
  - **Histórico**
  - **Chatbot** (aba dedicada para despesas)
- Chatbot que registra gastos por comando natural (ex.: `gastei 120 mercado`).

## Executar localmente

```bash
python3 -m http.server 4173
```

Abra: `http://localhost:4173`
