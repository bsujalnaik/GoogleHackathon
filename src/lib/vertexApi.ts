export async function fetchVertexAIResponse(prompt: string): Promise<string> {
  const res = await fetch('http://localhost:8080/vertex-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (data.candidates?.[0]?.content) {
    return data.candidates[0].content;
  }
  if (data.error) {
    return `API Error: ${data.error.message || JSON.stringify(data.error)}`;
  }
  return "Sorry, I couldn't generate a response.";
} 