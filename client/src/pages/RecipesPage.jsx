import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import { formatCurrency, formatPercent } from '../utils/helpers';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Main Course', selling_price: '', instructions: '', ingredients: [] });

  useEffect(() => { loadRecipes(); loadItems(); }, []);

  const loadRecipes = async () => {
    try {
      const { data } = await API.get('/recipes');
      setRecipes(data);
    } catch (err) { toast.error('Failed to load recipes'); }
    finally { setLoading(false); }
  };

  const loadItems = async () => {
    try {
      const { data } = await API.get('/inventory');
      setItems(data);
    } catch (err) { /* optional */ }
  };

  const viewDetail = async (id) => {
    try {
      const { data } = await API.get(`/recipes/${id}`);
      setDetailRecipe(data);
      setShowDetailModal(true);
    } catch (err) { toast.error('Failed to load recipe'); }
  };

  const openEdit = async (id) => {
    try {
      const { data } = await API.get(`/recipes/${id}`);
      setEditing(id);
      setForm({
        name: data.name, category: data.category || 'Main Course',
        selling_price: data.selling_price, instructions: data.instructions || '',
        ingredients: data.ingredients.map(ing => ({
          item_id: ing.item_id, quantity: ing.quantity, unit: ing.unit,
        })),
      });
      setShowModal(true);
    } catch (err) { toast.error('Failed to load recipe'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/recipes/${editing}`, form);
        toast.success('Recipe updated');
      } else {
        await API.post('/recipes', form);
        toast.success('Recipe created');
      }
      setShowModal(false); setEditing(null);
      setForm({ name: '', category: 'Main Course', selling_price: '', instructions: '', ingredients: [] });
      loadRecipes();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await API.delete(`/recipes/${id}`);
      toast.success('Recipe deleted');
      loadRecipes();
    } catch (err) { toast.error('Delete failed'); }
  };

  const addIngredient = () => {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { item_id: '', quantity: '', unit: 'kg' }] }));
  };

  const removeIngredient = (idx) => {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const updateIngredient = (idx, field, value) => {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing),
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pt-8 lg:pt-0">
      <PageHeader title="Recipe Management" subtitle={`${recipes.length} recipes`}
        action={
          <button onClick={() => { setEditing(null); setForm({ name: '', category: 'Main Course', selling_price: '', instructions: '', ingredients: [] }); setShowModal(true); }} className="btn-primary">
            <HiOutlinePlus className="w-4 h-4 inline mr-1" />Add Recipe
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(recipe => (
          <div key={recipe.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{recipe.category}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                parseFloat(recipe.food_cost_pct) > 35 ? 'bg-red-100 text-red-700' :
                parseFloat(recipe.food_cost_pct) > 30 ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {formatPercent(recipe.food_cost_pct)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Selling Price</p>
                <p className="font-medium">{formatCurrency(recipe.selling_price)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Recipe Cost</p>
                <p className="font-medium">{formatCurrency(recipe.recipe_cost)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1 border-t border-gray-100 pt-3">
              <button onClick={() => viewDetail(recipe.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><HiOutlineEye className="w-4 h-4" /></button>
              <button onClick={() => openEdit(recipe.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><HiOutlinePencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(recipe.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={detailRecipe?.name || 'Recipe'} size="lg">
        {detailRecipe && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="card bg-blue-50 p-3"><p className="text-xs text-blue-600">Selling Price</p><p className="font-bold text-lg">{formatCurrency(detailRecipe.selling_price)}</p></div>
              <div className="card bg-red-50 p-3"><p className="text-xs text-red-600">Recipe Cost</p><p className="font-bold text-lg">{formatCurrency(detailRecipe.recipe_cost)}</p></div>
              <div className="card bg-green-50 p-3"><p className="text-xs text-green-600">Food Cost %</p><p className="font-bold text-lg">{formatPercent(detailRecipe.food_cost_pct)}</p></div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Ingredients</h4>
              <table className="w-full text-left">
                <thead><tr>
                  <th className="table-header">Ingredient</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Unit</th>
                  <th className="table-header">Cost</th>
                </tr></thead>
                <tbody>
                  {detailRecipe.ingredients?.map((ing, i) => (
                    <tr key={i}>
                      <td className="table-cell">{ing.ingredient_name}</td>
                      <td className="table-cell">{ing.quantity}</td>
                      <td className="table-cell">{ing.unit}</td>
                      <td className="table-cell">{formatCurrency(ing.ingredient_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detailRecipe.instructions && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Instructions</h4>
                <p className="text-sm text-gray-600">{detailRecipe.instructions}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Recipe' : 'New Recipe'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Menu Item Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {['Main Course','Starter','Dessert','Beverage','Side','Breakfast'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Selling Price ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.selling_price} onChange={e => setForm(f => ({...f, selling_price: e.target.value}))} required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Ingredients</label>
              <button type="button" onClick={addIngredient} className="text-blue-600 text-sm font-medium hover:underline">+ Add Ingredient</button>
            </div>
            {form.ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <select className="input-field" value={ing.item_id} onChange={e => updateIngredient(idx, 'item_id', e.target.value)} required>
                    <option value="">Select item</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({formatCurrency(i.unit_cost)}/{i.unit})</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <input type="number" step="0.001" min="0" className="input-field" placeholder="Qty" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} required />
                </div>
                <div className="w-20">
                  <input className="input-field" placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} required />
                </div>
                <button type="button" onClick={() => removeIngredient(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded"><HiOutlineTrash className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Instructions</label>
            <textarea className="input-field" rows={3} value={form.instructions} onChange={e => setForm(f => ({...f, instructions: e.target.value}))} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
