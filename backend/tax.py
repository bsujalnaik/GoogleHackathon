# Tax calculation logic for Indian tax system

from portfolio import get_portfolio
import datetime

def calculate_tax(data):
    """
    Calculate taxable income and tax based on income, investments, deductions, and portfolio gains.
    data: { income, investments, deductions }
    Returns: tax amount, breakdown, realized/unrealized gains
    """
    portfolio = get_portfolio()
    # For demo: assume all gains are unrealized, no sale transactions
    total_gain = portfolio['total_gain']
    # Simple tax: 15% short-term, 10% long-term (ignore holding period for demo)
    stcg = total_gain * 0.5  # 50% as short-term
    ltcg = total_gain * 0.5  # 50% as long-term
    stcg_tax = max(0, stcg * 0.15)
    ltcg_tax = max(0, (ltcg - 100000) * 0.10) if ltcg > 100000 else 0
    total_tax = stcg_tax + ltcg_tax
    # Add income tax (very simplified)
    income = data.get('income', 0)
    deductions = data.get('deductions', 0)
    taxable_income = max(0, income + total_gain - deductions)
    income_tax = 0
    if taxable_income > 500000:
        income_tax = (taxable_income - 500000) * 0.2
    total_tax += income_tax
    return {
        'stcg': stcg,
        'ltcg': ltcg,
        'stcg_tax': stcg_tax,
        'ltcg_tax': ltcg_tax,
        'income_tax': income_tax,
        'total_tax': total_tax,
        'realized_gain': 0,
        'unrealized_gain': total_gain,
    }

def suggest_tax_savings(data):
    """
    Suggest additional savings ideas (e.g., max out 80C, 80D)
    """
    suggestions = []
    deductions = data.get('deductions', 0)
    if deductions < 150000:
        suggestions.append('Invest more in 80C (PPF, ELSS, etc.) to save tax')
    if data.get('health_insurance', 0) < 25000:
        suggestions.append('Buy health insurance to claim 80D deduction')
    return suggestions

def recommend_itr_form(data):
    """
    Recommend correct ITR form based on user profile
    """
    # TODO: Implement ITR form logic
    return "ITR-1" 