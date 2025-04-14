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

      await axios.post(
        // Captured response
        "/api/chat/create",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // Added space
          },
        }
      );
      fetchUsersChats();
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

      if (data.success) {
        setChats(data.data);

        // If user has no chats, create one
        if (data.data.length === 0) {
          await createNewChat();
          return fetchUsersChats();
        } else {
          // Sort chats by updated date
          data.data.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );

          // Set recently updated chats as selected chat
          setSelectedChat(data.data[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
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
