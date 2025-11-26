const API_URL ="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


export async function categorizeSite(title, url, apiKey) {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
You are a strict classification engine.
Your job is to assign the browser history title into exactly one category from the list below.

Allowed Categories :
Education
Entertainment
Social Media
Shopping
News
Adult
Gaming
Sports
Finance
Coding / Programming
AI Tools
Productivity
Health
Travel
Food
Other

Instructions:
- Always respond with only the category name, nothing else.
- If the title doesn’t clearly belong to any category, return “Other”.
- Do not invent new categories.
- Interpret the user’s intent behind the title when needed.
- Stay consistent across similar titles.

Website Title: "${title}"
Website URL: "${url}"

Output: Return only one category from the list.
`;

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const validCategories = [
      "Education", "Entertainment", "Gaming", "News", "Social Media",
      "Adult", "Sports", "Shopping", "Coding", "Productivity", "Finance",
      "AI Tools", "Health", "Travel", "Food", "Others"
    ];

    let normalized = category;
    if (normalized === "Coding / Programming") normalized = "Coding";
    if (normalized === "Other") normalized = "Others";

    const match = validCategories.find(c => c.toLowerCase() === normalized?.toLowerCase());
    return match || "Others";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Others";
  }
}
