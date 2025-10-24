import React from 'react';
import { Quote, ShippingType, Currency } from '../types';

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

  const getConvertedValue = (amount: number) => {
    if (!exchangeRates) return amount;
    return convertCurrency(amount, quote.currency, globalCurrency, exchangeRates);
  };
  
  const convertedUnitPrice = getConvertedValue(quote.unitPrice);
  const baseCost = convertedUnitPrice * quote.quantity;
  const currencyToDisplay = exchangeRates ? globalCurrency : quote.currency;

  const hasIntlShippingOptions = Object.values(quote.shippingOptions).some(v => v && (v.shippingCost > 0 || v.deliveryCost > 0));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 flex flex-col justify-between relative">
       <div className="absolute top-3 right-3 flex gap-2">
            <button 
                onClick={() => onEdit(quote)}
                className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Modifier le devis"
                disabled={!exchangeRates}
            >
                <EditIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => onRequestDelete(quote.id)}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Supprimer le devis"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-16">{quote.supplierName}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{quote.productName}</p>

            <div className="grid grid-cols-3 gap-4 text-sm mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prix Unitaire</p>
                    <p className="font-semibold">{formatCurrency(convertedUnitPrice, currencyToDisplay)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantité</p>
                    <p className="font-semibold">{quote.quantity.toLocaleString('fr-FR')}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Coût base</p>
                    <p className="font-semibold">{formatCurrency(baseCost, currencyToDisplay)}</p>
                </div>
            </div>

            <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Coûts de livraison internationale</h4>
            <ul className="space-y-3 text-sm mb-4">
                {Object.entries(quote.shippingOptions).map(([type, details]) => {
                if (!details || (details.shippingCost === 0 && details.deliveryCost === 0)) return null;
                
                const convertedShipping = getConvertedValue(details.shippingCost);
                const convertedDelivery = getConvertedValue(details.deliveryCost);
                const logisticsCost = convertedShipping + convertedDelivery;
                const totalCostBeforeLocal = baseCost + logisticsCost;

                return (
                    <li key={type} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{shippingTypeLabels[type as ShippingType]}</div>
                        <div className="flex justify-between items-center mt-1 text-slate-600 dark:text-slate-400">
                            <span>Coût logistique:</span>
                            <span className="font-mono">{formatCurrency(logisticsCost, currencyToDisplay)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                            <span>Coût total (avant transport local):</span>
                            <span className="font-mono">{formatCurrency(totalCostBeforeLocal, currencyToDisplay)}</span>
                        </div>
                        {quote.localTransportOptions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                {quote.localTransportOptions.map(lt => {
                                    const convertedLocalCost = getConvertedValue(lt.cost);
                                    const finalCost = totalCostBeforeLocal + convertedLocalCost;
                                    return (
                                        <div key={lt.id} className="text-xs">
                                            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                                                <span>+ Coût final avec {lt.name}:</span>
                                                <span className="font-mono">{formatCurrency(finalCost, currencyToDisplay)}</span>
                                            </div>
                                             <div className="flex justify-between items-center font-semibold text-blue-600 dark:text-blue-400">
                                                <span>Coût / pièce (tout inclus):</span>
                                                <span className="font-mono">{formatCurrency(finalCost / quote.quantity, currencyToDisplay)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </li>
                );
                })}
                {!hasIntlShippingOptions && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune option de livraison internationale renseignée.</p>
                )}
            </ul>
            
            {quote.localTransportOptions.length > 0 && !hasIntlShippingOptions && (
                 <div>
                    <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Coûts de transport local</h4>
                     <ul className="space-y-2 text-sm">
                        {quote.localTransportOptions.map(lt => {
                             const convertedLocalCost = getConvertedValue(lt.cost);
                             return (
                                <li key={lt.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between items-center">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{lt.name}</span>
                                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(convertedLocalCost, currencyToDisplay)}</span>
                                </li>
                             )
                        })}
                    </ul>
                 </div>
            )}
        </div>
    </div>
  );
};

export default QuoteCard;
