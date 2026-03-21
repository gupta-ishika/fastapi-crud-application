export default function ItemCard({ item, onEdit, onDelete }) {
  return (
    <div className="item-card">
      <div className="item-card-header">
        <h3>{item.name}</h3>
        <span className="price-badge">${Number(item.price).toFixed(2)}</span>
      </div>
      {item.description && (
        <p className="item-description">{item.description}</p>
      )}
      <div className="item-actions">
        <button className="btn btn-edit" onClick={() => onEdit(item)}>
          ✏️ Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(item.id)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}
