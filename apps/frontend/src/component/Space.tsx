import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
interface Space {
  id: string;
  name: string;
  dimensions: string;
  thumbnail?: string;
}

interface Element {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  static: boolean;
  x: number;
  y: number;
}
// maps
interface Map {
  id: string;
  name: string;
  dimensions: string;
  thumbnail: string;
}


const SpacePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpace, setNewSpace] = useState({ name: "", dimensions: "",mapId:"" });
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [newElement, setNewElement] = useState({ spaceId: "", elementId: "", x: 0, y: 0 });
  const [maps, setMaps] = useState<Map[]>([]);
  const [tokenId, setTokenId] = useState({token:""});  
  useEffect(() => {
    fetchSpaces();
    fetchMaps();
    console.log("mapRouteCalled")
  }, []);
  
  const fetchSpaces = async () => {
    const res = await fetch("http://localhost:3001/api/v1/space/all",{credentials:"include"});
    const data = await res.json();
    console.log("spaceData:",data.spaces)
    setSpaces(data.spaces);
  };

  const createSpace = async () => {
    await fetch("http://localhost:3001/api/v1/space/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSpace),
      credentials: "include",
    });
    fetchSpaces();
  };
  // get all the maps: 
  const fetchMaps = async () => {
    console.log("fetchingMaps")
    const res =   await fetch("http://localhost:3001/api/v1/space/map",{credentials:"include"});
    const data = await res.json();
    console.log("maps",data.maps)
    setMaps(data.maps);
    setTokenId(data.token)
  };
  

  const deleteSpace = async (spaceId: string) => {
    await fetch(`http://localhost:3001/api/v1/space/s/${spaceId}`, { method: "DELETE" });
    fetchSpaces();
  };

  const getSpace = async (spaceId: string) => {
    console.log("thisSpaceId:",spaceId)
    navigate(`/meeting/${spaceId}/${tokenId}`);
    // const res = await fetch(`http://localhost:3001/api/v1/space/s/${spaceId}`,{credentials:"include"});
    // const data = await res.json();
    // console.log("spaceData:",data)
    // setSelectedSpace({ id: spaceId, name: "", dimensions: data.dimensions });
    // setElements(data.elements);
  };

  const addElement = async () => {
    await fetch("http://localhost:3001/api/v1/space/element", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newElement),
    });
    getSpace(newElement.spaceId);
  };

  const deleteElement = async (elementId: string) => {
    await fetch("http://localhost:3001/api/v1/space/element", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: elementId }),
    });
    getSpace(newElement.spaceId);
  };


  // to fetch and update the avatars
  const [avatars, setAvatars] = useState<{ id: string; imageUrl: string; name: string }[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatars();
  }, []);

  // Fetch available avatars
  const fetchAvatars = async () => {
    const res = await fetch("http://localhost:3001/api/v1/avatars", { credentials: "include" });
    const data = await res.json();
    console.log("Fetched Avatars:", data.avatars);
    setAvatars(data.avatars);
  };

  // Update user metadata with the selected avatar
  const updateAvatar = async () => {
    if (!selectedAvatar) return alert("Please select an avatar!");
    console.log("selectedAvatar:", selectedAvatar);
    const res = await fetch("http://localhost:3001/api/v1/user/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId: selectedAvatar }),
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok) {
      alert("Avatar updated successfully!");
    } else {
      alert(`Error: ${data.message}`);
    }
  };
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>

<div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Choose Your Avatar</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => setSelectedAvatar(avatar.id)}
            style={{
              border: selectedAvatar === avatar.id ? "2px solid blue" : "1px solid gray",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <img src={avatar.imageUrl} alt={avatar.name} style={{ width: "80px", height: "80px", borderRadius: "50%" }} />
            <p>{avatar.name}</p>
          </div>
        ))}
      </div>
      <button onClick={updateAvatar} style={{ marginTop: "10px", cursor: "pointer" }}>
        Save Avatar
      </button>
    </div>
      <h2>Manage Spaces</h2>
      <div>
        <input
          type="text"
          placeholder="Space Name"
          value={newSpace.name}
          onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Dimensions (WxH)"
          value={newSpace.dimensions}
          onChange={(e) => setNewSpace({ ...newSpace, dimensions: e.target.value })}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Map ID (optional)"
          value={newSpace.mapId}
          onChange={(e) => setNewSpace({ ...newSpace, mapId: e.target.value })}
/>
        <button onClick={createSpace} style={{ cursor: "pointer" }}>Create Space</button>
      </div>
      
      <h3>Spaces</h3>
      <ul>
        {spaces?.map((space) => (
          <li key={space.id} style={{ marginBottom: "10px" }}>
            {space.name} - {space.dimensions}
            <button onClick={() => getSpace(space.id)} style={{ marginLeft: "10px", cursor: "pointer" }}>View</button>
            <button onClick={() => deleteSpace(space.id)} style={{ marginLeft: "10px", cursor: "pointer" }}>Delete</button>
          </li>
        ))}
      </ul>

      {selectedSpace && (
        <div>
          <h3>Space Details ({selectedSpace.dimensions})</h3>
          <ul>
            {elements.map((el) => (
              <li key={el.id}>
                <img src={el.element.imageUrl} style={{ width: "100px", height: "100px", marginRight: "10px" }} />
                ({el.x}, {el.y})
                <button onClick={() => deleteElement(el.id)} style={{ marginLeft: "10px", cursor: "pointer" }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>hehe</div>
      <h2 style={{ textAlign: "center", marginTop: "20px" }}>Available Maps</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {maps.map((map) => (
          <div
            key={map.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "5px",
              width: "200px",
              textAlign: "center",
              background: `url(${map.thumbnail})`,
            }}
          >
            <p>{map.id}</p>
            <h3>{map.name}</h3>
            <p>{map.dimensions}</p>

          </div>
        ))}
      </div>

      <h3>Add Element</h3>
      <div>
        <input
          type="text"
          placeholder="Space ID"
          value={newElement.spaceId}
          onChange={(e) => setNewElement({ ...newElement, spaceId: e.target.value })}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Element ID"
          value={newElement.elementId}
          onChange={(e) => setNewElement({ ...newElement, elementId: e.target.value })}
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="X"
          value={newElement.x}
          onChange={(e) => setNewElement({ ...newElement, x: Number(e.target.value) })}
          style={{ width: "50px", marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="Y"
          value={newElement.y}
          onChange={(e) => setNewElement({ ...newElement, y: Number(e.target.value) })}
          style={{ width: "50px", marginRight: "10px" }}
        />
        <button onClick={addElement} style={{ cursor: "pointer" }}>Add Element</button>
      </div>
    </div>
  );
};

export default SpacePage;