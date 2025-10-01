import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Saree } from '../types/models';

interface ProductFormProps {
  initialData?: Partial<Saree>;
  onSubmit: (data: Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Saree>>(initialData || {
    name: '',
    price: 0,
    category: '',
    stock: 0,
    imageUrl: '',
    priceType: 'fixed',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      stock: Number(formData.stock) || 0, // ✅ ensure stock is a number
      price: formData.priceType === 'fixed' ? Number(formData.price) || 0 : 0,
    } as Omit<Saree, 'id' | 'createdAt' | 'updatedAt'>);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 space-y-4"
      onSubmit={handleSubmit}
    >
      <h3 className="text-lg font-semibold">
        {initialData ? 'Edit Product' : 'Add New Product'}
      </h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>

        {/* Price Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Price Type</label>
          <select
            value={formData.priceType || 'fixed'}
            onChange={(e) => setFormData({ ...formData, priceType: e.target.value as 'fixed' | 'dm' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="fixed">Fixed Price</option>
            <option value="dm">DM Price</option>
          </select>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            min="0"
            value={formData.stock ?? 0}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
            placeholder="Enter available stock"
          />
        </div>

        {/* Price (only if fixed) */}
        {formData.priceType === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            rows={3}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="">Select category</option>
            <option value="Silk">Silk</option>
            <option value="Cotton">Cotton</option>
            <option value="Linen">Linen</option>
            <option value="Designer">Designer</option>
            <option value="Traditional">Traditional</option>
          </select>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="url"
            value={formData.imageUrl || ''}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {initialData ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </motion.form>
  );
};
