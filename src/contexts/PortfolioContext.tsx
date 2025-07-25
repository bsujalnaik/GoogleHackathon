import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUser } from './UserContext';

interface PortfolioStock {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  change: number;
  percentChange: number;
}

interface PortfolioContextType {
  portfolio: PortfolioStock[];
  addToPortfolio: (stock: PortfolioStock) => void;
  removeFromPortfolio: (symbol: string) => void;
  updatePortfolio: (stocks: PortfolioStock[]) => void;
}

const PortfolioContext = createContext<PortfolioContextType>({
  portfolio: [],
  addToPortfolio: () => {},
  removeFromPortfolio: () => {},
  updatePortfolio: () => {}
});

export const usePortfolio = () => useContext(PortfolioContext);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const { user } = useUser();
  const hasLoaded = useRef(false);

  // Load portfolio from Firestore or localStorage on mount or user change
  useEffect(() => {
    const loadPortfolio = async () => {
      setPortfolioLoading(true);
      if (user && user.uid) {
        // Try to load from Firestore
        const docRef = doc(db, 'portfolios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPortfolio(docSnap.data().stocks || []);
        } else {
          setPortfolio([]);
        }
      } else {
        // Fallback to localStorage
        const savedPortfolio = localStorage.getItem('portfolio');
        if (savedPortfolio) {
          try {
            setPortfolio(JSON.parse(savedPortfolio));
          } catch (error) {
            console.error('Failed to load portfolio from localStorage:', error);
            setPortfolio([]);
          }
        } else {
          setPortfolio([]);
        }
      }
      setPortfolioLoading(false);
      hasLoaded.current = true;
    };
    loadPortfolio();
    // eslint-disable-next-line
  }, [user]);

  // Save portfolio to Firestore or localStorage whenever it changes, but skip first run after load
  useEffect(() => {
    if (!hasLoaded.current) return;
    const savePortfolio = async () => {
      if (user && user.uid) {
        await setDoc(doc(db, 'portfolios', user.uid), { stocks: portfolio }, { merge: true });
      } else {
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
      }
    };
    savePortfolio();
  }, [portfolio, user]);

  const addToPortfolio = (stock: PortfolioStock) => {
    setPortfolio(current => {
      const existingStock = current.find(s => s.symbol === stock.symbol);
      if (existingStock) {
        // Update existing stock
        return current.map(s => 
          s.symbol === stock.symbol
            ? {
                ...s,
                quantity: s.quantity + stock.quantity,
                avgPrice: ((s.avgPrice * s.quantity) + (stock.avgPrice * stock.quantity)) / (s.quantity + stock.quantity),
                currentPrice: stock.currentPrice,
                change: stock.change,
                percentChange: stock.percentChange
              }
            : s
        );
      }
      // Add new stock
      return [...current, stock];
    });
  };

  const removeFromPortfolio = (symbol: string) => {
    setPortfolio(current => current.filter(stock => stock.symbol !== symbol));
  };

  const updatePortfolio = (stocks: PortfolioStock[]) => {
    setPortfolio(stocks);
  };

  return (
    <PortfolioContext.Provider value={{ portfolio, addToPortfolio, removeFromPortfolio, updatePortfolio }}>
      {/* Optionally, you can provide portfolioLoading in context if needed */}
      {children}
    </PortfolioContext.Provider>
  );
};

export default PortfolioContext; 