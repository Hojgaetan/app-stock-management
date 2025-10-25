import React from 'react';
import { Quote, ShippingType, Currency } from '../types';

interface QuoteReportProps {
  quote: Quote;
  globalCurrency: Currency;
  exchangeRates: Record<string, number> | null;
}

const shippingTypeLabels: { [key in ShippingType]: string } = {
  'direct-air': 'Direct par avion',
  'forwarder-standard': 'Transitaire Standard',
  'forwarder-express': 'Transitaire Express',
};

const convertCurrency = (amount: number, from: Currency, to: Currency, rates: Record<string, number>): number => {
  if (!rates || from === to) return amount;
  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;
  const amountInEur = amount / rateFrom;
  return amountInEur * rateTo;
};

const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
};

const QuoteReport: React.FC<QuoteReportProps> = ({ quote, globalCurrency, exchangeRates }) => {
  const getConvertedValue = (amount: number) => {
    if (!exchangeRates) return amount;
    return convertCurrency(amount, quote.currency, globalCurrency, exchangeRates);
  };

  const currencyToDisplay = exchangeRates ? globalCurrency : quote.currency;
  const convertedUnitPrice = getConvertedValue(quote.unitPrice);
  const baseCost = convertedUnitPrice * (quote.quantity || 0);
  const totalWeightKg = (quote.weightKg || 0) * (quote.quantity || 0);

  const shippingBreakdown = Object.entries(quote.shippingOptions).map(([type, details]) => {
    if (!details) return null;
    const convertedShipping = getConvertedValue(details.shippingCost || 0);
    const convertedDelivery = getConvertedValue(details.deliveryCost || 0);
    const convertedPricePerKg = details.pricePerKg != null ? getConvertedValue(details.pricePerKg) : 0;
    const variableCost = convertedPricePerKg > 0 ? convertedPricePerKg * totalWeightKg : 0;
    const logisticsCost = convertedShipping + variableCost + convertedDelivery;
    const totalCostBeforeLocal = baseCost + logisticsCost;
    return {
      type: type as ShippingType,
      label: shippingTypeLabels[type as ShippingType],
      convertedPricePerKg,
      variableCost,
      convertedShipping,
      convertedDelivery,
      logisticsCost,
      totalCostBeforeLocal,
    };
  }).filter(Boolean) as Array<{
    type: ShippingType;
    label: string;
    convertedPricePerKg: number;
    variableCost: number;
    convertedShipping: number;
    convertedDelivery: number;
    logisticsCost: number;
    totalCostBeforeLocal: number;
  }>;

  const localTransportTotalConverted = quote.localTransportOptions.reduce((sum, lt) => sum + getConvertedValue(lt.cost), 0);

  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: '2-digit' });

  return (
    <div className="report-content bg-white text-secondary p-6">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rapport de Devis</h1>
          <p className="text-sm text-secondary/70">Date: {dateStr}</p>
        </div>
        <div className="text-right">
          <div className="text-sm">Devise d'affichage</div>
          <div className="font-semibold">{currencyToDisplay}</div>
        </div>
      </div>

      {/* Informations devis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Fournisseur</div>
          <div className="font-semibold">{quote.supplierName}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Produit</div>
          <div className="font-semibold">{quote.productName}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Quantité</div>
          <div className="font-semibold">{(quote.quantity || 0).toLocaleString('fr-FR')}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Prix unitaire</div>
          <div className="font-semibold">{formatCurrency(convertedUnitPrice, currencyToDisplay)}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Poids unitaire (Kg)</div>
          <div className="font-semibold">{(quote.weightKg || 0).toLocaleString('fr-FR')}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-secondary/70">Poids total (Kg)</div>
          <div className="font-semibold">{totalWeightKg.toLocaleString('fr-FR')}</div>
        </div>
      </div>

      {/* Récap coût de base */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Coût de base</h2>
        <div className="flex items-center justify-between border rounded-md p-4">
          <span>Total produits</span>
          <span className="font-mono">{formatCurrency(baseCost, currencyToDisplay)}</span>
        </div>
      </div>

      {/* Options d'expédition internationale */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Expédition internationale</h2>
        {shippingBreakdown.length > 0 ? (
          <div className="space-y-3">
            {shippingBreakdown.map((opt) => (
              <div key={opt.type} className="border rounded-md p-4">
                <div className="font-medium mb-2">{opt.label}</div>
                {opt.convertedPricePerKg > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Prix / Kg × Poids total</span>
                    <span className="font-mono">{formatCurrency(opt.variableCost, currencyToDisplay)}</span>
                  </div>
                )}
                {opt.convertedShipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Forfait expédition</span>
                    <span className="font-mono">{formatCurrency(opt.convertedShipping, currencyToDisplay)}</span>
                  </div>
                )}
                {opt.convertedDelivery > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Frais de livraison</span>
                    <span className="font-mono">{formatCurrency(opt.convertedDelivery, currencyToDisplay)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium mt-2">
                  <span>Coût logistique total</span>
                  <span className="font-mono">{formatCurrency(opt.logisticsCost, currencyToDisplay)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Base + logistique</span>
                  <span className="font-mono">{formatCurrency(opt.totalCostBeforeLocal, currencyToDisplay)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-secondary/70 italic">Aucune option de livraison internationale renseignée.</div>
        )}
      </div>

      {/* Transport local */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Transport local</h2>
        {quote.localTransportOptions.length > 0 ? (
          <div className="border rounded-md divide-y">
            {quote.localTransportOptions.map((lt) => (
              <div key={lt.id} className="flex justify-between p-3 text-sm">
                <span>{lt.name}</span>
                <span className="font-mono">{formatCurrency(getConvertedValue(lt.cost), currencyToDisplay)}</span>
              </div>
            ))}
            <div className="flex justify-between p-3 font-medium">
              <span>Total transport local</span>
              <span className="font-mono">{formatCurrency(localTransportTotalConverted, currencyToDisplay)}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-secondary/70 italic">Aucun transport local renseigné.</div>
        )}
      </div>

      {/* Totaux finaux par option */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold mb-2">Totaux finaux</h2>
        {shippingBreakdown.length > 0 ? (
          <div className="space-y-3">
            {shippingBreakdown.map((opt) => {
              const final = opt.totalCostBeforeLocal + localTransportTotalConverted;
              const perPiece = (quote.quantity || 0) > 0 ? final / quote.quantity : 0;
              return (
                <div key={opt.type} className="border rounded-md p-4">
                  <div className="font-medium mb-2">{opt.label}</div>
                  <div className="flex justify-between">
                    <span>Coût total (tout inclus)</span>
                    <span className="font-mono">{formatCurrency(final, currencyToDisplay)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Coût / pièce (tout inclus)</span>
                    <span className="font-mono">{(quote.quantity || 0) > 0 ? formatCurrency(perPiece, currencyToDisplay) : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-md p-4">
            <div className="flex justify-between">
              <span>Coût total (base + local)</span>
              <span className="font-mono">{formatCurrency(baseCost + localTransportTotalConverted, currencyToDisplay)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Coût / pièce (tout inclus)</span>
              <span className="font-mono">{(quote.quantity || 0) > 0 ? formatCurrency((baseCost + localTransportTotalConverted) / (quote.quantity || 1), currencyToDisplay) : '-'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteReport;

