// AI Search utility
// TODO: Connect to backend proxy for Gemini API
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function aiSearch(query, listings) {
  // In a real app, we'd send the query and listing titles/descriptions to Gemini
  // to find the best matches. For now, we'll simulate the AI filtering.
  
  console.log('AI Searching for:', query);
  
  // Simulation: Filter based on keywords if AI key is missing
  const keywords = query.toLowerCase().split(' ');
  return listings.filter(item => {
    const text = (item.title + ' ' + item.description + ' ' + item.category).toLowerCase();
    return keywords.some(word => text.includes(word));
  });
}

/**
 * Example prompt for Gemini:
 * "You are a marketplace assistant for Kericho, Kenya. 
 * Based on these listings: [LISTINGS_JSON], 
 * find the best items for the user query: '[USER_QUERY]'.
 * Return only a JSON array of product IDs."
 */
