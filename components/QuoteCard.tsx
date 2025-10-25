import React, { useEffect, useState } from 'react';
import { Quote, ShippingType, Currency } from '../types';
import QuoteReport from './QuoteReport';

interface QuoteCardProps {
  quote: Quote;
  onRequestDelete: (id: string) => void;
  onEdit: (quote: Quote) => void;
  globalCurrency: Currency;
  exchangeRates: Record<string, number> | null;
}

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const EditIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const PrintIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18.75h12m-12 0a3 3 0 0 1-3-3V9.75A3 3 0 0 1 6 6.75h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3m-12 0v1.5A2.25 2.25 0 0 0 8.25 22.5h7.5A2.25 2.25 0 0 0 18 20.25v-1.5m-9-12V3.75A1.5 1.5 0 0 1 10.5 2.25h3A1.5 1.5 0 0 1 15 3.75V5.25M6 15.75h12" />
  </svg>
);

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


const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onRequestDelete, onEdit, globalCurrency, exchangeRates }) => {
  const [isPrintTarget, setIsPrintTarget] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportPrintTarget, setIsReportPrintTarget] = useState(false);

  useEffect(() => {
    const handler = () => { setIsPrintTarget(false); setIsReportPrintTarget(false); };
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, []);

  const getConvertedValue = (amount: number) => {
    if (!exchangeRates) return amount;
    return convertCurrency(amount, quote.currency, globalCurrency, exchangeRates);
  };
  
  const convertedUnitPrice = getConvertedValue(quote.unitPrice);
  const baseCost = convertedUnitPrice * quote.quantity;
  const currencyToDisplay = exchangeRates ? globalCurrency : quote.currency;

  // Nouveau: poids total de la marchandise (Kg)
  const totalWeightKg = (quote.weightKg || 0) * (quote.quantity || 0);

  // Badge: existe-t-il un prix/kg ?
  const hasPerKg = Object.values(quote.shippingOptions).some(v => v && v.pricePerKg != null && v.pricePerKg > 0);

  const hasIntlShippingOptions = Object.values(quote.shippingOptions).some(v => v && ((v.shippingCost > 0 || v.deliveryCost > 0) || (v.pricePerKg != null && v.pricePerKg > 0)));

  // Total cumulé du transport local (pas de distinction par type)
  const localTransportTotalConverted = quote.localTransportOptions.reduce((sum, lt) => sum + getConvertedValue(lt.cost), 0);

  const handlePrint = () => {
    setIsPrintTarget(true);
    setTimeout(() => window.print(), 50);
  };

  const handleOpenReport = () => setIsReportOpen(true);
  const handleCloseReport = () => setIsReportOpen(false);
  const handlePrintReport = () => {
    setIsReportPrintTarget(true);
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className={`bg-white dark:bg-secondary rounded-lg shadow-md p-5 flex flex-col justify-between relative ${isPrintTarget ? 'print-target' : ''}`}>
       <div className="absolute top-3 right-3 flex gap-2 no-print">
            <button
                onClick={() => onEdit(quote)}
                className="text-secondary/40 dark:text-primary/50 hover:text-brandBlue dark:hover:text-brandSky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Modifier le devis"
                disabled={!exchangeRates}
            >
                <EditIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => onRequestDelete(quote.id)}
                className="text-secondary/40 dark:text-primary/50 hover:text-brandRed transition-colors"
                aria-label="Supprimer le devis"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handlePrint}
                className="text-secondary/50 dark:text-primary/60 hover:text-secondary dark:hover:text-primary transition-colors"
                aria-label="Imprimer / Exporter en PDF (carte)"
                title="Imprimer / Exporter en PDF (carte)"
            >
                <PrintIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleOpenReport}
                className="px-2 py-1 text-xs rounded-md bg-brandBlue/10 hover:bg-brandBlue/20 dark:bg-brandSky/10 dark:hover:bg-brandSky/20 text-brandBlue dark:text-brandSky"
                aria-label="Ouvrir le rapport de devis"
                title="Rapport (PDF)"
            >
                Rapport (PDF)
            </button>
        </div>
        <div>
            <h3 className="text-lg font-bold text-secondary dark:text-primary truncate pr-16">{quote.supplierName}</h3>
            <p className="text-sm text-secondary/70 dark:text-primary/70 mb-4">{quote.productName}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 border-b border-secondary/20 dark:border-primary/20 pb-4">
                <div className="text-center">
                    <p className="text-xs text-secondary/60 dark:text-primary/70">Prix Unitaire</p>
                    <p className="font-semibold">{formatCurrency(convertedUnitPrice, currencyToDisplay)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-secondary/60 dark:text-primary/70">Quantité</p>
                    <p className="font-semibold">{quote.quantity.toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-secondary/60 dark:text-primary/70">Poids unitaire (Kg)</p>
                    <p className="font-semibold">{(quote.weightKg || 0).toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-secondary/60 dark:text-primary/70 flex items-center justify-center gap-2">Poids total (Kg)
                      {hasPerKg && (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brandYellow/40 border border-brandYellow text-secondary">Facturation au kilo</span>
                      )}
                    </p>
                    <p className="font-semibold">{totalWeightKg.toLocaleString('fr-FR')}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="text-center">
                    <p className="text-xs text-secondary/60 dark:text-primary/70">Coût base</p>
                    <p className="font-semibold">{formatCurrency(baseCost, currencyToDisplay)}</p>
                </div>
            </div>

            <h4 className="text-md font-semibold mb-2 text-secondary dark:text-primary">Coûts de livraison internationale</h4>
            <ul className="space-y-3 text-sm mb-4">
                {Object.entries(quote.shippingOptions).map(([type, details]) => {
                if (!details || ((details.shippingCost === 0 && details.deliveryCost === 0) && !(details.pricePerKg != null && details.pricePerKg > 0))) return null;

                const convertedShipping = getConvertedValue(details.shippingCost || 0);
                const convertedDelivery = getConvertedValue(details.deliveryCost || 0);
                const convertedPricePerKg = details.pricePerKg != null ? getConvertedValue(details.pricePerKg) : 0;
                const variableCost = convertedPricePerKg > 0 ? convertedPricePerKg * totalWeightKg : 0;
                const logisticsCost = convertedShipping + variableCost + convertedDelivery;
                const totalCostBeforeLocal = baseCost + logisticsCost;
                const finalCost = totalCostBeforeLocal + localTransportTotalConverted;
                const perPiece = quote.quantity > 0 ? (finalCost / quote.quantity) : 0;

                return (
                    <li key={type} className="p-3 bg-secondary/5 dark:bg-primary/10 rounded-md">
                        <div className="font-medium text-secondary dark:text-primary">{shippingTypeLabels[type as ShippingType]}</div>
                        {convertedPricePerKg > 0 && (
                          <div className="flex justify-between items-center mt-1 text-secondary/70 dark:text-primary/70">
                            <span>Prix / Kg × Poids total:</span>
                            <span className="font-mono">{formatCurrency(variableCost, currencyToDisplay)} <span className="text-xs">({formatCurrency(convertedPricePerKg, currencyToDisplay)} × {totalWeightKg.toLocaleString('fr-FR')} kg)</span></span>
                          </div>
                        )}
                        {convertedShipping > 0 && (
                          <div className="flex justify-between items-center mt-1 text-secondary/70 dark:text-primary/70">
                            <span>Forfait expédition:</span>
                            <span className="font-mono">{formatCurrency(convertedShipping, currencyToDisplay)}</span>
                          </div>
                        )}
                        {convertedDelivery > 0 && (
                          <div className="flex justify-between items-center mt-1 text-secondary/70 dark:text-primary/70">
                            <span>Frais de livraison:</span>
                            <span className="font-mono">{formatCurrency(convertedDelivery, currencyToDisplay)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-1 text-secondary/80 dark:text-primary/80">
                            <span>Coût logistique total:</span>
                            <span className="font-mono">{formatCurrency(logisticsCost, currencyToDisplay)}</span>
                        </div>
                        {localTransportTotalConverted > 0 && (
                          <div className="flex justify-between items-center mt-1 text-secondary/70 dark:text-primary/70">
                              <span>Transport local (total):</span>
                              <span className="font-mono">{formatCurrency(localTransportTotalConverted, currencyToDisplay)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center font-semibold text-secondary dark:text-primary mt-1">
                            <span>Coût total (tout inclus):</span>
                            <span className="font-mono">{formatCurrency(finalCost, currencyToDisplay)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-brandBlue dark:text-brandSky mt-1">
                            <span>Coût / pièce (tout inclus):</span>
                            <span className="font-mono">{quote.quantity > 0 ? formatCurrency(perPiece, currencyToDisplay) : '-'}</span>
                        </div>
                    </li>
                );
                })}
                {!hasIntlShippingOptions && (
                    <p className="text-sm text-secondary/70 dark:text-primary/70 italic">Aucune option de livraison internationale renseignée.</p>
                )}
            </ul>
            
            {quote.localTransportOptions.length > 0 && !hasIntlShippingOptions && (
                 <div className="p-3 bg-secondary/5 dark:bg-primary/10 rounded-md">
                    <h4 className="text-md font-semibold mb-2 text-secondary dark:text-primary">Transport local</h4>
                    <div className="flex justify-between items-center text-sm text-secondary dark:text-primary">
                      <span>Total transport local:</span>
                      <span className="font-mono">{formatCurrency(localTransportTotalConverted, currencyToDisplay)}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-secondary dark:text-primary mt-2">
                      <span>Coût total (base + local):</span>
                      <span className="font-mono">{formatCurrency(baseCost + localTransportTotalConverted, currencyToDisplay)}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-brandBlue dark:text-brandSky mt-1">
                      <span>Coût / pièce (tout inclus):</span>
                      <span className="font-mono">{quote.quantity > 0 ? formatCurrency((baseCost + localTransportTotalConverted) / quote.quantity, currencyToDisplay) : '-'}</span>
                    </div>
                 </div>
            )}
        </div>

        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 p-3 no-print" onClick={handleCloseReport}>
            <div className="bg-white dark:bg-secondary rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-secondary/20 dark:border-primary/20 px-4 py-3 sticky top-0 bg-white dark:bg-secondary">
                <h3 className="text-lg font-semibold text-secondary dark:text-primary">Rapport de Devis</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintReport} className="px-3 py-1.5 text-sm rounded-md text-white bg-brandBlue hover:bg-brandSky">Imprimer le rapport</button>
                  <button onClick={handleCloseReport} className="px-3 py-1.5 text-sm rounded-md text-secondary dark:text-primary bg-secondary/10 dark:bg-primary/10 hover:bg-secondary/20 dark:hover:bg-primary/20">Fermer</button>
                </div>
              </div>
              <div className={`${isReportPrintTarget ? 'print-target' : ''}`}>
                <QuoteReport quote={quote} globalCurrency={globalCurrency} exchangeRates={exchangeRates} />
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default QuoteCard;
