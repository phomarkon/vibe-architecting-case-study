/**
 * Knowledge Base Search Tool
 * Searches a mock knowledge base for product/service information
 */

// Mock knowledge base data
const knowledgeBase = [
  {
    id: 1,
    topic: "return policy",
    content: "Our return policy allows returns within 30 days of purchase for a full refund. Items must be unused and in original packaging. Please keep your receipt for faster processing.",
    keywords: ["return", "refund", "policy", "exchange"]
  },
  {
    id: 2,
    topic: "shipping",
    content: "We offer free standard shipping on orders over $50. Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for $15. International shipping is available to select countries.",
    keywords: ["shipping", "delivery", "tracking", "international"]
  },
  {
    id: 3,
    topic: "payment methods",
    content: "We accept Visa, Mastercard, American Express, PayPal, and Apple Pay. All transactions are securely processed through our encrypted payment gateway.",
    keywords: ["payment", "credit card", "paypal", "apple pay"]
  },
  {
    id: 4,
    topic: "warranty",
    content: "All products come with a 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranty plans are available for purchase at checkout.",
    keywords: ["warranty", "guarantee", "defect", "coverage"]
  },
  {
    id: 5,
    topic: "account creation",
    content: "Creating an account is quick and free. You'll get access to order tracking, saved payment methods, and exclusive member discounts. Click 'Sign Up' in the top right corner to get started.",
    keywords: ["account", "sign up", "register", "login"]
  },
  {
    id: 6,
    topic: "order tracking",
    content: "Once your order ships, you'll receive an email with a tracking number. You can also track your order by logging into your account and viewing your order history.",
    keywords: ["track", "tracking", "order status", "where is my order"]
  },
  {
    id: 7,
    topic: "customer support hours",
    content: "Our customer support team is available Monday-Friday 9am-6pm EST. For urgent issues outside these hours, please use our live chat feature.",
    keywords: ["hours", "support", "contact", "help"]
  },
  {
    id: 8,
    topic: "product availability",
    content: "Product availability is shown on each product page. If an item is out of stock, you can sign up for back-in-stock notifications to be alerted when it becomes available again.",
    keywords: ["availability", "in stock", "out of stock", "restock"]
  }
];

/**
 * Searches the knowledge base for relevant information
 * @param {string} query - The search query
 * @returns {string} - Search results or no results message
 */
export function searchKb(query) {
  console.log(`[search_kb] Searching for: "${query}"`);

  if (!query || typeof query !== 'string') {
    return "Please provide a search query.";
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Search by topic and keywords
  const results = knowledgeBase.filter(entry => {
    const topicMatch = entry.topic.toLowerCase().includes(normalizedQuery);
    const keywordMatch = entry.keywords.some(keyword =>
      normalizedQuery.includes(keyword) || keyword.includes(normalizedQuery)
    );
    const contentMatch = entry.content.toLowerCase().includes(normalizedQuery);

    return topicMatch || keywordMatch || contentMatch;
  });

  if (results.length === 0) {
    return `No information found for "${query}". Please try a different search term or contact our support team for assistance.`;
  }

  // Return the most relevant results (up to 2)
  const topResults = results.slice(0, 2);
  const formattedResults = topResults.map(entry =>
    `${entry.topic.toUpperCase()}: ${entry.content}`
  ).join('\n\n');

  console.log(`[search_kb] Found ${results.length} result(s)`);

  return formattedResults;
}

// Tool definition for OpenAI function calling
export const searchKbTool = {
  type: "function",
  function: {
    name: "search_kb",
    description: "Search the knowledge base for information about products, services, policies, and common questions. Use this when the customer asks about return policies, shipping, payments, warranties, or general product information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant information in the knowledge base"
        }
      },
      required: ["query"]
    }
  }
};
