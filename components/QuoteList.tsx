import React, { useState } from 'react';
import { Quote, Currency } from '../types';
import QuoteCard from './QuoteCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ConfirmationModal from './ConfirmationModal';

interface QuoteListProps {
  quotes: Quote[];
  onRequestDeleteQuote: (id: string) => void;
  onAnalyze: () => void;
  analysis: string;
  isLoading: boolean;
  canAnalyze: boolean;
  deleteAllQuotes: () => void;
  onEditQuote: (quote: Quote) => void;
  globalCurrency: Currency;
  exchangeRates: Record<string, number> | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500" style={{animationDelay: '0.4s'}}></div>
        <span className="ml-2">Analyse en cours...</span>
    </div>
);

const QuoteList: React.FC<QuoteListProps> = ({ 
    quotes, 
    onRequestDeleteQuote, 
    onAnalyze, 
    analysis, 
    isLoading, 
    canAnalyze, 
    deleteAllQuotes, 
    onEditQuote,
    globalCurrency,
    exchangeRates
}) => {
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);


    const handleConfirmDeleteAll = () => {
        deleteAllQuotes();
        setIsDeleteAllModalOpen(false);
    }
    
    const handleRequestDelete = (id: string) => {
        setQuoteToDelete(id);
    };

    const handleConfirmDelete = () => {
        if (quoteToDelete) {
            onRequestDeleteQuote(quoteToDelete);
            setQuoteToDelete(null);
        }
    };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Devis Actuels ({quotes.length})</h2>
            <div className="flex gap-2">
                {quotes.length > 0 && (
                    <button 
                        onClick={() => setIsDeleteAllModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 transition-colors"
                    >
                        Tout supprimer
                    </button>
                )}
                <button
                onClick={onAnalyze}
                disabled={!canAnalyze || isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors"
                >
                {isLoading ? <LoadingSpinner /> : 'Lancer l\'Analyse'}
                </button>
            </div>
        </div>
      </div>

      {isLoading && (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex justify-center items-center">
            <LoadingSpinner />
         </div>
      )}

      {analysis && !isLoading && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md prose prose-slate dark:prose-invert max-w-none">
          <h3 className="text-lg font-bold mb-2">Résultats de l'analyse</h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
        </div>
      )}

      {quotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quotes.map(quote => (
            <QuoteCard 
              key={quote.id} 
              quote={quote} 
              onRequestDelete={() => handleRequestDelete(quote.id)}
              onEdit={onEditQuote}
              globalCurrency={globalCurrency}
              exchangeRates={exchangeRates}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Aucun devis pour le moment.</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Ajoutez un devis en utilisant le formulaire.</p>
        </div>
      )}
      <ConfirmationModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Supprimer tous les devis ?"
      >
        <p>Cette action est irréversible. Tous les devis saisis ainsi que les analyses précédentes seront définitivement supprimés.</p>
      </ConfirmationModal>

      {quoteToDelete && (
         <ConfirmationModal
            isOpen={!!quoteToDelete}
            onClose={() => setQuoteToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Supprimer ce devis ?"
         >
             <p>Voulez-vous vraiment supprimer ce devis ? Cette action est irréversible.</p>
         </ConfirmationModal>
      )}

    </div>
  );
};

export default QuoteList;
