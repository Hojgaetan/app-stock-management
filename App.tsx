
import React, { useState, useEffect, useCallback } from 'react';
import { Quote } from './types';
import QuoteForm from './components/QuoteForm';
import QuoteList from './components/QuoteList';
import { analyzeQuotes } from './services/geminiService';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedQuotes = localStorage.getItem('supplierQuotes');
      if (storedQuotes) {
        setQuotes(JSON.parse(storedQuotes));
      }
    } catch (error) {
      console.error("Failed to parse quotes from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('supplierQuotes', JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (quote: Omit<Quote, 'id'>) => {
    const newQuote: Quote = { ...quote, id: new Date().toISOString() };
    setQuotes(prevQuotes => [newQuote, ...prevQuotes]);
  };

  const deleteQuote = (id: string) => {
    setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== id));
  };
  
  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setAnalysis('');
    const result = await analyzeQuotes(quotes);
    setAnalysis(result);
    setIsLoading(false);
  },[quotes]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
            Gestionnaire de Devis
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Votre outil pour centraliser et analyser les offres de vos fournisseurs.
          </p>
        </header>

        <div className="space-y-8">
          <QuoteForm onAddQuote={addQuote} />
          
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Liste des Devis</h2>
                 <button 
                    onClick={handleAnalysis} 
                    disabled={isLoading || quotes.length === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                    <SparklesIcon className="w-5 h-5"/>
                    <span>{isLoading ? 'Analyse en cours...' : 'Analyser avec l\'IA'}</span>
                </button>
             </div>

            {isLoading && (
                <div className="flex justify-center items-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="ml-4 text-slate-600 dark:text-slate-400">Gemini analyse vos données...</p>
                </div>
            )}

            {analysis && (
              <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">Résultat de l'Analyse IA</h3>
                <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
              </div>
            )}
            
            <QuoteList quotes={quotes} onDeleteQuote={deleteQuote} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
