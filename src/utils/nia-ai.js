// Nia AI — upgraded with product awareness, user context, Swahili support

const API_URL = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';
const OMIX_API_KEY = import.meta.env.VITE_OMIX_API_KEY || '';

// ── Build message array for the API ─────────────────────────────
function buildMessages(conversationHistory, userText) {
  const messages = [];

  // Add recent history (last 10 exchanges)
  const recent = conversationHistory.slice(-20);
  for (const msg of recent) {
    if (msg.sender === 'user') {
      messages.push({ role: 'user', content: msg.text });
    } else if (msg.sender === 'nia' && !msg.isChipResponse) {
      const cleanText = msg.text.replace(/\nCHIPS:.*$/, '');
      messages.push({ role: 'assistant', content: cleanText });
    }
  }

  messages.push({ role: 'user', content: userText });
  return messages;
}

// ── Call the backend Nia proxy ──────────────────────────────────
export async function niaChat(conversationHistory, userText, userId = '') {
  try {
    const messages = buildMessages(conversationHistory, userText);

    const res = await fetch(`${API_URL}/api/nia/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': OMIX_API_KEY,
      },
      body: JSON.stringify({ messages, userId }),
    });

    if (!res.ok) {
      console.warn('Nia API error:', res.status);
      return fallbackResponse(userText);
    }

    const data = await res.json();
    const fullResponse = data.content || '';

    if (!fullResponse) {
      return fallbackResponse(userText);
    }

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

  // Swahili greetings
  if (lower.match(/jambo|habari|habari ya|mambo|shikamoo|niko/i)) {
    return {
      text: "Habari! Mimi ni Nia, msaidizi wako wa Omix Store. Naweza kukusaidia nini leo? 😊",
      chips: ['Ona bidhaa', 'Fuatilia oda', 'Jinsi inavyofanya kazi', 'Wasiliana nasi'],
    };
  }

  // English greetings
  if (lower.match(/hello|\bhi\b|hey|good morning|good evening|howdy|what'?s up/i)) {
    return {
      text: "Hello! I'm Nia, your Omix Store assistant. How can I help you today?",
      chips: ['Browse products', 'Track my order', 'How it works', 'Refer a friend'],
    };
  }

  // Swahili product queries
  if (lower.match(/bei|ghama|nunua|leta|naomba|nataka.*bidhaa|bidhaa.*gani| Electronics|vatovu|simu|nguo/i)) {
    return {
      text: "Unaweza kutafuta bidhaa kwenye ukurasa wa nyumbani! Tumia kijaribio au chagua kwa aghamu. Nikusaidie na bidhaa maalum? 😊",
      chips: ['Browse products', 'Electronics', 'Clothing', 'Contact support'],
    };
  }

  // Swahili order queries
  if (lower.match(/oda|fuatilia|order|imefika wapi|delivery|usafirishaji/i)) {
    return {
      text: "Unaweza kufuatilia oda yako kwenye ukurasa wa 'Track Order' au kwenye Account yako. Unahitaji msaada zaidi?",
      chips: ['Track my order', 'Contact support', 'Browse products'],
    };
  }

  if (lower.match(/refer|invite|friend|share/i)) {
    return {
      text: "Our referral program is live!\n\nShare your unique referral link (find it in your Account page under 'Refer a Friend') — when someone signs up and places their first order, you both get KES 100 off!",
      chips: ['Go to my account', 'Browse products', 'How it works'],
    };
  }
  if (lower.match(/point|loyalty|reward/i)) {
    return {
      text: "Loyalty Points are here!\n\nYou earn 1 point for every KES 100 you spend. 100 points = KES 50 off your next order. Redeem at checkout.\n\nCheck your balance in your Account page!",
      chips: ['Go to my account', 'Browse products', 'Track my order'],
    };
  }
  if (lower.match(/wishlist|heart|save|favorite/i)) {
    return {
      text: "You can save items to your Wishlist!\n\nJust tap the heart icon on any product to save it. View all your saved items at /wishlist.",
      chips: ['Browse products', 'Go to wishlist', 'Go to my account'],
    };
  }
  if (lower.match(/track|order where|status|delivery/i)) {
    return {
      text: "You can track your order at /track-order or in your Account page.\n\nYou'll need your order ID. For help with a specific order, contact support with your order number.",
      chips: ['Track my order', 'Go to my account', 'Contact support'],
    };
  }
  if (lower.match(/pay|mpesa|pesa|stk|push/i)) {
    return {
      text: "We accept M-Pesa via Paystack STK Push.\n\nAt checkout, enter your M-Pesa phone number (starting with 07...). You'll receive a payment prompt on your phone within 30 seconds. Enter your M-Pesa PIN to complete payment.\n\nIt's secure and instant!",
      chips: ['Browse products', 'How it works', 'Contact support'],
    };
  }
  if (lower.match(/deliver|ship|arrive|how long/i)) {
    return {
      text: "We deliver within Kericho and surrounding areas.\n\n- Kericho CBD: Same day\n- Kericho town areas: 1-2 days\n- Outside Kericho: 2-3 days\n\nDelivery is free within Kericho.",
      chips: ['Browse products', 'How it works', 'Contact support'],
    };
  }
  if (lower.match(/return|refund|exchange/i)) {
    return {
      text: "Our return policy:\n\n- Electronics: 7 days if defective (with receipt)\n- Clothing: 3 days with tags and receipt\n- Furniture: No returns (inspect on delivery)\n- Shoes: 3 days if unworn\n\nContact support to start a return.",
      chips: ['Contact support', 'Browse products', 'How it works'],
    };
  }
  if (lower.match(/sell|list|post|upload|vendor/i)) {
    return {
      text: "Want to sell on Omix Store? Contact our team at omixsystems@gmail.com or call +254 768 213 649 to get started!",
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
    chips: ['Browse products', 'Track my order', 'How it works', 'Contact support'],
  };
}

// ── Generate greeting based on time and context ─────────────────
export function getGreeting(userName) {
  const hour = new Date().getHours();
  let timeGreeting = 'Hello';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  const name = userName ? `, ${userName.split(' ')[0]}` : '';

  return {
    text: `${timeGreeting}${name}! I'm Nia, your Omix Store assistant. 👋\n\nI can help you find products, track orders, answer payments & delivery questions, and more!\n\nWhat would you like to do?`,
    chips: ['Browse products', 'Track my order', 'How it works', 'Refer a friend'],
  };
}

// ── Generate Swahili greeting ───────────────────────────────────
export function getSwahiliGreeting(userName) {
  const hour = new Date().getHours();
  let timeGreeting = 'Habari';
  if (hour < 12) timeGreeting = 'Habari za asubuhi';
  else if (hour < 17) timeGreeting = 'Habari za mchana';
  else timeGreeting = 'Habari za jioni';

  const name = userName ? `, ${userName.split(' ')[0]}` : '';

  return {
    text: `${timeGreeting}${name}! Mimi ni Nia, msaidizi wako wa Omix Store. 👢\n\nNaweza kukusaidia kutafuta bidhaa, kufuatilia oda, na kujua bei, malipo na usafirishaji!\n\nUngependa kufanya nini leo?`,
    chips: ['Ona bidhaa', 'Fuatilia oda', 'Jinsi inavyofanya kazi', 'Wasiliana nasi'],
  };
}
