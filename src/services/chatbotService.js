import { chatbotDictionary } from "../data/chatbotData";

export async function getBotResponse(message) {
  const normalizedMessage = message
    .toLowerCase()
    .trim();

  const response =
    chatbotDictionary[normalizedMessage];

  await simulateDelay();

  return (
    response ||
    "Sorry, I don't understand that yet."
  );
}

function simulateDelay() {
  return new Promise((resolve) =>
    setTimeout(resolve, 700)
  );
}