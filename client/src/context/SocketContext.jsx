import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?._id || user?.id;
    
    if (token && userId) {
      socketService.connect(token, userId);
      setIsConnected(true);
    }

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const value = {
    socketService,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};