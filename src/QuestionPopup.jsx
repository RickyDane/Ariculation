
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function QuestionPopup(props) {
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
        <h1 className="add-item-popup-title">{props.msg}</h1>
        <div className="add-item-popup-body">
          <div className="add-item-popup-upper-body">
            <p style={{color: "white"}}>Id: {props.item.id}</p>
            <p style={{color: "white"}}>Name: {props.item.name}</p>
          </div>
          <div className="add-item-popup-footer">
            <div></div>
            <div className="add-item-popup-button-container">
              <button className="add-item-popup-button add-item-popup-button-confirm" style={{color: "white"}} onClick={() => props.setShow("none")}>Cancel</button>
              <button className="add-item-popup-button add-item-popup-button-cancel" style={{color: "red"}} onClick={() => { props.confirmFunction(); props.setShow("none"); }}><i className="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default QuestionPopup;
