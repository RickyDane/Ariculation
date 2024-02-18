import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

function TooltipInput(props) {
  const [listName, setListName] = useState("");

  return (
    <div className="tooltip-input" style={{display: props.show}} >
      <input className="text-input new-list-tooltip-input" onBlur={() => props.setShow("none")} value={listName} onChange={(e) => setListName(e.target.value)} placeholder="New list .." onKeyUp={
        async (e) => {
          props.setIsPending(true);
          if (e.key === "Enter" && listName.length >= 3) {
            props.setShow("none");
            await invoke("add_list_type", { name: listName, userId: props.activeUserId, isJoint: props.isJoint }).then(async () => {
              await invoke("get_list_types").then(types => props.setListTypes(types))
            });
            setListName("");
          }
          else if (e.key === "Enter") {
            alert("List name must be at least 3 characters long.");
          }
          else if (e.key === "Escape") {
            props.setShow("none");
          }
          props.setIsPending(false);
        }
      } />
    </div>
  );
}

export default TooltipInput;
