import React, { useState } from 'react';
import { Quote, Currency } from '../types';
import QuoteCard from './QuoteCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ConfirmationModal from './ConfirmationModal';
import StatusBanner from './StatusBanner';

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
        <div className="w-4 h-4 rounded-full animate-pulse bg-brandBlue"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brandBlue" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brandBlue" style={{animationDelay: '0.4s'}}></div>
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
      <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-secondary dark:text-primary">Devis Actuels ({quotes.length})</h2>
            <div className="flex gap-2">
                {quotes.length > 0 && (
                    <button 
                        onClick={() => setIsDeleteAllModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium rounded-md text-brandRed bg-brandRed/10 hover:bg-brandRed/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandRed dark:focus:ring-offset-secondary transition-colors"
                    >
                        Tout supprimer
                    </button>
                )}
                <button
                onClick={onAnalyze}
                disabled={!canAnalyze || isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-brandBlue hover:bg-brandSky disabled:bg-secondary/40 dark:disabled:bg-secondary/60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandBlue dark:focus:ring-offset-secondary transition-colors"
                >
                {isLoading ? <LoadingSpinner /> : 'Lancer l\'Analyse'}
                </button>
            </div>
        </div>
      </div>

      {isLoading && (
         <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-md flex justify-center items-center">
            <LoadingSpinner />
         </div>
      )}

      {analysis && !isLoading && (
        <div className="bg-white dark:bg-secondary p-6 rounded-lg shadow-md prose prose-slate dark:prose-invert max-w-none">
          <h3 className="text-lg font-bold mb-2 text-brandGreen">Résultats de l'analyse</h3>
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
        !isLoading && (
          <StatusBanner type="warning" title="Aucun devis">
            Ajoutez un devis en utilisant le formulaire ci-dessus.
          </StatusBanner>
        )
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
