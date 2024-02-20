import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

function NewListInput(props) {
  const [listName, setListName] = useState("");
  const [listPassword, setListPassword] = useState("");

  const handleEnter = async (e) => {
    props.setIsPending(true);
    if (e.key === "Enter" && listName.length >= 3) {
      props.setShow("none");
      await invoke("get_users").then(async users => {
        console.log(users, props.activeUserId, users.find(user => user.id == parseInt(props.activeUserId)).start_money.toString());
        await invoke("add_list_type", {
          name: listName,
          userId: props.activeUserId,
          isJoint: props.isJoint,
          listMoney: parseFloat(users.find(user => user.id == parseInt(props.activeUserId)).start_money).toFixed(2).toString(),
          listPassword: listPassword
        }).then(async () => {
          await invoke("get_list_types").then(types => props.setListTypes(types))
        });
      });
    }
    else if (e.key === "Enter") {
      alert("List name must be at least 3 characters long.");
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
      <input style={{marginTop: "5px"}} className="text-input newlist-password-input" value={listPassword} onChange={(e) => setListPassword(e.target.value)} onKeyUp={handleEnter} type="text" placeholder="Password / std: -" />
    </div>
  );
}

export default NewListInput;
