import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.products || response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  const styles = {
    container: {
      padding: '20px 0'
    },
    title: {
      fontSize: '32px',
      marginBottom: '30px',
      color: '#2c3e50'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '25px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ':hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 5px 20px rgba(0,0,0,0.15)'
      }
    },
    imagePlaceholder: {
      height: '180px',
      backgroundColor: '#ecf0f1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px'
    },
    content: {
      padding: '20px'
    },
    productName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#2c3e50'
    },
    description: {
      fontSize: '14px',
      color: '#7f8c8d',
      marginBottom: '12px',
      lineHeight: '1.4'
    },
    category: {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      marginBottom: '12px'
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '10px'
    },
    price: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#27ae60'
    },
    stock: {
      fontSize: '12px',
      color: '#7f8c8d'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
      marginTop: '15px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed'
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading products...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Our Products</h1>
      {!user && <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>Please login to place orders</p>}
      <div style={styles.grid}>
        {products.map(product => (
          <div key={product.id} style={styles.card}>
            <div style={styles.imagePlaceholder}>📦</div>
            <div style={styles.content}>
              <span style={styles.category}>{product.category}</span>
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.description}>{product.description}</p>
              <div style={styles.footer}>
                <span style={styles.price}>${product.price}</span>
                <span style={styles.stock}>{product.stock} in stock</span>
              </div>
              <button
                style={{
                  ...styles.button,
                  ...(product.stock === 0 ? styles.buttonDisabled : {})
                }}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
