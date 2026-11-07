document.addEventListener('DOMContentLoaded', () => {
    const costPriceInput = document.getElementById('costPrice');
    const taxRateInput = document.getElementById('taxRate');
    const targetMarginInput = document.getElementById('targetMargin');
    const mlCommissionInput = document.getElementById('mlCommission');
    const shopeeCommissionInput = document.getElementById('shopeeCommission');
    const ownGatewayInput = document.getElementById('ownGateway');
    const ownShippingInput = document.getElementById('ownShipping');

    const presetButtons = document.querySelectorAll('.btn-preset');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            taxRateInput.value = btn.dataset.tax;
            calculatePrices();
        });
    });

    const allInputs = [
        costPriceInput, taxRateInput, targetMarginInput,
        mlCommissionInput, shopeeCommissionInput, ownGatewayInput, ownShippingInput
    ];

    allInputs.forEach(input => {
        input.addEventListener('input', calculatePrices);
    });

    function formatCurrency(val) {
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function calculatePrices() {
        const cost = parseFloat(costPriceInput.value) || 0;
        const taxPercent = (parseFloat(taxRateInput.value) || 0) / 100;
        const targetMarginPercent = (parseFloat(targetMarginInput.value) || 0) / 100;

        const mlCommPercent = (parseFloat(mlCommissionInput.value) || 0) / 100;
        const shopeeCommPercent = (parseFloat(shopeeCommissionInput.value) || 0) / 100;
        const ownGatewayPercent = (parseFloat(ownGatewayInput.value) || 0) / 100;
        const ownShipping = parseFloat(ownShippingInput.value) || 0;

        // 1. SITE PRÓPRIO
        const ownDivisor = 1 - taxPercent - ownGatewayPercent - targetMarginPercent;
        let ownPrice = 0;
        if (ownDivisor > 0) {
            ownPrice = (cost + ownShipping) / ownDivisor;
        }
        const ownTaxVal = ownPrice * taxPercent;
        const ownGatewayVal = ownPrice * ownGatewayPercent;
        const ownNetProfit = ownPrice - cost - ownShipping - ownTaxVal - ownGatewayVal;
        const ownMarginEff = ownPrice > 0 ? (ownNetProfit / ownPrice) * 100 : 0;

        document.getElementById('ownPrice').textContent = formatCurrency(ownPrice);
        document.getElementById('ownGatewayVal').textContent = 'R$ ' + formatCurrency(ownGatewayVal);
        document.getElementById('ownShippingVal').textContent = 'R$ ' + formatCurrency(ownShipping);
        document.getElementById('ownTaxVal').textContent = 'R$ ' + formatCurrency(ownTaxVal);
        document.getElementById('ownNetProfit').textContent = 'R$ ' + formatCurrency(ownNetProfit);
        document.getElementById('ownMarginEff').textContent = ownMarginEff.toFixed(1) + '%';

        // 2. MERCADO LIVRE
        let mlFixedFee = 0;
        let mlDivisor = 1 - taxPercent - mlCommPercent - targetMarginPercent;
        let mlPrice = 0;

        if (mlDivisor > 0) {
            let pNoFee = cost / mlDivisor;
            if (pNoFee >= 79) {
                mlPrice = pNoFee;
                mlFixedFee = 0;
            } else {
                mlFixedFee = 6.00;
                mlPrice = (cost + mlFixedFee) / mlDivisor;
                if (mlPrice >= 79) {
                    mlPrice = pNoFee;
                    mlFixedFee = 0;
                }
            }
        }

        const mlCommVal = (mlPrice * mlCommPercent);
        const mlTaxVal = (mlPrice * taxPercent);
        const mlNetProfit = mlPrice - cost - mlFixedFee - mlCommVal - mlTaxVal;
        const mlMarginEff = mlPrice > 0 ? (mlNetProfit / mlPrice) * 100 : 0;

        document.getElementById('mlPrice').textContent = formatCurrency(mlPrice);
        document.getElementById('mlFixedFee').textContent = 'R$ ' + formatCurrency(mlFixedFee);
        document.getElementById('mlTotalComm').textContent = 'R$ ' + formatCurrency(mlCommVal);
        document.getElementById('mlTaxVal').textContent = 'R$ ' + formatCurrency(mlTaxVal);
        document.getElementById('mlNetProfit').textContent = 'R$ ' + formatCurrency(mlNetProfit);
        document.getElementById('mlMarginEff').textContent = mlMarginEff.toFixed(1) + '%';

// 3. SHOPEE CALCULATION (Baseado na tabela de comissões por faixa)
function getShopeeRates(estimatedPrice) {
    if (estimatedPrice <= 79.99) {
        return { commPercent: 0.20, fixedFee: 4.50 };
    } else if (estimatedPrice <= 99.99) {
        return { commPercent: 0.14, fixedFee: 16.00 };
    } else if (estimatedPrice <= 199.99) {
        return { commPercent: 0.14, fixedFee: 20.00 };
    } else {
        return { commPercent: 0.14, fixedFee: 26.00 };
    }
}

let shopeePrice = 0;
let shopeeFixedFee = 0;
let shopeeCommPercent = 0;
let isAdjustedAlert = false;

// Tabela de faixas para teste iterativo
const tiers = [
    { max: 79.99, comm: 0.20, fee: 4.50 },
    { max: 99.99, comm: 0.14, fee: 16.00 },
    { max: 199.99, comm: 0.14, fee: 20.00 },
    { max: Infinity, comm: 0.14, fee: 26.00 }
];

for (const tier of tiers) {
    const divisor = 1 - taxPercent - tier.comm - targetMarginPercent;
    if (divisor > 0) {
        const calculatedPrice = (cost + tier.fee) / divisor;
        
        // Verifica se o preço calculado se enquadra dentro do limite da faixa atual
        if (calculatedPrice <= tier.max) {
            shopeePrice = calculatedPrice;
            shopeeFixedFee = tier.fee;
            shopeeCommPercent = tier.comm;
            break;
        }
    }
}

// Fallback para caso atinja a faixa superior (> R$ 200)
if (shopeePrice === 0) {
    const tier = tiers[tiers.length - 1];
    const divisor = 1 - taxPercent - tier.comm - targetMarginPercent;
    if (divisor > 0) {
        shopeePrice = (cost + tier.fee) / divisor;
        shopeeFixedFee = tier.fee;
        shopeeCommPercent = tier.comm;
    }
}

// Validação de margem e zona de transição de faixa
const shopeeCommVal = shopeePrice * shopeeCommPercent;
const shopeeTaxVal = shopeePrice * taxPercent;
const shopeeNetProfit = shopeePrice - cost - shopeeFixedFee - shopeeCommVal - shopeeTaxVal;

// Alerta se o preço cair logo no início da faixa de R$ 16,00 (ex: R$ 80,00 - R$ 85,00) onde a taxa fixa consome parte da margem
if (shopeePrice >= 80.00 && shopeePrice <= 88.00) {
    isAdjustedAlert = true;
}

const shopeeMarginEff = shopeePrice > 0 ? (shopeeNetProfit / shopeePrice) * 100 : 0;

document.getElementById('shopeePrice').textContent = formatCurrency(shopeePrice);
document.getElementById('shopeeFixedFee').textContent = 'R$ ' + formatCurrency(shopeeFixedFee);
document.getElementById('shopeeTotalComm').textContent = 'R$ ' + formatCurrency(shopeeCommVal);
document.getElementById('shopeeTaxVal').textContent = 'R$ ' + formatCurrency(shopeeTaxVal);
document.getElementById('shopeeNetProfit').textContent = 'R$ ' + formatCurrency(shopeeNetProfit);
document.getElementById('shopeeMarginEff').textContent = shopeeMarginEff.toFixed(1) + '%';

const alertEl = document.getElementById('shopeeAlert');
if (isAdjustedAlert) {
    alertEl.classList.remove('hidden');
    document.getElementById('shopeeAlertText').textContent = 
        `Atenção: O produto caiu na faixa de R$ 80,00–R$ 99,99, onde a taxa fixa sobe para R$ 16,00. Considere ajustar o valor para R$ 79,99 ou subir para acima de R$ 90,00 para recalibrar a margem.`;
} else {
    alertEl.classList.add('hidden');
}
    }

    calculatePrices();
});
