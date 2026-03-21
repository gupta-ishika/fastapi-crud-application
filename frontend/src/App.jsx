import { useState, useEffect } from 'react'
import ItemForm from './components/ItemForm'
import ItemCard from './components/ItemCard'
import { getItems, createItem, updateItem, deleteItem } from './api/items'

export default function App() {
  const [items, setItems] = useState([])
  const [editItem, setEditItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all items on mount
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await getItems()
      setItems(res.data)
      setError(null)
    } catch (err) {
      setError('Could not connect to the backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    try {
      const res = await createItem(data)
      setItems([...items, res.data])
    } catch (err) {
      alert('Failed to create item.')
    }
  }

  const handleUpdate = async (data) => {
    try {
      const res = await updateItem(editItem.id, data)
      setItems(items.map((i) => (i.id === editItem.id ? res.data : i)))
      setEditItem(null)
    } catch (err) {
      alert('Failed to update item.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    try {
      await deleteItem(id)
      setItems(items.filter((i) => i.id !== id))
    } catch (err) {
      alert('Failed to delete item.')
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <span className="logo">🛒</span>
          <h1>Items Manager</h1>
          <span className="item-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <main className="main">
        {/* Form panel */}
        <aside className="form-panel">
          <ItemForm
            key={editItem ? editItem.id : 'new'}
            initial={editItem || {}}
            onSubmit={editItem ? handleUpdate : handleCreate}
            onCancel={() => setEditItem(null)}
          />
        </aside>

        {/* Items list */}
        <section className="items-panel">
          <h2 className="section-title">All Items</h2>

          {loading && <p className="status-text">Loading…</p>}
          {error && <p className="status-text error">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="status-text">No items yet. Add one!</p>
          )}

          <div className="items-grid">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={setEditItem}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
