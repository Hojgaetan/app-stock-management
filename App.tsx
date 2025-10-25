import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote, Currency, ShippingType, LocalTransportOption } from './types';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import { analyzeQuotes } from './services/geminiService';
import { initDB, getAllQuotes, addQuote, updateQuote, deleteQuote, clearQuotes } from './services/db';
import StatusBanner from './components/StatusBanner';

const convertCurrency = (amount: number, from: Currency, to: Currency, rates: Record<string, number>): number => {
    if (!rates || from === to) return amount;
    const rateFrom = rates[from] || 1;
    const rateTo = rates[to] || 1;
    const amountInEur = amount / rateFrom;
    return amountInEur * rateTo;
};

const App: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
    const [dbInitialized, setDbInitialized] = useState(false);

    const [globalCurrency, setGlobalCurrency] = useState<Currency>('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [exchangeRatesError, setExchangeRatesError] = useState<string | null>(null);

    const [status, setStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                await initDB();
                setDbInitialized(true);
            } catch (error) {
                console.error("Failed to initialize DB", error);
            }
        };
        initialize();
    }, []);

    useEffect(() => {
        if (dbInitialized) {
            const fetchQuotes = async () => {
                try {
                    const savedQuotes = await getAllQuotes();
                    setQuotes(savedQuotes);
                } catch(error) {
                    console.error("Could not fetch quotes from DB", error);
                }
            };
            fetchQuotes();
        }
    }, [dbInitialized]);

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

    const handleAddQuote = async (newQuoteData: Omit<Quote, 'id'>) => {
        const newQuote: Quote = { ...newQuoteData, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) };
        await addQuote(newQuote);
        setQuotes(prev => [...prev, newQuote]);
        setAnalysis('');
        setStatus({ type: 'success', message: 'Devis ajouté avec succès.' });
    };

    const handleUpdateQuote = async (updatedQuote: Quote) => {
        await updateQuote(updatedQuote);
        setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
        setQuoteToEdit(null);
        setAnalysis('');
        setStatus({ type: 'success', message: 'Devis mis à jour avec succès.' });
    };

    const handleEditQuote = (quote: Quote) => {
        setQuoteToEdit(quote);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleDeleteQuote = async (id: string) => {
        await deleteQuote(id);
        setQuotes(prev => prev.filter(quote => quote.id !== id));
        setAnalysis('');
        setStatus({ type: 'success', message: 'Devis supprimé avec succès.' });
    };

    const deleteAllQuotes = async () => {
        await clearQuotes();
        setQuotes([]);
        setAnalysis('');
        setStatus({ type: 'success', message: 'Tous les devis ont été supprimés.' });
    }

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setAnalysis('');
        if (!exchangeRates) {
            setAnalysis("L'analyse est impossible car les taux de change n'ont pas pu être chargés.");
            setStatus({ type: 'warning', message: "Analyse indisponible: taux de change non chargés." });
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
                        if (originalDetails.pricePerKg != null) {
                            (details as any).pricePerKg = convertCurrency(originalDetails.pricePerKg, quote.currency, globalCurrency, exchangeRates);
                        }
                    }
                }

                newQuote.localTransportOptions = newQuote.localTransportOptions.map((lt, index) => ({
                    ...lt,
                    cost: convertCurrency(quote.localTransportOptions[index].cost, quote.currency, globalCurrency, exchangeRates)
                }));
                
                newQuote.currency = globalCurrency;
                return newQuote;
            });

            const result = await analyzeQuotes(quotesInGlobalCurrency, globalCurrency);
            setAnalysis(result);
            setStatus({ type: 'success', message: 'Analyse terminée.' });
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysis("Une erreur est survenue lors de l'analyse.");
        } finally {
            setIsLoading(false);
        }
    }, [quotes, globalCurrency, exchangeRates]);
    
    const canAnalyze = quotes.length > 0 && !!exchangeRates;

    return (
        <div className="bg-primary dark:bg-secondary min-h-screen text-secondary dark:text-primary font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-4">
                <header className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-secondary dark:text-primary mb-2">Analyseur de Devis Fournisseurs</h1>
                    <p className="text-secondary/70 dark:text-primary/70">Comparez et analysez vos devis pour prendre la meilleure décision.</p>
                </header>

                {exchangeRatesError && (
                    <div className="bg-brandRed/10 dark:bg-brandRed/20 border border-brandRed text-brandRed px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Erreur :</strong>
                        <span className="block sm:inline sm:ml-2">{exchangeRatesError}</span>
                    </div>
                )}

                {status && (
                    <StatusBanner type={status.type} onClose={() => setStatus(null)}>
                        {status.message}
                    </StatusBanner>
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
                    
                    <div className="bg-white dark:bg-secondary p-4 rounded-lg shadow-md flex items-center justify-end gap-3">
                        <label htmlFor="currency-select" className="text-sm font-medium text-secondary dark:text-primary">Devise d'affichage :</label>
                        <select
                            id="currency-select"
                            value={globalCurrency}
                            onChange={e => setGlobalCurrency(e.target.value as Currency)}
                            className="rounded-md border-0 py-1.5 px-2 text-secondary dark:text-primary bg-white dark:bg-secondary shadow-sm ring-1 ring-inset ring-secondary/20 dark:ring-primary/20 focus:ring-2 focus:ring-inset focus:ring-brandBlue sm:text-sm"
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
                
                <footer className="text-center text-sm text-secondary/60 dark:text-primary/70 pt-4 border-t border-secondary/20 dark:border-primary/20">
                    <p>&copy; {new Date().getFullYear()} Analyseur de Devis. Créé par Joel Gaetan HASSAM OBAH.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
