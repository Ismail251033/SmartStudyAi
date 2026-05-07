const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../lib/supabase');
const { generateSummary, generateQuiz, generateFlashcards, answerQuestion } = require('../lib/groq');
// XP awards
const XP_AWARDS = {
  summary: 10,
  quiz: 20,
  flashcards: 15,
  qa: 5
};

// Helper: award XP and update level
const awardXP = async (userId, xpAmount, activityType, metadata = {}) => {
  try {
    // Get current user data
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('xp, level')
      .eq('id', userId)
      .single();

    const currentXP = user?.xp || 0;
    const newXP = currentXP + xpAmount;

    // Calculate level (every 100 XP = 1 level)
    const newLevel = Math.floor(newXP / 100) + 1;

    // Update user XP and level
    await supabaseAdmin
      .from('users')
      .update({ xp: newXP, level: newLevel })
      .eq('id', userId);

    // Log activity
    await supabaseAdmin
      .from('activities')
      .insert({
        user_id: userId,
        type: activityType,
        xp_earned: xpAmount,
        metadata,
        created_at: new Date().toISOString()
      });

    return { newXP, newLevel, previousLevel: user?.level || 1, leveledUp: newLevel > (user?.level || 1) };
  } catch (err) {
    console.error('XP award error:', err);
    return null;
  }
};

// Generate Summary
router.post('/summary', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters long' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text must be under 10,000 characters' });
    }

    const summary = await generateSummary(text);

    // Award XP
    const xpResult = await awardXP(req.user.id, XP_AWARDS.summary, 'summary', {
      title: summary.title
    });

    res.json({
      summary,
      xp: {
        earned: XP_AWARDS.summary,
        ...xpResult
      }
    });
  } catch (err) {
    console.error('Summary generation error:', err);
    res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
});

// Generate Quiz
router.post('/quiz', authenticate, async (req, res) => {
  try {
    const { text, numQuestions = 5 } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters long' });
    }

    const count = Math.min(Math.max(parseInt(numQuestions) || 5, 3), 10);
    const quiz = await generateQuiz(text, count);

    // Save quiz to database
    const { data: savedQuiz } = await supabaseAdmin
      .from('quizzes')
      .insert({
        user_id: req.user.id,
        title: quiz.title,
        questions: quiz.questions,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    const xpResult = await awardXP(req.user.id, XP_AWARDS.quiz, 'quiz', {
      title: quiz.title,
      quiz_id: savedQuiz?.id
    });

    res.json({
      quiz: { ...quiz, id: savedQuiz?.id },
      xp: {
        earned: XP_AWARDS.quiz,
        ...xpResult
      }
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

// Generate Flashcards
router.post('/flashcards', authenticate, async (req, res) => {
  try {
    const { text, numCards = 8 } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters long' });
    }

    const count = Math.min(Math.max(parseInt(numCards) || 8, 4), 20);
    const flashcardSet = await generateFlashcards(text, count);

    // Save to database
    const { data: savedSet } = await supabaseAdmin
      .from('flashcards')
      .insert({
        user_id: req.user.id,
        title: flashcardSet.title,
        cards: flashcardSet.cards,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    const xpResult = await awardXP(req.user.id, XP_AWARDS.flashcards, 'flashcards', {
      title: flashcardSet.title,
      set_id: savedSet?.id
    });

    res.json({
      flashcards: { ...flashcardSet, id: savedSet?.id },
      xp: {
        earned: XP_AWARDS.flashcards,
        ...xpResult
      }
    });
  } catch (err) {
    console.error('Flashcard generation error:', err);
    res.status(500).json({ error: 'Failed to generate flashcards. Please try again.' });
  }
});

// Q&A Assistant
router.post('/qa', authenticate, async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question || question.trim().length < 5) {
      return res.status(400).json({ error: 'Question must be at least 5 characters' });
    }

    if (question.length > 1000) {
      return res.status(400).json({ error: 'Question must be under 1,000 characters' });
    }

    const answer = await answerQuestion(question, context || '');

    const xpResult = await awardXP(req.user.id, XP_AWARDS.qa, 'qa', {
      question: question.substring(0, 100)
    });

    res.json({
      answer,
      xp: {
        earned: XP_AWARDS.qa,
        ...xpResult
      }
    });
  } catch (err) {
    console.error('Q&A error:', err);
    res.status(500).json({ error: 'Failed to get answer. Please try again.' });
  }
});

module.exports = router;
