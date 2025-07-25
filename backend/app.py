from fastapi import FastAPI, Request, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from stock import get_stock_data, get_technical_indicators
from portfolio import get_portfolio, update_portfolio, delete_portfolio, create_portfolio
from tax import calculate_tax, suggest_tax_savings, recommend_itr_form
from report import generate_report
from fastapi.responses import JSONResponse, FileResponse



import json
import os
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
mcp_cache = {}
CACHE_TTL = 60
# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
PROJECT_ID = "finsight-agentic-ai"
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.0-flash-lite-001"

# MCP Details
MCP_LOGIN_URL = "http://localhost:8087/login?sessionId=mcp-session-594e48ea-fea1-40ef-8c52-7552dd9272af"
MCP_TOOL_URL = "http://localhost:8087/mcp/stream"
MCP_SESSION_ID = "mcp-session-594e48ea-fea1-40ef-8c52-7552dd9272af"
MCP_PHONE_NUMBER = "2121212121"
MCP_OTP = "123456"

# Global variables
executor = ThreadPoolExecutor(max_workers=4)
aiohttp_session = None
vertex_model = None
login_status = {"logged_in": False, "timestamp": 0}

# === LIGHTNING FAST MCP OPERATIONS ===
async def quick_mcp_login():
    """Fast MCP login with minimal retry"""
    global aiohttp_session, login_status
    
    current_time = time.time()
    
    # Check if login is recent (within 5 minutes)
    if login_status["logged_in"] and (current_time - login_status["timestamp"]) < 300:
        return True
    
    if aiohttp_session is None:
        timeout_config = aiohttp.ClientTimeout(total=3)
        aiohttp_session = aiohttp.ClientSession(timeout=timeout_config)
    
    try:
        data = {"phoneNumber": MCP_PHONE_NUMBER, "otp": MCP_OTP}
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        async with aiohttp_session.post(MCP_LOGIN_URL, data=data, headers=headers) as resp:
            if resp.status == 200:
                login_status = {"logged_in": True, "timestamp": current_time}
                logger.info("MCP login successful")
                return True
            else:
                logger.warning(f"MCP login failed: {resp.status}")
                return False
                
    except Exception as e:
        logger.error(f"MCP login error: {e}")
        return False

async def fetch_mcp_data_fast():
    """Fast MCP data fetch with caching"""
    global aiohttp_session, mcp_cache
    
    # 1. Check cache first
    current_time = time.time()
    if "data" in mcp_cache and (current_time - mcp_cache.get("timestamp", 0)) < CACHE_TTL:
        logger.info("Returning MCP data from cache.")
        return True, mcp_cache["data"]

    # 2. If no cache, proceed with fetch
    if not await quick_mcp_login():
        return False, {"error": "Login failed"}
    
    headers = {"Content-Type": "application/json", "Mcp-Session-Id": MCP_SESSION_ID}
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": "fetch_net_worth", "arguments": {}}
    }
    
    for attempt in range(2):
        try:
            async with asyncio.timeout(3):  # 3 second timeout per attempt
                async with aiohttp_session.post(MCP_TOOL_URL, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        logger.info(f"MCP data fetched successfully on attempt {attempt + 1}")
                        # 3. Cache the successful result
                        mcp_cache = {"data": result, "timestamp": time.time()}
                        return True, result
                    elif resp.status == 401:
                        # Re-login and try once more
                        login_status["logged_in"] = False
                        if await quick_mcp_login():
                            continue
                    else:
                        logger.warning(f"MCP fetch failed: {resp.status}")
                        
        except asyncio.TimeoutError:
            logger.warning(f"MCP fetch timeout on attempt {attempt + 1}")
        except Exception as e:
            logger.error(f"MCP fetch error on attempt {attempt + 1}: {e}")
        
        # Small delay between attempts
        if attempt == 0:
            await asyncio.sleep(0.5)
    
    return False, {"error": "Failed to fetch data"}

# === VERTEX AI SETUP ===
def init_vertex_ai():
    global vertex_model
    if vertex_model is None:
        try:
            import vertexai
            from vertexai.preview.generative_models import GenerativeModel
            vertexai.init(project=PROJECT_ID, location=LOCATION)
            vertex_model = GenerativeModel(MODEL_NAME)
            logger.info("Vertex AI initialized")
        except Exception as e:
            logger.error(f"Vertex AI init failed: {e}")
            vertex_model = "failed"
    return vertex_model

async def get_ai_response_fast(prompt: str, timeout: float = 5.0) -> str:
    """Get AI response with strict timeout"""
    try:
        model = init_vertex_ai()
        if model == "failed":
            return "AI service unavailable. Please check your setup."
        
        loop = asyncio.get_event_loop()
        
        async with asyncio.timeout(timeout):
            response = await loop.run_in_executor(executor, model.generate_content, prompt)
            return response.text.strip()
            
    except asyncio.TimeoutError:
        return "Response taking longer than expected. Please try a more specific question."
    except Exception as e:
        logger.error(f"AI response error: {e}")
        return "Unable to generate response. Please try again."

# === DATA EXTRACTION AND PROMPT CREATION ===
# === DATA EXTRACTION AND PROMPT CREATION ===

def extract_financial_data(mcp_data):
    """
    Extracts the full, parsed financial data object from the MCP response.
    No data is lost; the entire payload is passed on.
    """
    try:
        # 1. Navigate to the nested text string
        json_string = mcp_data.get('result', {}).get('content', [{}])[0].get('text')
        if not json_string:
            logger.warning("Could not find financial data text in MCP response.")
            return None

        # 2. Parse the string and return the ENTIRE financial data object
        financial_payload = json.loads(json_string)
        logger.info("Successfully parsed the full financial data payload.")
        return financial_payload
        
    except (json.JSONDecodeError, KeyError, IndexError, TypeError) as e:
        logger.error(f"Data extraction error: {e}", exc_info=True)
        return None

def create_focused_prompt(user_message: str, financial_data: dict) -> str:
    """
    Creates a master prompt that gives the AI the full JSON data and instructs it on how to query it.
    """
    
    # Convert the full financial data dictionary into a formatted JSON string for the prompt
    data_as_json_string = json.dumps(financial_data, indent=2)

    prompt = f"""You are an expert financial data analyst AI. Your task is to answer the user's question by performing a precise query on the provided JSON data.

### User Question:
"{user_message}"

### Full Financial Data (JSON):
```json
{data_as_json_string}

Instructions:
1. Give a direct, specific answer using the actual numbers from their data
2. Be concise but helpful (2-3 sentences max)
3. Use the exact amounts shown in the data
4. If asking about net worth, stocks, investments, or portfolio - give specific numbers
5. Don't give generic advice - use their real financial situation

Answer:"""
    
    return prompt

# === EXISTING API ROUTES ===
@app.get("/api/stocks")
async def stocks(ticker: str = ""):
    tickers = ticker.split(',')
    data = get_stock_data(tickers)
    indicators = get_technical_indicators(tickers)
    return {"data": data, "indicators": indicators}

@app.get("/api/portfolio")
async def get_portfolio_route():
    return get_portfolio()

@app.post("/api/portfolio")
async def create_portfolio_route(payload: dict):
    return create_portfolio(payload)

@app.put("/api/portfolio")
async def update_portfolio_route(payload: dict):
    return update_portfolio(payload)

@app.delete("/api/portfolio")
async def delete_portfolio_route(payload: dict):
    return delete_portfolio(payload)

@app.get("/api/recommendations")
async def recommendations():
    return {"recommendations": []}

@app.post("/api/tax")
async def tax(payload: dict):
    tax_result = calculate_tax(payload)
    suggestions = suggest_tax_savings(payload)
    itr_form = recommend_itr_form(payload)
    return {"tax": tax_result, "suggestions": suggestions, "itr_form": itr_form}

@app.get("/api/report")
async def report():
    file_path = generate_report()
    return FileResponse(file_path, filename=os.path.basename(file_path), media_type='application/octet-stream')

# === MAIN CHAT ROUTE - GUARANTEED REAL DATA ===
router = APIRouter()

@router.post("/chat")
async def data_driven_chat(request: Request):
    start_time = time.time()
    
    data = await request.json()
    user_message = data.get("message", "").strip()
    user_id = data.get("user_id", "demo_user")
    
    logger.info(f"Chat request: '{user_message}'")
    
    try:
        # Step 1: Fetch MCP data (max 8 seconds)
        logger.info("Fetching financial data...")
        mcp_success, mcp_data = await fetch_mcp_data_fast()
        
        fetch_time = time.time() - start_time
        logger.info(f"Data fetch took {fetch_time:.2f}s, success: {mcp_success}")
        
        # Step 2: Extract financial data
        financial_data = None
        if mcp_success:
            financial_data = extract_financial_data(mcp_data)
        
        # Step 3: Create response based on available data
        if financial_data:
            # We have real data - create focused prompt
            prompt = create_focused_prompt(user_message, financial_data)
            
            # Get AI response with remaining time
            remaining_time = max(10.0 - (time.time() - start_time), 2.0)
            ai_response = await get_ai_response_fast(prompt, timeout=remaining_time)
            
            response_data = {
                "response": ai_response,
                "mcp_raw": mcp_data,
                "data_available": True,
                "response_time": f"{time.time() - start_time:.2f}s",
                "fetch_time": f"{fetch_time:.2f}s"
            }
            
        else:
            # No usable data - give a brief error message
            error_msg = "I'm unable to access your financial data right now. Please check your MCP connection or try again in a moment."
            
            response_data = {
                "response": error_msg,
                "mcp_raw": mcp_data,
                "data_available": False,
                "response_time": f"{time.time() - start_time:.2f}s",
                "fetch_time": f"{fetch_time:.2f}s"
            }
        
        logger.info(f"Total response time: {response_data['response_time']}")
        return response_data
        
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Chat error after {total_time:.2f}s: {e}")
        
        return {
            "response": f"I encountered an error processing your request. Please try again.",
            "mcp_raw": {"error": str(e)},
            "data_available": False,
            "response_time": f"{total_time:.2f}s"
        }

app.include_router(router)

# === STARTUP ===
@app.on_event("startup")
async def startup_event():
    # Initialize everything at startup
    init_vertex_ai()
    await quick_mcp_login()
    logger.info("FinSight API ready - all services initialized")

@app.on_event("shutdown")
async def shutdown_event():
    global aiohttp_session
    if aiohttp_session:
        await aiohttp_session.close()
    executor.shutdown(wait=True)

# === ENTRY POINT ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        loop="asyncio",
        workers=1,
        timeout_keep_alive=20
    )