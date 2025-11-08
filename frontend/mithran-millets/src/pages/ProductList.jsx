import React, { useEffect, useState, useContext } from 'react';
import {
  Container,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import apiProduct from '../services/apiProduct';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const BASE_URL = 'http://localhost:8081';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [addedProductIds, setAddedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiProduct
      .get(`/products?ts=${Date.now()}`)
      .then(res => {
        if (!mounted) return;
        setProducts(res.data || []);
      })
      .catch(err => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch products';
        console.error('Failed to fetch products', err);
        setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = products
    .filter(p => (p.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (b.id || 0) - (a.id || 0));

  const handleAdd = async (product) => {
    try {
      await addToCart(product, 1);
      setAddedProductIds(prev => prev.includes(product.id) ? prev : [...prev, product.id]);
    } catch (err) {
      // error handled in context
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fbf7ef 0%, #f0e6cf 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: '#0b3d2e',
            textAlign: 'center',
            mb: 3,
            fontFamily: 'Georgia, serif',
            letterSpacing: 0.4,
          }}
        >
          Premium Millets Collection
        </Typography>

        <Paper
          elevation={3}
          sx={{
            mb: 4,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            background: 'rgba(255,255,255,0.95)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ justifyContent: 'center' }}>
            <TextField
              placeholder="Search products, e.g. Barnyard millet"
              value={search}
              onChange={e => setSearch(e.target.value)}
              variant="outlined"
              size="medium"
              fullWidth
              InputProps={{
                startAdornment: (
                  <IconButton size="small" sx={{ mr: 1 }}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
              sx={{
                backgroundColor: '#fff',
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e6dcc9' },
                width: { xs: '100%', md: '520px' },
                maxWidth: '100%',
              }}
            />
            <Button onClick={() => setSearch('')} variant="outlined" sx={{
              borderColor: '#c5b089', color: '#2d6a4f', textTransform: 'none', borderRadius: 2, px: 3,
            }}>
              Reset
            </Button>
          </Stack>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={48} thickness={4} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filtered.length === 0 ? (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ color: '#666' }}>
                    No products found.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              filtered.map(product => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card sx={{
                      height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(11,61,46,0.08)', transition: 'transform 200ms ease, box-shadow 200ms ease',
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(11,61,46,0.12)' },
                    }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={product.imageDownloadUrl ? `${BASE_URL}${product.imageDownloadUrl}` : '/default-product.jpg'}
                        alt={product.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      {product.category && (
                        <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(255,255,255,0.9)', px: 1.2, py: 0.4, borderRadius: 1, fontWeight: 700, color: '#2d6a4f', fontSize: 12 }}>
                          {product.category}
                        </Box>
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b3d2e' }} gutterBottom>{product.name}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d6a4f' }}>₹{product.price?.toFixed?.(2) ?? product.price}</Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: '#6b6b6b' }}>{product.description ? product.description.slice(0, 100) + '…' : 'Premium quality millet.'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: product.stock > 0 ? '#2d6a4f' : '#d9534f' }}>{product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}</Typography>
                    </CardContent>

                    <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                      <Button variant="contained" fullWidth onClick={() => navigate(`/products/${product.id}`)} sx={{ backgroundColor: '#2d6a4f', color: '#fff', fontWeight: 700, borderRadius: 2, '&:hover': { backgroundColor: '#23583f' }, textTransform: 'none' }}>
                        View
                      </Button>

                      <Button
                        variant={addedProductIds.includes(product.id) ? 'outlined' : 'contained'}
                        fullWidth
                        disabled={product.stock === 0}
                        onClick={() => {
                          if (addedProductIds.includes(product.id)) {
                            navigate('/cart');
                          } else {
                            handleAdd(product);
                          }
                        }}
                        sx={{
                          borderColor: '#2d6a4f',
                          color: addedProductIds.includes(product.id) ? '#2d6a4f' : '#fff',
                          backgroundColor: addedProductIds.includes(product.id) ? '#fff' : '#8fbf94',
                          '&:hover': { backgroundColor: addedProductIds.includes(product.id) ? '#f5f5f5' : '#7fb887' },
                          fontWeight: 700, borderRadius: 2, textTransform: 'none',
                        }}
                      >
                        {addedProductIds.includes(product.id) ? 'Go to Cart' : 'Add to Cart'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default ProductList;
