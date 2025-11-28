import { supabase } from '../utils/supabase';

// Get the Supabase URL for edge functions
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vmjskjejkdxslnihrmzh.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-music`;

/**
 * Call the Supabase Edge Function for AI generation
 * This proxies requests to Replicate to avoid CORS issues
 */
const callEdgeFunction = async (body) => {
  try {
    // Get the current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }

    return result.data;
  } catch (error) {
    console.error('Edge function error:', error);
    throw error;
  }
};

// ==================== MUSIC GENERATION ====================

/**
 * Generate music using ACE-Step model (lucataco/ace-step)
 * This model is good for electronic, synth-pop, and modern music
 * 
 * @param {Object} params
 * @param {string} params.tags - Genre/style tags (e.g., "synth-pop, electronic, 128 BPM, energetic")
 * @param {string} params.lyrics - Lyrics with structure tags ([verse], [chorus], [bridge], etc.)
 * @param {number} params.duration - Duration in seconds (default: 60)
 * @returns {Promise<string>} URL to generated audio file
 */
export const generateMusicAceStep = async ({ tags, lyrics, duration = 60 }) => {
  return callEdgeFunction({
    action: 'generate_music_ace',
    tags,
    lyrics,
    duration,
  });
};

/**
 * Generate music using MiniMax Music 1.5 model
 * This model is good for various genres with smoother, more polished output
 * 
 * @param {Object} params
 * @param {string} params.prompt - Genre/style description (e.g., "Jazz, Smooth Jazz, Romantic, Dreamy")
 * @param {string} params.lyrics - Lyrics with structure tags ([Verse], [Chorus], [Bridge], etc.)
 * @returns {Promise<string>} URL to generated audio file
 */
export const generateMusicMiniMax = async ({ prompt, lyrics }) => {
  return callEdgeFunction({
    action: 'generate_music_minimax',
    prompt,
    lyrics,
  });
};

/**
 * Generate TWO versions of a song using both models
 * User will choose which one they prefer
 * 
 * @param {Object} params
 * @param {string} params.tags - Genre/style tags for ACE-Step
 * @param {string} params.prompt - Genre/style description for MiniMax
 * @param {string} params.lyrics - Lyrics with structure tags
 * @param {number} params.duration - Duration in seconds (only used by ACE-Step)
 * @returns {Promise<{option1: Object, option2: Object}>} Both generated audio options
 */
export const generateMusicOptions = async ({ tags, prompt, lyrics, duration = 60 }) => {
  // Run both in parallel via separate calls
  const [option1, option2] = await Promise.all([
    generateMusicAceStep({ tags, lyrics, duration }),
    generateMusicMiniMax({ prompt, lyrics }),
  ]);

  return {
    option1: {
      url: option1,
      model: 'ace-step',
      description: 'Electronic/Synth Style',
    },
    option2: {
      url: option2,
      model: 'minimax',
      description: 'Polished/Smooth Style',
    },
  };
};

// ==================== COVER ART GENERATION ====================

/**
 * Generate cover art for a track using Seedream-4 model
 * 
 * @param {Object} params
 * @param {string} params.prompt - Description of the cover art to generate
 * @returns {Promise<string>} URL to generated image
 */
export const generateCoverArt = async ({ prompt }) => {
  return callEdgeFunction({
    action: 'generate_cover_art',
    prompt,
  });
};

/**
 * Generate cover art based on song metadata
 * Creates a prompt from the song's genre, mood, and title
 * 
 * @param {Object} params
 * @param {string} params.title - Song title
 * @param {string} params.genre - Genre/style of the song
 * @param {string} params.mood - Mood/vibe of the song (optional)
 * @returns {Promise<string>} URL to generated image
 */
export const generateCoverArtFromSong = async ({ title, genre, mood = '' }) => {
  return callEdgeFunction({
    action: 'generate_cover_art',
    title,
    genre,
    prompt: mood ? `${mood} mood` : undefined,
  });
};

// ==================== FULL TRACK GENERATION ====================

/**
 * Generate a complete track with music options and cover art
 * This is the most efficient method - runs all generations in parallel on the server
 * 
 * @param {Object} params
 * @param {string} params.title - Song title
 * @param {string} params.tags - Genre/style tags for ACE-Step
 * @param {string} params.prompt - Genre/style description for MiniMax
 * @param {string} params.lyrics - Lyrics with structure tags
 * @param {string} params.genre - Genre for cover art
 * @param {number} params.duration - Duration in seconds
 * @returns {Promise<Object>} Complete track data with music options and cover art
 */
export const generateCompleteTrack = async ({ 
  title, 
  tags, 
  prompt, 
  lyrics, 
  genre, 
  duration = 60 
}) => {
  return callEdgeFunction({
    action: 'generate_complete',
    title,
    tags,
    prompt,
    lyrics,
    genre,
    duration,
  });
};

export default {
  generateMusicAceStep,
  generateMusicMiniMax,
  generateMusicOptions,
  generateCoverArt,
  generateCoverArtFromSong,
  generateCompleteTrack,
};
