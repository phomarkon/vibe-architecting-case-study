/**
 * Account Lookup Tool
 * Looks up customer account information by ID or email
 */

// Mock customer database
const customerAccounts = [
  {
    id: "CUST001",
    email: "john.doe@example.com",
    name: "John Doe",
    membershipStatus: "Premium",
    accountCreated: "2023-01-15",
    totalOrders: 12,
    lastOrder: "2024-01-10"
  },
  {
    id: "CUST002",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    membershipStatus: "Standard",
    accountCreated: "2023-06-20",
    totalOrders: 5,
    lastOrder: "2024-01-05"
  },
  {
    id: "CUST003",
    email: "bob.wilson@example.com",
    name: "Bob Wilson",
    membershipStatus: "Premium",
    accountCreated: "2022-11-10",
    totalOrders: 28,
    lastOrder: "2024-02-01"
  },
  {
    id: "CUST004",
    email: "alice.johnson@example.com",
    name: "Alice Johnson",
    membershipStatus: "Standard",
    accountCreated: "2024-01-05",
    totalOrders: 2,
    lastOrder: "2024-01-20"
  }
];

/**
 * Looks up a customer account by ID or email
 * @param {string} identifier - Customer ID or email address
 * @returns {string} - Account information or not found message
 */
export function getAccount(identifier) {
  console.log(`[get_account] Looking up: "${identifier}"`);

  if (!identifier || typeof identifier !== 'string') {
    return "Please provide a customer ID or email address.";
  }

  const normalizedIdentifier = identifier.toLowerCase().trim();

  // Search by ID or email
  const account = customerAccounts.find(acc =>
    acc.id.toLowerCase() === normalizedIdentifier ||
    acc.email.toLowerCase() === normalizedIdentifier
  );

  if (!account) {
    return `No account found for "${identifier}". Please verify the customer ID or email address.`;
  }

  // Format account information
  const accountInfo = `
ACCOUNT FOUND:
Name: ${account.name}
Customer ID: ${account.id}
Email: ${account.email}
Membership Status: ${account.membershipStatus}
Account Created: ${account.accountCreated}
Total Orders: ${account.totalOrders}
Last Order: ${account.lastOrder}
  `.trim();

  console.log(`[get_account] Found account for ${account.name}`);

  return accountInfo;
}

// Tool definition for OpenAI function calling
export const getAccountTool = {
  type: "function",
  function: {
    name: "get_account",
    description: "Look up customer account information by customer ID or email address. Use this when the customer asks about their account status, order history, or provides their email/customer ID for account-related inquiries.",
    parameters: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "The customer ID (e.g., 'CUST001') or email address to look up"
        }
      },
      required: ["identifier"]
    }
  }
};
