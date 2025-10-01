import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { Saree } from '../types/models';
import { ProductForm } from './ProductForm';

interface ProductGridProps {
  products: Saree[];
  editingProduct: Saree | null;
  onEdit: (product: Saree) => void;
  onDelete: (productId: string) => void;
  onUpdate: (productId: string, data: Partial<Saree>) => Promise<void>;
  onCancelEdit: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  editingProduct,
  onEdit,
  onDelete,
  onUpdate,
  onCancelEdit
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products available</h3>
        <p className="mt-2 text-sm text-gray-500">Get started by adding a new product.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {editingProduct?.id === product.id ? (
            <ProductForm
              initialData={editingProduct}
              onSubmit={(data) => onUpdate(product.id, data)}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <div className="relative aspect-square">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`
                    px-2 py-1 text-xs font-semibold rounded-full
                    ${product.stock > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}
                  `}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xl font-bold text-blue-600">₹{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Category: {product.category}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit product"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {product.updatedAt && (
                  <div className="mt-4 border-t pt-4">
                    <div className="text-sm">
                      <p className="text-gray-500">
                        Last updated:{' '}
                        {product.updatedAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
};