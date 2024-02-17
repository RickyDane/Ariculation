import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import "./styles.css";
import "./font-awesome/js/all.min.js";
import "./font-awesome/css/all.min.css";
import AddItemPopup from "./AddItemPopup";
import EditItemPopup from "./EditItemPopup";

function App() {
  const [items, setItems] = useState([]);
  const [showAddItemPopup, setShowAddItemPopup] = useState("none");
  const [showEditItemPopup, setShowEditItemPopup] = useState("none");
  const [editItem, setEditItem] = useState({});
  const [monthlyMoney, setMonthlyMoney] = useState(0);
  const [isOverviewActive, setIsOverviewActive] = useState(true);
  const [isJointActive, setIsJointActive] = useState(false);

  useEffect(() => {
    console.log(items);
  }, []);

  return (
    <>
      <div className="page">
        <div className="site-nav">
          <h1 className="site-nav-title">Ariculation</h1>
          <div className="hr-divider"></div>
          <div className="site-nav-links">
          <button className={isOverviewActive ? "site-nav-link-active" : "site-nav-link"} onClick={() => {setIsOverviewActive(true); setIsJointActive(false)}}>
              <div className="nav-link-button-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="nav-link-button-text">Overview</div>
            </button>
            <button className={isJointActive ? "site-nav-link-active" : "site-nav-link"} onClick={() => {setIsJointActive(true); setIsOverviewActive(false)}}>
                <div className="nav-link-button-icon">
                  <i className="fa-solid fa-arrows-to-circle"></i>
                </div>
                <div className="nav-link-button-text">Joint</div>
              </button>
          </div>
        </div>
        <div className="main-container">
          <h2 className="monthly-money">
            <span style={{fontSize: "0.8em"}}>{"Start: "}</span>
            <div style={{width: "100px", maxWidth: "fit-content"}}>
              <input type="text" className="monthly-money-money" value={monthlyMoney} onChange={(e) => {e.keyCode == 13 ? e.target.blur() : setMonthlyMoney(e.target.value.length > 0 ? e.target.value : 0)}} />
            </div>
          </h2>
          <button className="add-item-button" onClick={() => setShowAddItemPopup("block")}>+</button>
          <table className="item-list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>User</th>
                <th>Split</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="list-item">
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{parseFloat(item.price).toFixed(2).toString().replace(".", ",")} {"€"}</td>
                  <td>{item.user}</td>
                  <td>{item.split == true ? "True" : "-"}</td>
                  <td className="item-action-buttons">
                    <button className="item-action-button" onClick={() => { setShowEditItemPopup("block"); setEditItem(item)}}>
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button className="item-action-button item-action-button-delete" onClick={() => setItems(items.filter((i) => i !== item))}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="item-list-footer">
                <td></td>
                <td></td>
                <td style={{borderTop: "1px solid #1F2124"}}>{(parseFloat(monthlyMoney) + items.reduce((acc, item) => parseFloat(acc) + parseFloat(item.price), 0)).toFixed(2).toString().replace(".", ",")} {"€"}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <AddItemPopup setItems={setItems} items={items} setShow={setShowAddItemPopup} show={showAddItemPopup} />
      <EditItemPopup setItems={setItems} items={items} item={editItem} setShow={setShowEditItemPopup} show={showEditItemPopup} />
    </>
  );
}

export default App;
