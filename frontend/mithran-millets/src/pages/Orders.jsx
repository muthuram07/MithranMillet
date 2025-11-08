import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiOrder from '../services/apiOrder';

/*
  Orders.jsx — normalized data, premium styling, no debug button.
*/

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchHistory = () => {
      apiOrder
        .get('/order/history')
        .then(res => {
          if (!mounted) return;
          const raw = Array.isArray(res.data) ? res.data : [];
          console.debug('Fetched orders raw:', raw);

          const normalized = raw.map(o => {
            const sourceItems = Array.isArray(o.items)
              ? o.items
              : Array.isArray(o.orderItems)
                ? o.orderItems
                : Array.isArray(o.order_items)
                  ? o.order_items
                  : Array.isArray(o.products)
                    ? o.products
                    : Array.isArray(o.product_items)
                      ? o.product_items
                      : [];
            const items = sourceItems.map(it => {
            // compute detectors once
            const detectQty = (() => {
              if (it == null) return 0;
              if (typeof it.quantity === 'number') return it.quantity;
              if (typeof it.qty === 'number') return it.qty;
              if (typeof it.count === 'number') return it.count;
              if (typeof it.quantity === 'string' && it.quantity.trim() !== '') return Number(it.quantity);
              if (typeof it.qty === 'string' && it.qty.trim() !== '') return Number(it.qty);
              if (it.orderItem && (it.orderItem.quantity != null)) return Number(it.orderItem.quantity);
              if (it.product && (it.product.quantity != null)) return Number(it.product.quantity);
              return 0;
            })();

            const detectPrice = (() => {
              if (it == null) return 0;
              if (typeof it.unitPrice === 'number') return it.unitPrice;
              if (typeof it.price === 'number') return it.price;
              if (typeof it.unitPrice === 'string' && it.unitPrice.trim() !== '') return Number(it.unitPrice);
              if (typeof it.price === 'string' && it.price.trim() !== '') return Number(it.price);
              if (it.orderItem && (it.orderItem.price != null)) return Number(it.orderItem.price);
              if (it.product && (it.product.price != null)) return Number(it.product.price);
              return 0;
            })();

            const qty = Number.isFinite(detectQty) ? detectQty : 0;
            const unitPrice = Number.isFinite(detectPrice) ? detectPrice : 0;

            return {
              productId: it?.productId ?? it?.id ?? it?.product?.id ?? null,
              name: it?.productName ?? it?.name ?? it?.product?.name ?? 'Product',
              qty,
              unitPrice,
              imageUrl: it?.imageUrl ?? it?.image ?? it?.product?.imageUrl ?? '/default-product.jpg',
              raw: it ?? null,
            };
          });

          return {
            ...o,
            items,
          };
        });

        // newest first
        normalized.sort((a, b) => new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0));
        setOrders(normalized);
        console.debug('Normalized orders:', normalized);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setOrders([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
   };

   setLoading(true);
   fetchHistory();
   const id = setInterval(fetchHistory, 15000);

   return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
      });
    } catch {
      return String(d);
    }
  };

  const getTotal = (order) => {
    if (!order) return 0;
    if (typeof order.totalAmount === 'number') return order.totalAmount;
    if (typeof order.total === 'number') return order.total;
    // derive from normalized items
    const sum = (Array.isArray(order.items) ? order.items : []).reduce((s, i) => s + (i.unitPrice || 0) * (i.qty || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  };

  const currency = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

  const formatAddress = (addr) => {
    if (!addr) return '—';
    return [
      addr.name,
      addr.phone,
      addr.street,
      addr.city,
      addr.state ? `${addr.state} - ${addr.pincode || ''}` : addr.pincode,
    ].filter(Boolean).join(', ');
  };

  // Premium textured background style
  const pageBg = {
    backgroundImage: 'linear-gradient(180deg, #fbf7ef 0%, #f6efe0 50%, #efe6d4 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    minHeight: '100vh',
    py: 8,
  };

  // Card style with subtle texture/shadow
  const cardSx = {
    p: { xs: 3, md: 4 },
    borderRadius: 3,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,249,244,0.98))',
    border: '1px solid rgba(13, 60, 45, 0.06)',
    boxShadow: '0 12px 30px rgba(11,61,46,0.08)',
  };

  if (!loading && (!Array.isArray(orders) || orders.length === 0)) {
    return (
      <Box sx={pageBg}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, color: '#0b3d2e', mb: 4 }}>
            📦 Your Orders
          </Typography>

          <Paper elevation={4} sx={{ p: 6, borderRadius: 4, background: 'linear-gradient(180deg,#fff,#fff8e1)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#274c3f', mb: 1 }}>
              No orders yet
            </Typography>
            <Typography variant="body1" sx={{ color: '#556864', mb: 3 }}>
              Your order history looks a little quiet. Start shopping our premium millets to see orders appear here.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/products')}
                sx={{
                  backgroundColor: '#2d6a4f',
                  color: '#fff',
                  fontWeight: 700,
                  px: 4,
                  py: 1,
                  borderRadius: '28px',
                  '&:hover': { backgroundColor: '#23583f' },
                }}
              >
                🛍️ Continue Shopping
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={pageBg}>
      <Container maxWidth="md">
        <Typography variant="h4" align="center" sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, color: '#0b3d2e', mb: 4 }}>
          📦 Your Orders
        </Typography>

        <Stack spacing={3}>
          {orders.map(order => {
            const itemsLen = Array.isArray(order.items) ? order.items.length : 0;
            const qtyRaw = (order.totalQuantity ?? order.total_quantity ?? order.itemCount ?? order.item_count);
            const hasQty = qtyRaw !== undefined && qtyRaw !== null && !Number.isNaN(Number(qtyRaw));
            const totalItems = itemsLen > 0 ? itemsLen : (hasQty ? Number(qtyRaw) : 0);
            return (
              <Paper key={order.id} elevation={6} sx={cardSx}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ minWidth: 160 }}>
                        <Typography variant="subtitle2" sx={{ color: '#6b6b6b', fontWeight: 700 }}>
                          Order #{order.id}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8a8a8a', mt: 0.5 }}>
                          {formatDate(order.orderDate || order.createdAt)}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', md: 'block' } }} />

                      <Box>
                        <Typography variant="body2" sx={{ color: '#4b6b59', fontWeight: 700 }}>
                          {totalItems} item{totalItems !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#98a79a', display: 'block', maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.items && order.items.length ? order.items.map(it => it.name).slice(0, 4).filter(Boolean).join(', ') : ''}
                          {order.items && order.items.length > 4 ? ' …' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={String(order.status ?? 'UNKNOWN').toUpperCase()}
                        sx={{
                          fontWeight: 800,
                          bgcolor: order.status === 'PLACED' ? '#e6f4ee' : undefined,
                          color: order.status === 'PLACED' ? '#1f5a44' : undefined,
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                        }}
                      />
                      <Box sx={{ textAlign: 'right', minWidth: 110 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b3d2e' }}>
                          {currency(getTotal(order))}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#98a79a' }}>
                          {order.paymentMethod ?? '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />

                    <List disablePadding>
                      {(Array.isArray(order.items) ? order.items : []).map(item => {
                        const qty = item.qty ?? 0;
                        const unitPrice = item.unitPrice ?? 0;
                        const name = item.name ?? 'Product';
                        const img = item.imageUrl ?? '/default-product.jpg';
                        const key = item.productId ?? `${order.id}-${name}`;

                        return (
                          <ListItem
                            key={key}
                            sx={{
                              py: 1,
                              px: 0,
                              alignItems: 'center',
                              borderBottom: '1px solid rgba(13,60,45,0.03)',
                            }}
                          >
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={img}
                                alt={name}
                                variant="rounded"
                                sx={{ width: 64, height: 48, bgcolor: '#f6f5f1', flexShrink: 0 }}
                                imgProps={{ onError: (e) => { e.currentTarget.src = '/default-product.jpg'; } }}
                              />

                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#274c3f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>
                                  {name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#7a8a7a', display: 'block' }}>
                                  {qty} × {currency(unitPrice)}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ ml: 2, textAlign: 'right', minWidth: 110 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0b3d2e' }}>
                                {currency(unitPrice * (qty || 1))}
                              </Typography>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>

                    {order.address && (
                      <Box sx={{ mt: 2, p: 2, borderRadius: 2, background: '#fbfbf7', border: '1px solid rgba(13,60,45,0.03)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#274c3f', mb: 0.5 }}>
                          Shipping To
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#556864' }}>
                          {formatAddress(order.address)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => {
                          try {
                            navigator.clipboard?.writeText(JSON.stringify(order));
                            // small UX-friendly confirmation
                            // eslint-disable-next-line no-alert
                            alert('Order copied to clipboard');
                          } catch (e) {
                            console.error('Copy failed', e);
                          }
                        }}
                        sx={{ color: '#2d6a4f' }}
                      >
                        Copy
                      </Button>

                      <Button size="small" onClick={() => window.print()} sx={{ color: '#2d6a4f' }}>
                        Print
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate(`/order/${order.id}`)}
                        sx={{
                          background: '#2d6a4f',
                          color: '#fff',
                          fontWeight: 700,
                          borderRadius: 2,
                          '&:hover': { background: '#23583f' },
                        }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
};

export default Orders;
