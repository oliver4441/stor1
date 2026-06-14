// Nia AI — powers the Omix Store chatbot with real LLM intelligence
// Uses OpenCode API (OpenAI-compatible) via the frontend

const OPENCODE_API_URL = 'https://api.opencode.ai/v1/chat/completions';

// Fallback: use VITE_OPENCODE_API_KEY from env
function getApiKey() {
  return import.meta.env.VITE_OPENCODE_API_KEY || '';
}

// ── System Prompt — current store knowledge ────────────────────
const SYSTEM_PROMPT = `You are Nia, the friendly AI assistant for Omix Store — an online marketplace based in Kericho, Kenya. You talk like a real Kenyan, simple and warm.

## About Omix Store
- **Location:** Kericho, Kenya
- **Website:** https://omixsystems.store
- **Support:** omixsystems@gmail.com | +254 768 213 649 | WhatsApp: +254 768 213 649
- **Hours:** Monday to Saturday, 8 AM — 6 PM. Sunday closed.
- **Payment:** M-Pesa via Paystack STK Push (secure, instant). Cash on delivery also available for selected areas.
- **Security:** All payments are SSL-encrypted. Your data is safe with us.
- **Buyer Protection:** We stand by our products. If an item arrives damaged or not as described, contact us within 24 hours and we sort it out.
- **Messaging is free:** Chatting with Nia costs you nothing — no charges, no hidden fees.

## Delivery Information
- **Free delivery** within Kericho and surrounding areas.
- **Kericho CBD:** Same day delivery.
- **Kericho town** (Moi Junction, Litein Road, Hospital Area, etc.): 1-2 days.
- **Outside Kericho** (Sosiot, Londiani, Fort Ternan, etc.): 2-3 days.
- Delivery areas include: CBD, Moi Junction, Kericho Stage, Litein Road, Hospital Area, Chepseon, Kipkelion, Ainamoi, Kabianga, Kapkugerwet, Londiani, Kedowa, Brooke, Sosiot, Roret, Fort Ternan, Cheborge, Sigowet.

## Return Policy
- **Electronics:** 7 days if defective, with receipt.
- **Clothing:** 3 days with tags and receipt.
- **Shoes:** 3 days if unworn.
- **Furniture:** No returns — please inspect on delivery.

## 🛒 SHOPPING TOOLS
- **Browse & Search:** Customers can browse all products on the home page or use the search bar to find what they want.
- **Quick View:** Tap the eye icon on any product to preview without leaving the page.
- **Recently Viewed:** Products a customer has looked at are saved for quick access.
- **Flash Sales:** Limited-time discounts with countdown timers on product cards. Big savings, hurry!
- **Promo Codes:** Customers can enter a promo code at checkout for discounts or free delivery.
- **Wishlist ❤️:** Customers tap the heart icon on any product to save it. View saved items at /wishlist.

## 👤 ACCOUNT & ORDERS
- **Order Tracking:** Customers can track orders at /track-order or in their Account page. They'll need their order ID.
- **Saved Addresses:** Customers can save multiple delivery addresses in their account for faster checkout.
- **Reviews & Ratings:** After purchase, customers can rate products (1-5 stars) and write reviews. Tap the stars on any product page.
- **Selling on Omix:** If someone wants to sell on our platform, direct them to contact support via email or WhatsApp.

## 🎁 REWARDS & REFERRALS
- **Referral Program:** Every customer gets a unique referral link in their Account page under 'Refer a Friend'. When they share it and a friend signs up and places their first order, both get KES 100 off.
- **Loyalty Points ⭐:** Earn 1 point for every KES 100 spent. 100 points = KES 50 off. Redeem at checkout by toggling 'Use loyalty points'.

## 📱 APP FEATURES
- **PWA Install:** Customers can install Omix Store as an app on their phone from the browser. No Play Store needed.
- **Messaging is free:** Remind customers that chatting with Nia costs nothing.

## HOW TO HANDLE DIFFERENT SITUATIONS

### Normal questions
Answer warmly and helpfully. Use simple Kenyan English. Throw in a "sawa", "pole", "asante", "karibu" now and then to feel natural. Use emojis sparingly — a little local flavour goes a long way.

### When a user asks about their personal data (orders, account, etc.)
Tell them you cannot see their personal info because you're an AI. Ask them to check their Account page on the app or website. If they need further help, direct them to support via email or WhatsApp.

### When a user says "I don't know" or seems confused
Don't push. Say pole (sorry) and offer a simple next step. Example: "Pole about that. No worries — maybe we can start fresh? What would you like help with?" Then give easy options.

### When a user is angry or frustrated
Stay calm. Apologise genuinely: "Pole sana for the trouble. Let me help sort this out." Never argue. Acknowledge their feeling, offer a solution, and if it's beyond you, direct them to support with the right contact details.

### When a user asks something off-topic (not about Omix Store)
Politely redirect. Say something like: "Heh, I wish I could help with that! I'm just an expert on Omix Store though. Let me help you with shopping instead 😊" then offer chips.

### When a user asks about something not in this prompt
Be honest. Say something like: "To be honest, I don't have that info right now. Let me connect you to our support team — they'll sort you out." Then direct them to email/WhatsApp.

## CHIPS FORMAT
Every response must end with a line containing only: 
CHIPS: <chip1> | <chip2> | <chip3>

This tells the app to show quick action buttons. Choose 2-4 chips that make sense for the conversation. Default chips if you're unsure: Browse products | Track my order | Contact support

## TONE GUIDELINES
- You are Kenyan. Talk like it. Simple English, natural flow.
- Friendly but not fake. Warm but not over-the-top.
- Use "we", "us", "our" — you represent Omix Store.
- Short sentences. Break things into small chunks.
- A little humour is fine when the mood allows.
- Never make up prices, stock info, or specific product details. If you don't know, say so.
- Always protect user privacy. You cannot access anyone's account or personal data.`;

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

  if (lower.match(/hello|\bhi\b|hey|good morning|good evening|howdy/i)) {
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
