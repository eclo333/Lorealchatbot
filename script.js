/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const quickActions = document.getElementById("quickActions");
const latestQuestion = document.getElementById("latestQuestion");

// Paste your deployed Cloudflare Worker URL here
const CLOUDFLARE_WORKER_URL = "https://lorealchatbot.ttrrippyy.workers.dev";

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

function addMessage(role, text) {
  const div = document.createElement("div");
  div.classList.add("msg", role === "user" ? "user" : "ai");
  div.textContent = (role === "user" ? "You: " : "L'Oréal Advisor: ") + text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setLatestQuestion(text) {
  if (!latestQuestion) {
    return;
  }

  latestQuestion.textContent = `Latest question: ${text}`;
}

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

addMessage(
  "ai",
  "Bonjour! 💄 I'm your L'Oréal Beauty Advisor. Ask me anything about skincare, haircare, makeup, or fragrances!",
);

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (CLOUDFLARE_WORKER_URL.includes("your-worker-name")) {
    addMessage(
      "ai",
      "I can't connect yet. Add your Cloudflare Worker URL in script.js and refresh.",
    );
    return;
  }

  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  addMessage("user", userText);
  setLatestQuestion(userText);

  messages.push({ role: "user", content: userText });

  const thinkingDiv = document.createElement("div");
  thinkingDiv.classList.add("msg", "ai");
  thinkingDiv.textContent = "L'Oréal Advisor: ...";
  chatWindow.appendChild(thinkingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  sendBtn.disabled = true;

  try {
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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

    addMessage("ai", aiReply);

    const suggestedProducts = getSuggestedProducts(`${userText} ${aiReply}`);
    addProductCards(suggestedProducts);

    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    addMessage(
      "ai",
      "I couldn't reach your Cloudflare Worker right now. Check the Worker URL and deployment.",
    );
    console.error(error);
  } finally {
    if (chatWindow.contains(thinkingDiv)) {
      chatWindow.removeChild(thinkingDiv);
    }
    sendBtn.disabled = false;
  }
});
