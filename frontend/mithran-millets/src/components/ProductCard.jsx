import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button } from '@mui/material';

const BASE_URL = 'http://localhost:8081';

const ProductCard = ({ product }) => {
  return (
    <Card sx={{ maxWidth: 300 }}>
      <CardMedia
        component="img"
        height="140"
        image={product.imageDownloadUrl ? `${BASE_URL}${product.imageDownloadUrl}` : '/default-product.jpg'}
        alt={product.name}
      />
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          ₹{product.price}
        </Typography>
        <Button variant="contained" sx={{ mt: 1 }}>Add to Cart</Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
