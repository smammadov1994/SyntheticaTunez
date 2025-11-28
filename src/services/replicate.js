import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN,
});

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
  try {
    const output = await replicate.run(
      "lucataco/ace-step:280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1",
      {
        input: {
          seed: -1, // Random seed for variety
          tags,
          lyrics,
          duration,
          scheduler: "euler",
          guidance_type: "apg",
          guidance_scale: 15,
          number_of_steps: 60,
          granularity_scale: 10,
          guidance_interval: 0.5,
          min_guidance_scale: 3,
          tag_guidance_scale: 0,
          lyric_guidance_scale: 0,
          guidance_interval_decay: 0,
        }
      }
    );

    // Return the URL of the generated audio
    if (output && typeof output.url === 'function') {
      return output.url();
    }
    return output;
  } catch (error) {
    console.error('Error generating music with ACE-Step:', error);
    throw error;
  }
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
  try {
    const output = await replicate.run(
      "minimax/music-1.5",
      {
        input: {
          lyrics,
          prompt,
          bitrate: 256000,
          sample_rate: 44100,
          audio_format: "mp3",
        }
      }
    );

    // Return the URL of the generated audio
    if (output && typeof output.url === 'function') {
      return output.url();
    }
    return output;
  } catch (error) {
    console.error('Error generating music with MiniMax:', error);
    throw error;
  }
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
 * @returns {Promise<{option1: string, option2: string}>} URLs to both generated audio files
 */
export const generateMusicOptions = async ({ tags, prompt, lyrics, duration = 60 }) => {
  try {
    // Run both models in parallel for faster generation
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
  } catch (error) {
    console.error('Error generating music options:', error);
    throw error;
  }
};

// ==================== COVER ART GENERATION ====================

/**
 * Generate cover art for a track using Seedream-4 model
 * 
 * @param {Object} params
 * @param {string} params.prompt - Description of the cover art to generate
 * @param {number} params.width - Image width (default: 1024 for square album art)
 * @param {number} params.height - Image height (default: 1024 for square album art)
 * @returns {Promise<string>} URL to generated image
 */
export const generateCoverArt = async ({ prompt, width = 1024, height = 1024 }) => {
  try {
    const output = await replicate.run(
      "bytedance/seedream-4",
      {
        input: {
          size: "1K",
          width,
          height,
          prompt: `Album cover art: ${prompt}. Professional music album artwork, high quality, artistic, visually striking.`,
          max_images: 1,
          image_input: [],
          aspect_ratio: "1:1",
          enhance_prompt: true,
          sequential_image_generation: "disabled",
        }
      }
    );

    // Return the URL of the generated image
    if (Array.isArray(output) && output[0]) {
      if (typeof output[0].url === 'function') {
        return output[0].url();
      }
      return output[0];
    }
    return output;
  } catch (error) {
    console.error('Error generating cover art:', error);
    throw error;
  }
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
  const moodText = mood ? `, ${mood} mood` : '';
  const prompt = `${genre} music album cover for a song called "${title}"${moodText}. Abstract, artistic, modern design with vibrant colors and dynamic composition.`;
  
  return generateCoverArt({ prompt });
};

// ==================== FULL TRACK GENERATION ====================

/**
 * Generate a complete track with music options and cover art
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
  try {
    // Generate music options and cover art in parallel
    const [musicOptions, coverArtUrl] = await Promise.all([
      generateMusicOptions({ tags, prompt, lyrics, duration }),
      generateCoverArtFromSong({ title, genre }),
    ]);

    return {
      title,
      genre,
      lyrics,
      duration,
      coverArtUrl,
      musicOptions,
    };
  } catch (error) {
    console.error('Error generating complete track:', error);
    throw error;
  }
};

export default {
  generateMusicAceStep,
  generateMusicMiniMax,
  generateMusicOptions,
  generateCoverArt,
  generateCoverArtFromSong,
  generateCompleteTrack,
};

