import { invoke } from "@tauri-apps/api";
import { useState } from "react";

export default function ShoppingListPopup(props) {
	const [chosenListType, setChosenListType] = useState(1);
	const [shoppingListItems, setShoppingListItems] = useState([]);
	const [newItemName, setNewItemName] = useState("");
	const [isPending, setIsPending] = useState(false);
	const loadShoppingListItems = async () => {
		await invoke("get_shopping_list_items", {
			listType: chosenListType,
		}).then((items) => {
			setShoppingListItems(items);
		});
	};
	const addShoppingListItems = async (item) => {
		setIsPending(true);
		await invoke("add_shopping_list_item", {
			// listType: chosenListType,
			itemName: item.name,
			// itemprice: item.price,
		});
		setShoppingListItems([...shoppingListItems, item]);
		setIsPending(false);
	};
	return (
		<div
			className="add-item-popup"
			style={{
				display: props.show,
				flexFlow: "column",
				position: "fixed",
				overflow: "hidden",
			}}
		>
			<div
				className="pending-loader-container"
				style={{
					display: isPending == true ? "block" : "none",
					position: "absolute",
				}}
			>
				<div
					className="pending-loader"
					style={{ display: isPending == true ? "block" : "none" }}
				></div>
			</div>
			<h1 className="add-item-popup-title">Shopping list</h1>
			<div className="add-item-popup-body">
				<div
					className="add-item-popup-upper-body"
					style={{
						display: "flex",
						flexFlow: "column",
						maxHeight: "200px",
						overflowY: "auto",
						padding: "10px",
						gap: 0,
					}}
				>
					{shoppingListItems.map((item, idx) => (
						<label
							className="add-item-popup-item"
							key={idx}
							htmlFor={"shoppling-list-item-checkbox-" + idx}
							style={{ cursor: "pointer" }}
						>
							<div
								style={{
									display: "flex",
									gap: "5px",
									alignItems: "center",
								}}
							>
								<input
									id={"shoppling-list-item-checkbox-" + idx}
									type="checkbox"
									style={{ width: "25px", height: "25px" }}
									onChange={() => {
										const newItems = [...shoppingListItems];
										newItems[idx].checked = !newItems[idx].checked;
										setShoppingListItems(newItems);
									}}
								/>
								<div className="add-item-popup-item-name">{item.name}</div>
							</div>
							<div style={{ display: "flex", alignItems: "center" }}>
								<input
									className="add-item-popup-item-price text-input"
									style={{
										width: "100px",
										textAlign: "right",
										fontSize: "16px",
										backgroundColor: "transparent",
										padding: "2px 5px",
									}}
									placeholder="0.00"
									onChange={(e) => {
										const newItems = [...shoppingListItems];
										newItems[idx].price = e.target.value;
										setShoppingListItems(newItems);
									}}
								/>
								<button
									className="add-item-popup-item-delete"
									style={{
										padding: "5px",
										backgroundColor: "transparent",
										border: "none",
										fontSize: "16px",
										cursor: "pointer",
									}}
									onClick={() => {
										const newItems = [...shoppingListItems];
										newItems.splice(idx, 1);
										setShoppingListItems(newItems);
									}}
								>
									<i className="fa-solid fa-trash"></i>
								</button>
							</div>
						</label>
					))}
				</div>
				<div
					className="add-item-popup-footer"
					style={{
						width: "100%",
						display: "flex",
						justifyContent: "space-between",
						paddingTop: "20px",
					}}
				>
					<input
						className="text-input"
						type="text"
						placeholder="Add item +"
						value={newItemName}
						onChange={(e) => setNewItemName(e.target.value)}
						onKeyUp={(e) => {
							if (e.key === "Enter" && newItemName != "") {
								addShoppingListItems({
									name: newItemName,
									price: 0,
								});
								setNewItemName("");
							}
						}}
					/>
					<div className="add-item-popup-button-container">
						<button
							className="add-item-popup-button add-item-popup-button-confirm"
							onClick={() => props.setShow("none")}
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
