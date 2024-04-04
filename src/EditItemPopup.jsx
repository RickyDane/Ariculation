import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

function EditItemPopup(props) {
	const [itemName, setItemName] = useState(props.item.name);
	const [itemCategory, setItemCategory] = useState(props.item.category);
	const [itemPerson, setItemPerson] = useState(props.item.user_id);
	const [itemDescription, setItemDescription] = useState(
		props.item.description
	);
	const [itemPrice, setItemPrice] = useState(
		parseFloat(props.item.price).toFixed(2)
	);
	const [itemSplit, setItemSplit] = useState(props.item.is_split);
	const [itemVisOnUser, setItemVisOnUser] = useState(false);
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

	const handleEditItem = async () => {
		let newItem = {
			id: props.item.id,
			name: itemName,
			category: itemCategory,
			description: itemDescription,
			price: itemPrice,
			is_split: itemSplit,
			user_id: itemPerson,
			is_visible_on_user: itemVisOnUser,
			visibleOnUserList:
				parseInt(visOnUserList) > 0
					? parseInt(visOnUserList)
					: parseInt(props.currentListType),
			listType: props.currentListType,
		};
		await invoke("update_item", {
			id: newItem.id,
			name: newItem.name,
			description: newItem.description,
			price: newItem.price.toString(),
			category: newItem.category,
			isSplit: newItem.is_split != null ? newItem.is_split : false,
			userId: parseInt(newItem.user_id),
			isVisibleOnUser:
				newItem.is_visible_on_user != null ? newItem.is_visible_on_user : false,
			visibleOnUserList: newItem.visibleOnUserList,
			listType: parseInt(newItem.listType),
		});

		switch (props.currentView) {
			case "all":
				await invoke("get_all_items", { listType: props.currentListType }).then(
					(items) => props.setItems(items)
				);
				break;
			case "user":
				await invoke("get_user_items", {
					userId: props.activeUserId,
					listType: props.currentListType,
				}).then((items) => props.setItems(items));
				break;
			case "joint":
				await invoke("get_items", {
					isSplit: true,
					isJoint: props.isJoint,
					listType: props.currentListType,
				}).then((items) => props.setItems(items));
				break;
			default:
				console.log("Invalid view: ", props.currentView);
				return;
		}
		props.setShow("none");
	};
	const refreshPopup = () => {
		setItemName(props.item.name);
		setItemCategory(props.item.category);
		setItemPerson(props.item.user_id);
		setItemDescription(props.item.description);
		setItemPrice(parseFloat(props.item.price).toFixed(2).toString());
		setItemSplit(props.item.is_split);
		setItemVisOnUser(props.item.is_visible_on_user);
	};

	useEffect(() => {
		refreshPopup();
	}, [props.item]);

	return (
		<>
			<div className="add-item-popup" style={{ display: props.show }}>
				<h1 className="add-item-popup-title">Edit Item</h1>
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
							<div
								style={{ display: "flex", alignItems: "center", gap: "10px" }}
							>
								<input
									id="edit-split-checkbox"
									type="checkbox"
									className="add-item-popup-checkbox"
									checked={itemSplit}
									onChange={handleSplitChange}
								/>
								<label
									htmlFor="edit-split-checkbox"
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
											gap: "10px",
										}}
									>
										<input
											id="edit-user-vis-checkbox"
											type="checkbox"
											className="add-item-popup-checkbox"
											checked={itemVisOnUser}
											onChange={handleVisOnUserChange}
										/>
										<label
											htmlFor="edit-user-vis-checkbox"
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
								onClick={handleEditItem}
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
export default EditItemPopup;
