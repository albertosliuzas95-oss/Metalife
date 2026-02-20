# Metalife

Aplicação web completa (front-end) para gestão de rotina e vida financeira com assinatura, onboarding, dashboard avançado e chatbot financeiro.

## Funcionalidades implementadas

- Introdução do produto e entrada guiada.
- Sistema de cadastro e login com persistência em `localStorage`.
- Assinatura validada por cartão (simulação com validação de número, validade e CVV).
- Regra de acesso: só entra no dashboard com conta + assinatura ativa.
- Dashboard com metas, histórico de gastos, KPIs e relatório mensal.
- Chatbot financeiro que registra gastos ao detectar frases como:
  - `gastei 85 mercado`
  - `gastei 120.50 uber`

## Executar localmente

```bash
python3 -m http.server 4173
```

Abra: `http://localhost:4173`
