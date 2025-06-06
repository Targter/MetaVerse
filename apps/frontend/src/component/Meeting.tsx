import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

interface Map {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail: string;
}

interface Element {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

const MeetingPage = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { spaceId, tokenId } = useParams();
  const wsRef = useRef<WebSocket | null>(null);

  const [map, setMap] = useState<Map | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState(new Map());

  // WebSocket Setup
  useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:3000"); // Update with your WS URL

    wsRef.current.onopen = () => {
      wsRef.current!.send(
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
    switch (message.type) {
      case "space-joined":
        setCurrentUser({
          x: message.payload.spawn.x,
          y: message.payload.spawn.y,
          userId: message.payload.userId,
        });
        console.log("currentUser:", currentUser)

        const userMap = new Map();
        message.payload.users.forEach((user: any) => userMap.set(user.userId, user));
        setUsers(userMap);
        break;

      case "user-joined":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.set(message.payload.userId, message.payload);
          return newUsers;
        });
        console.log("users:",users);
        break;

      case "movement":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          const user = newUsers.get(message.payload.userId);
          if (user) {
            user.x = message.payload.x;
            user.y = message.payload.y;
          }
          return newUsers;
        });
        break;

      case "movement-rejected":
        setCurrentUser((prev: any) => ({
          ...prev,
          x: message.payload.x,
          y: message.payload.y,
        }));
        break;

      case "user-left":
        setUsers((prev) => {
          const newUsers = new Map(prev);
          newUsers.delete(message.payload.userId);
          return newUsers;
        });
        break;
    }
  };

  const handleMove = (newX: number, newY: number) => {
    if (!currentUser) return;

    wsRef.current?.send(
      JSON.stringify({
        type: "move",
        payload: { x: newX, y: newY, userId: currentUser.userId },
      })
    );

    setCurrentUser((prev: any) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  // Attach keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;

      let { x, y } = currentUser;
      if (e.key === "ArrowUp") y -= 1;
      if (e.key === "ArrowDown") y += 1;
      if (e.key === "ArrowLeft") x -= 1;
      if (e.key === "ArrowRight") x += 1;

      handleMove(x, y);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser]);

  // Draw users on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current user
    if (currentUser) {
      ctx.fillStyle = "#FF6B6B";
      ctx.beginPath();
      ctx.arc(currentUser.x * 50, currentUser.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("You", currentUser.x * 50, currentUser.y * 50 + 40);
    }

    // Draw other users
    users.forEach((user) => {
      if (!user.x) return;
      ctx.fillStyle = "#4ECDC4";
      ctx.beginPath();
      ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`User ${user.userId}`, user.x * 50, user.y * 50 + 40);
    });
  }, [currentUser, users]);

  // Fetch Map Data
  useEffect(() => {
    const fetchMapData = async () => {
      const res = await fetch(`http://localhost:3001/api/v1/space/s/${spaceId}`, { credentials: "include" });
      const data = await res.json();
      const [width, height] = data.dimensions.split("x").map(Number);
      setMap({ ...data, width, height });
      setElements(data.elements);
    };

    fetchMapData();
  }, [spaceId]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Meeting Room - {map?.name}</h2>
      {map && (
        <div
          style={{
            position: "relative",
            width: `${map.width}px`,
            height: `${map.height}px`,
            border: "1px solid #ccc",
            margin: "auto",
            backgroundImage: `url(${map.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {elements.map((el) => (
            <img
              key={el.id}
              src={el.element.imageUrl}
              alt="Element"
              style={{
                position: "absolute",
                left: `${(el.x / map.width) * 100}%`,
                top: `${(el.y / map.height) * 100}%`,
                width: `${(el.element.width / map.width) * 100}%`,
                height: `${(el.element.height / map.height) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      )}

      <div className="p-4 bg-black">
        <h1 className="text-2xl font-bold mb-4">Arena</h1>
        <p className="text-sm text-gray-600">Connected Users: {users.size + (currentUser ? 1 : 0)}</p>
        <canvas ref={canvasRef} width={800} height={600} className="bg-white" style={{background:"red"}} />
        <p className="mt-2 text-sm text-gray-500">Use arrow keys to move your avatar</p>
      </div>
    </div>
  );
};

export default MeetingPage;
