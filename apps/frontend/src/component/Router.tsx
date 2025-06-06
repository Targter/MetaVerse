import React, { useEffect, useRef, useState } from "react";

const spaceId = "cm8vyyew30002104vqv4g25ik"; // Replace with dynamic space ID
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTh2ZzhzdHcwMDAxbTRqMGJzbHR2YTdiIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzQzMzI4NDU1fQ.by4YXVTAroELAS62ajlnErWSwbbbySR5a7DgZ4eImVw"; // Replace with actual JWT token

type User = {
  id: string;
  x: number;
  y: number;
};

const WebSocketComponent: React.FC = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [myPosition, setMyPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:3000");

    wsRef.current.onopen = () => {
      console.log("Connected to WebSocket");
      wsRef.current?.send(
        JSON.stringify({
          type: "join",
          payload: { spaceId, token },
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received:", message);

      switch (message.type) {
        case "space-joined":
          setMyPosition(message.payload.spawn);
          setUsers(message.payload.users);
          break;

        case "user-joined":
          setUsers((prevUsers) => [...prevUsers, { id: message.payload.userId, x: message.payload.x, y: message.payload.y }]);
          break;

        case "movement":
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === message.payload.userId ? { ...u, x: message.payload.x, y: message.payload.y } : u))
          );
          break;

        case "user-left":
          setUsers((prevUsers) => prevUsers.filter((u) => u.id !== message.payload.userId));
          break;
      }
    };

    wsRef.current.onclose = () => console.log("Disconnected from WebSocket");
    wsRef.current.onerror = (error) => console.error("WebSocket error:", error);

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const move = (dx: number, dy: number) => {
    const newX = myPosition.x + dx;
    const newY = myPosition.y + dy;

    wsRef.current?.send(
      JSON.stringify({
        type: "move",
        payload: { x: newX, y: newY },
      })
    );

    setMyPosition({ x: newX, y: newY });
  };

  return (
    <div>
      <h2>Users in Space {spaceId}</h2>
      <div className="grid">
        {users.map((user) => (
          <div
            key={user.id}
            className="user"
            style={{ left: user.x * 50, top: user.y * 50 }}
          >
            {user.id === token ? "You" : `User ${user.id}`}
          </div>
        ))}
      </div>
      <div className="controls">
        <button onClick={() => move(0, -1)}>Up</button>
        <div>
          <button onClick={() => move(-1, 0)}>Left</button>
          <button onClick={() => move(1, 0)}>Right</button>
        </div>
        <button onClick={() => move(0, 1)}>Down</button>
      </div>
      <style jsx>{`
        .grid {
          position: relative;
          width: 300px;
          height: 300px;
          border: 1px solid black;
        }
        .user {
          position: absolute;
          width: 40px;
          height: 40px;
          background-color: lightblue;
          text-align: center;
          line-height: 40px;
          border-radius: 50%;
        }
        .controls {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default WebSocketComponent;
