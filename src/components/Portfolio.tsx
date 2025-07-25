import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Line } from 'react-chartjs-2';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { FaArrowUp, FaArrowDown, FaChartLine, FaWallet, FaExchangeAlt } from 'react-icons/fa';
import { Input } from './ui/input';

const PortfolioOverview = () => {
  const { portfolio, updatePortfolio } = usePortfolio();

  // Calculate portfolio metrics
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0);
  const totalInvestment = portfolio.reduce((sum, stock) => sum + (stock.avgPrice * stock.quantity), 0);
  const totalGain = totalValue - totalInvestment;
  const totalGainPercent = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;

  // Sort stocks by value
  const sortedStocks = [...portfolio].sort((a, b) => 
    (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity)
  );

  // Get top gainers and losers
  const topGainers = [...portfolio]
    .sort((a, b) => b.percentChange - a.percentChange)
    .slice(0, 3);

  const topLosers = [...portfolio]
    .sort((a, b) => a.percentChange - b.percentChange)
    .slice(0, 3);

  // Handle quantity change
  const handleQuantityChange = (symbol: string, newQuantity: number) => {
    const updatedPortfolio = portfolio.map(stock => {
      if (stock.symbol === symbol) {
        return {
          ...stock,
          quantity: Math.max(1, newQuantity)
        };
      }
      return stock;
    });
    updatePortfolio(updatedPortfolio);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Portfolio Summary</h2>
              <p className="text-zinc-400">Your investment overview</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">${totalValue.toFixed(2)}</div>
              <div className={`text-sm font-medium ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)} ({totalGainPercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaWallet className="text-blue-500" />
                <span className="text-zinc-400">Total Investment</span>
              </div>
              <div className="text-xl font-bold">${totalInvestment.toFixed(2)}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaChartLine className={totalGain >= 0 ? 'text-green-500' : 'text-red-500'} />
                <span className="text-zinc-400">Total Gain/Loss</span>
              </div>
              <div className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)}
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaExchangeAlt className="text-purple-500" />
                <span className="text-zinc-400">Number of Stocks</span>
              </div>
              <div className="text-xl font-bold">{portfolio.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Your Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4">Stock</th>
                  <th className="text-right py-3 px-4">Quantity</th>
                  <th className="text-right py-3 px-4">Avg Price</th>
                  <th className="text-right py-3 px-4">Current Price</th>
                  <th className="text-right py-3 px-4">Total Value</th>
                  <th className="text-right py-3 px-4">Total Gain/Loss</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const value = stock.currentPrice * stock.quantity;
                  const cost = stock.avgPrice * stock.quantity;
                  const gain = value - cost;
                  const gainPercent = (gain / cost) * 100;

                  return (
                    <tr key={stock.symbol} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-sm text-zinc-400">{stock.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={stock.quantity}
                            onChange={(e) => handleQuantityChange(stock.symbol, parseInt(e.target.value) || 1)}
                            className="w-24 text-right bg-zinc-800 border-zinc-700"
                          />
                          <span className="text-sm text-zinc-400">shares</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">${stock.avgPrice.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">
                        <div>${stock.currentPrice.toFixed(2)}</div>
                        <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">${value.toFixed(2)}</td>
                      <td className={`text-right py-3 px-4 ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <div>{gain >= 0 ? '+' : ''}{gain.toFixed(2)}</div>
                        <div className="text-sm">({gainPercent.toFixed(2)}%)</div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleQuantityChange(stock.symbol, 0)}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-zinc-700">
                <tr>
                  <td className="py-3 px-4 font-bold">Total</td>
                  <td className="text-right py-3 px-4 font-bold">
                    {portfolio.reduce((sum, stock) => sum + stock.quantity, 0)} shares
                  </td>
                  <td className="text-right py-3 px-4"></td>
                  <td className="text-right py-3 px-4"></td>
                  <td className="text-right py-3 px-4 font-bold">${totalValue.toFixed(2)}</td>
                  <td className={`text-right py-3 px-4 font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaArrowUp className="text-green-500" />
              <h3 className="text-xl font-bold">Top Gainers</h3>
            </div>
            <div className="space-y-3">
              {topGainers.map((stock) => (
                <div key={stock.symbol} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-zinc-400">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-500">+{stock.percentChange.toFixed(2)}%</div>
                      <div className="text-sm text-zinc-400">${stock.currentPrice.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaArrowDown className="text-red-500" />
              <h3 className="text-xl font-bold">Top Losers</h3>
            </div>
            <div className="space-y-3">
              {topLosers.map((stock) => (
                <div key={stock.symbol} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-zinc-400">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500">{stock.percentChange.toFixed(2)}%</div>
                      <div className="text-sm text-zinc-400">${stock.currentPrice.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioOverview; 