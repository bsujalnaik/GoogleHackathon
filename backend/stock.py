import logging
from flask import Blueprint, jsonify, request
import requests

stock_bp = Blueprint('stock', __name__)

# Predefined NIFTY 50 list (symbol: name)
NIFTY_50 = [
    {"symbol": "RELIANCE", "name": "Reliance Industries"},
    {"symbol": "TCS", "name": "Tata Consultancy Services"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank"},
    {"symbol": "INFY", "name": "Infosys"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever"},
    {"symbol": "SBIN", "name": "State Bank of India"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel"},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank"},
    {"symbol": "ITC", "name": "ITC Limited"},
    # ... add more as needed ...
]

ALPHA_VANTAGE_API_KEY = 'YOUR_API_KEY'
ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'

@stock_bp.route('/api/stocks', methods=['GET'])
def get_stocks():
    stocks = []
    for stock in NIFTY_50:
        try:
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': stock['symbol'] + '.NS',
                'apikey': ALPHA_VANTAGE_API_KEY
            }
            r = requests.get(ALPHA_VANTAGE_BASE, params=params)
            data = r.json()
            if 'Global Quote' in data:
                price = float(data['Global Quote'].get('05. price', 0))
            elif 'Note' in data:
                logging.error(f"Alpha Vantage rate limit: {data['Note']}")
                return jsonify({'error': 'Alpha Vantage rate limit exceeded. Please try again later.'}), 429
            else:
                price = None
            stocks.append({
                'symbol': stock['symbol'],
                'name': stock['name'],
                'price': price
            })
        except Exception as e:
            logging.error(f"Error fetching {stock['symbol']}: {e}")
            stocks.append({
                'symbol': stock['symbol'],
                'name': stock['name'],
                'price': None,
                'error': str(e)
            })
    return jsonify(stocks)

@stock_bp.route('/api/stocks/<symbol>', methods=['GET'])
def get_stock_details(symbol):
    try:
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': symbol + '.NS',
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        r = requests.get(ALPHA_VANTAGE_BASE, params=params)
        data = r.json()
        if 'Time Series (Daily)' in data:
            prices = []
            for date, values in list(data['Time Series (Daily)'].items())[:30]:
                prices.append({
                    'date': date,
                    'open': float(values['1. open']),
                    'high': float(values['2. high']),
                    'low': float(values['3. low']),
                    'close': float(values['4. close']),
                    'volume': int(values['5. volume'])
                })
            return jsonify({
                'symbol': symbol,
                'prices': prices[::-1]  # most recent last
            })
        elif 'Note' in data:
            logging.error(f"Alpha Vantage rate limit: {data['Note']}")
            return jsonify({'error': 'Alpha Vantage rate limit exceeded. Please try again later.'}), 429
        else:
            return jsonify({'error': 'Stock data not found.'}), 404
    except Exception as e:
        logging.error(f"Error fetching details for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

def get_stock_data(tickers):
    """
    Returns latest price, % change, etc. for each ticker using Alpha Vantage.
    """
    result = {}
    for ticker in tickers:
        if not ticker:
            continue
        try:
            params = {
                "function": "TIME_SERIES_DAILY_ADJUSTED",
                "symbol": ticker,
                "apikey": ALPHA_VANTAGE_API_KEY
            }
            resp = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
            data = resp.json()
            if "Time Series (Daily)" not in data:
                result[ticker] = {"error": data.get("Note") or data.get("Error Message") or "No data returned"}
                continue
            ts = data["Time Series (Daily)"]
            dates = sorted(ts.keys(), reverse=True)
            if len(dates) < 2:
                result[ticker] = {"error": "Not enough data"}
                continue
            last = ts[dates[0]]
            prev = ts[dates[1]]
            price = float(last["4. close"])
            prev_close = float(prev["4. close"])
            change = price - prev_close
            pct_change = (change / prev_close) * 100 if prev_close else 0
            result[ticker] = {
                "price": price,
                "prev_close": prev_close,
                "change": change,
                "pct_change": pct_change,
                "name": ticker,
                "currency": "INR",  # Alpha Vantage does not provide currency in this endpoint
            }
        except Exception as e:
            result[ticker] = {"error": str(e)}
    return result

# Placeholder for technical indicators (can be implemented with Alpha Vantage's indicator endpoints)
def get_technical_indicators(tickers):
    """
    Returns indicators for each ticker (moving averages, RSI, MACD, etc.)
    """
    # Not implemented for Alpha Vantage in this version
    return {ticker: {} for ticker in tickers}

def recommend_stocks(tickers):
    """
    Recommend stocks based on technical indicators (e.g., RSI < 30, MACD > 0)
    Returns: list of {ticker, reason}
    """
    recommendations = []
    indicators = get_technical_indicators(tickers)
    for ticker, ind in indicators.items():
        if 'error' in ind:
            continue
        reasons = []
        if ind.get('RSI14') is not None and ind['RSI14'] < 35:
            reasons.append('RSI indicates oversold')
        if ind.get('MACD') is not None and ind.get('MACD_signal') is not None and ind['MACD'] > ind['MACD_signal']:
            reasons.append('MACD bullish crossover')
        if reasons:
            recommendations.append({'ticker': ticker, 'reasons': reasons})
    return recommendations 