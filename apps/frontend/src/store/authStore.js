import { create } from "zustand";
import axios from "axios";

const useAuthStore = create((set) => ({
  user: null,
  login: async (username, password, type) => {
    try {
      const { data } = await axios.post("http://localhost:5000/login", {
        username,
        password,
        type,
      });
      set({ user: data });
    } catch (error) {
      console.error("Login failed", error);
    }
  },
  signup: async (username, password, type) => {
    try {
      const { data } = await axios.post("http://localhost:5000/signup", {
        username,
        password,
        type,
      });
      set({ user: data });
    } catch (error) {
      console.error("Signup failed", error);
    }
  },
  logout: () => set({ user: null }),
}));

export default useAuthStore;
