document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    const costPriceInput = document.getElementById('costPrice');
    const taxRateInput = document.getElementById('taxRate');
    const targetMarginInput = document.getElementById('targetMargin');
    const mlCommissionInput = document.getElementById('mlCommission');
    const ownGatewayInput = document.getElementById('ownGateway');
    const ownShippingInput = document.getElementById('ownShipping');

    // Preset buttons for Tax
    const presetButtons = document.querySelectorAll('.btn-preset');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            taxRateInput.value = btn.dataset.tax;
            calculatePrices();
        });
    });

    // Add event listeners to all inputs
    const allInputs = [
        costPriceInput, taxRateInput, targetMarginInput,
        mlCommissionInput, ownGatewayInput, ownShippingInput
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
        const ownGatewayPercent = (parseFloat(ownGatewayInput.value) || 0) / 100;
        const ownShipping = parseFloat(ownShippingInput.value) || 0;

        // 1. SITE PRÓPRIO CALCULATION
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

        // 2. MERCADO LIVRE CALCULATION
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

        // 3. SHOPEE CALCULATION (Baseado na tabela oficial de comissões por faixa)[cite: 2]
        let shopeePrice = 0;
        let shopeeFixedFee = 0;
        let shopeeCommPercent = 0;
        let isAdjustedAlert = false;

        const tiers = [
            { max: 79.99, comm: 0.20, fee: 4.50 },  // Até R$ 79,99: 20% + R$ 4,50[cite: 2]
            { max: 99.99, comm: 0.14, fee: 16.00 }, // Acima de R$ 80 até R$ 99,99: 14% + R$ 16[cite: 2]
            { max: 199.99, comm: 0.14, fee: 20.00 },// Acima de R$ 100 até R$ 199,99: 14% + R$ 20[cite: 2]
            { max: 499.99, comm: 0.14, fee: 26.00 },// Acima de R$ 200 até R$ 499,99: 14% + R$ 26[cite: 2]
            { max: Infinity, comm: 0.14, fee: 26.00 }// Acima de R$ 500: 14% + R$ 26[cite: 2]
        ];

        for (const tier of tiers) {
            const divisor = 1 - taxPercent - tier.comm - targetMarginPercent;
            if (divisor > 0) {
                const calculatedPrice = (cost + tier.fee) / divisor;
                if (calculatedPrice <= tier.max) {
                    shopeePrice = calculatedPrice;
                    shopeeFixedFee = tier.fee;
                    shopeeCommPercent = tier.comm;
                    break;
                }
            }
        }

        // Fallback caso ultrapasse a última faixa explicitada
        if (shopeePrice === 0) {
            const tier = tiers[tiers.length - 1];
            const divisor = 1 - taxPercent - tier.comm - targetMarginPercent;
            if (divisor > 0) {
                shopeePrice = (cost + tier.fee) / divisor;
                shopeeFixedFee = tier.fee;
                shopeeCommPercent = tier.comm;
            }
        }

        const shopeeCommVal = shopeePrice * shopeeCommPercent;
        const shopeeTaxVal = shopeePrice * taxPercent;
        const shopeeNetProfit = shopeePrice - cost - shopeeFixedFee - shopeeCommVal - shopeeTaxVal;

        // Alerta automático se cair na zona de transição de faixa com taxa fixa mais pesada (ex: R$ 80 a R$ 88)
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
                `Atenção: O preço calculado caiu na faixa onde a taxa fixa sobe para R$ 16,00. Considere ajustar o valor estrategicamente para abaixo de R$ 79,99 ou acima de R$ 90,00 para proteger sua margem.`;
        } else {
            alertEl.classList.add('hidden');
        }
    }

    // Initial run
    calculatePrices();
});
