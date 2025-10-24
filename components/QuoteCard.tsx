
import React from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  onDelete: (id: string) => void;
}

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.036-2.134H8.718c-1.126 0-2.037.954-2.037 2.134v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDelete }) => {
  const totalCost = (quote.unitPrice * quote.quantity) + quote.shippingCost + quote.deliveryCost;
  const costPerItem = totalCost / quote.quantity;
  const totalWeight = quote.weightKg * quote.quantity;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-5 transition-transform hover:scale-[1.02] relative">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-primary-600 dark:text-primary-400">{quote.productName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">par <span className="font-semibold">{quote.supplierName}</span></p>
        </div>
        <button onClick={() => onDelete(quote.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full -mt-2 -mr-2">
            <TrashIcon className="w-6 h-6"/>
        </button>
      </div>

      <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
                <p className="text-slate-500 dark:text-slate-400">Prix/Unité</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(quote.unitPrice)}</p>
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400">Quantité</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{quote.quantity.toLocaleString('fr-FR')}</p>
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400">Coûts logistiques</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(quote.shippingCost + quote.deliveryCost)}</p>
            </div>
             <div>
                <p className="text-slate-500 dark:text-slate-400">Poids Total</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{totalWeight.toFixed(2)} kg</p>
            </div>
        </div>
      </div>
      
      <div className="mt-4 bg-slate-50 dark:bg-slate-700 rounded-lg p-3 flex justify-between items-center">
        <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Coût Total</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalCost)}</p>
        </div>
        <div>
             <p className="text-sm text-slate-600 dark:text-slate-300 text-right">Coût/Pièce (final)</p>
             <p className="text-md font-semibold text-primary-700 dark:text-primary-300 text-right">{formatCurrency(costPerItem)}</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
