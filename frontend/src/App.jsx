import { useState, useEffect, useCallback } from 'react'
import ItemForm from './components/ItemForm'
import ItemCard from './components/ItemCard'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import { getItems, createItem, updateItem, deleteItem } from './api/items'
import { getMe, logout, getToken } from './api/auth'

// ── Simple toast ──────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onDismiss}>×</button>
    </div>
  )
}

export default function App() {
  // Auth state
  const [page,    setPage]    = useState(getToken() ? 'dashboard' : 'login')
  const [user,    setUser]    = useState(null)

  // Dashboard state
  const [items,    setItems]    = useState([])
  const [editItem, setEditItem] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [toast,    setToast]    = useState(null)  // { message, type }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type })
  const dismissToast = useCallback(() => setToast(null), [])

  const fetchUser = async () => {
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      handleLogout()
    }
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await getItems()
      setItems(res.data)
    } catch (err) {
      if (err?.response?.status === 401) handleLogout()
      else showToast('Could not load items — is the backend running?', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Auth callbacks ────────────────────────────────────────────────────────────
  const handleLogin = () => {
    setPage('dashboard')
    fetchUser()
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setItems([])
    setPage('login')
  }

  // Fetch data when dashboard loads
  useEffect(() => {
    if (page === 'dashboard') {
      fetchUser()
      fetchItems()
    }
  }, [page])

  // ── CRUD callbacks ────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    try {
      const res = await createItem(data)
      setItems((prev) => [...prev, res.data])
      showToast('Item created successfully!')
    } catch (err) {
      const detail = err?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Failed to create item.', 'error')
    }
  }

  const handleUpdate = async (data) => {
    try {
      const res = await updateItem(editItem.id, data)
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? res.data : i)))
      setEditItem(null)
      showToast('Item updated successfully!')
    } catch (err) {
      const detail = err?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Failed to update item.', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    try {
      await deleteItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      showToast('Item deleted.')
    } catch (err) {
      const detail = err?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Failed to delete item.', 'error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (page === 'login')
    return <LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />
  if (page === 'register')
    return <RegisterPage onLogin={handleLogin} onGoLogin={() => setPage('login')} />

  return (
    <div className="app">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
      )}

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <span className="logo">🛒</span>
          <h1>Items Manager</h1>
          <div className="header-right">
            {user && (
              <span className="user-badge">
                {user.role === 'admin' ? '👑 ' : '👤 '}
                {user.username}
              </span>
            )}
            <span className="item-count">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
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
          <h2 className="section-title">My Items</h2>

          {loading && <p className="status-text">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="status-text">No items yet — add your first one!</p>
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
