
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function AddUserPopup(props) {
  const [userName, setUserName] = useState("User");
  const [userMoney, setUserMoney] = useState(0);

  const handleNameChange = (e) => {
    setUserName(e.target.value);
  }
  const handleMoneyChange = (e) => {
    setUserMoney(e.target.value);
  }
  const handleAddUser = async () => {
    if (!userName.length > 0) { return; }
    if (!userMoney.length > 0) { return; }
    let newUser = {
      name: userName,
      money: userMoney
    }
    await invoke("add_user", { name: newUser.name, startMoney: newUser.money.toString() });
    await invoke("get_users").then(users => props.setUsers(users));
    props.setShow("none");
  }

  useEffect(() => {
    setUserName("User");
    setUserMoney(0);
  }, [props.show]);

  return (
    <>
      <div className="add-item-popup" style={{display: props.show}}>
        <h1 className="add-item-popup-title">Add user</h1>
        <div className="add-item-popup-body">
          <div className="add-item-popup-upper-body">
            <input type="text" className="add-item-popup-input" value={userName} onChange={handleNameChange} placeholder="Name" />
          </div>
          <div className="add-item-popup-bottom-body">
            <input type="number" className="add-item-popup-input add-item-popup-input-price" value={userMoney} onChange={handleMoneyChange} placeholder="0,00 €" />
          </div>
          <div className="add-item-popup-footer">
            <div></div>
            <div className="add-item-popup-button-container">
              <button className="add-item-popup-button add-item-popup-button-cancel" onClick={() => props.setShow("none")}>Cancel</button>
              <button className="add-item-popup-button add-item-popup-button-confirm" onClick={handleAddUser}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default AddUserPopup;
