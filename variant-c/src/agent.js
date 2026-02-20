/**
 * Agent Logic
 * Orchestrates the conversation with OpenAI and tool execution
 */

import OpenAI from 'openai';
import { searchKb, searchKbTool } from './tools/searchKb.js';
import { getAccount, getAccountTool } from './tools/getAccount.js';
import { escalateToHuman, escalateToHumanTool } from './tools/escalateToHuman.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt defining the agent's behavior
const SYSTEM_PROMPT = `You are a helpful customer service assistant for an e-commerce company.

Your role is to:
- Answer customer questions about products, policies, and services
- Look up customer account information when needed
- Escalate complex issues to human agents when appropriate

You have access to three tools:
1. search_kb - Search the knowledge base for information
2. get_account - Look up customer account details
3. escalate_to_human - Transfer to a human agent

Guidelines:
- Be friendly, professional, and concise
- Use tools when you need specific information
- Don't make up information - use the knowledge base
- Escalate when the customer explicitly asks or when the issue is beyond your capabilities
- If you use a tool, explain the results naturally in your response

Remember: You're here to help customers have a great experience!`;

// Available tools for function calling
const tools = [searchKbTool, getAccountTool, escalateToHumanTool];

// Tool execution mapping
const toolFunctions = {
  search_kb: searchKb,
  get_account: getAccount,
  escalate_to_human: escalateToHuman
};

/**
 * Main agent loop - processes a message and returns a response
 * @param {Array} messages - Conversation history
 * @returns {Object} - Response object with text and metadata
 */
export async function runAgent(messages) {
  console.log('\n[Agent] Starting agent loop...');

  // Add system prompt if not present
  const conversationMessages = messages[0]?.role === 'system'
    ? messages
    : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops
  const toolsUsed = [];

  while (iterations < maxIterations) {
    iterations++;
    console.log(`[Agent] Iteration ${iterations}`);

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversationMessages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7
    });

    const assistantMessage = response.choices[0].message;
    conversationMessages.push(assistantMessage);

    // Check if the model wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[Agent] Model requested ${assistantMessage.tool_calls.length} tool call(s)`);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[Agent] Calling tool: ${functionName}`, functionArgs);

        // Execute the tool function
        const toolFunction = toolFunctions[functionName];
        if (!toolFunction) {
          console.error(`[Agent] Unknown tool: ${functionName}`);
          continue;
        }

        const toolResult = toolFunction(...Object.values(functionArgs));
        toolsUsed.push(functionName);

        // Add tool result to conversation
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: toolResult
        });

        console.log(`[Agent] Tool ${functionName} returned result`);
      }

      // Continue loop to get the next response with tool results
      continue;
    }

    // No more tool calls - return the final response
    console.log('[Agent] Agent loop complete\n');

    return {
      response: assistantMessage.content,
      messages: conversationMessages.slice(1), // Remove system prompt for storage
      toolsUsed: [...new Set(toolsUsed)] // Deduplicate
    };
  }

  // Max iterations reached
  console.warn('[Agent] Max iterations reached');

  return {
    response: "I apologize, but I'm having trouble processing your request. Please try again or contact our support team directly.",
    messages: conversationMessages.slice(1),
    toolsUsed: [...new Set(toolsUsed)]
  };
}

/**
 * Simple chat function without tool calling (for comparison/testing)
 */
export async function simpleChat(messages) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.7
  });

  return {
    response: response.choices[0].message.content,
    toolsUsed: []
  };
}
