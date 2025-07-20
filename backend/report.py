# Report generation logic (PDF/CSV)

import yfinance as yf

def generate_report():
    """
    Generate a report (PDF or CSV) with portfolio summary and tax suggestions.
    Returns: file path to the generated report
    """
    # TODO: Implement report generation (use reportlab or csv)
    data = yf.Ticker("TCS.NS")
    hist = data.history(period="1mo")
    print(hist)
    return "report.pdf"