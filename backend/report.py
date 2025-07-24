# Report generation logic (PDF/CSV)

import yfinance as yf
import pandas as pd
from portfolio import get_portfolio
from tax import calculate_tax, suggest_tax_savings
import datetime

def generate_report():
    """
    Generate a report (CSV) with portfolio summary and tax suggestions.
    Returns: file path to the generated report
    """
    portfolio = get_portfolio()
    tax = calculate_tax({'income': 0, 'deductions': 0})
    suggestions = suggest_tax_savings({'income': 0, 'deductions': 0})
    # Portfolio summary
    df = pd.DataFrame(portfolio['holdings'])
    file_path = f"report_{datetime.date.today().isoformat()}.csv"
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('Portfolio Summary\n')
        df.to_csv(f, index=False)
        f.write('\nTax Summary\n')
        for k, v in tax.items():
            f.write(f'{k},{v}\n')
        f.write('\nTax Saving Suggestions\n')
        for s in suggestions:
            f.write(f'{s}\n')
    return file_path