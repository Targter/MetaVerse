import { useState, useEffect } from "react";

interface ElementData {
    id?: string;
  width: number | "";
  height: number | "";
  static: boolean;
  imageUrl: string;
}

interface AvatarData {
  name: string;
  imageUrl: string;
}

interface MapData {
    name: string;
    dimensions: string; // Format: "500x300"
    thumbnail: string;
    defaultElements: {
      elementId: string;
      x: number;
      y: number;
    }[];
}



export default function AdminPanel() {
    const BACKEND_URL:string =  'http://localhost:3001';
    const [role, setRole] = useState<string | null>("Admin");
  
  const [avatar, setAvatar] = useState<AvatarData>({ name: "", imageUrl: "" });
  const [map, setMap] = useState<MapData>({ name: "", dimensions: "", thumbnail: "",defaultElements:[] });
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<string>("");

  const [element, setElement] = useState<ElementData>({
    id: "",
    width: 0,
    height: 0,
    static: false,
    imageUrl: "",
  });
//   useEffect(() => {
//     fetch("/api/user-role", { credentials: "include" })
//       .then((res) => res.json())
//       .then((data) => setRole(data.role))
//       .catch(() => setRole("User"));
//   }, []);

  if (role !== "Admin") {
    return <h2 style={{ color: "red", textAlign: "center", fontSize: "24px", marginTop: "20px" }}>🚫 Access Denied. Admins only!</h2>;
  }

  const handleCreate = async (url: string, data: object, successMessage: string) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
    });
      const responseData = await res.json();
      console.log('responseData:',responseData)
      if (!res.ok) throw new Error(responseData.message || "Something went wrong");
      alert(successMessage);
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };
//   TO GET ALL THE ELEMENTS: 
const [elements, setElements] = useState<ElementData[]>([]);


  useEffect(() => {
    fetch("http://localhost:3001/api/v1/elements", {
      method: "GET",
      credentials: "include", // Ensures cookies are sent
    })
      .then((res) => res.json())
      .then((data) => {setElements(data.elements || []); console.log("Fetched elements:", data.elements);})
      .catch((err) => console.error("Error fetching elements:", err));
  }, []);

//   for adding the element on the map 
const addElementToMap = () => {
    if (!selectedElement) return alert("Please select an element!");
    const newElement = { elementId: selectedElement, x: position.x, y: position.y };
    setMap({ ...map, defaultElements: [...map.defaultElements, newElement] });
    setSelectedElement(""); // Reset selection
    setPosition({ x: 0, y: 0 }); // Reset position
};

const removeElement = (index:number) => {
    const updatedElements = [...map.defaultElements];
    updatedElements.splice(index, 1);
    setMap({ ...map, defaultElements: updatedElements });
};

  return (
    <div style={{ width: "60%", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px", backgroundColor: "#f9f9f9" }}>
      <h2 style={{ textAlign: "center", color: "#333", fontSize: "26px", marginBottom: "20px" }}>🎛️ Admin Panel</h2>

        {/* GET ALL THE ELEMENT */}
        <div style={{ width: "50%", margin: "auto", padding: "20px", border: "1px solid black", borderRadius: "10px" }}>
      <h2 style={{ textAlign: "center", color: "blue" }}>Admin Panel</h2>

      <h3>My Elements</h3>
      <ul>
        {elements.map((el) => (
          <li key={el.id} style={{"marginBottom": "10px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px"}}>
            <p>id:{el.id}</p>
            <img src={el.imageUrl} alt="Element" width={50} height={50} />
            <p>Width: {el.width}px, Height: {el.height}px</p>
            <p>Static: {el.static ? "Yes" : "No"}</p>
          </li>
        ))}
      </ul>
    </div>

      {/* Element Form */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "white" }}>
        <h3>Create Element</h3>
        <input type="number" placeholder="Width" value={element.width} onChange={(e) => setElement({ ...element, width: Number(e.target.value) })} style={inputStyle} />
        <input type="number" placeholder="Height" value={element.height} onChange={(e) => setElement({ ...element, height: Number(e.target.value) })} style={inputStyle} />
        <input type="text" placeholder="Image URL" value={element.imageUrl} onChange={(e) => setElement({ ...element, imageUrl: e.target.value })} style={inputStyle} />
        <label style={{ display: "block", marginBottom: "10px" }}>
          <input type="checkbox" checked={element.static} onChange={(e) => setElement({ ...element, static: e.target.checked })} />
          Static Element
        </label>
        <button
          onClick={() => handleCreate(`${BACKEND_URL}/api/v1/admin/element`, element, "✅ Element Created!")}
          style={{
            ...buttonStyle,
            ":hover": { backgroundColor: "#0056b3" },
          }}
        >
          Create Element
        </button>
      </div>

      {/* Avatar Form */}
      <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "white" }}>
        <h3>Create Avatar</h3>
        <input type="text" placeholder="Name" value={avatar.name} onChange={(e) => setAvatar({ ...avatar, name: e.target.value })} style={inputStyle} />
        <input type="text" placeholder="Image URL" value={avatar.imageUrl} onChange={(e) => setAvatar({ ...avatar, imageUrl: e.target.value })} style={inputStyle} />
        <button onClick={() => handleCreate(`${BACKEND_URL}/api/v1/admin/avatar`, avatar, "✅ Avatar Created!")} style={buttonStyle}>Create Avatar</button>
      </div>

      {/* Map Form */}
      <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "white" }}>
        <h3>Create Map</h3>
        <input type="text" placeholder="Name" value={map.name} onChange={(e) => setMap({ ...map, name: e.target.value })} style={inputStyle} />
        <input type="text" placeholder="Dimensions (e.g. 500x300)" value={map.dimensions} onChange={(e) => setMap({ ...map, dimensions: e.target.value })} style={inputStyle} />
        <input type="text" placeholder="Thumbnail URL" value={map.thumbnail} onChange={(e) => setMap({ ...map, thumbnail: e.target.value })} style={inputStyle} />

        
         {/* Add Elements to Map */}
         <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "5px", marginBottom: "15px" }}>
                <h4>🧩 Add Elements to Map</h4>
                <select value={selectedElement} onChange={(e) => setSelectedElement(e.target.value)} 
                    style={{ width: "100%", padding: "5px", marginBottom: "5px" }}>
                    <option value="">Select an element</option>
                    {elements.map((el) => (
                        <option key={el.id} value={el.id}>{el.imageUrl} (Size: {el.width}x{el.height})</option>
                    ))}
                </select>
                <div style={{ display: "flex", gap: "5px" }}>
                    <input type="number" placeholder="X Position" value={position.x} 
                        onChange={(e) => setPosition({ ...position, x: parseInt(e.target.value) || 0 })} 
                        style={{ flex: 1, padding: "5px" }} 
                    />
                    <input type="number" placeholder="Y Position" value={position.y} 
                        onChange={(e) => setPosition({ ...position, y: parseInt(e.target.value) || 0 })} 
                        style={{ flex: 1, padding: "5px" }} 
                    />
                </div>
                <button onClick={addElementToMap} style={{ width: "100%", padding: "8px", marginTop: "10px", backgroundColor: "#007BFF", color: "white", borderRadius: "5px" }}>
                    ➕ Add Element
                </button>
            </div>

            {/* Display Added Elements */}
            {map.defaultElements.length > 0 && (
                <div style={{ padding: "10px", backgroundColor: "#fff", borderRadius: "5px", marginBottom: "15px" }}>
                    <h4>📌 Elements in Map</h4>
                    {map.defaultElements.map((el, index) => (
                        <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px", borderBottom: "1px solid #ddd" }}>
                            <span>🟢 ID: {el.elementId} | X: {el.x}, Y: {el.y}</span>
                            <button onClick={() => removeElement(index)} style={{ background: "red", color: "white", border: "none", padding: "5px", borderRadius: "5px", cursor: "pointer" }}>
                                ➖
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Map */}
            <button onClick={() => handleCreate(`${BACKEND_URL}/api/v1/admin/map`, map, "✅ Map Created!")} 
                style={{ width: "100%", padding: "10px", marginTop: "15px", backgroundColor: "#0056b3", color: "white", borderRadius: "5px" }}>
                🚀 Create Map
            </button>
        </div>
  
    </div>
  );
}

// Reusable Styles
const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginBottom: "10px",
  padding: "8px",
  border: "1px solid #aaa",
  borderRadius: "5px",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  backgroundColor: "#007BFF",
// Remove the hover style from buttonStyle and apply it inline in JSX
  cursor: "pointer",
  transition: "background 0.3s",
  
};

// buttonStyle["&:hover"] = {
//   backgroundColor: "#0056b3",
// };
