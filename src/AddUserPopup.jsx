import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function AddUserPopup(props) {
	const [userName, setUserName] = useState("");
	const [userMoney, setUserMoney] = useState(0);

	const handleNameChange = (e) => {
		setUserName(e.target.value);
	};
	const handleMoneyChange = (e) => {
		setUserMoney(e.target.value);
	};
	const handleAddUser = async () => {
		if (!userName.length > 0) {
			alert("Type in a username");
			return;
		}
		if (!userMoney.length > 0) {
			alert("Type in an amount of money to start");
			return;
		}
		props.setIsPending(true);
		props.setShow("none");
		let newUser = {
			name: userName,
			money: userMoney,
			ref_id: crypto.randomUUID(),
		};
		await invoke("add_user", {
			name: newUser.name,
			startMoney: newUser.money.toString(),
			lastListId: 0,
			refId: newUser.ref_id,
		});
		await invoke("get_users").then(async (users) => {
			props.setUsers(users);
			console.log(users.find((user) => user.ref_id == newUser.ref_id).id);
			await invoke("add_list_type", {
				listPassword: "",
				listMoney: parseFloat(userMoney).toFixed(2).toString(),
				name: "Default",
				userId: users.find((user) => user.ref_id == newUser.ref_id).id,
				isJoint: false,
			});
		});
		props.setIsPending(false);
	};

	useEffect(() => {
		setUserName("");
		setUserMoney(0);
	}, [props.show]);

	return (
		<>
			<div className="add-item-popup" style={{ display: props.show }}>
				<h1 className="add-item-popup-title">Add user</h1>
				<div className="add-item-popup-body">
					<div className="add-item-popup-upper-body">
						<input
							type="text"
							className="add-item-popup-input"
							value={userName}
							onChange={handleNameChange}
							placeholder="Name"
						/>
					</div>
					<div className="add-item-popup-bottom-body">
						<div>
							<p
								style={{
									color: "gray",
									fontWeight: "lighter",
									fontSize: "0.9em",
								}}
							>
								Start money
							</p>
							<input
								type="number"
								className="add-item-popup-input add-item-popup-input-price"
								value={userMoney}
								onChange={handleMoneyChange}
								placeholder="0,00 €"
							/>
						</div>
					</div>
					<div className="add-item-popup-footer">
						<div></div>
						<div className="add-item-popup-button-container">
							<button
								className="add-item-popup-button add-item-popup-button-cancel"
								onClick={() => props.setShow("none")}
							>
								Cancel
							</button>
							<button
								className="add-item-popup-button add-item-popup-button-confirm"
								onClick={handleAddUser}
							>
								Save
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
export default AddUserPopup;
