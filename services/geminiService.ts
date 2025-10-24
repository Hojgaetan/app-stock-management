
import { GoogleGenAI } from "@google/genai";
import { Quote } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development environments where the key might not be set.
  // In the target runtime, process.env.API_KEY is expected to be available.
  console.warn("API_KEY is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const analyzeQuotes = async (quotes: Quote[]): Promise<string> => {
  if (!API_KEY) {
    return "Erreur : La clé API Gemini n'est pas configurée. L'analyse ne peut pas être effectuée.";
  }
  
  if (quotes.length === 0) {
    return "Aucun devis à analyser. Veuillez d'abord ajouter quelques devis.";
  }

  const model = 'gemini-2.5-flash';
  
  const formattedQuotes = quotes.map(q => ({
    fournisseur: q.supplierName,
    produit: q.productName,
    prixUnitaire: q.unitPrice,
    poidsKg: q.weightKg,
    quantite: q.quantity,
    coutExpedition: q.shippingCost,
    coutLivraison: q.deliveryCost,
    coutTotal: (q.unitPrice * q.quantity) + q.shippingCost + q.deliveryCost
  }));

  const prompt = `
    En tant qu'expert en analyse commerciale et en chaîne d'approvisionnement, analyse les données de devis suivantes provenant de fournisseurs chinois. 
    Fournis une analyse concise et exploitable en français pour m'aider à prendre une décision.

    L'analyse doit inclure :
    1.  Un résumé global des options disponibles.
    2.  Identification du devis le plus rentable au total.
    3.  Identification du devis le plus cher au total.
    4.  Une recommandation sur le meilleur rapport qualité-prix, en tenant compte non seulement du coût total mais aussi de facteurs potentiels comme le coût par unité.
    5.  Formate ta réponse en utilisant Markdown pour une meilleure lisibilité (titres, listes à puces).

    Données des devis :
    ${JSON.stringify(formattedQuotes, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Une erreur est survenue lors de l'analyse des devis. Veuillez vérifier la console pour plus de détails.";
  }
};
