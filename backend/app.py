from flask import Flask, request, jsonify, send_file
from stock import get_stock_data, get_technical_indicators, recommend_stocks, stock_bp
from portfolio import get_portfolio, update_portfolio, delete_portfolio, create_portfolio, get_portfolio_history
from tax import calculate_tax, suggest_tax_savings, recommend_itr_form
from report import generate_report

app = Flask(__name__)
app.register_blueprint(stock_bp)

# --- STOCK DATA ENDPOINT ---
@app.route('/api/stocks', methods=['GET'])
def stocks():
    """
    Query params: ticker (comma-separated)
    Returns: live stock data, technical indicators, chart data
    """
    # Example: /api/stocks?ticker=TCS.NS,RELIANCE.NS
    tickers = request.args.get('ticker', '').split(',')
    data = get_stock_data(tickers)
    indicators = get_technical_indicators(tickers)
    return jsonify({'data': data, 'indicators': indicators})

# --- PORTFOLIO ENDPOINTS ---
@app.route('/api/portfolio', methods=['GET', 'POST', 'PUT', 'DELETE'])
def portfolio():
    """
    GET: Get portfolio
    POST: Create new portfolio
    PUT: Update portfolio
    DELETE: Delete portfolio
    """
    if request.method == 'GET':
        result = get_portfolio()
        if isinstance(result, dict) and 'error' in result:
            return jsonify({'error': result['error']}), 500
        return jsonify(result)
    elif request.method == 'POST':
        return jsonify(create_portfolio(request.json))
    elif request.method == 'PUT':
        return jsonify(update_portfolio(request.json))
    elif request.method == 'DELETE':
        return jsonify(delete_portfolio(request.json))

# --- PORTFOLIO HISTORY ENDPOINT ---
@app.route('/api/portfolio/history', methods=['GET'])
def portfolio_history():
    """
    Returns historical portfolio value for performance charts
    """
    return jsonify(get_portfolio_history())

# --- RECOMMENDATIONS ENDPOINT ---
@app.route('/api/recommendations', methods=['GET'])
def recommendations():
    """
    Returns: smart stock recommendations based on technical analysis
    """
    # Recommend for all portfolio tickers
    portfolio = get_portfolio()
    tickers = [h['ticker'] for h in portfolio['holdings']]
    recs = recommend_stocks(tickers)
    return jsonify({'recommendations': recs})

# --- TAX CALCULATION ENDPOINT ---
@app.route('/api/tax', methods=['POST'])
def tax():
    """
    Body: { income, investments, deductions }
    Returns: tax calculation, suggestions, ITR form
    """
    data = request.json
    tax_result = calculate_tax(data)
    suggestions = suggest_tax_savings(data)
    itr_form = recommend_itr_form(data)
    return jsonify({'tax': tax_result, 'suggestions': suggestions, 'itr_form': itr_form})

# --- REPORT GENERATION ENDPOINT ---
@app.route('/api/report', methods=['GET'])
def report():
    """
    Returns: downloadable report (PDF or CSV)
    """
    # TODO: Implement report generation
    file_path = generate_report()
    return send_file(file_path, as_attachment=True)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True) 