# In-memory portfolio store (for demo; replace with DB for production)
PORTFOLIO = {
    'holdings': [],  # List of {ticker, quantity, avg_price}
    'history': []    # List of historical values
}

from stock import get_stock_data
import datetime

def get_portfolio():
    """
    Returns the current portfolio (holdings, value, P/L, allocation, top gainers/losers, history)
    """
    try:
        holdings = PORTFOLIO['holdings']
        tickers = [h['ticker'] for h in holdings]
        prices = get_stock_data(tickers)
        if any('error' in prices.get(t, {}) for t in tickers):
            errors = {t: prices[t]['error'] for t in tickers if 'error' in prices.get(t, {})}
            return {'error': f"Error fetching stock data: {errors}"}
        total_value = 0
        total_cost = 0
        holding_details = []
        for h in holdings:
            ticker = h['ticker']
            qty = h['quantity']
            avg_price = h['avg_price']
            price_info = prices.get(ticker, {})
            price = price_info.get('price', 0)
            value = qty * price
            cost = qty * avg_price
            gain = value - cost
            pct_gain = (gain / cost * 100) if cost else 0
            holding_details.append({
                'ticker': ticker,
                'name': price_info.get('name', ticker),
                'quantity': qty,
                'avg_price': avg_price,
                'current_price': price,
                'value': value,
                'cost': cost,
                'gain': gain,
                'pct_gain': pct_gain,
                'day_change': price_info.get('change', 0),
                'day_pct_change': price_info.get('pct_change', 0),
                'currency': price_info.get('currency', 'INR'),
            })
            total_value += value
            total_cost += cost
        # Allocation
        allocation = []
        for h in holding_details:
            alloc = (h['value'] / total_value * 100) if total_value else 0
            allocation.append({'ticker': h['ticker'], 'name': h['name'], 'allocation': alloc})
        # Top gainers/losers
        sorted_by_day = sorted(holding_details, key=lambda x: x['day_pct_change'], reverse=True)
        top_gainers = sorted_by_day[:3]
        top_losers = sorted_by_day[-3:][::-1] if len(sorted_by_day) > 3 else []
        # Update history
        import datetime
        today = datetime.date.today().isoformat()
        PORTFOLIO['history'].append({'date': today, 'value': total_value})
        # Remove duplicate dates
        seen = set()
        PORTFOLIO['history'] = [x for x in PORTFOLIO['history'] if not (x['date'] in seen or seen.add(x['date']))]
        return {
            'holdings': holding_details,
            'total_value': total_value,
            'total_cost': total_cost,
            'total_gain': total_value - total_cost,
            'total_pct_gain': ((total_value - total_cost) / total_cost * 100) if total_cost else 0,
            'allocation': allocation,
            'top_gainers': top_gainers,
            'top_losers': top_losers,
            'history': PORTFOLIO['history'],
        }
    except Exception as e:
        return {'error': f"Portfolio calculation error: {str(e)}"}

def get_portfolio_history():
    """
    Returns historical portfolio value for performance charts.
    """
    return PORTFOLIO['history']

def create_portfolio(data):
    """
    Create a new portfolio (replace existing)
    """
    PORTFOLIO['holdings'] = data.get('holdings', [])
    PORTFOLIO['history'] = []
    return PORTFOLIO

def update_portfolio(data):
    """
    Update portfolio holdings (add/update stocks)
    data: {holdings: [{ticker, quantity, avg_price}]}
    """
    updates = data.get('holdings', [])
    for upd in updates:
        found = False
        for h in PORTFOLIO['holdings']:
            if h['ticker'] == upd['ticker']:
                h['quantity'] = upd.get('quantity', h['quantity'])
                h['avg_price'] = upd.get('avg_price', h['avg_price'])
                found = True
                break
        if not found:
            PORTFOLIO['holdings'].append(upd)
    return get_portfolio()

def delete_portfolio(data):
    """
    Delete portfolio or specific holdings
    data: {tickers: [ticker1, ticker2, ...]}
    """
    tickers = data.get('tickers', [])
    if tickers:
        PORTFOLIO['holdings'] = [h for h in PORTFOLIO['holdings'] if h['ticker'] not in tickers]
    else:
        PORTFOLIO['holdings'] = []
        PORTFOLIO['history'] = []
    return get_portfolio() 