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

        // 3. SHOPEE (COM PROTEÇÃO DE MARGEM DE FAIXA RUIM)
        let shopeeDivisor = 1 - taxPercent - shopeeCommPercent - targetMarginPercent;
        let shopeePrice = 0;
        let shopeeFixedFee = 0;
        let isAdjustedAlert = false;

        if (shopeeDivisor > 0) {
            let rawPrice = (cost + 4.00) / shopeeDivisor;
            let rawPriceLow = (cost + 2.00) / shopeeDivisor;

            if (rawPriceLow < 8.00) {
                shopeePrice = rawPriceLow;
                shopeeFixedFee = 2.00;
            } else {
                shopeePrice = rawPrice;
                shopeeFixedFee = 4.00;

                const currentNetProfit = shopeePrice - cost - shopeeFixedFee - (shopeePrice * shopeeCommPercent) - (shopeePrice * taxPercent);
                const desiredProfit = shopeePrice * targetMarginPercent;
                const minAcceptableProfit = desiredProfit / 2;

                if (shopeePrice < 12.00 || currentNetProfit < minAcceptableProfit) {
                    const halfMarginDivisor = 1 - taxPercent - shopeeCommPercent - (targetMarginPercent / 2);
                    let safePrice = (cost + 4.00) / halfMarginDivisor;
                    
                    if (safePrice < 12.50) {
                        safePrice = 12.50;
                    }
                    
                    if (safePrice > shopeePrice) {
                        shopeePrice = safePrice;
                        isAdjustedAlert = true;
                    }
                }
            }
        }

        let shopeeCommVal = shopeePrice * shopeeCommPercent;
        if (shopeeCommVal > 100) {
            shopeeCommVal = 100;
        }

        const shopeeTaxVal = shopeePrice * taxPercent;
        const shopeeNetProfit = shopeePrice - cost - shopeeFixedFee - shopeeCommVal - shopeeTaxVal;
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
        } else {
            alertEl.classList.add('hidden');
        }
    }

    calculatePrices();
});
