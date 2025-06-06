// src/pages/api/bot-simulate.js
export async function POST({ request }) {
  try {
    const { command, params, pools } = await request.json();
    
    // Parse command
    const commandParts = command.trim().split(' ');
    const commandName = commandParts[0].toLowerCase();
    
    let response = '';
    let embed = null;
    let updatedPools = null;
    
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
        
      case '/payments':
        ({ response, embed } = handlePayments());
        break;
        
      case '/add_card':
        ({ response, updatedPools } = handleAddCard(params, pools));
        break;
        
      case '/add_email':
        ({ response, updatedPools } = handleAddEmail(params, pools));
        break;
        
      case '/open':
      case '/close':
        ({ response, embed } = handleChannelStatus(commandName));
        break;
        
      default:
        response = `❌ Unknown command: ${commandName}\n\nAvailable commands:\n• \`/fusion_assist\`\n• \`/fusion_order\`\n• \`/wool_order\`\n• \`/payments\`\n• \`/add_card\`\n• \`/add_email\`\n• \`/open\`\n• \`/close\``;
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

// Mock order data for simulation
const getMockOrderData = () => ({
  link: 'https://ubereats.com/cart/12345',
  name: 'John Doe',
  addr2: 'Apt 4B',
  notes: 'Leave at door',
  tip: '5.00'
});

async function handleFusionAssist(params, pools) {
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
  
  const command = `${orderData.link},${cardNumber},06,30,${cvv},19104${params.email ? `,${params.email}` : ''}`;
  
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
  if (pools.cards.length === 0) {
    return {
      response: '❌ Card pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }
  
  if (pools.emails.length === 0 && !params.custom_email) {
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
    email = pools.emails[0];
    updatedPools.emails = pools.emails.slice(1);
  }
  
  const orderData = getMockOrderData();
  const command = `${orderData.link},${cardNumber},06,30,${cvv},19104,${email}`;
  
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
  if (pools.cards.length === 0) {
    return {
      response: '❌ Card pool is empty.',
      embed: null,
      updatedPools: pools
    };
  }
  
  if (pools.emails.length === 0 && !params.custom_email) {
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
    email = pools.emails[0];
    updatedPools.emails = pools.emails.slice(1);
  }
  
  const orderData = getMockOrderData();
  const command = `${orderData.link},${cardNumber},06/30,${cvv},19104,${email}`;
  
  const embed = {
    title: 'Wool Order',
    color: '#ff6600',
    fields: [
      { name: 'Command', value: `\`\`\`${command}\`\`\`` },
      { name: 'Email used', value: email },
      { name: 'Name', value: 'John,Doe' },
      { name: 'Address Line 2', value: 'Apt 4B' },
      { name: 'Delivery Notes', value: 'Leave at door' },
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

function handlePayments() {
  const embed = {
    title: "Prin's Payments",
    description: 'Select which payment method you would like to use!',
    color: '#9932cc',
    fields: [
      { name: '🏦 Zelle', value: 'Email: `ganbryanbts@gmail.com`\nName: **Bryan Gan**' },
      { name: '💙 Venmo', value: 'Username: `@BGHype`\nFriends & Family, no notes\nLast 4: **0054**' },
      { name: '💚 PayPal', value: 'Email: `ganbryanbts@gmail.com`\nFriends & Family, no notes' },
      { name: '🪙 Crypto', value: 'Available: ETH, LTC, SOL, BTC, USDT, USDC\nMessage for wallet addresses' }
    ]
  };
  
  return {
    response: '💳 Payment methods displayed!',
    embed
  };
}

function handleAddCard(params, pools) {
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

function handleAddEmail(params, pools) {
  if (!params.email) {
    return {
      response: '❌ Please provide an email address.',
      updatedPools: pools
    };
  }
  
  const updatedPools = {
    ...pools,
    emails: params.top ? [params.email, ...pools.emails] : [...pools.emails, params.email]
  };
  
  return {
    response: `✅ Email \`${params.email}\` added to pool.`,
    updatedPools
  };
}

function handleChannelStatus(command) {
  const isOpen = command === '/open';
  const status = isOpen ? 'OPEN' : 'CLOSED';
  const emoji = isOpen ? '🟢🟢' : '🔴🔴';
  
  const embed = {
    title: `ZR Eats is now ${status}!`,
    description: isOpen 
      ? 'We are now accepting orders! Click the order button to place an order.'
      : 'We are currently closed. Please come back later when we\'re open for new orders!',
    color: isOpen ? '#00ff00' : '#ff0000'
  };
  
  return {
    response: `✅ Channel ${isOpen ? 'opened' : 'closed'} ${emoji}`,
    embed
  };
}

function getPoolWarnings(pools) {
  const warnings = [];
  if (pools.cards.length === 0) warnings.push('⚠️ Card pool empty!');
  if (pools.emails.length === 0) warnings.push('⚠️ Email pool empty!');
  return warnings.length > 0 ? warnings.join(' | ') : null;
}