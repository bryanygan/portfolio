// ===== RATE LIMITING CONFIGURATION =====
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // General requests per window
const RATE_LIMIT_BULK_WINDOW_MS = 5 * 60 * 1000; // 5 minutes for bulk operations
const RATE_LIMIT_MAX_BULK_OPERATIONS = 3; // Max bulk operations per 5 min

// Per-operation limits
const OPERATION_LIMITS = {
  BULK_CARDS_MAX: 50, // Max cards per bulk import
  BULK_EMAILS_MAX: 100, // Max emails per bulk import
  BULK_REMOVE_MAX: 50, // Max items to remove per bulk operation
};

// Rate limit stores
const rateLimitStore = new Map(); // IP-based general limits
const bulkOperationStore = new Map(); // Track bulk operations
const violationStore = new Map(); // Track repeated violations for exponential backoff

// Configurable constants
const CONFIG = {
  EXP_MONTH: '09',
  EXP_YEAR: '30',
  ZIP_CODE: '07724',
  AUTHORIZED_USER_ID: '745694160002089130' // Mock authorized user
};

// Enhanced rate limiting with violation tracking
function isRateLimited(identifier) {
  const now = Date.now();

  // Check for active penalty (exponential backoff)
  const violation = violationStore.get(identifier);
  if (violation && now < violation.penaltyUntil) {
    return {
      limited: true,
      retryAfter: Math.ceil((violation.penaltyUntil - now) / 1000),
      reason: 'Rate limit penalty active due to repeated violations'
    };
  }

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { count: 1, start: now };
    rateLimitStore.set(identifier, record);
    return { limited: false };
  }

  // Reset window if expired
  if (now - record.start > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.start = now;
    rateLimitStore.set(identifier, record);
    return { limited: false };
  }

  record.count += 1;
  rateLimitStore.set(identifier, record);

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    // Track violation for exponential backoff
    trackViolation(identifier);

    return {
      limited: true,
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.start)) / 1000),
      reason: 'Too many requests'
    };
  }

  return { limited: false };
}

// Track violations for exponential backoff
function trackViolation(identifier) {
  const now = Date.now();
  let violation = violationStore.get(identifier);

  if (!violation) {
    violation = { count: 1, firstViolation: now, penaltyUntil: 0 };
  } else {
    // Reset if last violation was more than 1 hour ago
    if (now - violation.firstViolation > 60 * 60 * 1000) {
      violation = { count: 1, firstViolation: now, penaltyUntil: 0 };
    } else {
      violation.count += 1;
    }
  }

  // Apply exponential backoff: 2^(violations-1) minutes
  const penaltyMinutes = Math.min(Math.pow(2, violation.count - 1), 60); // Cap at 60 min
  violation.penaltyUntil = now + (penaltyMinutes * 60 * 1000);

  violationStore.set(identifier, violation);
}

// Check bulk operation rate limit
function isBulkOperationLimited(identifier) {
  const now = Date.now();
  let record = bulkOperationStore.get(identifier);

  if (!record) {
    record = { count: 1, start: now };
    bulkOperationStore.set(identifier, record);
    return { limited: false };
  }

  // Reset window if expired
  if (now - record.start > RATE_LIMIT_BULK_WINDOW_MS) {
    record.count = 1;
    record.start = now;
    bulkOperationStore.set(identifier, record);
    return { limited: false };
  }

  record.count += 1;
  bulkOperationStore.set(identifier, record);

  if (record.count > RATE_LIMIT_MAX_BULK_OPERATIONS) {
    return {
      limited: true,
      retryAfter: Math.ceil((RATE_LIMIT_BULK_WINDOW_MS - (now - record.start)) / 1000),
      reason: `Too many bulk operations (max ${RATE_LIMIT_MAX_BULK_OPERATIONS} per 5 minutes)`
    };
  }

  return { limited: false };
}

// Validate operation item count limits
function validateOperationLimit(operation, count) {
  let limit;

  switch (operation) {
    case 'bulk_cards':
      limit = OPERATION_LIMITS.BULK_CARDS_MAX;
      break;
    case 'bulk_emails':
      limit = OPERATION_LIMITS.BULK_EMAILS_MAX;
      break;
    case 'bulk_remove':
      limit = OPERATION_LIMITS.BULK_REMOVE_MAX;
      break;
    default:
      return { valid: true };
  }

  if (count > limit) {
    return {
      valid: false,
      message: `Operation exceeds limit: ${count} items (max ${limit} per request)`
    };
  }

  return { valid: true };
}

// Simple mock authorization
function isAuthorized(userId) {
  // In simulation, we'll allow a specific user ID or if no auth is provided (for testing)
  return !userId || userId === CONFIG.AUTHORIZED_USER_ID;
}

// This makes this specific route server-rendered
export const prerender = false;

export async function POST({ request, clientAddress }) {
  try {
    const { command, params = {}, pools, userId } = await request.json();

    // Create identifier for rate limiting (prefer userId, fallback to IP)
    const identifier = userId || clientAddress || 'unknown';

    // Apply general rate limiting
    const rateLimit = isRateLimited(identifier);
    if (rateLimit.limited) {
      return new Response(JSON.stringify({
        response: `❌ ${rateLimit.reason}`,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter,
          message: rateLimit.reason
        }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + rateLimit.retryAfter).toString()
        }
      });
    }

    // Parse command
    const commandParts = command.trim().split(' ');
    const commandName = commandParts[0].toLowerCase();

    // Check if this is a bulk operation
    const isBulkOperation = [
      '/bulk_cards',
      '/bulk_emails_main',
      '/bulk_emails_pump20',
      '/bulk_emails_pump25',
      '/remove_bulk_cards',
      '/remove_bulk_emails'
    ].includes(commandName);

    // Apply additional bulk operation limits
    if (isBulkOperation) {
      const bulkLimit = isBulkOperationLimited(identifier);
      if (bulkLimit.limited) {
        return new Response(JSON.stringify({
          response: `❌ ${bulkLimit.reason}`,
          error: {
            type: 'BULK_OPERATION_LIMIT_EXCEEDED',
            retryAfter: bulkLimit.retryAfter,
            message: bulkLimit.reason
          }
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': bulkLimit.retryAfter.toString(),
            'X-RateLimit-Type': 'bulk-operation',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_BULK_OPERATIONS.toString()
          }
        });
      }
    }

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

      case '/bulk_cards':
        ({ response, embed, updatedPools } = handleBulkCards(params, pools, userId));
        break;

      case '/bulk_emails_main':
      case '/bulk_emails_pump20':
      case '/bulk_emails_pump25':
        ({ response, embed, updatedPools } = handleBulkEmails(commandName, params, pools, userId));
        break;

      case '/remove_bulk_cards':
        ({ response, embed, updatedPools } = handleRemoveBulkCards(params, pools, userId));
        break;

      case '/remove_bulk_emails':
        ({ response, embed, updatedPools } = handleRemoveBulkEmails(params, pools, userId));
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
    title: "Demo Payment Methods",
    description: '⚠️ DEMO ONLY - This is a simulation. All payment information is placeholder data.',
    color: '#9932cc',
    fields: [
      { name: '🏦 Zelle', value: 'Email: `contact@example.com`\nName: **Demo User**' },
      { name: '💙 Venmo', value: 'Username: `@demo-user`\nFriends & Family, single emoji note only\nLast 4: **0000**' },
      { name: '💚 PayPal', value: 'Email: `payments@example.com`\nFriends & Family, no notes' },
      { name: '💵 CashApp', value: 'CashTag: `$demouser`\nMust be from balance, single emoji note only' },
      { name: '🪙 Crypto', value: 'Available: ETH, LTC, SOL, BTC, USDT, USDC\n⚠️ Demo addresses only - do not send real funds' }
    ]
  };

  return {
    response: '💳 Payment methods displayed! (Demo data only)',
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
        value: '```\n/add_card number:1234... cvv:123\n/add_email email:test@example.com pool:main\n/bulk_cards data:"card,cvv"\n/bulk_emails_main data:"emails"\n/remove_bulk_cards data:"card,cvv"\n/open\n/close\n/break\n```\nManage pools and channel status'
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

// ===== VALIDATION FUNCTIONS =====

// Luhn algorithm for card validation
function validateCardNumber(cardNumber) {
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(cleanNumber)) {
    return { valid: false, error: 'Card number must contain only digits' };
  }

  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return { valid: false, error: 'Card number must be 13-19 digits long' };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number (failed Luhn check)' };
  }

  return { valid: true, cleanNumber };
}

function validateCVV(cvv, cardNumber) {
  const cleanCVV = cvv.replace(/\s/g, '');

  if (!/^\d+$/.test(cleanCVV)) {
    return { valid: false, error: 'CVV must contain only digits' };
  }

  // American Express cards start with 34 or 37 and have 4-digit CVV
  const isAmex = cardNumber && (cardNumber.startsWith('34') || cardNumber.startsWith('37'));
  const expectedLength = isAmex ? 4 : 3;

  if (cleanCVV.length !== expectedLength) {
    return { valid: false, error: `CVV must be ${expectedLength} digits for this card type` };
  }

  return { valid: true, cleanCVV };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail.length < 5) {
    return { valid: false, error: 'Email too short' };
  }

  if (!cleanEmail.includes('@')) {
    return { valid: false, error: 'Email must contain @' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (!parts[1].includes('.')) {
    return { valid: false, error: 'Email domain must contain a dot' };
  }

  return { valid: true, cleanEmail };
}

// ===== BULK COMMAND HANDLERS =====

function handleBulkCards(params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null,
      updatedPools: pools
    };
  }

  if (!params.file) {
    return {
      response: '❌ No file provided. Please upload a .txt or .csv file containing card data.',
      embed: null,
      updatedPools: pools
    };
  }

  const { file } = params;
  const fileName = file.name || '';
  const isCSV = fileName.toLowerCase().endsWith('.csv');
  const fileContent = file.content || '';

  let lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

  // Skip header for CSV
  if (isCSV && lines.length > 1 && lines[0].toLowerCase().includes('card')) {
    lines = lines.slice(1);
  }

  // Validate operation limit
  const limitCheck = validateOperationLimit('bulk_cards', lines.length);
  if (!limitCheck.valid) {
    return {
      response: `❌ ${limitCheck.message}`,
      embed: {
        title: 'Bulk Operation Limit Exceeded',
        color: '#ff0000',
        description: limitCheck.message,
        fields: [
          { name: 'Items in file', value: lines.length.toString(), inline: true },
          { name: 'Max allowed', value: OPERATION_LIMITS.BULK_CARDS_MAX.toString(), inline: true }
        ]
      },
      updatedPools: pools
    };
  }

  const results = {
    added: 0,
    duplicates: 0,
    invalid: [],
    total: lines.length
  };

  const updatedPools = { ...pools, cards: [...pools.cards] };

  lines.forEach((line, index) => {
    let cardNumber, cvv;

    if (isCSV) {
      // CSV format: card at column 6 (index 5), CVV at column 9 (index 8)
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      if (columns.length < 9) {
        results.invalid.push(`Line ${index + 1}: Insufficient columns in CSV`);
        return;
      }
      cardNumber = columns[5];
      cvv = columns[8];
    } else {
      // Text format: cardNumber,cvv
      const parts = line.split(',');
      if (parts.length !== 2) {
        results.invalid.push(`Line ${index + 1}: Expected format 'cardNumber,cvv'`);
        return;
      }
      cardNumber = parts[0].trim();
      cvv = parts[1].trim();
    }

    // Validate card number
    const cardValidation = validateCardNumber(cardNumber);
    if (!cardValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${cardValidation.error}`);
      return;
    }

    // Validate CVV
    const cvvValidation = validateCVV(cvv, cardValidation.cleanNumber);
    if (!cvvValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${cvvValidation.error}`);
      return;
    }

    // Check for duplicates
    const cardEntry = `${cardValidation.cleanNumber},${cvvValidation.cleanCVV}`;
    if (updatedPools.cards.includes(cardEntry)) {
      results.duplicates++;
      return;
    }

    // Add to pool
    updatedPools.cards.push(cardEntry);
    results.added++;
  });

  // Create response embed
  const embed = {
    title: '💳 Bulk Cards Import Results',
    color: results.added > 0 ? '#00ff00' : '#ff6600',
    fields: [
      { name: 'Total Processed', value: results.total.toString(), inline: true },
      { name: 'Successfully Added', value: results.added.toString(), inline: true },
      { name: 'Duplicates Skipped', value: results.duplicates.toString(), inline: true },
      { name: 'Invalid Lines', value: results.invalid.length.toString(), inline: true },
      { name: 'Cards in Pool', value: updatedPools.cards.length.toString(), inline: true }
    ]
  };

  if (results.invalid.length > 0) {
    const errorList = results.invalid.slice(0, 10).join('\n');
    const moreErrors = results.invalid.length > 10 ? `\n... and ${results.invalid.length - 10} more errors` : '';
    embed.fields.push({
      name: 'Error Details',
      value: `\`\`\`\n${errorList}${moreErrors}\`\`\``,
      inline: false
    });
  }

  const response = results.added > 0
    ? `✅ Successfully processed bulk cards import!`
    : results.invalid.length > 0
    ? `⚠️ Bulk cards import completed with errors.`
    : `❌ No valid cards found to import.`;

  return {
    response,
    embed,
    updatedPools
  };
}

function handleBulkEmails(commandName, params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null,
      updatedPools: pools
    };
  }

  if (!params.file) {
    return {
      response: '❌ No file provided. Please upload a .txt file containing email addresses.',
      embed: null,
      updatedPools: pools
    };
  }

  // Determine target pool from command name
  let targetPool;
  switch (commandName) {
    case '/bulk_emails_main':
      targetPool = 'main';
      break;
    case '/bulk_emails_pump20':
      targetPool = 'pump_20off25';
      break;
    case '/bulk_emails_pump25':
      targetPool = 'pump_25off';
      break;
    default:
      return {
        response: '❌ Invalid bulk email command.',
        embed: null,
        updatedPools: pools
      };
  }

  pools = normalizeEmailPools(pools);
  const fileContent = params.file.content || '';
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

  // Validate operation limit
  const limitCheck = validateOperationLimit('bulk_emails', lines.length);
  if (!limitCheck.valid) {
    return {
      response: `❌ ${limitCheck.message}`,
      embed: {
        title: 'Bulk Operation Limit Exceeded',
        color: '#ff0000',
        description: limitCheck.message,
        fields: [
          { name: 'Items in file', value: lines.length.toString(), inline: true },
          { name: 'Max allowed', value: OPERATION_LIMITS.BULK_EMAILS_MAX.toString(), inline: true }
        ]
      },
      updatedPools: pools
    };
  }

  const results = {
    added: 0,
    duplicates: 0,
    invalid: [],
    total: lines.length,
    pool: targetPool
  };

  const updatedPools = {
    ...pools,
    emails: {
      ...pools.emails,
      [targetPool]: [...pools.emails[targetPool] || []]
    }
  };

  lines.forEach((line, index) => {
    const emailValidation = validateEmail(line);

    if (!emailValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${emailValidation.error}`);
      return;
    }

    // Check for duplicates
    if (updatedPools.emails[targetPool].includes(emailValidation.cleanEmail)) {
      results.duplicates++;
      return;
    }

    // Add to pool
    updatedPools.emails[targetPool].push(emailValidation.cleanEmail);
    results.added++;
  });

  // Create response embed
  const embed = {
    title: `📧 Bulk Emails Import Results (${targetPool} pool)`,
    color: results.added > 0 ? '#00ff00' : '#ff6600',
    fields: [
      { name: 'Total Processed', value: results.total.toString(), inline: true },
      { name: 'Successfully Added', value: results.added.toString(), inline: true },
      { name: 'Duplicates Skipped', value: results.duplicates.toString(), inline: true },
      { name: 'Invalid Lines', value: results.invalid.length.toString(), inline: true },
      { name: `Emails in ${targetPool} Pool`, value: updatedPools.emails[targetPool].length.toString(), inline: true }
    ]
  };

  if (results.invalid.length > 0) {
    const errorList = results.invalid.slice(0, 10).join('\n');
    const moreErrors = results.invalid.length > 10 ? `\n... and ${results.invalid.length - 10} more errors` : '';
    embed.fields.push({
      name: 'Error Details',
      value: `\`\`\`\n${errorList}${moreErrors}\`\`\``,
      inline: false
    });
  }

  const response = results.added > 0
    ? `✅ Successfully processed bulk emails import!`
    : results.invalid.length > 0
    ? `⚠️ Bulk emails import completed with errors.`
    : `❌ No valid emails found to import.`;

  return {
    response,
    embed,
    updatedPools
  };
}

function handleRemoveBulkCards(params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null,
      updatedPools: pools
    };
  }

  if (!params.file) {
    return {
      response: '❌ No file provided. Please upload a .txt file containing card data to remove.',
      embed: null,
      updatedPools: pools
    };
  }

  const fileContent = params.file.content || '';
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

  // Validate operation limit
  const limitCheck = validateOperationLimit('bulk_remove', lines.length);
  if (!limitCheck.valid) {
    return {
      response: `❌ ${limitCheck.message}`,
      embed: {
        title: 'Bulk Operation Limit Exceeded',
        color: '#ff0000',
        description: limitCheck.message,
        fields: [
          { name: 'Items in file', value: lines.length.toString(), inline: true },
          { name: 'Max allowed', value: OPERATION_LIMITS.BULK_REMOVE_MAX.toString(), inline: true }
        ]
      },
      updatedPools: pools
    };
  }

  const results = {
    removed: 0,
    notFound: 0,
    invalid: [],
    total: lines.length
  };

  const updatedPools = { ...pools, cards: [...pools.cards] };

  lines.forEach((line, index) => {
    const parts = line.split(',');
    if (parts.length !== 2) {
      results.invalid.push(`Line ${index + 1}: Expected format 'cardNumber,cvv'`);
      return;
    }

    const cardNumber = parts[0].trim();
    const cvv = parts[1].trim();

    // Validate card number
    const cardValidation = validateCardNumber(cardNumber);
    if (!cardValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${cardValidation.error}`);
      return;
    }

    // Validate CVV
    const cvvValidation = validateCVV(cvv, cardValidation.cleanNumber);
    if (!cvvValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${cvvValidation.error}`);
      return;
    }

    // Look for exact match
    const cardEntry = `${cardValidation.cleanNumber},${cvvValidation.cleanCVV}`;
    const cardIndex = updatedPools.cards.indexOf(cardEntry);

    if (cardIndex === -1) {
      results.notFound++;
      return;
    }

    // Remove from pool
    updatedPools.cards.splice(cardIndex, 1);
    results.removed++;
  });

  // Create response embed
  const embed = {
    title: '💳 Bulk Cards Removal Results',
    color: results.removed > 0 ? '#00ff00' : '#ff6600',
    fields: [
      { name: 'Total Processed', value: results.total.toString(), inline: true },
      { name: 'Successfully Removed', value: results.removed.toString(), inline: true },
      { name: 'Not Found', value: results.notFound.toString(), inline: true },
      { name: 'Invalid Lines', value: results.invalid.length.toString(), inline: true },
      { name: 'Cards Remaining', value: updatedPools.cards.length.toString(), inline: true }
    ]
  };

  if (results.invalid.length > 0) {
    const errorList = results.invalid.slice(0, 10).join('\n');
    const moreErrors = results.invalid.length > 10 ? `\n... and ${results.invalid.length - 10} more errors` : '';
    embed.fields.push({
      name: 'Error Details',
      value: `\`\`\`\n${errorList}${moreErrors}\`\`\``,
      inline: false
    });
  }

  const response = results.removed > 0
    ? `✅ Successfully processed bulk cards removal!`
    : results.invalid.length > 0
    ? `⚠️ Bulk cards removal completed with errors.`
    : `❌ No valid cards found to remove.`;

  return {
    response,
    embed,
    updatedPools
  };
}

function handleRemoveBulkEmails(params, pools, userId) {
  if (!isAuthorized(userId)) {
    return {
      response: '❌ You are not authorized.',
      embed: null,
      updatedPools: pools
    };
  }

  if (!params.file) {
    return {
      response: '❌ No file provided. Please upload a .txt file containing email addresses to remove.',
      embed: null,
      updatedPools: pools
    };
  }

  const targetPool = params.pool || 'all';
  const validPools = ['all', 'main', 'pump_20off25', 'pump_25off'];

  if (!validPools.includes(targetPool)) {
    return {
      response: `❌ Invalid pool. Must be one of: ${validPools.join(', ')}`,
      embed: null,
      updatedPools: pools
    };
  }

  pools = normalizeEmailPools(pools);
  const fileContent = params.file.content || '';
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

  // Validate operation limit
  const limitCheck = validateOperationLimit('bulk_remove', lines.length);
  if (!limitCheck.valid) {
    return {
      response: `❌ ${limitCheck.message}`,
      embed: {
        title: 'Bulk Operation Limit Exceeded',
        color: '#ff0000',
        description: limitCheck.message,
        fields: [
          { name: 'Items in file', value: lines.length.toString(), inline: true },
          { name: 'Max allowed', value: OPERATION_LIMITS.BULK_REMOVE_MAX.toString(), inline: true }
        ]
      },
      updatedPools: pools
    };
  }

  const results = {
    removed: 0,
    notFound: 0,
    invalid: [],
    total: lines.length,
    pool: targetPool
  };

  const updatedPools = {
    ...pools,
    emails: {
      main: [...pools.emails.main],
      pump_20off25: [...pools.emails.pump_20off25],
      pump_25off: [...pools.emails.pump_25off]
    }
  };

  lines.forEach((line, index) => {
    const emailValidation = validateEmail(line);

    if (!emailValidation.valid) {
      results.invalid.push(`Line ${index + 1}: ${emailValidation.error}`);
      return;
    }

    let found = false;

    if (targetPool === 'all') {
      // Remove from all pools
      Object.keys(updatedPools.emails).forEach(poolName => {
        const emailIndex = updatedPools.emails[poolName].indexOf(emailValidation.cleanEmail);
        if (emailIndex !== -1) {
          updatedPools.emails[poolName].splice(emailIndex, 1);
          found = true;
        }
      });
    } else {
      // Remove from specific pool
      const emailIndex = updatedPools.emails[targetPool].indexOf(emailValidation.cleanEmail);
      if (emailIndex !== -1) {
        updatedPools.emails[targetPool].splice(emailIndex, 1);
        found = true;
      }
    }

    if (found) {
      results.removed++;
    } else {
      results.notFound++;
    }
  });

  // Create response embed
  const embed = {
    title: `📧 Bulk Emails Removal Results (${targetPool} pool${targetPool === 'all' ? 's' : ''})`,
    color: results.removed > 0 ? '#00ff00' : '#ff6600',
    fields: [
      { name: 'Total Processed', value: results.total.toString(), inline: true },
      { name: 'Successfully Removed', value: results.removed.toString(), inline: true },
      { name: 'Not Found', value: results.notFound.toString(), inline: true },
      { name: 'Invalid Lines', value: results.invalid.length.toString(), inline: true }
    ]
  };

  // Add pool counts
  if (targetPool === 'all') {
    Object.keys(updatedPools.emails).forEach(poolName => {
      embed.fields.push({
        name: `${poolName} Pool`,
        value: updatedPools.emails[poolName].length.toString(),
        inline: true
      });
    });
  } else {
    embed.fields.push({
      name: `${targetPool} Pool Remaining`,
      value: updatedPools.emails[targetPool].length.toString(),
      inline: true
    });
  }

  if (results.invalid.length > 0) {
    const errorList = results.invalid.slice(0, 10).join('\n');
    const moreErrors = results.invalid.length > 10 ? `\n... and ${results.invalid.length - 10} more errors` : '';
    embed.fields.push({
      name: 'Error Details',
      value: `\`\`\`\n${errorList}${moreErrors}\`\`\``,
      inline: false
    });
  }

  const response = results.removed > 0
    ? `✅ Successfully processed bulk emails removal!`
    : results.invalid.length > 0
    ? `⚠️ Bulk emails removal completed with errors.`
    : `❌ No valid emails found to remove.`;

  return {
    response,
    embed,
    updatedPools
  };
}