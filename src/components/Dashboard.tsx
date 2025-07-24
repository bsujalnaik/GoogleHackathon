import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Stocks from './Stocks';
import { FaChartLine, FaWallet, FaStar, FaLightbulb } from 'react-icons/fa';
import { usePortfolio } from "@/contexts/PortfolioContext";
import { Line } from 'react-chartjs-2';
import { Alert } from "./ui/alert";
import { Badge } from "@/components/ui/badge";
import { FaArrowUp, FaHandPaper, FaEye, FaArrowDown } from "react-icons/fa";
import { Input } from "@/components/ui/input";
// Add imports for PDF and DOCX extraction
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Use fake worker mode for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// --- Portfolio Tab ---
const PortfolioOverview = () => {
  const { portfolio } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate portfolio metrics
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0);
  const totalInvestment = portfolio.reduce((sum, stock) => sum + (stock.avgPrice * stock.quantity), 0);
  const totalGain = totalValue - totalInvestment;
  const totalGainPercent = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;

  // Get top gainers and losers
  const topGainers = [...portfolio]
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, 3);

  const topLosers = [...portfolio]
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-sm text-gray-400">Total Investment</div>
            <div className="text-2xl font-bold">${totalInvestment.toFixed(2)}</div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-sm text-gray-400">Total Gain/Loss</div>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)
            </div>
          </div>
          <div className="p-4 bg-zinc-900 rounded-lg">
            <div className="text-sm text-gray-400">Number of Stocks</div>
            <div className="text-2xl font-bold">{portfolio.length}</div>
          </div>
        </div>

        {portfolio.length > 0 ? (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Quantity</th>
                    <th className="px-4 py-3 text-left">Avg Price</th>
                    <th className="px-4 py-3 text-left">Current Price</th>
                    <th className="px-4 py-3 text-left">Value</th>
                    <th className="px-4 py-3 text-left">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {portfolio.map((stock, idx) => {
                    const value = stock.currentPrice * stock.quantity;
                    const cost = stock.avgPrice * stock.quantity;
                    const gain = value - cost;
                    const gainPercent = (gain / cost) * 100;
                    return (
                      <tr key={stock.symbol} className={`hover:bg-zinc-800 transition ${idx % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-900/30'}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-gray-400">{stock.name}</div>
                        </td>
                        <td className="px-4 py-3">{stock.quantity}</td>
                        <td className="px-4 py-3">${stock.avgPrice.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div>${stock.currentPrice.toFixed(2)}</div>
                          <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)</div>
                        </td>
                        <td className="px-4 py-3">${value.toFixed(2)}</td>
                        <td className={`px-4 py-3 ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>${gain.toFixed(2)}<div className="text-sm">({gainPercent.toFixed(2)}%)</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-700 shadow-lg hover:shadow-2xl transition-all duration-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Top Gainers</h3>
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg mb-2">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-gray-400">{stock.name}</div>
                      </div>
                      <div className="text-green-500">
                        +{stock.percentChange.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-zinc-900 border-zinc-700 shadow-lg hover:shadow-2xl transition-all duration-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Top Losers</h3>
                  {topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg mb-2">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-gray-400">{stock.name}</div>
                      </div>
                      <div className="text-red-500">
                        {stock.percentChange.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No stocks in portfolio. Add stocks from the Stocks tab.
          </div>
        )}
      </Card>
    </div>
  );
};

// --- Performance Tab ---
const PortfolioPerformance = () => {
  const { portfolio } = usePortfolio();
  const [history, setHistory] = useState<any[]>([]);
  const [stockHistories, setStockHistories] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    // Generate sample historical data for portfolio
    const today = new Date();
    const data = [];
    let value = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0);
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Add some random variation
      value = value * (1 + (Math.random() * 0.02 - 0.01));
      data.push({
        date: date.toLocaleDateString(),
        value: value
      });
    }
    setHistory(data);

    // Generate sample historical data for each stock
    const stockData: { [key: string]: any[] } = {};
    portfolio.forEach(stock => {
      const data = [];
      let price = stock.currentPrice;
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Add some random variation
        price = price * (1 + (Math.random() * 0.02 - 0.01));
        data.push({
          date: date.toLocaleDateString(),
          price: price,
          value: price * stock.quantity
        });
      }
      stockData[stock.symbol] = data;
    });
    setStockHistories(stockData);
  }, [portfolio]);

  // Calculate performance metrics for each stock
  const stockPerformance = portfolio.map(stock => {
    const history = stockHistories[stock.symbol] || [];
    const firstPrice = history[0]?.price || stock.avgPrice;
    const lastPrice = stock.currentPrice;
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = (priceChange / firstPrice) * 100;
    const valueChange = (lastPrice - stock.avgPrice) * stock.quantity;
    const valueChangePercent = ((lastPrice - stock.avgPrice) / stock.avgPrice) * 100;

    return {
      ...stock,
      priceChange,
      priceChangePercent,
      valueChange,
      valueChangePercent,
      history: history
    };
  }).sort((a, b) => b.valueChangePercent - a.valueChangePercent);

  // Portfolio summary metrics
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0);
  const totalInvestment = portfolio.reduce((sum, stock) => sum + (stock.avgPrice * stock.quantity), 0);
  const totalGain = totalValue - totalInvestment;
  const totalGainPercent = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-indigo-900/80 to-zinc-900/80 border-0 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <FaChartLine className="text-indigo-400 text-3xl" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Portfolio Performance</h2>
              <div className="text-zinc-400 text-sm">30-Day Value Trend</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="bg-zinc-800 rounded-lg px-6 py-3 text-center">
              <div className="text-xs text-zinc-400 mb-1">Total Value</div>
              <div className="text-xl font-bold">${totalValue.toFixed(2)}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg px-6 py-3 text-center">
              <div className="text-xs text-zinc-400 mb-1">Total Gain/Loss</div>
              <div className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)</div>
            </div>
            <div className="bg-zinc-800 rounded-lg px-6 py-3 text-center">
              <div className="text-xs text-zinc-400 mb-1">Stocks</div>
              <div className="text-xl font-bold">{portfolio.length}</div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="font-semibold mb-2 text-zinc-200">30-Day Portfolio Value</div>
          {history.length > 0 && (
            <div className="h-64 w-full">
              <Line
                data={{
                  labels: history.map(h => h.date),
                  datasets: [{
                    label: 'Portfolio Value',
                    data: history.map(h => h.value),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: false,
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      ticks: { callback: (value: any) => `$${Number(value).toFixed(0)}` }
                    },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Stock Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stockPerformance.map(stock => (
          <Card key={stock.symbol} className="p-6 bg-zinc-900/90 border-0 shadow-lg hover:shadow-2xl transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg">{stock.symbol}</span>
                  {stock.valueChange >= 0 ? (
                    <Badge className="bg-green-500/20 text-green-400 font-bold"><FaArrowUp className="inline mr-1" />+{stock.valueChangePercent.toFixed(2)}%</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 font-bold"><FaArrowDown className="inline mr-1" />{stock.valueChangePercent.toFixed(2)}%</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-2">{stock.name}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${stock.valueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stock.valueChange >= 0 ? '+' : ''}{stock.valueChange.toFixed(2)} USD</div>
                <div className="text-xs text-zinc-400">{stock.quantity} shares</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Current Price</div>
                <div className="font-medium">${stock.currentPrice.toFixed(2)}</div>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3">
                <div className="text-xs text-gray-400">Avg Price</div>
                <div className="font-medium">${stock.avgPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="h-32">
              <Line
                data={{
                  labels: stock.history.map(h => h.date),
                  datasets: [
                    {
                      label: 'Stock Price',
                      data: stock.history.map(h => h.price),
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      fill: true,
                      tension: 0.4,
                      yAxisID: 'y'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      ticks: { color: '#9ca3af', callback: (value: any) => `$${Number(value).toFixed(2)}` }
                    },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                  }
                }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Recommendations Tab ---
const StockRecommendations = () => {
  const [stocks, setStocks] = useState<any[]>([]);

  useEffect(() => {
    const storedPrices = JSON.parse(localStorage.getItem('stockPrices') || '{}');
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
      { symbol: 'SHOP', name: 'Shopify Inc.' }
    ];
    const stocksWithData = STOCK_LIST.map(stock => ({
      ...stock,
      price: storedPrices[stock.symbol]?.price ?? null,
      change: storedPrices[stock.symbol]?.change ?? null,
      percentChange: storedPrices[stock.symbol]?.percentChange ?? null,
    }));
    setStocks(stocksWithData);
  }, []);

  // Categorize stocks
  const buy = [...stocks]
    .filter(s => s.percentChange !== null && s.percentChange > 2)
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, 10);
  const hold = [...stocks]
    .filter(s => s.percentChange !== null && s.percentChange <= 2 && s.percentChange >= -1)
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 10);
  const watch = [...stocks]
    .filter(s => s.percentChange !== null && s.percentChange < -1)
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, 10);

  return (
    <Card className="p-6 mb-6 shadow-lg hover:shadow-2xl transition-all duration-200">
      <h2 className="text-2xl font-bold mb-6 text-center tracking-tight">Stock Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Buy Recommendations */}
        <div className="bg-zinc-900 rounded-xl shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaArrowUp className="text-green-400" />
              <h3 className="font-semibold text-green-400 text-lg">Buy</h3>
            </div>
            <span className="text-xs text-gray-400">Top 10</span>
          </div>
          {buy.length === 0 && <p className="text-sm text-gray-400">No strong buy recommendations right now.</p>}
          <div className="flex flex-col gap-2">
            {buy.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-700 transition">
                <div>
                  <div className="font-semibold text-base">{stock.symbol}</div>
                  <div className="text-xs text-gray-400">{stock.name}</div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="default" className="bg-green-500/20 text-green-400 font-bold mb-1">
                    +{stock.percentChange.toFixed(2)}%
                  </Badge>
                  <span className="text-xs text-gray-400">Quantity: 1</span>
                  <span className="text-sm text-gray-200 font-mono">${stock.price !== null ? stock.price.toFixed(2) : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Hold Recommendations */}
        <div className="bg-zinc-900 rounded-xl shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaHandPaper className="text-yellow-400" />
              <h3 className="font-semibold text-yellow-400 text-lg">Hold</h3>
            </div>
            <span className="text-xs text-gray-400">Top 10</span>
          </div>
          {hold.length === 0 && <p className="text-sm text-gray-400">No hold recommendations right now.</p>}
          <div className="flex flex-col gap-2">
            {hold.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-700 transition">
                <div>
                  <div className="font-semibold text-base">{stock.symbol}</div>
                  <div className="text-xs text-gray-400">{stock.name}</div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 font-bold mb-1">
                    {stock.percentChange.toFixed(2)}%
                  </Badge>
                  <span className="text-xs text-gray-400">Quantity: 1</span>
                  <span className="text-sm text-gray-200 font-mono">${stock.price !== null ? stock.price.toFixed(2) : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Watch List */}
        <div className="bg-zinc-900 rounded-xl shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaEye className="text-blue-400" />
              <h3 className="font-semibold text-blue-400 text-lg">Watch List</h3>
            </div>
            <span className="text-xs text-gray-400">Top 10</span>
          </div>
          {watch.length === 0 && <p className="text-sm text-gray-400">No watch list recommendations right now.</p>}
          <div className="flex flex-col gap-2">
            {watch.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 hover:bg-zinc-700 transition">
                <div>
                  <div className="font-semibold text-base">{stock.symbol}</div>
                  <div className="text-xs text-gray-400">{stock.name}</div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="default" className="bg-blue-500/20 text-blue-400 font-bold mb-1">
                    {stock.percentChange.toFixed(2)}%
                  </Badge>
                  <span className="text-xs text-gray-400">Quantity: 1</span>
                  <span className="text-sm text-gray-200 font-mono">${stock.price !== null ? stock.price.toFixed(2) : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950 p-0 md:p-8 flex flex-col items-center font-sans pb-32 md:pb-16">
      <div className="w-full max-w-7xl rounded-none md:rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-zinc-800 p-0 md:p-8 mt-0 md:mt-8 min-h-screen md:min-h-0">
        {/* Friendly greeting */}
        <div className="w-full flex flex-col items-center mb-6 mt-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">Welcome back!</h1>
          <p className="text-zinc-300 text-base md:text-lg">Here’s your portfolio at a glance.</p>
        </div>
        <Tabs defaultValue="stocks" className="w-full">
          {/* Mobile Tab List */}
          <div className="md:hidden w-full overflow-x-auto pb-2 no-scrollbar">
            <TabsList className="flex w-max min-w-full bg-zinc-900/80 rounded-none shadow-md p-1 gap-1 border-b border-zinc-800">
              <TabsTrigger value="stocks" className="flex-1 min-w-[100px] flex items-center gap-2 justify-center px-3 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-indigo-700/60 transition">
                <FaChartLine className="w-4 h-4" /> Stocks
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 min-w-[100px] flex items-center gap-2 justify-center px-3 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-green-700/60 transition">
                <FaWallet className="w-4 h-4" /> Portfolio
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex-1 min-w-[100px] flex items-center gap-2 justify-center px-3 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-blue-700/60 transition">
                <FaStar className="w-4 h-4" /> Performance
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex-1 min-w-[100px] flex items-center gap-2 justify-center px-3 py-2 rounded-lg font-medium text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-amber-700/60 transition">
                <FaLightbulb className="w-4 h-4" /> Recommendations
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop Tab List */}
          <div className="hidden md:block">
            <TabsList className="flex w-full bg-zinc-900/80 rounded-xl shadow-md p-1 gap-1.5 border-b border-zinc-800">
              <TabsTrigger value="stocks" className="flex-1 flex items-center gap-2 justify-center px-3 py-1.5 rounded-lg font-medium text-sm data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-indigo-700/60 transition">
                <FaChartLine className="w-4 h-4" /> Stocks
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 flex items-center gap-2 justify-center px-3 py-1.5 rounded-lg font-medium text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-green-700/60 transition">
                <FaWallet className="w-4 h-4" /> Portfolio
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex-1 flex items-center gap-2 justify-center px-3 py-1.5 rounded-lg font-medium text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-blue-700/60 transition">
                <FaStar className="w-4 h-4" /> Performance
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex-1 flex items-center gap-2 justify-center px-3 py-1.5 rounded-lg font-medium text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=inactive]:text-zinc-200 hover:bg-amber-700/60 transition">
                <FaLightbulb className="w-4 h-4" /> Recommendations
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="block md:hidden text-xs text-zinc-400 text-center mt-2">
            Swipe left/right to see more options
          </div>

          <div className="space-y-6 md:space-y-8 p-4 md:p-0 mb-8 md:mb-12">
            <TabsContent value="stocks">
              <div className="w-full overflow-x-auto md:overflow-visible pb-2 relative">
                <Stocks />
              </div>
            </TabsContent>
            <TabsContent value="portfolio">
              <div className="w-full overflow-x-auto md:overflow-visible pb-2 relative">
                <PortfolioOverview />
              </div>
            </TabsContent>
            <TabsContent value="performance">
              <div className="w-full overflow-x-auto md:overflow-visible pb-2 relative">
                <PortfolioPerformance />
              </div>
            </TabsContent>
            <TabsContent value="recommendations">
              <div className="w-full overflow-x-auto md:overflow-visible pb-2 relative">
                <StockRecommendations />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;