const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');

// Get full user profile with stats
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // Get activity count per type
    const { data: activityStats } = await supabaseAdmin
      .from('activities')
      .select('type')
      .eq('user_id', req.user.id);

    const stats = {
      summaries: activityStats?.filter(a => a.type === 'summary').length || 0,
      quizzes: activityStats?.filter(a => a.type === 'quiz').length || 0,
      flashcardSets: activityStats?.filter(a => a.type === 'flashcards').length || 0,
      questions: activityStats?.filter(a => a.type === 'qa').length || 0,
      totalActivities: activityStats?.length || 0
    };

    res.json({ user, stats });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get recent activities
router.get('/activities', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ activities: activities || [] });
  } catch (err) {
    console.error('Activities error:', err);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Get saved flashcard sets
router.get('/flashcards', authenticate, async (req, res) => {
  try {
    const { data: flashcards, error } = await supabaseAdmin
      .from('flashcards')
      .select('id, title, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ flashcards: flashcards || [] });
  } catch (err) {
    console.error('Flashcards error:', err);
    res.status(500).json({ error: 'Failed to get flashcards' });
  }
});

// Get specific flashcard set
router.get('/flashcards/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('flashcards')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    res.json({ flashcardSet: data });
  } catch (err) {
    console.error('Flashcard detail error:', err);
    res.status(500).json({ error: 'Failed to get flashcard set' });
  }
});

// Get saved quizzes
router.get('/quizzes', authenticate, async (req, res) => {
  try {
    const { data: quizzes, error } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ quizzes: quizzes || [] });
  } catch (err) {
    console.error('Quizzes error:', err);
    res.status(500).json({ error: 'Failed to get quizzes' });
  }
});

// Get progress data (XP over time)
router.get('/progress', authenticate, async (req, res) => {
  try {
    const { data: activities, error } = await supabaseAdmin
      .from('activities')
      .select('type, xp_earned, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    // Aggregate by day
    const byDay = {};
    activities?.forEach(a => {
      const day = new Date(a.created_at).toLocaleDateString();
      byDay[day] = (byDay[day] || 0) + (a.xp_earned || 0);
    });

    res.json({ 
      activities: activities || [],
      byDay
    });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to get progress data' });
  }
});

// Update username
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    // Check uniqueness
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', req.user.id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ username })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ user: data });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
