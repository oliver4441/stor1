// Nia AI — powers the Omix Store chatbot with real LLM intelligence
// Uses OpenCode API (OpenAI-compatible) via the frontend

const OPENCODE_API_URL = 'https://api.opencode.ai/v1/chat/completions';

// Fallback: use VITE_OPENCODE_API_KEY from env
function getApiKey() {
  return import.meta.env.VITE_OPENCODE_API_KEY || '';
}

// ── System Prompt — current store knowledge ────────────────────
const SYSTEM_PROMPT = `You are Nia, the helpful AI assistant for Omix Store — an online marketplace based in Kericho, Kenya.

## About Omix Store
- Location: Kericho, Kenya
- Delivery: Free delivery within Kericho and surrounding areas
  - Kericho CBD: Same day delivery
  - Kericho town (Moi Junction, Litein Road, Hospital Area, etc.): 1-2 days
  - Outside Kericho (Sosiot, Londiani, Fort Ternan, etc.): 2-3 days
- Payment: M-Pesa via Paystack STK Push (secure, instant)
- Contact: omixsystems@gmail.com | +254 768 213 649
- Hours: Mon-Sat 8AM-6PM, Sun closed

## Features (know these inside out):
1. **Wishlist** — Users can save favorite items with the heart icon on any product
2. **Reviews & Ratings** — Users can rate products (1-5 stars) and write reviews after purchase
3. **Saved Addresses** — Users can save multiple delivery addresses in their account for faster checkout
4. **Referral System** — Users get a unique referral link in their account. Share it — you both get KES 100 off when the friend places their first order
5. **Loyalty Points** — Earn 1 point per KES 100 spent. 100 points = KES 50 off. Redeem at checkout
6. **Flash Sales** — Limited-time discounts with countdown timers on product cards
7. **Promo Codes** — Enter promo codes at checkout for discounts or free delivery
8. **Order Tracking** — Users can track orders at /track-order or in their account
9. **Recently Viewed** — Products the user has looked at are saved
10. **Quick View** — Click the eye icon on any product to preview without navigating away
11. **PWA Install** — Users can install Omix Store as an app on their phone

## How to handle questions:
- Be friendly, helpful, and concise. Use emojis sparingly.
- If asked about something you don't know, say so honestly.
- For orders/users/products, ask them to check their account or provide details.
- Always end with 2-4 suggested next-action chips (like "Browse products", "Track my order", etc.).
- Your response should end with a line containing only "CHIPS: <chip1> | <chip2> | <chip3>" to suggest quick action buttons.

## Delivery Areas (Kericho Sub-locations):
- Kericho Town: CBD, Moi Junction, Kericho Stage, Litein Road, Hospital Area
- Residential: Chepseon, Kipkelion, Ainamoi, Kabianga, Kapkugerwet, Londiani, Kedowa
- Outskirts: Brooke, Sosiot, Roret, Fort Ternan, Cheborge, Sigowet

## Return Policy:
- Electronics: 7 days if defective (with receipt)
- Clothing: 3 days with tags and receipt
- Furniture: No returns (please inspect on delivery)
- Shoes: 3 days if unworn

Keep responses short, helpful, and natural. You're talking to Kenyan customers — use simple English.`;

// ── Build message array for the API ─────────────────────────────
function buildMessages(conversationHistory, userText) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Add recent history (last 10 exchanges)
  const recent = conversationHistory.slice(-20);
  for (const msg of recent) {
    if (msg.sender === 'user') {
      messages.push({ role: 'user', content: msg.text });
    } else if (msg.sender === 'nia' && !msg.isChipResponse) {
      // Strip the CHIPS line from the assistant message for the API
      const cleanText = msg.text.replace(/\nCHIPS:.*$/, '');
      messages.push({ role: 'assistant', content: cleanText });
    }
  }

  messages.push({ role: 'user', content: userText });
  return messages;
}

// ── Call the AI API ─────────────────────────────────────────────
export async function niaChat(conversationHistory, userText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return fallbackResponse(userText);
  }

  try {
    const messages = buildMessages(conversationHistory, userText);

    const res = await fetch(OPENCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'opencode-moon',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn('Nia AI API error:', res.status, res.statusText);
      return fallbackResponse(userText);
    }

    const data = await res.json();
    const fullResponse = data.choices?.[0]?.message?.content || '';

    // Parse chips from the response (line starting with CHIPS:)
    let text = fullResponse;
    let chips = ['Browse products', 'Track my order', 'Contact support'];

    const chipsMatch = fullResponse.match(/CHIPS:\s*(.+)$/m);
    if (chipsMatch) {
      chips = chipsMatch[1].split('|').map(s => s.trim());
      text = fullResponse.replace(/\nCHIPS:.*$/m, '');
    }

    return { text: text.trim(), chips };
  } catch (err) {
    console.error('Nia AI error:', err);
    return fallbackResponse(userText);
  }
}

// ── Fallback keyword-based response (when AI is unavailable) ────
function fallbackResponse(text) {
  const lower = text.toLowerCase();

  if (lower.match(/hello|hi |hey|good morning|good evening|howdy/i)) {
    return {
      text: "Hello! 👋 I'm Nia, your Omix Store assistant. How can I help you today?",
      chips: ['Browse products', 'Track my order', 'How it works', 'Refer a friend'],
    };
  }
  if (lower.match(/refer|invite|friend|share/i)) {
    return {
      text: "Our referral program is live! 🎉\n\nShare your unique referral link (find it in your Account page under 'Refer a Friend') — when someone signs up and places their first order, you both get KES 100 off!\n\nWant me to take you to your account?",
      chips: ['Go to my account', 'Browse products', 'How it works'],
    };
  }
  if (lower.match(/point|loyalty|reward/i)) {
    return {
      text: "Loyalty Points are here! ⭐\n\nYou earn 1 point for every KES 100 you spend. 100 points = KES 50 off your next order. You can redeem points at checkout by toggling the 'Use loyalty points' option.\n\nCheck your balance in your Account page!",
      chips: ['Go to my account', 'Browse products', 'Track my order'],
    };
  }
  if (lower.match(/wishlist|heart|save|favorite/i)) {
    return {
      text: "You can save items to your Wishlist! ❤️\n\nJust tap the heart icon on any product to save it. View all your saved items at /wishlist or from the heart icon in the bottom navigation on your phone.",
      chips: ['Browse products', 'Go to wishlist', 'Go to my account'],
    };
  }
  if (lower.match(/review|rating|star/i)) {
    return {
      text: "You can leave a review after purchasing! ⭐\n\nOn any product page, scroll down to the Reviews section. Tap the stars to rate (1-5) and write your experience. Your feedback helps other shoppers!",
      chips: ['Browse products', 'Track my order', 'Contact support'],
    };
  }
  if (lower.match(/flash|sale|discount|deals?|offer/i)) {
    return {
      text: "Check out our Flash Sales for limited-time discounts! ⏱\n\nProducts with flash sales show a countdown timer and a special discounted price. Check the home page for current deals!",
      chips: ['Browse products', 'Go to home', 'Track my order'],
    };
  }
  if (lower.match(/track|order where|status|delivery/i)) {
    return {
      text: "You can track your order at /track-order or in your Account page.\n\nYou'll need your order ID (find it in your account under 'Recent Orders'). For help with a specific order, contact support with your order number.",
      chips: ['Track my order', 'Go to my account', 'Contact support'],
    };
  }
  if (lower.match(/pay|mpesa|pesa|stk|push/i)) {
    return {
      text: "We accept M-Pesa via Paystack STK Push. 💳\n\nAt checkout, enter your M-Pesa phone number (starting with 07...). You'll receive a payment prompt on your phone within 30 seconds. Enter your M-Pesa PIN to complete payment.\n\nIt's secure and instant!",
      chips: ['Browse products', 'How it works', 'Contact support'],
    };
  }
  if (lower.match(/deliver|ship|arrive|how long/i)) {
    return {
      text: "We deliver within Kericho and surrounding areas. 🚚\n\n• Kericho CBD: Same day\n• Kericho town areas: 1-2 days\n• Outside Kericho: 2-3 days\n\nDelivery is free within Kericho. For other areas, it's calculated at checkout.",
      chips: ['Browse products', 'How it works', 'Contact support'],
    };
  }
  if (lower.match(/return|refund|exchange/i)) {
    return {
      text: "Our return policy:\n\n• Electronics: 7 days if defective (with receipt)\n• Clothing: 3 days with tags and receipt\n• Furniture: No returns (inspect on delivery)\n• Shoes: 3 days if unworn\n\nContact support to start a return.",
      chips: ['Contact support', 'Browse products', 'How it works'],
    };
  }
  if (lower.match(/sell|list|post|upload|vendor/i)) {
    return {
      text: "Want to sell on Omix Store? Contact our team at omixsystems@gmail.com or call +254 768 213 649 to get started! 📦",
      chips: ['Contact support', 'Browse products', 'How it works'],
    };
  }
  if (lower.match(/browse|shop|buy|find|search|product|item/i)) {
    return {
      text: "Browse all our products on the home page! Filter by category or use the search bar to find exactly what you're looking for.\n\nWant me to take you there?",
      chips: ['Go to home', 'Search products', 'Browse categories'],
    };
  }

  return {
    text: "I'm not sure I understand that completely. Here's what I can help with:",
    chips: ['Browse products', 'Track my order', 'How it works', 'Refer a friend', 'Contact support'],
  };
}

// ── Generate greeting based on time and context ─────────────────
export function getGreeting(userName) {
  const hour = new Date().getHours();
  let timeGreeting = 'Hello';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  const name = userName ? ` ${userName}` : '';

  return {
    text: `${timeGreeting}${name}! 👋 I'm Nia, your Omix Store assistant.\n\nI can help you find products, track orders, and answer questions. I also know all about our new features — wishlist, reviews, referrals, and loyalty points!\n\nWhat would you like to do?`,
    chips: ['Browse products', 'Track my order', 'How it works', 'Refer a friend'],
  };
}
