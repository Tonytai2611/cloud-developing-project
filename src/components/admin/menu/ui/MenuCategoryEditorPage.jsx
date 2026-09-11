/* Hallmark · pre-emit critique: P4 H5 E5 S5 R5 V4 */
import React from 'react';
import { ChevronRight, Folder, ImageOff, Link as LinkIcon, Plus, Trash2, Upload, UtensilsCrossed } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminMenuCategoryForm } from '../../hooks/useAdminMenuCategoryForm';
import AdminWorkspaceShell from '../../shared/AdminWorkspaceShell';

const inputClass = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100';

export default function MenuCategoryEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editor = useAdminMenuCategoryForm({ id: searchParams.get('id'), navigate });

  return (
    <AdminWorkspaceShell title={editor.isEditMode ? 'Edit Menu Category' : 'Create Menu Category'} subtitle="Keep category details and dishes organized.">
      <div className="space-y-5 pb-24">
        <div>
          <nav className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500"><button onClick={() => navigate('/admin')} className="hover:text-teal-700">Dashboard</button><ChevronRight className="h-4 w-4" /><button onClick={() => navigate('/admin/manage-menu')} className="hover:text-teal-700">Menu Management</button><ChevronRight className="h-4 w-4" /><span className="text-teal-700">{editor.isEditMode ? 'Edit Category' : 'Create Category'}</span></nav>
          <h1 className="font-serif text-4xl font-bold text-slate-950">{editor.isEditMode ? 'Edit Menu Category' : 'Create Menu Category'}</h1>
          <p className="mt-1 text-slate-500">{editor.isEditMode ? 'Update this category and its dishes.' : 'Add a new category and its dishes to your menu.'}</p>
        </div>

        <form onSubmit={editor.handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-700"><Folder className="h-5 w-5" /></span><div><h2 className="font-serif text-2xl font-bold text-slate-950">Basic Information</h2><p className="text-sm text-slate-500">Set the identifier and display title.</p></div></div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Category ID <span className="text-red-500">*</span></span><input value={editor.formData.id} onChange={(event) => editor.setFormData({ ...editor.formData, id: event.target.value })} disabled={editor.isEditMode} required placeholder="e.g. 1, 2, beverages" className={inputClass} /><span className="mt-2 block text-xs text-slate-500">Unique category identifier; it cannot be changed later.</span></label>
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Category Title <span className="text-red-500">*</span></span><input value={editor.formData.title} onChange={(event) => editor.setFormData({ ...editor.formData, title: event.target.value })} required placeholder="e.g. Main Course, Beverages" className={inputClass} /><span className="mt-2 block text-xs text-slate-500">Visible to both staff and customers.</span></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-700"><UtensilsCrossed className="h-5 w-5" /></span><div><h2 className="font-serif text-2xl font-bold text-slate-950">Dishes <span className="text-base font-medium text-slate-500">({editor.dishes.length}/6)</span></h2><p className="text-sm text-slate-500">Add up to six dishes to this category.</p></div></div><button type="button" onClick={editor.handleAddDish} disabled={editor.dishes.length >= 6} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Plus className="h-4 w-4" /> Add Dish</button></div>

            <div className="space-y-5">{editor.dishes.map((dish, index) => (
              <article key={index} className="overflow-hidden rounded-2xl border border-slate-200">
                <header className="flex items-center justify-between border-b border-slate-200 bg-teal-50/50 px-5 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-teal-100 font-black text-teal-800">{index + 1}</span><h3 className="font-bold text-slate-900">Dish {index + 1}</h3></div>{editor.dishes.length > 1 && <button type="button" onClick={() => editor.handleDeleteDish(index)} aria-label={`Remove dish ${index + 1}`} className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>}</header>
                <div className="grid min-w-0 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
                  <div className="space-y-4">
                    <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Dish Name <span className="text-red-500">*</span></span><input value={dish.name || ''} onChange={(event) => editor.handleDishInputChange(index, 'name', event.target.value)} placeholder="e.g. Special Beef Pho" className={inputClass} /></label>
                    <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Price (VND) <span className="text-red-500">*</span></span><input type="number" min="0" value={dish.price || ''} onChange={(event) => editor.handleDishInputChange(index, 'price', event.target.value)} placeholder="e.g. 65000" className={inputClass} /></label>
                    <label className="block"><span className="mb-2 block text-sm font-bold text-slate-800">Description</span><textarea value={dish.description || ''} onChange={(event) => editor.handleDishInputChange(index, 'description', event.target.value)} placeholder="Describe the dish in a short, appealing way." rows="4" className={`${inputClass} h-auto resize-y py-3`} /></label>
                  </div>
                  <div className="min-w-0">
                    <span className="mb-2 block text-sm font-bold text-slate-800">Dish Image</span>
                    {!dish.image ? <div onDragEnter={(event) => editor.handleDrag(event, index)} onDragLeave={(event) => editor.handleDrag(event, index)} onDragOver={(event) => editor.handleDrag(event, index)} onDrop={(event) => editor.handleDrop(event, index)} className={`relative grid min-h-40 place-items-center rounded-2xl border-2 border-dashed p-6 text-center ${editor.dragActive[index] ? 'border-teal-600 bg-teal-50' : 'border-slate-300 bg-slate-50'}`}><input type="file" accept="image/*" onChange={(event) => editor.handleImageUpload(index, event)} disabled={editor.isUploading} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-700">{editor.isUploading ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" /> : <Upload className="h-6 w-6" />}</span><p className="mt-3 text-sm font-bold text-slate-800">Drop image here or click to upload</p><p className="mt-1 text-xs text-slate-500">PNG, JPG or GIF up to 10MB</p></div></div> : <div className="relative overflow-hidden rounded-2xl border border-slate-200"><img src={dish.image} alt={dish.name || 'Dish preview'} className="h-48 w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><div className="flex items-center justify-between gap-3 p-3"><span className="flex items-center gap-2 text-xs text-slate-500"><ImageOff className="h-4 w-4" /> Image preview</span><button type="button" onClick={() => editor.removeImage(index)} className="text-sm font-bold text-red-600 hover:text-red-700">Remove</button></div></div>}
                    <label className="mt-4 block"><span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600"><LinkIcon className="h-4 w-4" /> Or enter image URL</span><input value={dish.image || ''} onChange={(event) => editor.handleDishInputChange(index, 'image', event.target.value)} placeholder="https://example.com/image.jpg" className={inputClass} /></label>
                  </div>
                </div>
              </article>
            ))}</div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64"><div className="mx-auto flex max-w-[1544px] justify-end gap-3"><button type="button" onClick={() => navigate('/admin/manage-menu')} className="h-12 min-w-32 rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={editor.loading} className="h-12 min-w-48 rounded-xl bg-teal-700 px-6 font-bold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">{editor.loading ? 'Saving…' : editor.isEditMode ? 'Update Category' : 'Create Category'}</button></div></div>
        </form>
      </div>
    </AdminWorkspaceShell>
  );
}
