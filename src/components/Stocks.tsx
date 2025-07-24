import React, { useEffect, useState } from 'react';
import { Card, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Line, Chart as ChartComponent } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import 'chartjs-chart-financial';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Alert } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Input } from './ui/input';
import { FaSearch, FaArrowUp, FaArrowDown, FaChartBar, FaChartLine, FaChartArea } from 'react-icons/fa';

// Finnhub API configuration
const FINNHUB_API_KEY = 'd20a1f1r01qmbi8rqnrgd20a1f1r01qmbi8rqns0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// List of 50 popular stocks
const STOCK_LIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
  { symbol: 'BAC', name: 'Bank of America Corp.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'DIS', name: 'The Walt Disney Co.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'KO', name: 'The Coca-Cola Co.' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'CMCSA', name: 'Comcast Corporation' },
  { symbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'NKE', name: 'Nike Inc.' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.' },
  { symbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'LLY', name: 'Eli Lilly and Co.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'UNP', name: 'Union Pacific Corporation' },
  { symbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'RTX', name: 'Raytheon Technologies Corp.' },
  { symbol: 'C', name: 'Citigroup Inc.' },
  { symbol: 'SCHW', name: 'Charles Schwab Corp.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'IBM', name: 'International Business Machines' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'SBUX', name: 'Starbucks Corporation' },
  { symbol: 'GE', name: 'General Electric Co.' },
  { symbol: 'BA', name: 'Boeing Co.' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'SONY', name: 'Sony Group Corp.' }, // If not working, try 'SONY.T'
  { symbol: 'BABA', name: 'Alibaba Group' },    // If not working, try '9988.HK'
  { symbol: 'SAP', name: 'SAP SE' },            // If not working, try 'SAP.F'
  { symbol: 'TM', name: 'Toyota Motor Corp.' }, // If not working, try '7203.T'
];

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

interface QuantityControlProps {
  symbol: string;
  quantity: number;
  onChange: (value: number) => void;
  price: number;
}

const QuantityControl: React.FC<QuantityControlProps> = ({ symbol, quantity, onChange, price }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(Math.max(1, quantity - 1));
          }}
          className="px-3 py-1 text-zinc-400 hover:text-white transition-colors border-r border-zinc-700"
        >
          -
        </button>
        <div className="px-3 py-1 min-w-[40px] text-center">
          {quantity}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange(quantity + 1);
          }}
          className="px-3 py-1 text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
        >
          +
        </button>
      </div>
      <div className="text-sm text-zinc-400">
        ${(price * quantity).toFixed(2)}
      </div>
    </div>
  );
};

const SparklineChart: React.FC<{ data: number[], isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data.length) return null;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  // Create points for the sparkline
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 64; // Scale to width
    const y = 28 - ((value - minValue) / range) * 24; // Scale to height with padding
    return `${x},${y}`;
  }).join(' ');

  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="w-20 h-8 flex items-center justify-center">
      <svg
        width="64"
        height="32"
        className="overflow-visible"
      >
        {/* Sparkline only, no grid, no crosshair */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start and end points */}
        <circle cx="0" cy={28 - ((data[0] - minValue) / range) * 24} r="2" fill={color} />
        <circle 
          cx="64" 
          cy={28 - ((data[data.length - 1] - minValue) / range) * 24} 
          r="2" 
          fill={color}
        />
      </svg>
    </div>
  );
};

const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [stockDetails, setStockDetails] = useState<{ [key: string]: any }>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sparklineData, setSparklineData] = useState<{ [key: string]: number[] }>({});
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { portfolio, addToPortfolio, removeFromPortfolio } = usePortfolio();

  // Chart options
  const candlestickOptions: ChartOptions<'candlestick'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const dataPoint = context.raw;
            return [
              `Open: $${dataPoint.o.toFixed(2)}`,
              `High: $${dataPoint.h.toFixed(2)}`,
              `Low: $${dataPoint.l.toFixed(2)}`,
              `Close: $${dataPoint.c.toFixed(2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 0,
          maxTicksLimit: 5
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: number) => `$${value.toFixed(2)}`
        }
      }
    }
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (context: any) => `Price: $${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: '#9ca3af',
          maxRotation: 0,
          maxTicksLimit: 5
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9ca3af',
          callback: (value: number) => `$${value.toFixed(2)}`
        }
      }
    }
  };

  // Function to generate dummy data
  const generateDummyData = (length: number): number[] => {
    const result = [];
    let currentValue = 100;
    
    for (let i = 0; i < length; i++) {
      result.push(currentValue);
      // Generate smoother transitions
      const change = (Math.random() - 0.5) * 2;
      currentValue += change;
    }
    
    return result;
  };

  // Fetch stock quote from Finnhub
  const fetchStockQuote = async (symbol: string) => {
    try {
      const response = await fetch(
        `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        console.error(`API error for ${symbol}:`, data.error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  };

  // Add this function to fetch sparkline data
  const fetchSparklineData = async (symbol: string) => {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 7 * 24 * 60 * 60; // 7 days of data
      const response = await fetch(
        `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      if (data.error) {
        console.error(`API error for ${symbol} sparkline:`, data.error);
        return generateDummyData(7);
      }
      if (data.s === 'ok' && data.c && data.c.length > 0) {
        // Get last 7 days of data and ensure we have exactly 7 points
        const prices = data.c.slice(-7);
        while (prices.length < 7) {
          prices.unshift(prices[0]); // Fill with first price if we have less than 7 days
        }
        return prices;
      }
      return generateDummyData(7);
    } catch (error) {
      console.error(`Error fetching sparkline for ${symbol}:`, error);
      return generateDummyData(7);
    }
  };

  // Update handleQuantityChange to sync with portfolio
  const handleQuantityChange = (symbol: string, value: number) => {
    const newQuantity = Math.max(1, value);
    setQuantities(prev => ({
      ...prev,
      [symbol]: newQuantity
    }));
  };

  // Update handleAddToPortfolio to include quantity
  const handleAddToPortfolio = async (stock: any, quantity: number = 1) => {
    setAdding(stock.symbol);
    try {
      const quote = await fetchStockQuote(stock.symbol);
      const currentPrice = quote?.c || stock.price;

      addToPortfolio({
        symbol: stock.symbol,
        name: stock.name,
        quantity: quantity,
        avgPrice: currentPrice,
        currentPrice: currentPrice,
        change: quote?.d || stock.change,
        percentChange: quote?.dp || stock.percentChange
      });
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
      alert('Failed to add stock to portfolio. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  // Update the openStock function to toggle expansion
  const toggleStockExpansion = async (stock: any) => {
    if (expandedStock === stock.symbol) {
      setExpandedStock(null);
      return;
    }

    setExpandedStock(stock.symbol);
    
    if (!stockDetails[stock.symbol]) {
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 7 * 24 * 60 * 60; // 7 days
        const response = await fetch(
          `${FINNHUB_BASE_URL}/stock/candle?symbol=${stock.symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }

        const data = await response.json();
        
        if (data.s === 'ok' && data.t && data.t.length > 0) {
          setStockDetails(prev => ({
            ...prev,
            [stock.symbol]: data
          }));
        }
      } catch (err) {
        console.error('Error fetching stock details:', err);
      }
    }
  };

  // Update quantities state initialization to use portfolio values
  useEffect(() => {
    const portfolioQuantities = portfolio.reduce((acc, stock) => ({
      ...acc,
      [stock.symbol]: stock.quantity
    }), {});
    setQuantities(portfolioQuantities);
  }, [portfolio]);

  // Initialize stocks with STOCK_LIST
  useEffect(() => {
    const initializeStocks = async () => {
      setLoading(true);
      try {
        // Get stored prices from localStorage
        const storedPrices = JSON.parse(localStorage.getItem('stockPrices') || '{}');
        
        // Initialize with stored prices or null (not 0)
        const initialStocks = STOCK_LIST.map(stock => ({
          ...stock,
          price: storedPrices[stock.symbol]?.price ?? null,
          change: storedPrices[stock.symbol]?.change ?? null,
          percentChange: storedPrices[stock.symbol]?.percentChange ?? null,
          lastUpdated: storedPrices[stock.symbol]?.lastUpdated || null
        }));
        setStocks(initialStocks);

        // Fetch initial prices in batches to avoid rate limiting
        const batchSize = 10;
        const updatedStocks = [];
        
        for (let i = 0; i < initialStocks.length; i += batchSize) {
          const batch = initialStocks.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (stock) => {
              const quote = await fetchStockQuote(stock.symbol);
              const sparklineData = await fetchSparklineData(stock.symbol);
              
              // Update sparkline data
              setSparklineData(prev => ({
                ...prev,
                [stock.symbol]: sparklineData
              }));

              return {
                ...stock,
                price: quote?.c ?? stock.price,
                change: quote?.d ?? stock.change,
                percentChange: quote?.dp ?? stock.percentChange,
                lastUpdated: new Date().toISOString()
              };
            })
          );
          updatedStocks.push(...batchResults);
          setStocks([...updatedStocks]); // Update state with each batch
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between batches
        }
        
        // Save to localStorage
        const pricesForStorage = updatedStocks.reduce((acc, stock) => ({
          ...acc,
          [stock.symbol]: {
            price: stock.price,
            change: stock.change,
            percentChange: stock.percentChange,
            lastUpdated: stock.lastUpdated
          }
        }), {});
        localStorage.setItem('stockPrices', JSON.stringify(pricesForStorage));
      } catch (err) {
        console.error('Error initializing stocks:', err);
        setError('Failed to load stocks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeStocks();
  }, []);

  // Update prices periodically
  useEffect(() => {
    const updatePrices = async () => {
      if (stocks.length === 0) return;
      
      setRefreshing(true);
      try {
        const updates = await Promise.all(
          stocks.map(async (stock) => {
            const quote = await fetchStockQuote(stock.symbol);
            if (quote && typeof quote.c === 'number') {
              return {
                ...stock,
                price: quote.c,
                change: quote.d || stock.change,
                percentChange: quote.dp || stock.percentChange,
                lastUpdated: new Date().toISOString()
              };
            }
            return stock; // Keep previous values if update fails
          })
        );

        // Save to localStorage and update state
        const pricesForStorage = updates.reduce((acc, stock) => ({
          ...acc,
          [stock.symbol]: {
            price: stock.price,
            change: stock.change,
            percentChange: stock.percentChange,
            lastUpdated: stock.lastUpdated
          }
        }), {});
        localStorage.setItem('stockPrices', JSON.stringify(pricesForStorage));
        setStocks(updates);
      } catch (err) {
        console.error('Error updating prices:', err);
      } finally {
        setRefreshing(false);
      }
    };

    const intervalId = setInterval(updatePrices, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Card className="p-6 mb-6 w-full">
        <CardTitle className="mb-4 flex justify-between items-center">
          <span>Stocks</span>
          {refreshing && <span className="text-sm text-gray-500">Updating prices...</span>}
        </CardTitle>
        <CardContent className="p-0">
          <div className="mb-4 px-4">
            <div className="relative flex items-center bg-zinc-900 rounded-xl shadow focus-within:ring-2 focus-within:ring-indigo-500 transition-all border border-zinc-700">
              <FaSearch className="absolute left-4 text-zinc-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search stocks by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-400 rounded-xl py-3"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {loading && !stocks.some(s => s.price !== null) && (
            <div className="flex flex-col items-center my-8">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <span className="font-semibold">Error loading stocks:</span> {error}
            </Alert>
          )}
          {stocks.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-800 bg-zinc-950">
              <table className="w-full divide-y divide-gray-800">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[10%]">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[20%]">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[10%]">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[15%]">Change</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[15%]">Trend</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[15%]">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider w-[15%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stocks
                    .filter(stock => 
                      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((stock, idx) => {
                      const isInPortfolio = portfolio.some(p => p.symbol === stock.symbol);
                      const sparkline = sparklineData[stock.symbol] || [];
                      const isPositive = stock.change >= 0;
                      const quantity = quantities[stock.symbol] || 1;
                      const isExpanded = expandedStock === stock.symbol;
                      const candleData = stockDetails[stock.symbol];
                      
                      return (
                        <React.Fragment key={stock.symbol}>
                          <tr className={
                        `hover:bg-zinc-800 cursor-pointer ${idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-950'}`
                      }>
                            <td className="px-4 py-3 font-mono font-semibold text-gray-100 whitespace-nowrap" onClick={() => toggleStockExpansion(stock)}>{stock.symbol}</td>
                            <td className="px-4 py-3 text-gray-100 whitespace-nowrap" onClick={() => toggleStockExpansion(stock)}>{stock.name}</td>
                            <td className="px-4 py-3 text-gray-100 whitespace-nowrap" onClick={() => toggleStockExpansion(stock)}>
                            {stock.price !== null ? `$${stock.price.toFixed(2)}` : 'Loading...'}
                          </td>
                            <td className={`px-4 py-3 whitespace-nowrap ${stock.change > 0 ? 'text-green-500' : stock.change < 0 ? 'text-red-500' : 'text-gray-100'}`} onClick={() => toggleStockExpansion(stock)}>
                            {stock.change !== null ? (
                              `${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.percentChange.toFixed(2)}%)`
                            ) : 'Loading...'}
                          </td>
                            <td className="px-4 py-3 relative group whitespace-nowrap" onClick={() => toggleStockExpansion(stock)}>
                            {sparkline.length > 0 ? (
                              <div className="relative">
                                <SparklineChart data={sparkline} isPositive={isPositive} />
                                <div className="absolute inset-0 bg-zinc-800 opacity-0 group-hover:opacity-10 transition-opacity rounded" />
                              </div>
                            ) : (
                              <div className="w-20 h-8 bg-zinc-800 rounded animate-pulse" />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <QuantityControl
                              symbol={stock.symbol}
                              quantity={quantity}
                              onChange={(value) => handleQuantityChange(stock.symbol, value)}
                              price={stock.price || 0}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isInPortfolio ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromPortfolio(stock.symbol)}
                                className="w-[120px]"
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                disabled={adding === stock.symbol || stock.price === null}
                                onClick={() => handleAddToPortfolio(stock, quantity)}
                                className="w-[120px]"
                              >
                                {adding === stock.symbol ? 'Adding...' : 'Add to Portfolio'}
                              </Button>
                            )}
                          </td>
                        </tr>
                          {isExpanded && candleData && (
                            <tr>
                              <td colSpan={7} className="p-6 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border-l-4 border-indigo-500 shadow-xl rounded-b-xl animate-fade-in">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400"><FaArrowUp /> High</div>
                                    <div className="text-lg font-medium">${Math.max(...candleData.h).toFixed(2)}</div>
                                  </div>
                                  <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400"><FaArrowDown /> Low</div>
                                    <div className="text-lg font-medium">${Math.min(...candleData.l).toFixed(2)}</div>
                                  </div>
                                  <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400"><FaChartBar /> Volume</div>
                                    <div className="text-lg font-medium">{(candleData.v[candleData.v.length - 1] / 1000000).toFixed(1)}M</div>
                                  </div>
                                  <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 text-sm text-zinc-400"><FaChartLine /> 7d Change</div>
                                    <div className={`text-lg font-medium ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stock.change >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%</div>
                                  </div>
                                </div>
                                <div className="border-t border-zinc-700 my-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-zinc-800 rounded-lg p-4">
                                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><FaChartArea /> Candlestick Chart</h3>
                                    <div className="h-[300px]">
                                      <ChartComponent
                                        type="candlestick"
                                        data={{
                                          labels: candleData.t.map((t: number) => new Date(t * 1000).toLocaleDateString()),
                                          datasets: [{
                                            label: stock.symbol,
                                            data: candleData.t.map((_: any, i: number) => ({
                                              x: new Date(candleData.t[i] * 1000).toLocaleDateString(),
                                              o: candleData.o[i],
                                              h: candleData.h[i],
                                              l: candleData.l[i],
                                              c: candleData.c[i]
                                            }))
                                          }]
                                        }}
                                        options={candlestickOptions}
                                      />
                                    </div>
                                  </div>
                                  <div className="bg-zinc-800 rounded-lg p-4">
                                    <h3 className="text-lg font-medium mb-4">Price Chart</h3>
                                    <div className="h-[300px]">
                                      <Line
                                        data={{
                                          labels: candleData.t.map((t: number) => new Date(t * 1000).toLocaleDateString()),
                                          datasets: [{
                                            label: 'Price',
                                            data: candleData.c,
                                            borderColor: '#6366f1',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            fill: true,
                                            tension: 0.4
                                          }]
                                        }}
                                        options={lineChartOptions}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
              {/* Add stock count summary */}
              <div className="text-right text-xs text-zinc-400 px-4 py-2">
                Showing {stocks.filter(stock =>
                  stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  stock.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} stock(s)
              </div>
              {stocks.filter(stock => 
                stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-400">
                  No stocks found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Stocks; 