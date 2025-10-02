import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Saree } from '../types/models';
import { Loader2 } from 'lucide-react';

const sareeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  priceType: z.enum(['fixed', 'dm']),
  price: z.number().min(0, 'Price must be a positive number').optional(),
  category: z.enum(['handloom', 'powerloom'], { required_error: 'Category is required' }),
  stock: z.number().min(0, 'Stock must be a non-negative number'),
  imageUrl: z.string().url('Please enter a valid image URL'),
}).refine(data => {
  if (data.priceType === 'fixed' && !data.price) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for fixed price sarees',
  path: ['price']
});

type SareeFormData = z.infer<typeof sareeSchema>;

interface SareeFormProps {
  saree?: Saree;
  onSubmit: (data: SareeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SareeForm: React.FC<SareeFormProps> = ({
  saree,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SareeFormData>({
    resolver: zodResolver(sareeSchema),
    defaultValues: saree
      ? {
          name: saree.name,
          priceType: saree.priceType,
          price: saree.price,
          category: saree.category,
          stock: saree.stock,
          imageUrl: saree.imageUrl,
        }
      : {
          priceType: 'fixed'
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="priceType" className="block text-sm font-medium text-gray-700">
          Price Type
        </label>
        <select
          id="priceType"
          {...register('priceType')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="fixed">Fixed Price</option>
          <option value="dm">Rate on Request (DM)</option>
        </select>
      </div>

      {watch('priceType') === 'fixed' && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            id="price"
            {...register('price', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Loom Type
        </label>
        <select
          id="category"
          {...register('category')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select Loom Type</option>
          <option value="handloom">Hand Loom</option>
          <option value="powerloom">Power Loom</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
          Stock
        </label>
        <input
          type="number"
          id="stock"
          {...register('stock', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.stock && (
          <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Image URL
        </label>
        <input
          type="url"
          id="imageUrl"
          {...register('imageUrl')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>
  );
};

export default SareeForm;