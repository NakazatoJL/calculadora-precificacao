# Calculadora de Precificação para E-commerce

Aplicação web estática (HTML5, CSS3, JavaScript puro) para cálculo de preço sugerido de venda com foco em **Mercado Livre**, **Shopee** e **Site Próprio (E-commerce)**.

## 🚀 Funcionalidades

- **Custo Total & Impostos**: Entrada de custo, alíquota personalizável e *presets* rápidos de regime tributário (Simples Nacional 6%, 11.2%, Lucro Presumido 18%, etc.).
- **Shopee (Proteção contra Faixa Ruim)**: Algoritmo automático que detecta quando a taxa fixa (R$ 4,00) corrói a margem em produtos de baixo valor, ajustando o preço para garantir retorno de 100% do custo e cobrir pelo menos 50% da margem desejada.
- **Mercado Livre**: Cálculo dinâmico considerando a taxa fixa de R$ 6,00 para anúncios abaixo de R$ 79,00.
- **Site Próprio**: Precificação considerando taxas de gateway de pagamento e custos de frete embutido.
- **Zero Dependências**: Rodando em JavaScript Vanilla (sem frameworks pesados), ideal para hospedagem estática gratuita.

## 📁 Estrutura do Repositório

```text
.
├── index.html   # Estrutura e marcação da aplicação
├── style.css    # Estilos responsivos e tema visual
├── app.js       # Regras de negócio, cálculos e lógica da Shopee
└── README.md    # Documentação do projeto
