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

  const showJoint = async () => {
    setIsJointActive(true);
    setIsOverviewActive(false);
    await invoke("get_items").then(items => setItems(items));
  }
  const showOverview = async () => {
    setIsJointActive(false);
    setIsOverviewActive(true);
    setItems([]);
  }
  const deleteItem = async (id) => {
    await invoke("delete_item", { id: id });
    setItems(items.filter(item => item.id != id));
  }

  return (
    <>
      <div className="page">
        <div className="site-nav">
          <h1 className="site-nav-title">Ariculation</h1>
          <div className="hr-divider"></div>
          <div className="site-nav-links">
          <button className={isOverviewActive ? "site-nav-link-active" : "site-nav-link"} onClick={showOverview}>
              <div className="nav-link-button-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="nav-link-button-text">Overview</div>
            </button>
            <button className={isJointActive ? "site-nav-link-active" : "site-nav-link"} onClick={showJoint}>
                <div className="nav-link-button-icon">
                  <i className="fa-solid fa-arrows-to-circle"></i>
                </div>
                <div className="nav-link-button-text">Joint</div>
              </button>
          </div>
        </div>
        <div className="main-container">
          <button className="add-item-button" onClick={() => setShowAddItemPopup("block")}>+</button>
          <table className="item-list">
            <thead className="item-list-header">
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
                  <td>{item.is_split == true ? "True" : "-"}</td>
                  <td className="item-action-buttons">
                    <button className="item-action-button" onClick={() => { setShowEditItemPopup("block"); setEditItem(item)}}>
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button className="item-action-button item-action-button-delete" onClick={() => deleteItem(item.id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="page-sum-footer">
            <div style={{display: "flex"}}>
              {"Start: "}
              <input type="text" className="monthly-money-money" value={monthlyMoney} onChange={(e) => {e.key == "G" ? e.target.blur() : setMonthlyMoney(e.target.value.length > 0 ? e.target.value : 0)}} />
            </div>
            <div style={{display: "flex", gap: "5px"}}>
              {items.length > 0 ? "Total:" : "No items"}
              <p style={{color: "white"}}>
                {items.length > 0 ?
                  (parseFloat(monthlyMoney)
                  +
                  items.filter(item => item.is_split == true).reduce((pre, item) => parseFloat(pre) + parseFloat(item.price) / 2, 0)
                  +
                  items.filter(item => item.is_split == false).reduce((acc, item) => parseFloat(acc) + parseFloat(item.price), 0)).toFixed(2).toString().replace(".", ",")
                  +
                  " €"
                  :
                  ""
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      <AddItemPopup setItems={setItems} items={items} setShow={setShowAddItemPopup} show={showAddItemPopup} />
      <EditItemPopup setItems={setItems} items={items} item={editItem} setShow={setShowEditItemPopup} show={showEditItemPopup} />
    </>
  );
}

export default App;
