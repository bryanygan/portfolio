const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map();

// Configurable constants
const CONFIG = {
  EXP_MONTH: '09',
  EXP_YEAR: '30',
  ZIP_CODE: '07724',
  AUTHORIZED_USER_ID: '745694160002089130' // Mock authorized user
};

function isRateLimited(ip) {
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { count: 1, start: now };
    rateLimitStore.set(ip, record);
    return false;
  }
  if (now - record.start > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.start = now;
    return false;
  }
  record.count += 1;
  return record.count > RATE_LIMIT_MAX_REQUESTS;
}

// Simple mock authorization
function isAuthorized(userId) {
  // In simulation, we'll allow a specific user ID or if no auth is provided (for testing)
  return !userId || userId === CONFIG.AUTHORIZED_USER_ID;
}

// This makes this specific route server-rendered
export const prerender = false;

export async function POST({ request }) {
  try {
    const { command, params = {}, pools, userId } = await request.json();

    // Parse command
    const commandParts = command.trim().split(' ');
    const commandName = commandParts[0].toLowerCase();

    let response = '';
    let embed = null;
    let updatedPools = null;

    // Handle button interactions first
    if (commandName === 'z_confirm' || commandName === 'z_cancel') {
      ({ response, embed } = handleZButtonClick(commandName, params, userId));
    } else {
      switch (commandName) {
        case '/fusion_assist':
        ({ response, embed, updatedPools } = await handleFusionAssist(params, pools));
        break;

      case '/fusion_order':
        ({ response, embed, updatedPools } = await handleFusionOrder(params, pools));
        break;

      case '/wool_order':
        ({ response, embed, updatedPools } = await handleWoolOrder(params, pools));
        break;

      case '/wool_details':
        ({ response, embed } = handleWoolDetails());
        break;

      case '/pump_order':
        ({ response, embed, updatedPools } = await handlePumpOrder(params, pools, userId));
        break;

      case '/reorder':
        ({ response, embed } = handleReorder(params, userId));
        break;

      case '/z':
        ({ response, embed } = handleZCommand(params, userId));
        break;

      case '/vcc':
        ({ response, embed, updatedPools } = handleVcc(params, pools, userId));
        break;

      case '/payments':
        ({ response, embed } = handlePayments());
        break;

      case '/add_card':
        ({ response, updatedPools } = handleAddCard(params, pools, userId));
        break;

      case '/add_email':
        ({ response, updatedPools } = handleAddEmail(params, pools, userId));
        break;

      case '/open':
      case '/close':
      case '/break':
        ({ response, embed } = handleChannelStatus(commandName));
        break;

      case '/help':
        ({ response, embed } = handleHelp());
        break;

      default:
        response = `❌ Unknown command: ${commandName}\n\nAvailable commands:\n• \`/fusion_assist\`\n• \`/fusion_order\`\n• \`/wool_order\`\n• \`/pump_order\`\n• \`/reorder\`\n• \`/z\`\n• \`/vcc\`\n• \`/payments\`\n• \`/add_card\`\n• \`/add_email\`\n• \`/open\`\n• \`/close\`\n• \`/break\`\n• \`/help\``;
      }
    }

    return new Response(JSON.stringify({
      response,
      embed,
      updatedPools
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bot simulation error:', error);
    return new Response(JSON.stringify({
      response: '❌ Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions
function normalizeEmailPools(pools) {
  // Ensure pools structure exists
  if (!pools) {
    pools = { cards: [], emails: {} };
  }

  // Ensure cards array exists
  if (!pools.cards) {
    pools.cards = [];
  }

  // Ensure emails structure includes multiple email pools
  if (!pools.emails || Array.isArray(pools.emails)) {
    const oldEmails = Array.isArray(pools.emails) ? pools.emails : [];
    pools.emails = {
      main: oldEmails,
      pump_20off25: [],
      pump_25off: []
    };
  }

  // Ensure all email pool arrays exist
  if (!pools.emails.main) pools.emails.main = [];
  if (!pools.emails.pump_20off25) pools.emails.pump_20off25 = [];
  if (!pools.emails.pump_25off) pools.emails.pump_25off = [];

  return pools;
}

// Mock order data for simulation (can be overridden later)
const getMockOrderData = () => ({
  link: 'https://ubereats.com/cart/12345',
  name: 'John Doe',
  addr2: 'Apt 4B',
  notes: 'Leave at door',
  tip: '5.00'
});

// Helper functions for formatting
function formatNameCsv(name) {
  const cleaned = name.replace(',', ' ').trim();
  const parts = cleaned.split(' ');
  if (parts.length >= 2) {
    const first = parts[0].trim();
    const last = parts[1].trim();
    return `${first},${last}`;
  }
  if (parts.length === 1) {
    const w = parts[0].trim();
    return `${w},${w[0]}`;
  }
  return '';
}

function isValidField(value) {
  return Boolean(value && value.trim().toLowerCase() !== 'n/a' && value.trim().toLowerCase() !== 'none');
}

function cleanTipAmount(tipStr) {
  if (!tipStr) return "";
  const matches = tipStr.match(/[\d.]+/g);
  if (matches) {
    const cleaned = matches.join('');
    try {
      parseFloat(cleaned);
      return cleaned;
    } catch {
      return "";
    }
  }
  return "";
}

// Command handlers
async function handleFusionAssist(params, pools) {
  pools = normalizeEmailPools(pools);

  if (pools.cards.length === 0) {
    return {
      response: '❌ Card pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }

  // Simulate card consumption
  const card = pools.cards[0];
  const [cardNumber, cvv] = card.split(',');
  const updatedPools = {
    ...pools,
    cards: pools.cards.slice(1)
  };

  const orderData = getMockOrderData();
  const mode = params.mode || 'ubereats';

  const command = `${orderData.link},${cardNumber},${CONFIG.EXP_MONTH},${CONFIG.EXP_YEAR},${cvv},${CONFIG.ZIP_CODE}${params.email ? `,${params.email}` : ''}`;

  const embed = {
    title: 'Fusion Assist',
    color: '#00ff00',
    fields: [
      { name: 'Command', value: `\`\`\`/assist order order_details:${command} mode:${mode}\`\`\`` },
      { name: 'Email used', value: params.email || 'None' },
      { name: 'Tip', value: `$${orderData.tip}` }
    ],
    footer: updatedPools.cards.length === 0 ? '⚠️ Card pool empty!' : null
  };

  return {
    response: '✅ Fusion assist command generated!',
    embed,
    updatedPools
  };
}

async function handleFusionOrder(params, pools) {
  pools = normalizeEmailPools(pools);

  if (pools.cards.length === 0) {
    return {
      response: '❌ Card pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }

  const mainEmails = pools.emails.main || [];
  if (mainEmails.length === 0 && !params.custom_email) {
    return {
      response: '❌ Email pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }

  // Simulate resource consumption
  const card = pools.cards[0];
  const [cardNumber, cvv] = card.split(',');

  let email = params.custom_email;
  let updatedPools = {
    ...pools,
    cards: pools.cards.slice(1)
  };

  if (!email) {
    email = mainEmails[0];
    updatedPools.emails.main = mainEmails.slice(1);
  }

  const orderData = getMockOrderData();
  const command = `${orderData.link},${cardNumber},${CONFIG.EXP_MONTH},${CONFIG.EXP_YEAR},${cvv},${CONFIG.ZIP_CODE},${email}`;

  const embed = {
    title: 'Fusion Order',
    color: '#0099ff',
    fields: [
      { name: 'Command', value: `\`\`\`/order uber order_details:${command}\`\`\`` },
      { name: 'Email used', value: email },
      { name: 'Tip', value: `$${orderData.tip}` }
    ],
    footer: getPoolWarnings(updatedPools)
  };

  return {
    response: '✅ Fusion order command generated!',
    embed,
    updatedPools
  };
}

async function handleWoolOrder(params, pools) {
  pools = normalizeEmailPools(pools);

  if (pools.cards.length === 0) {
    return {
      response: '❌ Card pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }

  const mainEmails = pools.emails.main || [];
  if (mainEmails.length === 0 && !params.custom_email) {
    return {
      response: '❌ Email pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }

  // Simulate resource consumption
  const card = pools.cards[0];
  const [cardNumber, cvv] = card.split(',');

  let email = params.custom_email;
  let updatedPools = {
    ...pools,
    cards: pools.cards.slice(1)
  };

  if (!email) {
    email = mainEmails[0];
    updatedPools.emails.main = mainEmails.slice(1);
  }

  const orderData = getMockOrderData();
  const command = `${orderData.link},${cardNumber},${CONFIG.EXP_MONTH}/${CONFIG.EXP_YEAR},${cvv},${CONFIG.ZIP_CODE},${email}`;

  const embed = {
    title: 'Wool Order',
    color: '#ff6600',
    fields: [
      { name: 'Command', value: `\`\`\`${command}\`\`\`` },
      { name: 'Email used', value: email },
      { name: 'Name', value: formatNameCsv(orderData.name) },
      { name: 'Address Line 2', value: orderData.addr2 },
      { name: 'Delivery Notes', value: orderData.notes },
      { name: 'Tip', value: `$${orderData.tip}` }
    ],
    footer: getPoolWarnings(updatedPools)
  };

  return {
    response: '✅ Wool order command generated!',
    embed,
    updatedPools
  };
}

async function handlePumpOrder(params, pools, userId) {
  try {
    if (!isAuthorized(userId)) {
      return {
        response: '❌ You are not authorized.',
        embed: null,
        updatedPools: pools || { cards: [], emails: [] }
      };
    }

    // Simple fallback for pools
    if (!pools) {
      return {
        response: '❌ Pool data is missing.',
        embed: null,
        updatedPools: { cards: [], emails: [] }
      };
    }

    // Check for card availability
    if (!params.card_number && (!pools.cards || pools.cards.length === 0)) {
      return {
        response: '❌ Card pool is empty.',
        embed: null,
        updatedPools: pools
      };
    }

    // Handle card
    let cardNumber, cvv;
    let updatedPools = {
      cards: pools.cards ? [...pools.cards] : [],
      emails: pools.emails || []
    };

    if (params.card_number && params.card_cvv) {
      cardNumber = params.card_number;
      cvv = params.card_cvv;
    } else {
      const card = pools.cards[0];
      if (!card || typeof card !== 'string') {
        return {
          response: '❌ Invalid card in pool.',
          embed: null,
          updatedPools: pools
        };
      }
      const cardParts = card.split(',');
      if (cardParts.length < 2) {
        return {
          response: '❌ Invalid card format in pool.',
          embed: null,
          updatedPools: pools
        };
      }
      cardNumber = cardParts[0];
      cvv = cardParts[1];
      updatedPools.cards = pools.cards.slice(1);
    }

    // Simple email handling - use custom email or mock email
    let email;
    if (params.custom_email) {
      email = params.custom_email;
    } else {
      // For now, use a mock email if no custom email provided
      email = 'test@pump.com';
    }

    // Generate pump order command
    const orderData = getMockOrderData();
    const command = `/qc checkout_details:${orderData.link},${cardNumber},${CONFIG.EXP_MONTH}/${CONFIG.EXP_YEAR},${cvv},${CONFIG.ZIP_CODE},${email}`;

    const embed = {
      title: 'Pump Order',
      color: '#9932cc',
      fields: [
        { name: '', value: `\`\`\`${command}\`\`\``, inline: false },
        { name: '**Email used:**', value: `\`\`\`${email} (${params.custom_email ? 'custom' : 'mock'})\`\`\``, inline: false },
        { name: 'Name:', value: `\`\`\`${formatNameCsv(orderData.name)}\`\`\``, inline: false },
        { name: 'Apt / Suite / Floor:', value: `\`\`\`${orderData.addr2}\`\`\``, inline: false },
        { name: 'Delivery Notes:', value: `\`\`\`${orderData.notes}\`\`\``, inline: false },
        { name: 'Tip:', value: `\`\`\`${cleanTipAmount(orderData.tip)}\`\`\``, inline: false }
      ],
      footer: `Cards: ${updatedPools.cards.length}`
    };

    return {
      response: '✅ Pump order command generated!',
      embed,
      updatedPools
    };
  } catch (error) {
    console.error('Error in handlePumpOrder:', error);
    return {
      response: '❌ Internal error processing pump order.',
      embed: null,
      updatedPools: pools || { cards: [], emails: [] }
    };
  }
}

function handleReorder(params, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null
    };
  }

  if (!params.email) {
    return {
      response: '❌ Email parameter is required for reorder command.',
      embed: null
    };
  }

  const orderData = getMockOrderData();

  // Build the reorder command
  const parts = [`/reorder uber order_details:${orderData.link},${params.email}`];

  // Add name override if valid
  if (isValidField(orderData.name)) {
    const normalizedName = orderData.name.replace(',', ' ').trim();
    parts.push(`override_name:${normalizedName}`);
  }

  // Add apt/suite/floor override if valid
  if (isValidField(orderData.addr2)) {
    parts.push(`override_aptorsuite:${orderData.addr2}`);
  }

  // Handle delivery notes and dropoff preference
  if (isValidField(orderData.notes)) {
    parts.push(`override_notes:${orderData.notes}`);
    // If notes contain "leave", also set dropoff preference
    if (orderData.notes.toLowerCase().includes('leave')) {
      parts.push('override_dropoff:Leave at Door');
    }
  }

  // Add tip override if present
  const tipAmount = cleanTipAmount(orderData.tip);
  if (tipAmount) {
    parts.push(`override_tip:${tipAmount}`);
  }

  const command = parts.join(' ');

  const embed = {
    title: 'Reorder Command',
    color: '#FF1493',
    fields: [
      { name: '', value: `\`\`\`${command}\`\`\``, inline: false },
      { name: '**Email used:**', value: `\`\`\`${params.email}\`\`\``, inline: false }
    ]
  };

  return {
    response: '✅ Reorder command generated!',
    embed
  };
}

function handleZButtonClick(action, params, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null
    };
  }

  if (action === 'z_confirm') {
    // Parse values from stored order data
    const subtotal = 20.70;
    const deliveryFee = 0.00;
    const taxesFees = 1.97;
    const originalTotal = subtotal + deliveryFee + taxesFees + 3.49; // 3.49 is Uber service fee
    const newTotal = 8.97; // Final calculated total

    // Cart items for display
    const cartItems = [
      '• Pumpkin Cream Cheese Muffin (x1) - $4.95',
      '• Mango Dragonfruit Lemonade Refresher (x1) - $8.60',
      '• Caffè Mocha (x1) - $7.15'
    ];

    const breakdownEmbed = {
      title: 'Order Breakdown:',
      color: '#00ff00',
      description: `**Cart Items:**\n${cartItems.join('\n')}\n\n` +
                  `Your original total + taxes + Uber fees: $${originalTotal.toFixed(2)}\n\n` +
                  `Promo Discount + Service Fee successfully applied!\n\n` +
                  `Tip amount: $0.00\n\n` +
                  `**Your new total: $${newTotal.toFixed(2)}**`
    };

    return {
      response: '✅ Order confirmed and processed!',
      embed: breakdownEmbed
    };
  }

  if (action === 'z_cancel') {
    return {
      response: '❌ Order cancelled.',
      embed: null
    };
  }
}

function handleZCommand(params, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null
    };
  }

  // Check if this is a confirmation action
  if (params.action === 'confirm' && params.confirmationData) {
    // User confirmed - return the breakdown embed
    const breakdownEmbed = params.confirmationData.breakdown;

    // Also prepare payment embeds that would follow
    const paymentEmbed = {
      title: "Prin's Payments",
      description: 'Select which payment method you would like to use! (Zelle/Crypto is preferred)',
      color: '#00ff00',
      requiresButtons: true
    };

    const instructionsEmbed = {
      title: 'Payment Instructions',
      description: "When paying, **please don't add any notes.** Only **single emojis** or a **period (.)** if necessary. **Always send as Friends and Family if using PayPal, Venmo, or Zelle**. After you pay, please send a screenshot of the payment confirmation and please ping <@745694160002089130>!",
      color: '#00ff00'
    };

    return {
      response: '✅ Order confirmed and processed!',
      embed: breakdownEmbed,
      additionalData: {
        followUpEmbeds: [paymentEmbed, instructionsEmbed],
        publicMessage: true
      }
    };
  }

  if (params.action === 'cancel') {
    // User cancelled
    return {
      response: '❌ Order cancelled.',
      embed: null
    };
  }

  // Parse values from order text (using mock data)
  const subtotal = 20.70;
  const deliveryFee = 0.00;
  const taxesFees = 1.97;
  const promotion = -20.70;
  const tipAmount = params.tip || 0.00;

  // Calculate totals
  const originalTotal = subtotal + deliveryFee + taxesFees + 3.49; // 3.49 is Uber service fee

  // Service fee calculation
  const isVip = params.vip === true;
  const serviceFee = params.service_fee ? parseFloat(params.service_fee) : (isVip ? 6.00 : 7.00);

  // Final total after promo and service fee
  const finalTotal = subtotal + promotion + deliveryFee + taxesFees + tipAmount;
  const newTotal = finalTotal + serviceFee;

  // Extract cart items for display
  const cartItems = [
    '• Pumpkin Cream Cheese Muffin (x1) - $4.95',
    '• Mango Dragonfruit Lemonade Refresher (x1) - $8.60',
    '• Caffè Mocha (x1) - $7.15'
  ];

  // Create confirmation embed with buttons
  const confirmEmbed = {
    title: '📋 Order Confirmation Required',
    color: '#0099ff',
    description: `**Order Total: $${originalTotal.toFixed(2)}**\n\n` +
                `Subtotal: $${subtotal.toFixed(2)}\n` +
                `Delivery Fee: $${deliveryFee.toFixed(2)}\n` +
                `Taxes & Fees: $${taxesFees.toFixed(2)}\n\n` +
                `**After Promo & Service Fee Applied:**\n` +
                `Tip Amount: $${tipAmount.toFixed(2)}\n` +
                `Service Fee: $${serviceFee.toFixed(2)}\n` +
                `**Your New Total: $${newTotal.toFixed(2)}**\n\n` +
                `Please review the order details and confirm to proceed.`,
    buttons: [
      {
        label: '✅ Confirm Order',
        style: 'success',
        action: 'z_confirm'
      },
      {
        label: '❌ Cancel',
        style: 'danger',
        action: 'z_cancel'
      }
    ]
  };

  // Prepare breakdown embed (will be shown after confirmation)
  const breakdownEmbed = {
    title: 'Order Breakdown:',
    color: '#00ff00',
    description: `**Cart Items:**\n${cartItems.join('\n')}\n\n` +
                `Your original total + taxes + Uber fees: $${originalTotal.toFixed(2)}\n\n` +
                `Promo Discount + Service Fee successfully applied!\n\n` +
                `Tip amount: $${tipAmount.toFixed(2)}\n\n` +
                `**Your new total: $${newTotal.toFixed(2)}**`
  };

  return {
    response: 'Processing order...',
    embed: confirmEmbed,
    additionalData: {
      breakdown: breakdownEmbed,
      newTotal: newTotal,
      requiresConfirmation: true
    }
  };
}

function handleVcc(params, pools, userId) {
  try {
    if (!isAuthorized(userId)) {
      return {
        response: '❌ You are not authorized.',
        embed: null,
        updatedPools: pools || { cards: [], emails: [] }
      };
    }

    // Simple fallback for pools
    if (!pools || !pools.cards) {
      return {
        response: '❌ Card pool is empty.',
        embed: null,
        updatedPools: { cards: [], emails: pools?.emails || [] }
      };
    }

    if (pools.cards.length === 0) {
      return {
        response: '❌ Card pool is empty.',
        embed: null,
        updatedPools: pools
      };
    }

    // Get and remove card from pool
    const card = pools.cards[0];
    if (!card || typeof card !== 'string') {
      return {
        response: '❌ Invalid card in pool.',
        embed: null,
        updatedPools: pools
      };
    }

    const cardParts = card.split(',');
    if (cardParts.length < 2) {
      return {
        response: '❌ Invalid card format in pool.',
        embed: null,
        updatedPools: pools
      };
    }

    const [number, cvv] = cardParts;

    // Simple pool update
    const updatedPools = {
      cards: pools.cards.slice(1),
      emails: pools.emails || []
    };

    // Format the card information
    const cardFormat = `${number},${CONFIG.EXP_MONTH}/${CONFIG.EXP_YEAR},${cvv},${CONFIG.ZIP_CODE}`;

    return {
      response: `\`\`\`${cardFormat}\`\`\``,
      embed: null,
      updatedPools
    };
  } catch (error) {
    console.error('VCC Error:', error);
    return {
      response: '❌ Error processing VCC command.',
      embed: null,
      updatedPools: pools || { cards: [], emails: [] }
    };
  }
}

function handlePayments() {
  const embed = {
    title: "Prin's Payments",
    description: 'Select which payment method you would like to use! (Zelle/Crypto is preferred)',
    color: '#9932cc',
    fields: [
      { name: '🏦 Zelle', value: 'Email: `ganbryanbts@gmail.com`\nName: **Bryan Gan**' },
      { name: '💙 Venmo', value: 'Username: `@BGHype`\nFriends & Family, single emoji note only\nLast 4: **0054**' },
      { name: '💚 PayPal', value: 'Email: `ganbryanbts@gmail.com`\nFriends & Family, no notes' },
      { name: '💵 CashApp', value: 'CashTag: `$bygan`\nMust be from balance, single emoji note only' },
      { name: '🪙 Crypto', value: 'Available: ETH, LTC, SOL, BTC, USDT, USDC\nMessage for wallet addresses' }
    ]
  };

  return {
    response: '💳 Payment methods displayed!',
    embed
  };
}

function handleAddCard(params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      updatedPools: pools
    };
  }

  if (!params.number || !params.cvv) {
    return {
      response: '❌ Please provide both card number and CVV.',
      updatedPools: pools
    };
  }

  const newCard = `${params.number},${params.cvv}`;
  const updatedPools = {
    ...pools,
    cards: [...pools.cards, newCard]
  };

  return {
    response: `✅ Card ending in ${params.number.slice(-4)} added to pool.`,
    updatedPools
  };
}

function handleAddEmail(params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      updatedPools: pools
    };
  }

  pools = normalizeEmailPools(pools);

  if (!params.email) {
    return {
      response: '❌ Please provide an email address.',
      updatedPools: pools
    };
  }

  // Determine which pool to add to
  const poolType = params.pool || 'main';
  const validPools = ['main', 'pump_20off25', 'pump_25off'];

  if (!validPools.includes(poolType)) {
    return {
      response: `❌ Invalid pool type. Valid pools: ${validPools.join(', ')}`,
      updatedPools: pools
    };
  }

  const updatedPools = { ...pools };
  const targetPool = updatedPools.emails[poolType];

  // Add to top or bottom based on params.top
  if (params.top) {
    updatedPools.emails[poolType] = [params.email, ...targetPool];
  } else {
    updatedPools.emails[poolType] = [...targetPool, params.email];
  }

  return {
    response: `✅ Email \`${params.email}\` added to ${poolType} pool.`,
    updatedPools
  };
}

function handleChannelStatus(command) {
  if (command === '/open') {
    const embed = {
      title: 'ZR Eats is now OPEN!',
      description: 'We are now accepting orders! Click the order button to place an order.',
      color: '#00ff00'
    };
    return {
      response: '✅ Channel opened 🟢🟢',
      embed
    };
  } else if (command === '/close') {
    const embed = {
      title: 'ZR Eats is now CLOSED!',
      description: 'We are currently closed. Please come back later when we\'re open for new orders!',
      color: '#ff0000'
    };
    return {
      response: '✅ Channel closed 🔴🔴',
      embed
    };
  } else if (command === '/break') {
    const embed = {
      title: 'ZR Eats is on BREAK!',
      description: 'We are temporarily on hold. Please wait for us to reopen.',
      color: '#ffa500'
    };
    return {
      response: '✅ Channel put on hold 🟡🟡',
      embed
    };
  }
}

function getPoolWarnings(pools) {
  pools = normalizeEmailPools(pools);
  const warnings = [];

  if (pools.cards.length === 0) warnings.push('⚠️ Card pool empty!');

  // Check all email pools
  const allEmailsEmpty = Object.values(pools.emails).every(pool => pool.length === 0);
  if (allEmailsEmpty) warnings.push('⚠️ All email pools empty!');

  return warnings.length > 0 ? warnings.join(' | ') : null;
}

function handleHelp() {
  const embed = {
    title: 'ZR Eats Bot Commands',
    description: 'Here are all the available commands you can use:',
    color: '#4169E1',
    fields: [
      {
        name: '🍔 Order Commands',
        value: '```\n/fusion_assist mode:UberEats\n/fusion_order\n/wool_order\n/pump_order pool:pump_20off25\n/reorder email:test@example.com\n/z order_text:"paste order here"\n/vcc\n```\nGenerate order commands with pool resources'
      },
      {
        name: '💳 Payment Commands',
        value: '```\n/payments\n```\nDisplay available payment methods'
      },
      {
        name: '⚙️ Admin Commands',
        value: '```\n/add_card number:1234... cvv:123\n/add_email email:test@example.com pool:main\n/open\n/close\n/break\n```\nManage pools and channel status'
      },
      {
        name: '📝 Examples',
        value: 'Try these commands:\n• `/payments` - See payment options\n• `/pump_order` - Generate pump order\n• `/vcc` - Pull a card from pool\n• `/z` - Parse order text\n• `/reorder email:test@example.com` - Generate reorder\n• `/help` - Show this help message'
      }
    ],
    footer: 'Commands are case-sensitive. Use exactly as shown above.'
  };

  return {
    response: '📋 Command help displayed!',
    embed
  };
}

function handleWoolDetails() {
  const embed = {
    title: 'Wool Order Details',
    color: '#ff6600',
    fields: [
      {
        name: 'Group Cart Link:',
        value: '```\nhttps://eats.uber.com/group-orders/s7dhi1-3e6f-4c0f-9699-c032b1kj75/join?source=quickActionCopy\n```'
      },
      {
        name: 'Name:',
        value: '```\nLebron,James\n```'
      },
      {
        name: 'Address Line 2:',
        value: '```\nCrypto.com Arena\n```'
      },
      {
        name: 'Delivery Notes:',
        value: '```\nMeet at Door\n```'
      },
      {
        name: 'Tip:',
        value: '$7'
      }
    ]
  };

  return {
    response: '📋 Wool order details parsed and displayed!',
    embed
  };
}