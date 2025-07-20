# In-memory portfolio store (for demo; replace with DB for production)
PORTFOLIO = {
    'holdings': [],  # List of {ticker, quantity, avg_price}
    'history': []    # List of historical values
}

def get_portfolio():
    """
    Returns the current portfolio (holdings, value, P/L, etc.)
    """
    # TODO: Calculate total value, P/L, allocation, etc.
    return PORTFOLIO

def create_portfolio(data):
    """
    Create a new portfolio (replace existing)
    """
    PORTFOLIO['holdings'] = data.get('holdings', [])
    PORTFOLIO['history'] = []
    return PORTFOLIO

def update_portfolio(data):
    """
    Update portfolio holdings (add/remove stocks)
    """
    # TODO: Implement update logic
    return PORTFOLIO

def delete_portfolio(data):
    """
    Delete portfolio or specific holdings
    """
    # TODO: Implement delete logic
    return PORTFOLIO 