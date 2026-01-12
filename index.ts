const GEMINI_API_KEY = "gen-lang-client-0583561856";

Deno.serve(async (req: Request) => {
    // Handle CORS for React Frontend
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    try {
        const { fleetData } = await req.json();

        const prompt = `
      You are the Mangalore Smart Transit AI. 
      Based on this live bus data: ${JSON.stringify(fleetData)},
      provide a 1-sentence dispatch strategy for the city admin. 
      Focus on Route 15 or Jyothi Circle.
    `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        return new Response(
            JSON.stringify({ text: aiText }),
            { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
})