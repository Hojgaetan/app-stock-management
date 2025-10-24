import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote, Currency, ShippingType } from './types';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import { analyzeQuotes } from './services/geminiService';

const convertCurrency = (amount: number, from: Currency, to: Currency, rates: Record<string, number>): number => {
    if (!rates || from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const amountInEur = amount / rateFrom;
    return amountInEur * rateTo;
};

const App: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>(() => {
        try {
            const savedQuotesJSON = localStorage.getItem('quotes');
            const savedQuotes = savedQuotesJSON ? JSON.parse(savedQuotesJSON) : [];
            // Migration for older quotes that might not have a currency field
            return savedQuotes.map((q: any) => ({ ...q, currency: q.currency || 'XOF' }));
        } catch (error) {
            console.error("Could not parse quotes from localStorage", error);
            return [];
        }
    });
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);

    const [globalCurrency, setGlobalCurrency] = useState<Currency>('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [exchangeRatesError, setExchangeRatesError] = useState<string | null>(null);

    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem('quotes', JSON.stringify(quotes));
    }, [quotes]);

    useEffect(() => {
        const fetchRates = async () => {
            setExchangeRatesError(null);
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
                if (!response.ok) throw new Error('Échec de la récupération des taux de change depuis l\'API.');
                const data = await response.json();
                if (data && data.rates) {
                    // XOF has a fixed rate to EUR, which might not be in the API response.
                    data.rates['XOF'] = 655.957;
                    setExchangeRates(data.rates);
                } else {
                    throw new Error('Format de données invalide depuis l\'API des taux de change.');
                }
            } catch (error) {
                console.error("Could not fetch exchange rates:", error);
                setExchangeRates(null);
                const message = error instanceof Error ? error.message : "Une erreur inconnue est survenue.";
                setExchangeRatesError(`Impossible de charger les taux de change. ${message} Les conversions sont désactivées.`);
            }
        };
        fetchRates();
    }, []);

    const handleAddQuote = (newQuoteData: Omit<Quote, 'id'>) => {
        const newQuote: Quote = { ...newQuoteData, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) };
        setQuotes(prev => [...prev, newQuote]);
        setAnalysis('');
    };

    const handleUpdateQuote = (updatedQuote: Quote) => {
        setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
        setQuoteToEdit(null);
        setAnalysis('');
    };

    const handleEditQuote = (quote: Quote) => {
        setQuoteToEdit(quote);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleDeleteQuote = (id: string) => {
        setQuotes(prev => prev.filter(quote => quote.id !== id));
        setAnalysis('');
    };

    const deleteAllQuotes = () => {
        setQuotes([]);
        setAnalysis('');
    }

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setAnalysis('');
        if (!exchangeRates) {
            setAnalysis("L'analyse est impossible car les taux de change n'ont pas pu être chargés.");
            setIsLoading(false);
            return;
        }

        try {
            const quotesInGlobalCurrency = quotes.map(quote => {
                const newQuote: Quote = JSON.parse(JSON.stringify(quote));
                newQuote.unitPrice = convertCurrency(quote.unitPrice, quote.currency, globalCurrency, exchangeRates);
                
                for (const key of Object.keys(newQuote.shippingOptions) as (keyof Quote['shippingOptions'])[]) {
                    const details = newQuote.shippingOptions[key];
                    const originalDetails = quote.shippingOptions[key];
                    if (details && originalDetails) {
                        details.shippingCost = convertCurrency(originalDetails.shippingCost, quote.currency, globalCurrency, exchangeRates);
                        details.deliveryCost = convertCurrency(originalDetails.deliveryCost, quote.currency, globalCurrency, exchangeRates);
                    }
                }
                newQuote.currency = globalCurrency;
                return newQuote;
            });

            const result = await analyzeQuotes(quotesInGlobalCurrency, globalCurrency);
            setAnalysis(result);
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysis("Une erreur est survenue lors de l'analyse.");
        } finally {
            setIsLoading(false);
        }
    }, [quotes, globalCurrency, exchangeRates]);
    
    const canAnalyze = quotes.length > 0 && !!exchangeRates;

    return (
        <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Analyseur de Devis Fournisseurs</h1>
                    <p className="text-slate-600 dark:text-slate-400">Comparez et analysez vos devis pour prendre la meilleure décision.</p>
                </header>

                {exchangeRatesError && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Erreur :</strong>
                        <span className="block sm:inline sm:ml-2">{exchangeRatesError}</span>
                    </div>
                )}
                
                <main className="space-y-8">
                    <div ref={formRef}>
                        <QuoteForm 
                            onAddQuote={handleAddQuote}
                            onUpdateQuote={handleUpdateQuote}
                            quoteToEdit={quoteToEdit}
                            clearEditing={() => setQuoteToEdit(null)}
                            globalCurrency={globalCurrency}
                            exchangeRates={exchangeRates}
                        />
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center justify-end gap-3">
                        <label htmlFor="currency-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">Devise d'affichage :</label>
                        <select
                            id="currency-select"
                            value={globalCurrency}
                            onChange={e => setGlobalCurrency(e.target.value as Currency)}
                            className="rounded-md border-0 py-1.5 px-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                        >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="XOF">XOF</option>
                        </select>
                    </div>

                    <QuoteList 
                        quotes={quotes}
                        onRequestDeleteQuote={handleDeleteQuote}
                        onAnalyze={handleAnalyze}
                        analysis={analysis}
                        isLoading={isLoading}
                        canAnalyze={canAnalyze}
                        deleteAllQuotes={deleteAllQuotes}
                        onEditQuote={handleEditQuote}
                        globalCurrency={globalCurrency}
                        exchangeRates={exchangeRates}
                    />
                </main>
                
                <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p>&copy; {new Date().getFullYear()} Analyseur de Devis. Construit avec React & Gemini.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;