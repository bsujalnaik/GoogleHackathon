import matplotlib.pyplot as plt
import os
import uuid

# --- PIE CHART GENERATOR (Unchanged) ---
def generate_pie_chart(data: dict, title: str) -> str:
    """Generates a dark-themed donut chart."""
    if not os.path.exists("static/charts"):
        os.makedirs("static/charts")
    
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(10, 7), facecolor='#1e1e1e')
    ax.set_facecolor('#1e1e1e')

    wedges, _, autotexts = ax.pie(
        data.values(), 
        autopct='%1.1f%%', 
        startangle=140, 
        pctdistance=0.85,
        textprops={'color': 'white', 'fontsize': 12, 'weight': 'bold'}
    )
    
    centre_circle = plt.Circle((0,0),0.70,fc='#1e1e1e')
    fig.gca().add_artist(centre_circle)

    ax.set_title(title, color='#20d4aa', fontsize=18, weight='bold', pad=20)
    ax.axis('equal')
    ax.legend(wedges, data.keys(), title="Categories", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    plt.tight_layout()
    chart_id = f"{uuid.uuid4()}.png"
    filepath = os.path.join("static/charts", chart_id)
    plt.savefig(filepath, facecolor=fig.get_facecolor())
    plt.close(fig)
    return f"/charts/{chart_id}"

# --- NEW: BAR CHART GENERATOR ---
def generate_bar_chart(data: dict, title: str, xlabel: str, ylabel: str) -> str:
    """Generates a dark-themed bar chart."""
    if not os.path.exists("static/charts"):
        os.makedirs("static/charts")

    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 7), facecolor='#1e1e1e')
    ax.set_facecolor('#1e1e1e')
    
    labels = list(data.keys())
    values = list(data.values())
    
    bars = ax.bar(labels, values, color='#20d4aa')
    
    ax.set_title(title, color='white', fontsize=18, weight='bold', pad=20)
    ax.set_xlabel(xlabel, color='#b0b0b0', fontsize=12, labelpad=10)
    ax.set_ylabel(ylabel, color='#b0b0b0', fontsize=12, labelpad=10)
    
    # Style the chart
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#555')
    ax.spines['bottom'].set_color('#555')
    ax.tick_params(axis='x', labelrotation=45)
    ax.grid(axis='y', linestyle='--', alpha=0.2)

    # Add value labels on top of bars
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval, f'₹{yval:,.0f}', va='bottom', ha='center', color='white', fontsize=10)
        
    plt.tight_layout()
    chart_id = f"{uuid.uuid4()}.png"
    filepath = os.path.join("static/charts", chart_id)
    plt.savefig(filepath, facecolor=fig.get_facecolor())
    plt.close(fig)
    return f"/charts/{chart_id}"