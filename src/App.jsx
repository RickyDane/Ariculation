import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import "./styles.css";
import "./font-awesome/js/all.min.js";
import "./font-awesome/css/all.min.css";
import AddItemPopup from "./Popups";

function App() {
  const [items, setItems] = useState([]);

  let startItems = [
    {
      id: crypto.randomUUID(),
      name: "Item 1",
      description: "This is item 1",
      user: "Ricky",
      price: 100,
    },
    {
      id: crypto.randomUUID(),
      name: "Item 2",
      description: "This is item 2",
      user: "Adinda",
      price: 200,
    },
    {
      id: crypto.randomUUID(),
      name: "Item 3",
      description: "This is item 3",
      user: "Adinda",
      price: 300,
    },
    {
      id: crypto.randomUUID(),
      name: "Item 4",
      description: "This is item 4",
      user: "Adinda",
      price: 400,
    }
  ];

  return (
    <>
      <div className="page">
        <div className="site-nav">
          <h1 className="site-nav-title">Ariculation</h1>
          <div className="hr-divider"></div>
          <div className="site-nav-links">
            <button className="site-nav-link" onClick={() => setItems(startItems)}>
              <div className="nav-link-button-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="nav-link-button-text">Overview</div>
            </button>
            <button className="site-nav-link">
                <div className="nav-link-button-icon">
                  <i className="fa-solid fa-arrows-to-circle"></i>
                </div>
                <div className="nav-link-button-text">Joint</div>
              </button>
          </div>
        </div>
        <div className="main-container">
          <button className="add-item-button">+</button>
          <table className="item-list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="item">
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>{item.price}</td>
                  <td>{item.user}</td>
                  <td className="item-action-buttons">
                    <button className="item-action-button" onClick={() => setItems(items.map((i) => i === item ? { ...i, name: prompt("Enter new name") } : i))}>
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button className="item-action-button" onClick={() => setItems(items.filter((i) => i !== item))}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddItemPopup />
    </>
  );
}

export default App;
