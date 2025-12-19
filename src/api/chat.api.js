import api from "./axios";


export const sendChatMessage = (messages, chatId) => {
  const token = localStorage.getItem("gollo_token");

  return api.post(
    "/chat",
    {
      messages,
      chatId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export const getUserChats = () => {
  const token = localStorage.getItem("gollo_token");

  return api.get("/chat", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const deleteChatApi = (chatId) => {
  const token = localStorage.getItem("gollo_token");

  return api.delete(`/chat/${chatId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const renameChatApi = (chatId, newTitle) => {
  const token = localStorage.getItem("gollo_token");

  return api.put(
    `/chat/${chatId}/title`,
    { title: newTitle },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


export const pinChatApi = (chatId, isPinned) => {
  const token = localStorage.getItem("gollo_token");

  return api.put(
    `/chat/${chatId}/pin`,
    { isPinned },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};