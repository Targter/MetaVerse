import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const DEFAULT_AVATAR = "/uiAvatar.png"; // Default avatar for all users

const Arena = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState(new Map());
  const { spaceId, tokenId } = useParams();
  const isMoving = useRef(false);
  // Initialize WebSocket connection
  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:3000"); // Replace with actual WebSocket URL

    wsRef.current.onopen = () => {
      wsRef.current?.send(
        JSON.stringify({
          type: "join",
          payload: { spaceId, tokenId },
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleWebSocketMessage = (message: any) => {
    console.log("receivedMovement:",message)
    switch (message.type) {
      case "space-joined":
        console.log("space-joined")
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId,
        });

        setUsers((prevUsers) => {
          const newUsers = new Map(prevUsers);
        //   newUsers.set(message.payload.userId, {
        //     id: message.payload.userId,
        //     x: message.payload.spawn.x,
        //     y: message.payload.spawn.y,
        //   });

          message.payload.users.forEach((user: any) =>
            newUsers.set(user.id, user)
          );
          return newUsers;
        });
        break;

      case "user-joined":
      console.log("user-joined",message.payload)  
      setUsers((prevUsers) => {
          const newUsers = new Map(prevUsers);
          
          newUsers.set(message.payload.userId, {
            x: message.payload.x,
            y: message.payload.y,
            userId: message.payload.userId,
          });
          return newUsers;
        });
        break;

      case "movement":
        console.log("frontendMovement Received")
        setUsers((prevUsers) => {
          const newUsers = new Map(prevUsers);
          if (message.payload.userId === currentUser?.userId) {
            setCurrentUser((prev) =>
              prev ? { ...prev, x: message.payload.x, y: message.payload.y } : prev
            );
          }

          if (newUsers.has(message.payload.userId)) {
            newUsers.set(message.payload.userId, {
              ...newUsers.get(message.payload.userId),
              x: message.payload.x,
              y: message.payload.y,
            });
          }
          return newUsers;
        });
        break;

      case "user-left":
        setUsers((prevUsers) => {
          const newUsers = new Map(prevUsers);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  const handleMove = (newX: number, newY: number) => {
    console.log("isMoving:",isMoving)
    if (!currentUser || isMoving.current) return;
    console.log("calledIsMoving")
    // Update local state immediately
    
    // Update the moving flag and local state immediately
    isMoving.current = true;
    setCurrentUser((prev:any) =>
      prev ? { ...prev, x: newX, y: newY } : prev
    );
    console.log("currentUser under move",currentUser)
    console.log("newX",newX)
    wsRef.current?.send(
      JSON.stringify({
        type: "move",
        payload: { x: newX, y: newY, userId: currentUser.userId },
      })
    );
// set the moving flag after a delay to allow websocket processing
    setTimeout(() => {
        isMoving.current = false;
      }, 100); 
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;

      setCurrentUser((prev) => {
        if (!prev) return prev;
        let newX = prev.x;
        let newY = prev.y;

        switch (e.key) {
          case "ArrowUp":
            newY = Math.max(0, prev.y - 10);
            break;
          case "ArrowDown":
            newY = Math.min(800 - 64, prev.y + 10);
            break;
          case "ArrowLeft":
            newX = Math.max(0, prev.x - 10);
            break;
          case "ArrowRight":
            newX = Math.min(1000 - 64, prev.x + 10);
            break;
        }

        // Send movement to WebSocket
        handleMove(newX, newY);

        return { ...prev, x: newX, y: newY };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser]);

  return (
    <div
      style={{
        position: "relative",
        width: "1000px",
        height: "800px",
        backgroundColor: "gray",
        border: "1px solid black",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>
        Arena
      </h1>
      <p style={{ textAlign: "center", color: "gray" }}>
        Use arrow keys to move your avatar
      </p>

      {/* Arena container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "black",
        }}
      >
        {/* Current User */}
        {currentUser && (
          <img
            src={DEFAULT_AVATAR}
            alt="You"
            style={{
              position: "absolute",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: "2px solid blue",

              left: `${Math.max(0, Math.min(1000 - 64, currentUser.x))}px`,
              top: `${Math.max(0, Math.min(800 - 64, currentUser.y))}px`,

              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Other Users */}
        {[...users.values()].map((user) =>
          user.userId !== currentUser?.userId ? (
           <>
            <img
              key={user.userId}
              src={DEFAULT_AVATAR}
              alt={`User ${user.userId}`}
              style={{
                position: "absolute",
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                border: "2px solid red",

                left: `${Math.max(0, Math.min(1000 - 64, user.x))}px`,
                top: `${Math.max(0, Math.min(800 - 64, user.y))}px`,

                transform: "translate(-50%, -50%)",
              }}
              />
              <p style={{font:"white"}}>{user.x}</p>
              </>
          ) : null
        )}
      </div>
    </div>
  );
};

export default Arena;
