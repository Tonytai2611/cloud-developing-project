import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { useAdminMenuCategoryForm } from '../hooks/useAdminMenuCategoryForm';

export default function AdminMenuForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const {
        dishes,
        dragActive,
        formData,
        handleAddDish,
        handleDeleteDish,
        handleDishInputChange,
        handleDrag,
        handleDrop,
        handleImageUpload,
        handleSubmit,
        isEditMode,
        isUploading,
        loading,
        removeImage,
        setFormData
    } = useAdminMenuCategoryForm({ id, navigate });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin/manage-menu')}
                        className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-4 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Menu List
                    </button>
                    <h1 className="text-4xl font-bold text-gray-800">
                        {isEditMode ? 'Edit Menu Category' : 'Create New Menu Category'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isEditMode ? 'Update your menu category details' : 'Add a new category to your menu'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-teal-500 rounded-full"></div>
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Menu ID */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Menu ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    disabled={isEditMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                                    placeholder="e.g., 1, 2, 3"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Unique identifier for this category</p>
                            </div>

                            {/* Menu Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Menu Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    placeholder="e.g., Main Course, Beverages"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Display name for this category</p>
                            </div>
                        </div>
                    </div>

                    {/* Dishes Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <div className="w-2 h-6 bg-teal-500 rounded-full"></div>
                                Dishes <span className="text-sm font-normal text-gray-500">({dishes.length}/6)</span>
                            </h2>
                            <button
                                type="button"
                                onClick={handleAddDish}
                                disabled={dishes.length >= 6}
                                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-xl hover:bg-teal-600 transition-all text-sm font-medium shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                Add Dish
                            </button>
                        </div>

                        <div className="space-y-6">
                            {dishes.map((dish, index) => (
                                <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white hover:border-teal-200 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800 text-lg">Dish {index + 1}</h3>
                                        {dishes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDish(index)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Left Column - Form Fields */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Dish Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dish.name || ''}
                                                    onChange={(e) => handleDishInputChange(index, 'name', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., Special Beef Pho"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Price (₫) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={dish.price || ''}
                                                    onChange={(e) => handleDishInputChange(index, 'price', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., 65000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={dish.description || ''}
                                                    onChange={(e) => handleDishInputChange(index, 'description', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                                                    placeholder="e.g., Traditional Vietnamese beef noodle soup"
                                                    rows="3"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column - Image Upload */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Dish Image
                                            </label>

                                            {!dish.image ? (
                                                <div
                                                    onDragEnter={(e) => handleDrag(e, index)}
                                                    onDragLeave={(e) => handleDrag(e, index)}
                                                    onDragOver={(e) => handleDrag(e, index)}
                                                    onDrop={(e) => handleDrop(e, index)}
                                                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${dragActive[index]
                                                            ? 'border-teal-500 bg-teal-50'
                                                            : 'border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/50'
                                                        }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(index, e)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        disabled={isUploading}
                                                    />
                                                    <div className="text-center">
                                                        <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                                                            <Upload className="w-8 h-8 text-teal-600" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-1">
                                                            {isUploading ? 'Uploading...' : 'Drop image here or click to upload'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            PNG, JPG, GIF up to 10MB
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative group rounded-2xl overflow-hidden border-2 border-gray-200">
                                                    <img
                                                        src={dish.image}
                                                        alt={dish.name || 'Dish preview'}
                                                        className="w-full h-64 object-cover"
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/400x300/gray/white?text=Image+Not+Found';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleImageUpload(index, e)}
                                                                className="hidden"
                                                                disabled={isUploading}
                                                            />
                                                            Change
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Manual URL Input */}
                                            <div className="mt-4">
                                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                                    Or enter image URL:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dish.image || ''}
                                                    onChange={(e) => handleDishInputChange(index, 'image', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all"
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 sticky bottom-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Menu' : 'Create Menu')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/manage-menu')}
                            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
