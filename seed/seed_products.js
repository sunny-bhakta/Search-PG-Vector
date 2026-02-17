const products = [
  {
    product_id: '11111111-1111-1111-1111-111111111111',
    name: 'Slim Fit Jeans',
    description: 'Classic slim fit jeans with stretch fabric.',
    brand: "Levi's",
    category_paths: ['men/clothing/jeans'],
    tags: ['stretch', 'premium'],
    min_price: 59.99,
    max_price: 79.99,
    embedding: null,
    in_stock: true,
    updated_at: new Date()
  },
  {
    product_id: '22222222-2222-2222-2222-222222222222',
    name: 'AirFlex Jogger',
    description: 'Tapered jogger with breathable four-way stretch fabric.',
    brand: 'Lumen Athletics',
    category_paths: ['apparel/mens/bottoms'],
    tags: ['athleisure', 'stretch', 'travel'],
    min_price: 69.99,
    max_price: 89.99,
    embedding: null,
    in_stock: true,
    updated_at: new Date()
  },
  {
    product_id: '33333333-3333-3333-3333-333333333333',
    name: 'TrailLite Sneaker',
    description: 'Lightweight trail runner with Vibram outsole.',
    brand: 'Northwind Outdoors',
    category_paths: ['footwear/outdoors/mens'],
    tags: ['trail', 'water-resistant', 'vibram'],
    min_price: 120.00,
    max_price: 140.00,
    embedding: null,
    in_stock: false,
    updated_at: new Date()
  },
  {
    product_id: '44444444-4444-4444-4444-444444444444',
    name: 'Classic Chinos',
    description: 'Versatile chinos for work or weekend.',
    brand: 'Dockers',
    category_paths: ['men/clothing/pants'],
    tags: ['versatile', 'work', 'weekend'],
    min_price: 49.99,
    max_price: 69.99,
    embedding: null,
    in_stock: true,
    updated_at: new Date()
  },
  {
    product_id: '55555555-5555-5555-5555-555555555555',
    name: 'Denim Jacket',
    description: 'Iconic denim jacket with modern fit.',
    brand: "Levi's",
    category_paths: ['men/clothing/jackets'],
    tags: ['denim', 'iconic', 'modern'],
    min_price: 89.99,
    max_price: 109.99,
    embedding: null,
    in_stock: true,
    updated_at: new Date()
  }
];

export default products;


