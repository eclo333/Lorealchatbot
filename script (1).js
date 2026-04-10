/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const quickActions = document.getElementById("quickActions");

// Basic product data used to show simple recommendation cards in the UI
const PRODUCT_CATALOG = [
  {
    name: "Revitalift Triple Power Anti-Aging Moisturizer",
    category: "Skincare",
    whenToUse: "For concerns like fine lines and firmness",
    routineTip: "Apply after serum in your morning and evening routine",
    keywords: ["anti-aging", "wrinkle", "firm", "aging", "skincare"],
  },
  {
    name: "Revitalift Derm Intensives 1.5% Hyaluronic Acid Serum",
    category: "Skincare",
    whenToUse: "For dry or dehydrated skin",
    routineTip: "Use on damp skin before moisturizer",
    keywords: ["dry skin", "dehydrated", "hydration", "serum", "skincare"],
  },
  {
    name: "Elvive Hyaluron Plump Shampoo",
    category: "Haircare",
    whenToUse: "For dry, flat, or thirsty hair",
    routineTip: "Pair with matching conditioner for best hydration",
    keywords: ["dry hair", "haircare", "shampoo", "frizzy", "hair"],
  },
  {
    name: "EverPure Sulfate-Free Moisture Conditioner",
    category: "Haircare",
    whenToUse: "For color-treated or moisture-starved hair",
    routineTip: "Leave on for 2-3 minutes before rinsing",
    keywords: ["conditioner", "color-treated", "frizzy", "haircare", "hair"],
  },
  {
    name: "Infallible Fresh Wear Foundation",
    category: "Makeup",
    whenToUse: "For long-wear, breathable everyday coverage",
    routineTip: "Start with a thin layer and build where needed",
    keywords: ["foundation", "makeup", "coverage", "infallible"],
  },
  {
    name: "True Match Super-Blendable Foundation",
    category: "Makeup",
    whenToUse: "For natural, skin-like finish",
    routineTip: "Match shade to your neck in daylight",
    keywords: ["foundation", "natural", "makeup", "true match"],
  },
];

// Keep the full conversation history so the AI remembers context
const messages = [
  {
    role: "system",
    content: `You are a friendly and knowledgeable L'Oréal Beauty Advisor.
You only answer questions related to L'Oréal products, skincare routines,
haircare routines, makeup tips, fragrance recommendations, and beauty advice.
If a user asks about anything unrelated to L'Oréal, beauty, or personal care,
politely decline and redirect them to beauty topics.
Always mention specific L'Oréal product lines when relevant (e.g., Revitalift,
EverPure, Infallible, True Match, Elvive, Excellence, etc.).`,
  },
];

// Helper: append a message bubble to the chat window
function addMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add("msg", role === "user" ? "user" : "ai");
  div.textContent = (role === "user" ? "You: " : "L'Oréal Advisor: ") + text;
  chatWindow.appendChild(div);
  // Scroll to the latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Find up to two relevant products based on words in the user prompt and AI reply
function getSuggestedProducts(text) {
  const normalized = text.toLowerCase();
  const results = [];

  for (let i = 0; i < PRODUCT_CATALOG.length; i += 1) {
    const product = PRODUCT_CATALOG[i];
    const matched = product.keywords.some((keyword) =>
      normalized.includes(keyword),
    );

    if (matched) {
      results.push(product);
    }

    if (results.length === 2) {
      break;
    }
  }

  return results;
}

// Render simple product cards under the assistant reply
function addProductCards(products) {
  if (!products.length) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.classList.add("product-cards");

  products.forEach((product) => {
    const card = document.createElement("article");
    card.classList.add("product-card");

    card.innerHTML = `
      <h3>${product.name}</h3>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Why it fits:</strong> ${product.whenToUse}</p>
      <p><strong>How to use:</strong> ${product.routineTip}</p>
    `;

    wrapper.appendChild(card);
  });

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Quick action buttons can auto-fill and send common questions
if (quickActions) {
  quickActions.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const promptText = target.dataset.prompt;
    if (!promptText) {
      return;
    }

    userInput.value = promptText;
    chatForm.requestSubmit();
  });
}

// Show a welcome message when the page loads
addMessage(
  "ai",
  "Bonjour! 💄 I'm your L'Oréal Beauty Advisor. Ask me anything about skincare, haircare, makeup, or fragrances!",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiKey =
    typeof OPENAI_API_KEY !== "undefined" && OPENAI_API_KEY
      ? OPENAI_API_KEY
      : window.OPENAI_API_KEY;

  // If the key is missing, stop early with a clear message
  if (!apiKey) {
    addMessage(
      "ai",
      "I can't connect yet. Add your OpenAI key in secrets.js and refresh the page.",
    );
    return;
  }

  // Get and clear the user's input
  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  // Display the user's message in the chat window
  addMessage("user", userText);

  // Add the user's message to the conversation history
  messages.push({ role: "user", content: userText });

  // Show a temporary "thinking" indicator
  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("msg", "ai");
  thinkingDiv.textContent = "L'Oréal Advisor: ...";
  chatWindow.appendChild(thinkingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Temporarily disable send button while waiting
  sendBtn.disabled = true;

  try {
    // Send the conversation to the OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content;

    if (!aiReply) {
      throw new Error("No assistant message returned from API.");
    }

    // Extract the AI's reply and display it
    addMessage("ai", aiReply);

    const suggestedProducts = getSuggestedProducts(`${userText} ${aiReply}`);
    addProductCards(suggestedProducts);

    // Add the AI's reply to the conversation history
    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    // Show a friendly error so the UI still feels responsive
    addMessage(
      "ai",
      "I couldn't reach the API right now. Please check your key and try again.",
    );
    console.error(error);
  } finally {
    // Remove the "thinking" indicator and re-enable the button
    if (chatWindow.contains(thinkingDiv)) {
      chatWindow.removeChild(thinkingDiv);
    }
    sendBtn.disabled = false;
  }
});
