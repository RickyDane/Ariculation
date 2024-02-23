import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

function NewListInput(props) {
  const [listName, setListName] = useState("");
  const [listPassword, setListPassword] = useState("");
  const [valListPassword, setValListPassword] = useState("");

  const handleEnter = async (e) => {
    props.setIsPending(true);
    if (e.key === "Enter") {
      if (listName.length >= 3 && listPassword === valListPassword) {
        props.setShow("none");
        await invoke("get_users").then(async users => {
          let money = props.activeUserId > 0 ? parseFloat(users.find(user => user.id == parseInt(props.activeUserId)).start_money).toFixed(2).toString() : "0.00";
          await invoke("add_list_type", {
            name: listName,
            userId: props.activeUserId,
            isJoint: props.isJoint,
            listMoney: money,
            listPassword: listPassword
          }).then(async () => {
            await invoke("get_list_types").then(types => props.setListTypes(types))
          });
        });
      }
      else if (listPassword !== valListPassword) {
        alert("Passwords do not match.");
      }
      else if (e.taget.value.length < 3) {
        alert("List name must be at least 3 characters long.");
      }
    }
    else if (e.key === "Escape") {
      props.setShow("none");
    }
    props.setIsPending(false);
  }

  return (
    <div className="newlist-input-container" style={{display: props.show}} >
      <input className="text-input newlist-name-input" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="New list .." onKeyUp={handleEnter} />
      <br/>
      <input type="password" style={{marginTop: "5px"}} className="text-input newlist-password-input" value={listPassword} onChange={(e) => setListPassword(e.target.value)} onKeyUp={handleEnter} placeholder="Password" />
      <br/>
      <input type="password" style={{ marginTop: "5px"}} className="text-input newlist-password-input" value={valListPassword} onChange={(e) => setValListPassword(e.target.value)} onKeyUp={handleEnter} placeholder="Repeat password" />
    </div>
  );
}

export default NewListInput;
