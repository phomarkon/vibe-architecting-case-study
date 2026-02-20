/**
 * Escalate to Human Tool
 * Escalates the conversation to a human agent
 */

/**
 * Escalates the conversation to a human agent
 * @param {string} reason - The reason for escalation
 * @returns {string} - Escalation confirmation message
 */
export function escalateToHuman(reason) {
  console.log(`[escalate_to_human] Escalating for reason: "${reason}"`);

  if (!reason || typeof reason !== 'string') {
    return "Escalation initiated. A human agent will be with you shortly.";
  }

  // In a real system, this would:
  // 1. Create a ticket in the support system
  // 2. Notify available agents
  // 3. Transfer conversation context
  // 4. Queue the customer for live chat

  // Generate a mock ticket ID
  const ticketId = `TICKET-${Date.now().toString().slice(-6)}`;

  const escalationMessage = `
I've escalated your request to our human support team.

Ticket ID: ${ticketId}
Reason: ${reason}

A support specialist will contact you shortly via email or live chat. Average wait time is 5-10 minutes during business hours (Monday-Friday, 9am-6pm EST).

For urgent issues, please call us at 1-800-SUPPORT.
  `.trim();

  console.log(`[escalate_to_human] Created ticket ${ticketId}`);

  return escalationMessage;
}

// Tool definition for OpenAI function calling
export const escalateToHumanTool = {
  type: "function",
  function: {
    name: "escalate_to_human",
    description: "Escalate the conversation to a human support agent. Use this when: 1) The customer explicitly asks to speak with a human, 2) The issue is complex and cannot be resolved with available tools, 3) The customer is frustrated or needs personalized assistance, 4) The request involves refunds, cancellations, or sensitive account changes.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "A brief description of why the conversation is being escalated (e.g., 'customer requests refund', 'complex technical issue', 'customer requested human agent')"
        }
      },
      required: ["reason"]
    }
  }
};
