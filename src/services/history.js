const HISTORY_KEY = 'chat_local_history';

export const getLocalHistory = () => {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLocalHistory = (messages) => {
  // Enforce max capacity of 10 messages
  const cappedMessages = messages.slice(-10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(cappedMessages));
  return cappedMessages; // Return capped array to update state
};