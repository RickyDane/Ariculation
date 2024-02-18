import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import "./styles.css";
import "./font-awesome/js/all.min.js";
import "./font-awesome/css/all.min.css";
import AddItemPopup from "./AddItemPopup";
import EditItemPopup from "./EditItemPopup";
import AddUserPopup from "./AddUserPopup";
import QuestionPopup from "./QuestionPopup.jsx";

function App() {
  const [items, setItems] = useState([]);
  const [showAddItemPopup, setShowAddItemPopup] = useState("none");
  const [showEditItemPopup, setShowEditItemPopup] = useState("none");
  const [showAddUserPopup, setShowAddUserPopup] = useState("none");
  const [editItem, setEditItem] = useState({});
  const [monthlyMoney, setMonthlyMoney] = useState(0);
  const [isAllItemsActive, setIsAllItemsActive] = useState(true);
  const [isJointActive, setIsJointActive] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(0);
  const [userMoney, setUserMoney] = useState("0");
  const [activeUserName, setActiveUserName] = useState("");
  const [showQuestionPopup, setShowQuestionPopup] = useState("none");
  const [confirmFunction, setConfirmFunction] = useState(() => { });
  const [questionPopupMsg, setQuestionPopupMsg] = useState("");
  const [currentItem, setCurrentItem] = useState({});
  const [currentView, setCurrentView] = useState("");

  const getUsers = async () => {
    await invoke("get_users").then(users => setUsers(users));
  }

  useEffect(() => {
    getUsers();
  }, []);

  const showallItems = async () => {
    unselectAllNavLinks();
    setIsAllItemsActive(true);
    setCurrentView("all");
    document.querySelector(".allItems-button").classList.add("site-nav-link-active");
    appWindow.setTitle("Ariculation - All Items");
    setActiveUserId(0);
    await invoke("get_all_items").then(items => setItems(items));
  }
  const showJoint = async () => {
    await unselectAllNavLinks();
    setIsJointActive(true);
    setCurrentView("joint");
    document.querySelector(".joint-button").classList.add("site-nav-link-active");
    appWindow.setTitle("Ariculation - Joint");
    setActiveUserId(0);
    await invoke("get_items", { isSplit: true, isJoint: true }).then(items => setItems(items));
  }
  const showUser = async (user) => {
    await invoke("get_user", { userId: user.id }).then(user => {
      setActiveUserId(user.id);
      setUserMoney(parseFloat(user.start_money).toFixed(2));
      setActiveUserName(user.name);
    });
    await unselectAllNavLinks();
    setCurrentView("user");
    document.querySelector(".user-button-" + user.id).classList.add("site-nav-link-active");
    appWindow.setTitle("Ariculation - " + user.name);
    await invoke("get_user_items", { userId: user.id }).then(items => setItems(items));
  }
  const deleteItem = async (id) => {
    await invoke("delete_item", { id: id });
    setItems(items.filter(item => item.id != id));
  }
  const updateActiveUserMoney = async (money) => {
    setUserMoney(money);
    await invoke("update_user", { userId: activeUserId, name: activeUserName, startMoney: money.replace(",", ".") });
  }
  const openQuestionPopup = (item, question, confirmFunction) => {
    setShowQuestionPopup("block");
    setConfirmFunction(() => confirmFunction);
    setQuestionPopupMsg(question);
    setCurrentItem(item);
  }
  const unselectAllNavLinks = async () => {
    setIsJointActive(false);
    setIsAllItemsActive(false);
    document.querySelectorAll(".site-nav-link").forEach(link => link.classList.remove("site-nav-link-active"));
  }

  return (
    <>
      <div className="page">
        <div className="site-nav">
          <h1 className="site-nav-title" onClick={() => { setItems([]); unselectAllNavLinks(); }}>Ariculation</h1>
          <div className="hr-divider"></div>
          <div className="site-nav-links">
            <button className="site-nav-link allItems-button" onClick={showallItems}>
              <div className="nav-link-button-icon">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div className="nav-link-button-text">All items</div>
            </button>
            <button className="site-nav-link joint-button" onClick={showJoint}>
              <div className="nav-link-button-icon">
                <i className="fa-solid fa-arrows-to-circle"></i>
              </div>
              <div className="nav-link-button-text">Joint</div>
            </button>
            {users.map((user) => (
              <button className={"site-nav-link user-button-"+user.id} key={user.id} onClick={(e) => showUser(user, e) }>
                <div className="nav-link-button-icon">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="nav-link-button-text">{user.name}</div>
              </button>
            ))}
          </div>
          <button className="add-user-button" onClick={() => setShowAddUserPopup(true)}><i className="fa-solid fa-user-plus"></i></button>
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
                  <td>{users.filter(user => user.id == item.user_id).name != null ? users.filter(user => user.id == item.user_id).name : "-"}</td>
                  <td>{item.is_split == true ? "True" : "-"}</td>
                  <td className="item-action-buttons">
                    <button className="item-action-button" onClick={() => { setShowEditItemPopup("block"); setEditItem(item)}}>
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button className="item-action-button item-action-button-delete" onClick={() => openQuestionPopup(item, "Should this item be deleted?", () => deleteItem(item.id))}>
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
              <input type="text" className="monthly-money-money" value={activeUserId != 0 ? userMoney.replace(".", ",") : monthlyMoney.toString().replace(".", ",")} onChange={
                (e) => {
                if (activeUserId != 0){
                  updateActiveUserMoney(e.target.value)
                }
                else {
                  setMonthlyMoney(e.target.value.length > 0 ? e.target.value : 0)
                }
              }}/>
            </div>
            <div style={{display: "flex", gap: "5px"}}>
              {items.length > 0 ? "Total:" : "No items"}
              <p style={{color: "white"}}>
                {items.length > 0 ?
                  (parseFloat(activeUserId != 0 ? userMoney.replace(",", ".") : monthlyMoney)
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
      <AddItemPopup setItems={setItems} items={items} setShow={setShowAddItemPopup} show={showAddItemPopup} isJoint={isJointActive} users={users} activeUserId={activeUserId} currentView={currentView} />
      <EditItemPopup setItems={setItems} items={items} item={editItem} setShow={setShowEditItemPopup} show={showEditItemPopup} isJoint={isJointActive} users={users} activeUserId={activeUserId} currentView={currentView} />
      <AddUserPopup users={users} setUsers={setUsers} setShow={setShowAddUserPopup} show={showAddUserPopup} />
      <QuestionPopup setShow={setShowQuestionPopup} show={showQuestionPopup} confirmFunction={confirmFunction} msg={questionPopupMsg} item={currentItem} />
    </>
  );
}

export default App;
