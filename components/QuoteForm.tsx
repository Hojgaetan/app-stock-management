
import React, { useState } from 'react';
import { Quote } from '../types';

interface QuoteFormProps {
  onAddQuote: (quote: Omit<Quote, 'id'>) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onAddQuote }) => {
  const [supplierName, setSupplierName] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [quantity, setQuantity] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !productName || !unitPrice || !weightKg || !quantity || !shippingCost || !deliveryCost) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    
    const newQuote = {
      supplierName,
      productName,
      unitPrice: parseFloat(unitPrice),
      weightKg: parseFloat(weightKg),
      quantity: parseInt(quantity, 10),
      shippingCost: parseFloat(shippingCost),
      deliveryCost: parseFloat(deliveryCost),
    };

    if (Object.values(newQuote).some(val => typeof val === 'number' && isNaN(val))) {
        setError('Veuillez entrer des nombres valides pour les champs numériques.');
        return;
    }

    onAddQuote(newQuote);

    // Reset form
    setSupplierName('');
    setProductName('');
    setUnitPrice('');
    setWeightKg('');
    setQuantity('');
    setShippingCost('');
    setDeliveryCost('');
    setError('');
  };

  const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string}> = 
  ({label, value, onChange, type = 'text', placeholder}) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      />
    </div>
  );


  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Ajouter un nouveau devis</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nom du Fournisseur" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Ex: Alibaba Tech" />
          <InputField label="Nom du Produit" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Coque de téléphone" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField label="Prix Unitaire (€)" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} type="number" placeholder="Ex: 5.50" />
          <InputField label="Poids (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} type="number" placeholder="Ex: 0.1" />
          <InputField label="Quantité" value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" placeholder="Ex: 1000" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Frais d'Expédition (€)" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} type="number" placeholder="Ex: 200" />
          <InputField label="Frais de Livraison (€)" value={deliveryCost} onChange={(e) => setDeliveryCost(e.target.value)} type="number" placeholder="Ex: 50" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="pt-2">
            <button type="submit" className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            Ajouter le devis
            </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
