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
import TooltipInput from "./TooltipInput";

function App() {
  const [items, setItems] = useState([]);
  const [showAddItemPopup, setShowAddItemPopup] = useState("none");
  const [showEditItemPopup, setShowEditItemPopup] = useState("none");
  const [showAddUserPopup, setShowAddUserPopup] = useState("none");
  const [showTooltipInput, setShowTooltipInput] = useState("none");
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
  const [listTypes, setListTypes] = useState([]);
  const [currentListType, setCurrentListType] = useState("-");

  const getUsers = async () => {
    await invoke("get_users").then(users => setUsers(users));
  }
  const getListTypes = async () => {
    await invoke("get_list_types").then(types => setListTypes(types));
  }

  useEffect(() => {
    getUsers();
    getListTypes();
  }, []);

  const showAllItems = async () => {
    unselectAllNavLinks();
    setIsAllItemsActive(true);
    setCurrentView("all");
    document.querySelector(".allItems-button").classList.add("site-nav-link-active");
    appWindow.setTitle("Ariculation - All Items");
    setActiveUserId(0);
    await invoke("get_all_items", { listType: currentListType }).then(items => setItems(items));
  }
  const showJoint = async () => {
    await unselectAllNavLinks();
    setIsJointActive(true);
    setCurrentView("joint");
    document.querySelector(".joint-button").classList.add("site-nav-link-active");
    appWindow.setTitle("Ariculation - Joint");
    setActiveUserId(0);
    await invoke("get_items", { isSplit: true, isJoint: true, listType: currentListType }).then(items => setItems(items));
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
    await invoke("get_user_items", { userId: user.id, listType: currentListType }).then(items => setItems(items));
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
  const clearJointItems = async () => {
    await invoke("remove_joint_entries");
    showJoint();
  }
  const handleSearchInput = async (e) => {
    if (isAllItemsActive) {
      await invoke("get_all_items", { listType: currentListType }).then(items => {
        setItems(items.filter(item => item.name.toLowerCase().includes(e.target.value.toLowerCase()) == true || item.category.toLowerCase().includes(e.target.value.toLowerCase()) == true));
      });
      return;
    }
    else if (isJointActive) {
      await invoke("get_items", { isSplit: true, isJoint: true, listType: currentListType }).then(items => {
        setItems(items.filter(item => item.name.toLowerCase().includes(e.target.value.toLowerCase()) == true || item.category.toLowerCase().includes(e.target.value.toLowerCase()) == true));
      });
      return;
    }
    else if (activeUserId != 0) {
      await invoke("get_user_items", { userId: activeUserId, listType: currentListType }).then(items => {
        setItems(items.filter(item => item.name.toLowerCase().includes(e.target.value.toLowerCase()) == true || item.category.toLowerCase().includes(e.target.value.toLowerCase()) == true));
      });
      return;
    }
  }
  const handleChangeListType = async (e) => {
    setCurrentListType(parseInt(e.target.value));
    switch (currentView) {
        case "all":
          await invoke("get_all_items", { listType: parseInt(e.target.value) }).then(items => setItems(items));
          break;
        case "user":
          await invoke("get_user_items", { userId: activeUserId, listType: parseInt(e.target.value) }).then(items => setItems(items));
          break;
        case "joint":
          await invoke("get_items", { isSplit: true, isJoint: isJointActive, listType: parseInt(e.target.value) }).then(items => setItems(items));
          break;
        default:
          console.log("Invalid view: ", currentView);
          return;
      }
  }

  return (
    <>
      <div className="page">
        <div className="site-nav">
          <h1 className="site-nav-title" onClick={() => { setItems([]); unselectAllNavLinks(); getUsers(); getListTypes(); }}>Ariculation</h1>
          <div className="hr-divider"></div>
          <div className="site-nav-links">
            <button className="site-nav-link allItems-button" onClick={showAllItems}>
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
          <div className="site-nav-settings-bar">
            <button className="add-user-button" onClick={() => setShowAddUserPopup(true)}><i className="fa-solid fa-user-plus"></i></button>
            <button className="site-nav-settings-button"><i className="fa-solid fa-gears"></i></button>
          </div>
        </div>
        <div className="main-container">
          <div className="toolbar">
            <input type="text" className="text-input" placeholder="Search ..." onChange={async (e) => { handleSearchInput(e) }}/>
            <div style={{display: "flex", gap: "5px"}}>
              <button className="add-item-button" style={{display: isAllItemsActive ? "none" : "flex"}} onClick={() => setShowAddItemPopup("block")}>Add item <i className="fa-solid fa-circle-plus"></i></button>
              <div className="list-type-container">
                <select className="list-type-select item-select" value={currentListType} onChange={(e) => handleChangeListType(e)}>
                  {listTypes.map((listType) => (<option key={listType.id} value={listType.id}>{listType.name}</option>))}
                </select>
                <button className="add-list-button" onClick={() => setShowTooltipInput("block")}><i className="fa-solid fa-circle-plus"></i></button>
              </div>
            </div>
          </div>
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
                  <td>{users.find(user => user.id == item.user_id).name}</td>
                  <td>{item.is_split == true ? parseFloat(item.price / users.length).toFixed(2).toString().replace(".", ",") : "-"}</td>
                  <td>
                    <div className="item-action-buttons">
                      <button className="item-action-button" onClick={() => { setShowEditItemPopup("block"); setEditItem(item)}}>
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button className="item-action-button item-action-button-delete" onClick={() => openQuestionPopup(item, "Should this item be deleted?", () => deleteItem(item.id))}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
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
            {isJointActive ? (
            <button className="remove-joint-entries" onClick={() => openQuestionPopup({}, "Are you sure you want to remove all joint entries?", () => clearJointItems())}>
              <i className="fa-solid fa-xmark"></i>
              Remove entries
            </button>
            ) : ""}
            <div style={{display: "flex", gap: "5px"}}>
              {items.length > 0 ? "Total:" : "No items"}
              <p style={{color: "white"}}>
                {items.length > 0 ?
                  (parseFloat(activeUserId != 0 ? userMoney.replace(",", ".") : monthlyMoney)
                  +
                  items.filter(item => item.is_split == true).reduce((pre, item) => parseFloat(pre) + parseFloat(item.price) / users.length, 0)
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
      <AddItemPopup
        setItems={setItems}
        items={items}
        setShow={setShowAddItemPopup}
        show={showAddItemPopup}
        isJoint={isJointActive}
        users={users}
        activeUserId={activeUserId}
        currentView={currentView}
        currentListType={currentListType} />
      <EditItemPopup
        setItems={setItems}
        items={items}
        item={editItem}
        setShow={setShowEditItemPopup}
        show={showEditItemPopup}
        isJoint={isJointActive}
        users={users}
        activeUserId={activeUserId}
        currentView={currentView}
        currentListType={currentListType} />
      <AddUserPopup
        users={users}
        setUsers={setUsers}
        setShow={setShowAddUserPopup}
        show={showAddUserPopup} />
      <QuestionPopup
        setShow={setShowQuestionPopup}
        show={showQuestionPopup}
        confirmFunction={confirmFunction}
        msg={questionPopupMsg}
        item={currentItem} />
      <TooltipInput setShow={setShowTooltipInput} show={showTooltipInput} />
    </>
  );
}

export default App;
