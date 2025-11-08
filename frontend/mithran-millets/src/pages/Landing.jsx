import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Paper,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Divider,
} from '@mui/material';
import { motion, useViewportScroll, useTransform } from 'framer-motion';
import { ArrowForward, Star, MailOutline } from '@mui/icons-material';
import { toast } from 'react-toastify';

/**
 * Landing.jsx (no external CountUp/Typed/Lazy packages)
 *
 * - CustomCountUp: simple animated number counter
 * - useTypedText: lightweight typed text effect hook
 * - Native lazy loading for hero image
 * - Keeps premium styling and framer-motion effects
 *
 * No additional npm installs required for CountUp/Typed/Lazy replacements.
 */

/* Replace with your own high-res hero image URL or import */
const HERO_IMAGE =
  'https://www.aranca.com/assets/uploads/blogs/milestone_banner.jpg';

const testimonials = [
  {
    name: 'Anita R.',
    role: 'Home Chef',
    quote:
      'Mithran Millets transformed our meals. Fresh, healthy and the texture is unmatched. Customer service is stellar.',
    rating: 5,
  },
  {
    name: 'Rahul P.',
    role: 'Nutritionist',
    quote:
      'High-quality grains, transparent sourcing, and timely delivery. Perfect for clients who demand real nutrition.',
    rating: 5,
  },
  {
    name: 'Deepa S.',
    role: 'Busy Mom',
    quote:
      'Quick recipes, healthy kids. The millet flour made breakfast a breeze and I know it’s nutritious.',
    rating: 4,
  },
];

/* ---------- Small utilities (no libs) ---------- */

const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

/* Custom CountUp component (no dependency) */
const CustomCountUp = ({ end = 0, duration = 2000, separator = ',', start = 0, decimals = 0, className }) => {
  const [value, setValue] = useState(start);
  const startRef = useRef(null);

  useEffect(() => {
    let raf = null;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutQuad(t);
      const current = start + (end - start) * eased;
      setValue(current);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration, start]);

  const formatted = useMemo(() => {
    const fixed = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    if (!separator) return fixed;
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return parts.join('.');
  }, [value, separator, decimals]);

  return <span className={className}>{formatted}</span>;
};

/* Lightweight typed text hook */
const useTypedText = (phrases = [], typeSpeed = 60, backSpeed = 40, pause = 1500) => {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [forward, setForward] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!phrases || phrases.length === 0) return;
    let timer = null;

    if (forward) {
      if (charIndex <= phrases[index].length) {
        timer = setTimeout(() => {
          setText(phrases[index].slice(0, charIndex));
          setCharIndex((c) => c + 1);
        }, typeSpeed);
      } else {
        // pause then backspace
        timer = setTimeout(() => setForward(false), pause);
      }
    } else {
      if (charIndex >= 0) {
        timer = setTimeout(() => {
          setText(phrases[index].slice(0, charIndex));
          setCharIndex((c) => c - 1);
        }, backSpeed);
      } else {
        // move to next phrase
        setForward(true);
        setIndex((i) => (i + 1) % phrases.length);
        setCharIndex(0);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrases, index, charIndex, forward, typeSpeed, backSpeed, pause]);

  return text;
};

/* ---------- UI subcomponents ---------- */

const FeatureCard = ({ icon, title, body }) => (
  <Paper
    elevation={4}
    sx={{
      p: 3,
      borderRadius: 3,
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
      border: '1px solid rgba(255,255,255,0.05)',
      backdropFilter: 'blur(6px)',
      minHeight: 150,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: '#d4a373', color: '#102a20' }}>{icon}</Avatar>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>

    <Typography variant="body2" sx={{ color: 'rgba(254,250,224,0.85)' }}>
      {body}
    </Typography>
  </Paper>
);

const Testimonial = ({ t }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      borderRadius: 3,
      background: 'rgba(255,255,255,0.02)',
      color: '#fefae0',
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      justifyContent: 'space-between',
    }}
  >
    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
      “{t.quote}”
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
      <Avatar sx={{ bgcolor: '#e9c46a', color: '#102a20' }}>{t.name.charAt(0)}</Avatar>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(254,250,224,0.7)' }}>
          {t.role}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.25 }}>
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} sx={{ color: '#ffd166', fontSize: 18 }} />
        ))}
      </Box>
    </Box>
  </Paper>
);

/* ---------- Landing component ---------- */

const Landing = () => {
  const theme = useTheme();
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { scrollY } = useViewportScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -40]); // subtle parallax
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.985]);

  // Typed texts (replacements for react-typed)
  const typed = useTypedText(
    [
      'Gluten-free flour and grains',
      'Locally sourced small-batch produce',
      'Recipes that bring the family together',
    ],
    50,
    25,
    2000
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function prevTestimonial() {
    setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }
  function nextTestimonial() {
    setTestimonialIndex((i) => (i + 1) % testimonials.length);
  }

  const subscribe = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.info('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      // simulate request — replace with api call when available
      await new Promise((r) => setTimeout(r, 700));
      toast.success('Subscribed — check your inbox for a welcome note');
      setEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Subscription failed. Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: 6, md: 10 },
        pb: { xs: 6, md: 12 },
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(233,197,106,0.06), transparent), linear-gradient(180deg,#102a20 0%, #163b2d 45%, #1b4332 100%)',
        color: '#fefae0',
      }}
    >
      {/* soft decorative overlay */}
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.6,
          mixBlendMode: 'overlay',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div style={{ y: heroY, scale: heroScale }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.2rem', md: '3.25rem' },
                  lineHeight: 1.05,
                  fontWeight: 900,
                  fontFamily: 'Georgia, serif',
                  color: '#fffbe6',
                }}
              >
                Millet Market
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', mt: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ color: '#e9c46a', fontWeight: 700 }}>
                  Natural. Nutritious.
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', minHeight: 24 }}>
                  {typed}
                  <Box component="span" sx={{ display: 'inline-block', width: 8, ml: 0.5, background: '#e9c46a', height: 12, animation: 'blink 1s steps(2, start) infinite' }} />
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mt: 3, color: 'rgba(255,255,255,0.9)', maxWidth: 560 }}>
                Premium millets curated from trusted farmers — crafted into flours, ready-to-cook mixes, and pantry essentials.
                We combine tradition with transparent sourcing to bring wholesome flavor to your table.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => (window.location.href = '/products')}
                  endIcon={<ArrowForward />}
                  sx={{
                    backgroundColor: '#d4a373',
                    color: '#102a20',
                    fontWeight: 800,
                    borderRadius: '30px',
                    px: 4,
                    '&:hover': { backgroundColor: '#e9c46a' },
                  }}
                >
                  Start Shopping
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => (window.location.href = '/about')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.9)',
                    borderRadius: '30px',
                    px: 4,
                  }}
                >
                  Our Story
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mt: 5 }}>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, background: 'transparent', color: '#fffbe6' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      <CustomCountUp end={1250} duration={1800} /> 
                    </Typography>
                    <Typography variant="caption">Orders fulfilled</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, background: 'transparent' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      <CustomCountUp end={320} duration={1800} />
                    </Typography>
                    <Typography variant="caption">Happy customers</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper elevation={0} sx={{ p: 2, background: 'transparent' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      <CustomCountUp end={48} duration={1800} />
                    </Typography>
                    <Typography variant="caption">Local farms</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Paper
                elevation={6}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 18px 60px rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Native lazy loading */}
                <Box
                  component="img"
                  src={HERO_IMAGE}
                  alt="Premium millets"
                  loading="lazy"
                  sx={{ width: '100%', height: { xs: 300, md: 420 }, objectFit: 'cover' }}
                />
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 6, md: 10 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Why customers choose us
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FeatureCard
                icon="🌾"
                title="Farm-to-Table Sourcing"
                body="We partner directly with small farms to ensure freshness, fair prices, and traceability for every batch."
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FeatureCard
                icon="🧪"
                title="Quality & Testing"
                body="Every harvest is quality-assured and tested for purity, so you always get clean, nutrient-rich grains."
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FeatureCard
                icon="🥣"
                title="Chef-Approved Recipes"
                body="Curated recipe cards and ready-to-cook blends make it effortless to create wholesome meals at home."
              />
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4} sx={{ mt: { xs: 6, md: 10 } }}>
          <Grid item xs={12} md={7}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
              What customers say
            </Typography>

            <Box sx={{ position: 'relative' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button onClick={prevTestimonial} variant="text" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Prev
                </Button>
                <Button onClick={nextTestimonial} variant="text" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Next
                </Button>
              </Box>

              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <Testimonial t={testimonials[testimonialIndex]} />
              </motion.div>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {testimonials.map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: i === testimonialIndex ? '#e9c46a' : 'rgba(255,255,255,0.12)',
                      transition: 'background 200ms',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Join our newsletter
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                Get exclusive offers, seasonal recipes, and farmer stories — delivered monthly.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="small"
                  placeholder="you@domain.com"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutline sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      </InputAdornment>
                    ),
                    sx: { background: 'rgba(255,255,255,0.02)', color: '#fefae0' },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={subscribe}
                  disabled={submitting}
                  sx={{ backgroundColor: '#d4a373', color: '#102a20' }}
                >
                  {submitting ? '...' : 'Subscribe'}
                </Button>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.04)' }} />

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                By subscribing you agree to receive promotional emails. You can unsubscribe anytime.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper
          elevation={6}
          sx={{
            mt: { xs: 6, md: 10 },
            p: 4,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Ready to elevate your pantry?
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Try our curated starter packs — crafted for balanced nutrition and delightful taste.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => (window.location.href = '/products')}
            sx={{
              backgroundColor: '#e9c46a',
              color: '#102a20',
              fontWeight: 800,
              borderRadius: '28px',
              px: 4,
              '&:hover': { backgroundColor: '#ffd166' },
            }}
          >
            Shop Starter Packs
          </Button>
        </Paper>
      </Container>

      {/* small global styles for typed cursor */}
      <style>{`
        @keyframes blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </Box>
  );
};

export default Landing;
