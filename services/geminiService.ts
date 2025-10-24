
import { GoogleGenAI } from "@google/genai";
import { Quote, ShippingType, ShippingCostDetail } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const shippingTypeLabels: { [key in ShippingType]: string } = {
  'direct-air': 'Direct par avion de Chine à Dakar (délai estimé: 2 semaines)',
  'forwarder-standard': 'Livraison via transitaire à Dakar (délai estimé: 2 semaines)',
  'forwarder-express': 'Livraison express via transitaire à Dakar',
};

export const analyzeQuotes = async (quotes: Quote[], currency: 'EUR' | 'USD' | 'XOF'): Promise<string> => {
  if (!API_KEY) {
    return "Erreur : La clé API Gemini n'est pas configurée. L'analyse ne peut pas être effectuée.";
  }
  
  if (quotes.length === 0) {
    return "Aucun devis à analyser. Veuillez d'abord ajouter quelques devis.";
  }

  const model = 'gemini-2.5-flash';
  
  const formattedQuotes = quotes.map(q => {
    const baseCost = q.unitPrice * q.quantity;
    const shippingOptions = Object.entries(q.shippingOptions).map(([type, details]) => {
      if (!details) return null;
      const logisticsCost = details.shippingCost + details.deliveryCost;
      return {
        type: shippingTypeLabels[type as ShippingType] || type,
        coutLogistique: logisticsCost,
        coutTotal: baseCost + logisticsCost,
        coutParPiece: (baseCost + logisticsCost) / q.quantity,
      };
    }).filter(Boolean);

    return {
      fournisseur: q.supplierName,
      produit: q.productName,
      prixUnitaireProduit: q.unitPrice,
      quantite: q.quantity,
      // FIX: Corrected shorthand property to a key-value pair. The variable is `shippingOptions`.
      optionsExpedition: shippingOptions,
    };
  });

  const prompt = `
    En tant qu'expert en analyse commerciale et en chaîne d'approvisionnement, analyse les données de devis suivantes provenant de fournisseurs chinois. 
    Fournis une analyse concise et exploitable en français pour m'aider à prendre une décision.
    IMPORTANT : Tous les montants monétaires (prix, coûts) dans les données ci-dessous sont exprimés en ${currency}. Assure-toi que ton analyse reflète cette devise.

    L'analyse doit inclure :
    1.  Un résumé global des options disponibles pour chaque produit/fournisseur.
    2.  Pour chaque devis, identifie l'option d'expédition la plus rentable.
    3.  Une comparaison globale pour identifier le devis et l'option d'expédition qui représentent le meilleur coût total le plus bas.
    4.  Une recommandation sur le meilleur rapport qualité-prix, en tenant compte du coût total, du coût par pièce final, et de l'impact potentiel du délai de livraison (par exemple, "express" est plus rapide mais plus cher).
    5.  Formate ta réponse en utilisant Markdown pour une meilleure lisibilité (titres, listes à puces, texte en gras).

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