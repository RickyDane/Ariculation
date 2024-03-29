import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function AddItemPopup(props) {
	const [itemName, setItemName] = useState("");
	const [itemCategory, setItemCategory] = useState("");
	const [itemPerson, setItemPerson] = useState(props.activeUserId.toString());
	const [itemDescription, setItemDescription] = useState("");
	const [itemPrice, setItemPrice] = useState(0);
	const [itemSplit, setItemSplit] = useState(false);
	const [itemVisOnUser, setItemVisOnUser] = useState(
		props.activeUserId > 0 ? true : false
	);
	const [visOnUserList, setVisOnUserList] = useState(0);

	const handleNameChange = (e) => {
		setItemName(e.target.value);
	};
	const handleCategoryChange = (e) => {
		setItemCategory(e.target.value);
	};
	const handlePersonChange = (e) => {
		setItemPerson(e.target.value);
	};
	const handleDescriptionChange = (e) => {
		setItemDescription(e.target.value);
	};
	const handlePriceChange = (e) => {
		setItemPrice(e.target.value);
	};
	const handleSplitChange = (e) => {
		setItemSplit(e.target.checked);
	};
	const handleVisOnUserChange = (e) => {
		setItemVisOnUser(e.target.checked);
	};

	const handleAddItem = async () => {
		console.log(
			props.activeUserId,
			itemName,
			itemCategory,
			itemPerson,
			itemDescription,
			itemPrice,
			itemSplit,
			itemVisOnUser
		);
		if (!itemName.length > 0) {
			return;
		}
		if (!itemCategory.length > 0) {
			return;
		}
		if (!itemPerson > 0) {
			return;
		}
		if (itemPrice == null) {
			return;
		}
		await invoke("add_item", {
			name: itemName,
			description: itemDescription,
			price: itemPrice.toString(),
			user: itemPerson,
			category: itemCategory,
			isSplit: itemSplit,
			isJoint: props.isJoint,
			userId: parseInt(itemPerson),
			isVisibleOnUser: itemVisOnUser,
			visibleOnUserList:
				parseInt(visOnUserList) > 0
					? parseInt(visOnUserList)
					: parseInt(props.currentListType),
			listType: parseInt(props.currentListType),
		});

		switch (props.currentView) {
			case "all":
				await invoke("get_all_items", {
					listType: parseInt(props.currentListType),
				}).then((items) => props.setItems(items));
				break;
			case "user":
				await invoke("get_user_items", {
					userId: props.activeUserId,
					listType: parseInt(props.currentListType),
				}).then((items) => props.setItems(items));
				break;
			case "joint":
				await invoke("get_items", {
					isSplit: true,
					isJoint: props.isJoint,
					listType: parseInt(props.currentListType),
				}).then((items) => props.setItems(items));
				break;
			default:
				console.log("Invalid view: ", props.currentView);
				return;
		}
		// props.setShow("none");
		clearFields();
	};

	const clearFields = () => {
		setItemSplit(false);
		setItemName("");
		setItemCategory("");
		setItemPerson(parseInt(props.activeUserId));
		setItemDescription("");
		setItemPrice(0);
		// setItemVisOnUser(false);
	};

	useEffect(() => {
		clearFields();
	}, [props.show]);

	return (
		<>
			<div className="add-item-popup" style={{ display: props.show }}>
				<h1 className="add-item-popup-title">Add Item</h1>
				<div className="add-item-popup-body">
					<div className="add-item-popup-upper-body">
						<div className="add-item-popup-left-body">
							<input
								type="text"
								className="add-item-popup-input"
								value={itemName}
								onChange={handleNameChange}
								placeholder="Name"
							/>
							<input
								type="text"
								className="add-item-popup-input"
								value={itemCategory}
								onChange={handleCategoryChange}
								placeholder="Category"
							/>
							<select
								className="item-select"
								value={itemPerson}
								onChange={handlePersonChange}
							>
								{props.users.map((user) => (
									<option key={user.id} value={user.id}>
										{user.name}
									</option>
								))}
								<option value="0">-</option>
							</select>
						</div>
						<div className="add-item-popup-right-body">
							<textarea
								className="add-item-popup-textarea"
								value={itemDescription}
								onChange={handleDescriptionChange}
								placeholder="Description"
							></textarea>
						</div>
					</div>
					<div className="add-item-popup-bottom-body">
						<input
							type="number"
							className="add-item-popup-input add-item-popup-input-price"
							value={itemPrice}
							onChange={handlePriceChange}
							placeholder="0,00 €"
						/>
					</div>
					<div className="add-item-popup-footer">
						<div className="add-item-popup-checkbox-container">
							<div style={{ display: "flex", alignItems: "center" }}>
								<input
									id="split-checkbox"
									type="checkbox"
									className="add-item-popup-checkbox"
									checked={itemSplit}
									onChange={handleSplitChange}
								/>
								<label
									htmlFor="split-checkbox"
									className="add-item-popup-checkbox-label"
								>
									Split
								</label>
							</div>
							{props.activeUserId > 0 ? (
								""
							) : (
								<div
									style={{
										display: "flex",
										flexFlow: "column",
										alignItems: "flex-start",
										gap: "5px",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
										}}
									>
										<input
											id="user-vis-checkbox"
											type="checkbox"
											className="add-item-popup-checkbox"
											checked={itemVisOnUser}
											onChange={handleVisOnUserChange}
										/>
										<label
											htmlFor="user-vis-checkbox"
											className="add-item-popup-checkbox-label"
										>
											Visible on user
										</label>
									</div>
									{itemVisOnUser && (
										<select
											className="item-select"
											value={visOnUserList}
											onChange={(e) => setVisOnUserList(e.target.value)}
										>
											{props.listTypes
												.filter((item) => item.user_id == itemPerson)
												.map((listType) => (
													<option value={listType.id}>{listType.name}</option>
												))}
										</select>
									)}
								</div>
							)}
						</div>
						<div className="add-item-popup-button-container">
							<button
								className="add-item-popup-button add-item-popup-button-cancel"
								onClick={() => props.setShow("none")}
							>
								Cancel
							</button>
							<button
								className="add-item-popup-button add-item-popup-button-confirm"
								onClick={handleAddItem}
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
export default AddItemPopup;
