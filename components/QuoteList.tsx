
import React from 'react';
import { Quote } from '../types';
import QuoteCard from './QuoteCard';

interface QuoteListProps {
  quotes: Quote[];
  onDeleteQuote: (id: string) => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ quotes, onDeleteQuote }) => {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">Aucun devis pour le moment</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Commencez par ajouter un devis en utilisant le formulaire ci-dessus.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} onDelete={onDeleteQuote} />
      ))}
    </div>
  );
};

export default QuoteList;
