import React, { useState, useEffect } from 'react';
import { Quote, Currency, ShippingType, ShippingCostDetail } from '../types';

interface QuoteFormProps {
  onAddQuote: (quote: Omit<Quote, 'id'>) => void;
  onUpdateQuote: (quote: Quote) => void;
  quoteToEdit: Quote | null;
  clearEditing: () => void;
  globalCurrency: Currency;
  exchangeRates: Record<string, number> | null;
}

const initialShippingInputs = {
  'direct-air': { shippingCost: '', deliveryCost: '' },
  'forwarder-standard': { shippingCost: '', deliveryCost: '' },
  'forwarder-express': { shippingCost: '', deliveryCost: '' },
};

const convertCurrency = (amount: number, from: Currency, to: Currency, rates: Record<string, number>): number => {
    if (!rates || from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const amountInEur = amount / rateFrom;
    return amountInEur * rateTo;
};

const getFractionDigits = (currency: Currency) => currency === 'XOF' ? 0 : 2;

const inputClasses = "block w-full rounded-md border-0 py-1.5 px-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-colors";
const selectClasses = `${inputClasses} pr-8 disabled:opacity-70 disabled:cursor-not-allowed`;

const QuoteForm: React.FC<QuoteFormProps> = ({ onAddQuote, onUpdateQuote, quoteToEdit, clearEditing, globalCurrency, exchangeRates }) => {
  const [supplierName, setSupplierName] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState<Currency>(globalCurrency);
  const [shippingInputs, setShippingInputs] = useState(initialShippingInputs);
  
  const isEditing = !!quoteToEdit;

  useEffect(() => {
    if (isEditing && quoteToEdit && exchangeRates) {
      const fractionDigits = getFractionDigits(globalCurrency);
      
      const displayUnitPrice = convertCurrency(quoteToEdit.unitPrice, quoteToEdit.currency, globalCurrency, exchangeRates);

      setSupplierName(quoteToEdit.supplierName);
      setProductName(quoteToEdit.productName);
      setUnitPrice(displayUnitPrice.toFixed(fractionDigits));
      setWeightKg(String(quoteToEdit.weightKg));
      setQuantity(String(quoteToEdit.quantity));
      setCurrency(quoteToEdit.currency);
      
      const newShippingInputs = { ...initialShippingInputs };
      for (const key in quoteToEdit.shippingOptions) {
          const typedKey = key as ShippingType;
          const details = quoteToEdit.shippingOptions[typedKey];
          if(details) {
                const displayShipping = convertCurrency(details.shippingCost, quoteToEdit.currency, globalCurrency, exchangeRates);
                const displayDelivery = convertCurrency(details.deliveryCost, quoteToEdit.currency, globalCurrency, exchangeRates);
                newShippingInputs[typedKey] = {
                  shippingCost: displayShipping.toFixed(fractionDigits),
                  deliveryCost: displayDelivery.toFixed(fractionDigits)
              };
          }
      }
      setShippingInputs(newShippingInputs);

    } else {
      resetForm();
      setCurrency(globalCurrency);
    }
  }, [quoteToEdit, globalCurrency, exchangeRates, isEditing]);
  
  useEffect(() => {
    if (!isEditing) {
        setCurrency(globalCurrency);
    }
  }, [globalCurrency, isEditing]);

  const resetForm = () => {
    setSupplierName('');
    setProductName('');
    setUnitPrice('');
    setWeightKg('');
    setQuantity('');
    setCurrency(globalCurrency);
    setShippingInputs(initialShippingInputs);
  };

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string, currencyForFormatting: Currency, allowDecimals: boolean) => {
    const fractionDigits = getFractionDigits(currencyForFormatting);
    let regex;
    if (!allowDecimals) {
        regex = /^\d*$/;
    } else if (fractionDigits > 0) {
        regex = new RegExp(`^\\d*\\.?\\d{0,${fractionDigits}}$`);
    } else {
        regex = /^\d*$/;
    }

    if (regex.test(value)) {
        setter(value);
    }
  };

  const handleShippingChange = (type: ShippingType, field: 'shippingCost' | 'deliveryCost', value: string) => {
    const currencyForFormatting = isEditing ? globalCurrency : currency;
    const fractionDigits = getFractionDigits(currencyForFormatting);
    const regex = new RegExp(`^\\d*\\.?\\d{0,${fractionDigits}}$`);
    
    if (regex.test(value)) {
      setShippingInputs(prev => ({
        ...prev,
        [type]: { ...prev[type], [field]: value }
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const getNum = (val: string) => parseFloat(val) || 0;

    const parsedShippingOptions = Object.entries(shippingInputs).reduce((acc, [key, value]) => {
        const shippingCost = getNum(value.shippingCost);
        const deliveryCost = getNum(value.deliveryCost);

        if (shippingCost > 0 || deliveryCost > 0) {
          acc[key as ShippingType] = { shippingCost, deliveryCost };
        }
        return acc;
    }, {} as { [key in ShippingType]?: ShippingCostDetail });

    if (isEditing && quoteToEdit && exchangeRates) {
        const originalUnitPrice = convertCurrency(getNum(unitPrice), globalCurrency, quoteToEdit.currency, exchangeRates);
        
        const originalShippingOptions = { ...parsedShippingOptions };
        for (const key in originalShippingOptions) {
            const typedKey = key as ShippingType;
            const details = originalShippingOptions[typedKey];
            if (details) {
                originalShippingOptions[typedKey] = {
                    shippingCost: convertCurrency(details.shippingCost, globalCurrency, quoteToEdit.currency, exchangeRates),
                    deliveryCost: convertCurrency(details.deliveryCost, globalCurrency, quoteToEdit.currency, exchangeRates)
                };
            }
        }

        onUpdateQuote({ 
            id: quoteToEdit.id,
            supplierName,
            productName,
            unitPrice: originalUnitPrice,
            weightKg: getNum(weightKg),
            quantity: parseInt(quantity, 10) || 0,
            currency: quoteToEdit.currency,
            shippingOptions: originalShippingOptions
        });
    } else {
        onAddQuote({
            supplierName,
            productName,
            unitPrice: getNum(unitPrice),
            weightKg: getNum(weightKg),
            quantity: parseInt(quantity, 10) || 0,
            currency,
            shippingOptions: parsedShippingOptions,
        });
    }
    
    resetForm();
    if(isEditing) clearEditing();
  };

  const shippingTypeLabels: { [key in ShippingType]: string } = {
    'direct-air': 'Direct par avion',
    'forwarder-standard': 'Transitaire Standard',
    'forwarder-express': 'Transitaire Express',
  };
  
  const activeCurrency = isEditing ? globalCurrency : currency;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{isEditing ? 'Modifier le devis' : 'Ajouter un devis'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nom du fournisseur" value={supplierName} onChange={e => setSupplierName(e.target.value)} required className={inputClasses}/>
          <input type="text" placeholder="Nom du produit" value={productName} onChange={e => setProductName(e.target.value)} required className={inputClasses}/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input type="text" inputMode="decimal" placeholder="Prix Unitaire" value={unitPrice} onChange={e => handleNumericChange(setUnitPrice, e.target.value, activeCurrency, true)} required className={inputClasses}/>
          <input type="text" inputMode="decimal" placeholder="Quantité" value={quantity} onChange={e => handleNumericChange(setQuantity, e.target.value, activeCurrency, false)} required className={inputClasses}/>
          <input type="text" inputMode="decimal" placeholder="Poids (Kg)" value={weightKg} onChange={e => handleNumericChange(setWeightKg, e.target.value, activeCurrency, true)} required className={inputClasses}/>
          <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={selectClasses} disabled={isEditing}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="XOF">XOF</option>
          </select>
        </div>
        
        <fieldset className="border border-slate-300 dark:border-slate-600 rounded-lg p-4">
          <legend className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">Options de livraison (en {activeCurrency})</legend>
          <div className="space-y-4">
            {Object.keys(shippingInputs).map(typeStr => {
              const type = typeStr as ShippingType;
              return (
                <div key={type} className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 items-center">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400 sm:col-span-1">{shippingTypeLabels[type]}</label>
                  <input type="text" inputMode="decimal" placeholder="Frais d'expédition" value={shippingInputs[type].shippingCost} onChange={e => handleShippingChange(type, 'shippingCost', e.target.value)} className={inputClasses}/>
                  <input type="text" inputMode="decimal" placeholder="Frais de livraison" value={shippingInputs[type].deliveryCost} onChange={e => handleShippingChange(type, 'deliveryCost', e.target.value)} className={inputClasses}/>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
            {isEditing && (
                 <button type="button" onClick={() => { resetForm(); clearEditing(); }} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors">
                    Annuler
                 </button>
            )}
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors">
                {isEditing ? 'Mettre à jour' : 'Ajouter le devis'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;