"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const createNewChat = async () => {
    console.log("createNewChat triggered"); // Added log
    try {
      if (!user) return null;

      const token = await getToken();

      const response = await axios.post(
        // Captured response
        "/api/chat/create",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Added space
          },
        }
      );
      const newChat = response.data.data;
      return newChat;
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchUsersChats = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      let userChats = data.data;

      if (userChats.length === 0) {
        console.log("No chats found, creating a new one...");
        const newChat = await createNewChat();
        if (newChat) {
          userChats = [newChat];
        } else {
          toast.error("Failed to create a chat");
          return;
        }
      }

      userChats.sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );

      setChats(userChats);
      setSelectedChat(userChats[0]);
    } catch (error) {
      console.error("Error in fetchUsersChats:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersChats();
    }
  }, [user]);

  const value = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
