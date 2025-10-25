import React, { useState, useEffect } from 'react';
import { Quote, Currency, ShippingType, ShippingCostDetail, LocalTransportOption } from '../types';

interface QuoteFormProps {
  onAddQuote: (quote: Omit<Quote, 'id'>) => void;
  onUpdateQuote: (quote: Quote) => void;
  quoteToEdit: Quote | null;
  clearEditing: () => void;
  globalCurrency: Currency;
  exchangeRates: Record<string, number> | null;
}

const initialShippingInputs = {
  'direct-air': { shippingCost: '', deliveryCost: '', pricePerKg: '' },
  'forwarder-standard': { shippingCost: '', deliveryCost: '', pricePerKg: '' },
  'forwarder-express': { shippingCost: '', deliveryCost: '', pricePerKg: '' },
};

const PRESET_LOCAL_TRANSPORTS: { key: string; label: string; costXOF: number }[] = [
  { key: 'clando', label: 'Clando', costXOF: 150 },
  { key: 'car-rapide', label: 'Car Rapide', costXOF: 100 },
  { key: 'brt', label: 'BRT', costXOF: 500 },
];

const convertCurrency = (amount: number, from: Currency, to: Currency, rates: Record<string, number>): number => {
    if (!rates || from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const amountInEur = amount / rateFrom;
    return amountInEur * rateTo;
};

const formatCurrency = (amount: number, currency: Currency) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);

const getFractionDigits = (currency: Currency) => currency === 'XOF' ? 0 : 2;

const inputClasses = "block w-full rounded-md border-0 py-1.5 px-2 text-secondary dark:text-primary bg-white dark:bg-secondary shadow-sm ring-1 ring-inset ring-secondary/20 dark:ring-primary/20 placeholder:text-secondary/60 dark:placeholder:text-primary/70 focus:ring-2 focus:ring-inset focus:ring-brandBlue sm:text-sm sm:leading-6 transition-colors";
const selectClasses = `${inputClasses} pr-8 disabled:opacity-70 disabled:cursor-not-allowed`;
const buttonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-secondary";

const QuoteForm: React.FC<QuoteFormProps> = ({ onAddQuote, onUpdateQuote, quoteToEdit, clearEditing, globalCurrency, exchangeRates }) => {
  const [supplierName, setSupplierName] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState<Currency>(globalCurrency);
  const [shippingInputs, setShippingInputs] = useState(initialShippingInputs);
  const [localTransportOptions, setLocalTransportOptions] = useState<LocalTransportOption[]>([]);
  
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
      
      const newShippingInputs = { ...initialShippingInputs } as any;
      for (const key in quoteToEdit.shippingOptions) {
          const typedKey = key as ShippingType;
          const details = quoteToEdit.shippingOptions[typedKey];
          if(details) {
              const displayShipping = convertCurrency(details.shippingCost, quoteToEdit.currency, globalCurrency, exchangeRates);
              const displayDelivery = convertCurrency(details.deliveryCost, quoteToEdit.currency, globalCurrency, exchangeRates);
              const displayPricePerKg = details.pricePerKg != null ? convertCurrency(details.pricePerKg, quoteToEdit.currency, globalCurrency, exchangeRates) : '';
              newShippingInputs[typedKey] = {
                shippingCost: displayShipping.toFixed(fractionDigits),
                deliveryCost: displayDelivery.toFixed(fractionDigits),
                pricePerKg: displayPricePerKg === '' ? '' : (displayPricePerKg as number).toFixed(fractionDigits)
            };
          }
      }
      setShippingInputs(newShippingInputs);

      const displayLocalOptions = quoteToEdit.localTransportOptions.map(opt => ({
          ...opt,
          cost: parseFloat(convertCurrency(opt.cost, quoteToEdit.currency, globalCurrency, exchangeRates).toFixed(fractionDigits))
      }));
      setLocalTransportOptions(displayLocalOptions);

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
    setLocalTransportOptions([]);
  };

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string, currencyForFormatting: Currency, allowDecimals: boolean) => {
    const fractionDigits = getFractionDigits(currencyForFormatting);
    let regex;
    if (!allowDecimals) {
        regex = /^\d*$/;
    } else if (fractionDigits > 0) {
        // Autoriser . ou , comme séparateur décimal
        regex = new RegExp(`^\\d*([.,]\\d{0,${fractionDigits}})?$`);
    } else {
        regex = /^\d*$/;
    }

    if (regex.test(value)) {
        setter(value);
    }
  };

  const handleShippingChange = (type: ShippingType, field: 'shippingCost' | 'deliveryCost' | 'pricePerKg', value: string) => {
    const currencyForFormatting = isEditing ? globalCurrency : currency;
    const fractionDigits = getFractionDigits(currencyForFormatting);
    const regex = new RegExp(`^\\d*([.,]\\d{0,${fractionDigits}})?$`);

    if (regex.test(value)) {
      setShippingInputs(prev => ({
        ...prev,
        [type]: { ...prev[type], [field]: value }
      }));
    }
  };

  const handleRemoveLocalOption = (id: string) => {
      setLocalTransportOptions(localTransportOptions.filter(opt => opt.id !== id));
  }
  
  // Ajouts rapides: presets en XOF (uniquement en mode ajout)
  const addPresetLocalTransport = (label: string, leg: 'Aller' | 'Retour', costXOF: number) => {
    const name = `${label} (${leg})`;
    setLocalTransportOptions(prev => ([...prev, { id: Date.now().toString() + Math.random().toString(36).slice(2), name, cost: costXOF }]));
  };
  const addPresetLocalTransportBoth = (label: string, costXOF: number) => {
    setLocalTransportOptions(prev => ([
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).slice(2), name: `${label} (Aller)`, cost: costXOF },
      { id: Date.now().toString() + Math.random().toString(36).slice(2), name: `${label} (Retour)`, cost: costXOF },
    ]));
  };

// Fix: Refactored to use an explicit if/else to properly handle type checking for 'name' and 'cost' fields.
  const handleLocalOptionChange = (id: string, field: 'name' | 'cost', value: string | number) => {
    setLocalTransportOptions(localTransportOptions.map(opt => {
        if (opt.id === id) {
            if (field === 'cost') {
                // En mode ajout, la saisie du transport local est en XOF (0 décimale)
                const currencyForFormatting: Currency = isEditing ? globalCurrency : 'XOF';
                const fractionDigits = getFractionDigits(currencyForFormatting);
                const regex = new RegExp(`^\\d*([.,]\\d{0,${fractionDigits}})?$`);
                if (regex.test(String(value))) {
                    return { ...opt, cost: parseFloat(String(String(value).replace(',', '.'))) || 0 };
                }
                return opt;
            } else { // field must be 'name'
                return { ...opt, name: String(value) };
            }
        }
        return opt;
    }));
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const getNum = (val: string | number) => {
      const s = String(val).replace(',', '.');
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    };

    const parsedShippingOptions = Object.entries(shippingInputs).reduce((acc, [key, value]) => {
        const shippingCost = getNum(value.shippingCost);
        const deliveryCost = getNum(value.deliveryCost);
        const pricePerKg = getNum((value as any).pricePerKg);
        if (shippingCost > 0 || deliveryCost > 0 || pricePerKg > 0) {
          acc[key as ShippingType] = { shippingCost, deliveryCost, ...(pricePerKg > 0 ? { pricePerKg } : {}) };
        }
        return acc;
    }, {} as { [key in ShippingType]?: ShippingCostDetail });

    const finalLocalOptions = localTransportOptions.filter(opt => opt.name.trim() !== '' && opt.cost > 0);

    if (isEditing && quoteToEdit && exchangeRates) {
        const originalUnitPrice = convertCurrency(getNum(unitPrice), globalCurrency, quoteToEdit.currency, exchangeRates);
        
        const originalShippingOptions = { ...parsedShippingOptions };
        for (const key in originalShippingOptions) {
            const typedKey = key as ShippingType;
            const details = originalShippingOptions[typedKey];
            if (details) {
                originalShippingOptions[typedKey] = {
                    shippingCost: convertCurrency(details.shippingCost || 0, globalCurrency, quoteToEdit.currency, exchangeRates),
                    deliveryCost: convertCurrency(details.deliveryCost || 0, globalCurrency, quoteToEdit.currency, exchangeRates),
                    ...(details.pricePerKg != null ? { pricePerKg: convertCurrency(details.pricePerKg, globalCurrency, quoteToEdit.currency, exchangeRates) } : {})
                };
            }
        }
        
        const originalLocalOptions = finalLocalOptions.map(opt => ({
            ...opt,
            // En édition, l'affichage est en devise globale -> reconvertir vers la devise d'origine du devis
            cost: convertCurrency(opt.cost, globalCurrency, quoteToEdit.currency, exchangeRates)
        }));

        onUpdateQuote({ 
            id: quoteToEdit.id,
            supplierName,
            productName,
            unitPrice: originalUnitPrice,
            weightKg: getNum(weightKg),
            quantity: parseInt(quantity, 10) || 0,
            currency: quoteToEdit.currency,
            shippingOptions: originalShippingOptions,
            localTransportOptions: originalLocalOptions
        });
    } else {
        // Ajout: le transport local est saisi en XOF et doit être converti vers la devise du devis au stockage
        let mappedLocalOptions: LocalTransportOption[] = finalLocalOptions;
        if (finalLocalOptions.length > 0) {
            if (currency === 'XOF') {
                // Pas de conversion nécessaire
                mappedLocalOptions = finalLocalOptions;
            } else if (exchangeRates) {
                mappedLocalOptions = finalLocalOptions.map(opt => ({
                    ...opt,
                    cost: convertCurrency(opt.cost, 'XOF', currency, exchangeRates)
                }));
            } else {
                // Impossible de convertir: on bloque la soumission pour éviter d'enregistrer des montants incohérents
                alert("Impossible de convertir le transport local depuis le XOF sans taux de change. Veuillez attendre le chargement des taux ou choisir XOF comme devise du devis.");
                return;
            }
        }

        onAddQuote({
            supplierName,
            productName,
            unitPrice: getNum(unitPrice),
            weightKg: getNum(weightKg),
            quantity: parseInt(quantity, 10) || 0,
            currency,
            shippingOptions: parsedShippingOptions,
            localTransportOptions: mappedLocalOptions
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

  // En mode ajout: la section "transport local" est saisie en XOF
  const localInputCurrencyLabel: Currency = isEditing ? activeCurrency : 'XOF';
  const needsRatesForLocal = !isEditing && localTransportOptions.some(o => o.cost > 0) && currency !== 'XOF' && !exchangeRates;
  const localTotal = localTransportOptions.reduce((sum, o) => sum + (o.cost || 0), 0);

  return (
    <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-secondary dark:text-primary mb-4">{isEditing ? 'Modifier le devis' : 'Ajouter un devis'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nom du fournisseur" value={supplierName} onChange={e => setSupplierName(e.target.value)} required className={inputClasses}/>
          <input type="text" placeholder="Nom du produit" value={productName} onChange={e => setProductName(e.target.value)} required className={inputClasses}/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input type="text" inputMode={activeCurrency === 'XOF' ? 'numeric' : undefined} placeholder="Prix Unitaire" value={unitPrice} onChange={e => handleNumericChange(setUnitPrice, e.target.value, activeCurrency, true)} required className={inputClasses}/>
          <input type="text" inputMode="decimal" placeholder="Quantité" value={quantity} onChange={e => handleNumericChange(setQuantity, e.target.value, activeCurrency, false)} required className={inputClasses}/>
          <input type="text" inputMode="decimal" placeholder="Poids unitaire (Kg)" value={weightKg} onChange={e => handleNumericChange(setWeightKg, e.target.value, activeCurrency, true)} required className={inputClasses}/>
          <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className={selectClasses} disabled={isEditing}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="XOF">XOF</option>
          </select>
        </div>
        
        <fieldset className="border border-secondary/20 dark:border-primary/20 rounded-lg p-4">
          <legend className="px-2 text-sm font-medium text-secondary dark:text-primary">Options de livraison internationale (en {activeCurrency})</legend>
          <div className="space-y-4">
            {Object.keys(shippingInputs).map(typeStr => {
              const type = typeStr as ShippingType;
              return (
                <div key={type} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-2 items-center">
                  <label className="text-sm font-medium text-secondary/70 dark:text-primary/70 sm:col-span-1">{shippingTypeLabels[type]}</label>
                  <input type="text" inputMode="decimal" placeholder="Frais d'expédition (forfait)" value={shippingInputs[type].shippingCost} onChange={e => handleShippingChange(type, 'shippingCost', e.target.value)} className={inputClasses}/>
                  <input type="text" inputMode="decimal" placeholder={`Prix / Kg`} value={shippingInputs[type].pricePerKg} onChange={e => handleShippingChange(type, 'pricePerKg', e.target.value)} className={inputClasses}/>
                  <input type="text" inputMode="decimal" placeholder="Frais de livraison" value={shippingInputs[type].deliveryCost} onChange={e => handleShippingChange(type, 'deliveryCost', e.target.value)} className={inputClasses}/>
                </div>
              )
            })}
            <p className="text-xs text-secondary/60 dark:text-primary/70">Astuce: Si le transitaire facture strictement au kilo, remplissez le champ "Prix / Kg". Le coût logistique sera calculé automatiquement en fonction du poids total.</p>
          </div>
        </fieldset>
        
        <fieldset className="border border-secondary/20 dark:border-primary/20 rounded-lg p-4">
          <legend className="px-2 text-sm font-medium text-secondary dark:text-primary">Frais de transport local (saisie en {localInputCurrencyLabel})</legend>
          {!isEditing && (
            <>
              <p className="mt-1 mb-2 text-xs text-secondary/60 dark:text-primary/70">Entrez les frais de transport local en XOF. Ils seront convertis automatiquement dans la devise du devis lors de l'ajout.</p>
              <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_LOCAL_TRANSPORTS.map(preset => (
                  <div key={preset.key} className="flex items-center gap-2">
                    <span className="text-xs text-secondary/80 dark:text-primary/80 w-28">{preset.label} ({formatCurrency(preset.costXOF, 'XOF')})</span>
                    <button type="button" onClick={() => addPresetLocalTransport(preset.label, 'Aller', preset.costXOF)} className="px-2 py-1 text-xs rounded-md bg-secondary/10 hover:bg-secondary/20 dark:bg-primary/10 dark:hover:bg-primary/20 text-secondary dark:text-primary">Aller</button>
                    <button type="button" onClick={() => addPresetLocalTransport(preset.label, 'Retour', preset.costXOF)} className="px-2 py-1 text-xs rounded-md bg-secondary/10 hover:bg-secondary/20 dark:bg-primary/10 dark:hover:bg-primary/20 text-secondary dark:text-primary">Retour</button>
                    <button type="button" onClick={() => addPresetLocalTransportBoth(preset.label, preset.costXOF)} className="px-2 py-1 text-xs rounded-md bg-brandBlue/10 hover:bg-brandBlue/20 dark:bg-brandSky/10 dark:hover:bg-brandSky/20 text-brandBlue dark:text-brandSky">A/R</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {needsRatesForLocal && (
            <div className="mb-2 text-xs text-brandYellow bg-brandYellow/10 border border-brandYellow rounded px-2 py-1">Taux de change indisponibles: conversion XOF → {currency} impossible. Veuillez attendre le chargement des taux ou choisissez XOF comme devise.</div>
          )}
          <div className="space-y-3">
              {localTransportOptions.map((opt) => (
                  <div key={opt.id} className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Nom du transport (ex: Yango)" 
                        value={opt.name} 
                        onChange={(e) => handleLocalOptionChange(opt.id, 'name', e.target.value)} 
                        className={`${inputClasses} sm:col-span-1`} 
                      />
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        placeholder={`Coût en ${localInputCurrencyLabel}`}
                        value={opt.cost || ''}
                        onChange={(e) => handleLocalOptionChange(opt.id, 'cost', e.target.value)}
                        className={inputClasses} 
                      />
                       <button 
                        type="button" 
                        onClick={() => handleRemoveLocalOption(opt.id)} 
                        className={`${buttonClasses} text-brandRed bg-brandRed/10 hover:bg-brandRed/20 focus:ring-brandRed`}>
                          Retirer
                       </button>
                  </div>
              ))}
              <div className="flex items-center justify-end">
                {/* Bouton d'ajout de transport local supprimé selon la demande */}
                <div className="text-sm font-medium text-secondary dark:text-primary">
                  Total transport local: <span className="font-mono">{formatCurrency(localTotal, localInputCurrencyLabel)}</span>
                </div>
              </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
            {isEditing && (
                 <button type="button" onClick={() => { resetForm(); clearEditing(); }} className={`${buttonClasses} text-secondary dark:text-primary bg-secondary/10 dark:bg-primary/10 hover:bg-secondary/20 dark:hover:bg-primary/20 focus:ring-secondary`}>
                    Annuler
                 </button>
            )}
            <button type="submit" disabled={needsRatesForLocal} className={`${buttonClasses} text-white bg-brandBlue hover:bg-brandSky disabled:bg-secondary/40 dark:disabled:bg-secondary/60 disabled:cursor-not-allowed focus:ring-brandBlue`}>
                {isEditing ? 'Mettre à jour' : 'Ajouter le devis'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;

