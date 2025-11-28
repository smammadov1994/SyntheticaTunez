/**
 * Replicate AI Service
 * Handles music generation and cover art creation
 * 
 * Note: This calls Replicate API directly, which works on native mobile apps.
 * CORS is only a browser limitation - native iOS/Android apps don't have this restriction.
 */

const REPLICATE_API_TOKEN = process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  console.warn('⚠️ EXPO_PUBLIC_REPLICATE_API_TOKEN is not set in .env file');
}

/**
 * Wait for a Replicate prediction to complete
 */
const waitForPrediction = async (predictionUrl) => {
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(predictionUrl, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`API returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
    }

    const prediction = await response.json();

    if (prediction.status === 'succeeded') {
      return prediction.output;
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error || 'Unknown error'}`);
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Prediction timed out');
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
  try {
    // Validate API token
    if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === 'undefined') {
      throw new Error('REPLICATE_API_TOKEN is not configured. Please set it in your .env file.');
    }

    const response = await fetch(
      'https://api.replicate.com/v1/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1',
          input: {
            seed: -1,
            tags,
            lyrics,
            duration,
            scheduler: 'euler',
            guidance_type: 'apg',
            guidance_scale: 15,
            number_of_steps: 60,
            granularity_scale: 10,
            guidance_interval: 0.5,
            min_guidance_scale: 3,
            tag_guidance_scale: 0,
            lyric_guidance_scale: 0,
            guidance_interval_decay: 0,
          },
        }),
      }
    );

    const prediction = await response.json();
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    // Wait for the prediction to complete
    const output = await waitForPrediction(prediction.urls.get);
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
    // Validate API token
    if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === 'undefined') {
      throw new Error('REPLICATE_API_TOKEN is not configured. Please set it in your .env file.');
    }

    const response = await fetch(
      'https://api.replicate.com/v1/models/minimax/music-1.5/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            lyrics,
            prompt,
            bitrate: 256000,
            sample_rate: 44100,
            audio_format: 'mp3',
          },
        }),
      }
    );

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Replicate API error (${response.status}): ${text.substring(0, 300)}`);
    }

    const prediction = await response.json();
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    // Wait for the prediction to complete
    const output = await waitForPrediction(prediction.urls.get);
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
 * @returns {Promise<{option1: Object, option2: Object}>} Both generated audio options
 */
export const generateMusicOptions = async ({ tags, prompt, lyrics, duration = 60 }) => {
  try {
    // Run both models in parallel for faster generation
    const [aceOutput, minimaxOutput] = await Promise.all([
      generateMusicAceStep({ tags, lyrics, duration }),
      generateMusicMiniMax({ prompt, lyrics }),
    ]);

    return {
      option1: {
        url: aceOutput,
        model: 'ace-step',
        description: 'Electronic/Synth Style',
      },
      option2: {
        url: minimaxOutput,
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
 * @returns {Promise<string>} URL to generated image
 */
export const generateCoverArt = async ({ prompt }) => {
  try {
    // Validate API token
    if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === 'undefined') {
      throw new Error('REPLICATE_API_TOKEN is not configured. Please set it in your .env file.');
    }

    const response = await fetch(
      'https://api.replicate.com/v1/models/bytedance/seedream-4/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            size: '1K',
            width: 1024,
            height: 1024,
            prompt: `Album cover art: ${prompt}. Professional music album artwork, high quality, artistic, visually striking.`,
            max_images: 1,
            image_input: [],
            aspect_ratio: '1:1',
            enhance_prompt: true,
            sequential_image_generation: 'disabled',
          },
        }),
      }
    );

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Replicate API error (${response.status}): ${text.substring(0, 300)}`);
    }

    const prediction = await response.json();
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    // Wait for the prediction to complete
    const output = await waitForPrediction(prediction.urls.get);
    
    // Return first image URL
    if (Array.isArray(output) && output[0]) {
      return typeof output[0] === 'string' ? output[0] : output[0].url || output[0];
    }
    return output;
  } catch (error) {
    console.error('Error generating cover art:', error);
    throw error;
  }
};

/**
 * Generate cover art based on song metadata and lyrics
 * Creates an intelligent prompt that captures the essence of the lyrics
 * 
 * @param {Object} params
 * @param {string} params.title - Song title
 * @param {string} params.genre - Genre/style of the song
 * @param {string} params.lyrics - The song lyrics
 * @returns {Promise<string>} URL to generated image
 */
export const generateCoverArtFromSong = async ({ title, genre, lyrics = '' }) => {
  // Extract key themes and imagery from lyrics for a unique cover
  const lyricsSnippet = lyrics
    .replace(/\[(verse|chorus|bridge|outro|intro)\]/gi, '') // Remove structure tags
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 8) // Take first 8 lines for context
    .join(' ')
    .substring(0, 500); // Limit length

  const prompt = `Create a unique, artistic album cover for a ${genre || 'music'} song titled "${title || 'Untitled'}". 
The artwork should visually capture the essence and emotions of these lyrics: "${lyricsSnippet}". 
Style: Modern, abstract, emotionally evocative. Use colors and imagery that reflect the mood of the lyrics. 
Professional music album artwork, high quality, visually striking, no text or words on the image.`;

  return generateCoverArt({ prompt });
};

// ==================== VIDEO GENERATION ====================

/**
 * Generate a music video using Google Veo 3 model
 * Videos are 4 seconds and loop continuously
 * 
 * @param {Object} params
 * @param {string} params.prompt - Description of the video to generate
 * @param {string} params.genre - Genre/style for visual context
 * @param {string} params.lyrics - Lyrics for thematic context
 * @returns {Promise<string>} URL to generated video file
 */
export const generateMusicVideo = async ({ prompt, genre = '', lyrics = '' }) => {
  try {
    // Build an enhanced prompt for music video generation
    const lyricsContext = lyrics
      .replace(/\[(verse|chorus|bridge|outro|intro)\]/gi, '')
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 4)
      .join(' ')
      .substring(0, 200);

    const enhancedPrompt = `Music video for a ${genre || 'music'} song. ${prompt}. 
${lyricsContext ? `The mood and theme should reflect: "${lyricsContext}".` : ''}
Cinematic, visually stunning, seamless loop, high quality music video aesthetic.`;

    // Validate API token
    if (!REPLICATE_API_TOKEN || REPLICATE_API_TOKEN === 'undefined') {
      throw new Error('REPLICATE_API_TOKEN is not configured. Please set it in your .env file.');
    }

    const response = await fetch(
      'https://api.replicate.com/v1/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '5e80c73750ffc5dfbe5cee2d694c6ed3da7706660d9132613e6736443b365464',
          input: {
            prompt: enhancedPrompt,
            duration: 4, // 4 seconds for looping
            resolution: '1080p', // High quality 1080p
            aspect_ratio: '16:9', // Horizontal/landscape format
            generate_audio: false, // We have our own audio
          },
        }),
      }
    );

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Replicate API error (${response.status}): ${text.substring(0, 300)}`);
    }

    const prediction = await response.json();
    
    if (prediction.error) {
      throw new Error(prediction.error);
    }

    // Wait for the prediction to complete
    const output = await waitForPrediction(prediction.urls.get);
    
    // Return video URL
    if (typeof output === 'string') {
      return output;
    }
    if (output?.url) {
      return output.url;
    }
    return output;
  } catch (error) {
    console.error('Error generating music video:', error);
    throw error;
  }
};

// ==================== FULL TRACK GENERATION ====================

/**
 * Generate a complete track with music options, cover art, and optional video
 * Runs all generations in parallel for efficiency
 * 
 * @param {Object} params
 * @param {string} params.title - Song title
 * @param {string} params.tags - Genre/style tags for ACE-Step
 * @param {string} params.prompt - Genre/style description for MiniMax
 * @param {string} params.lyrics - Lyrics with structure tags
 * @param {string} params.genre - Genre for cover art
 * @param {number} params.duration - Duration in seconds
 * @param {boolean} params.createVideo - Whether to generate a music video
 * @param {string} params.videoPrompt - Description for the video
 * @returns {Promise<Object>} Complete track data with music options, cover art, and video
 */
export const generateCompleteTrack = async ({ 
  title, 
  tags, 
  prompt, 
  lyrics, 
  genre, 
  duration = 60,
  createVideo = false,
  videoPrompt = '',
}) => {
  try {
    // Build parallel generation tasks
    const tasks = [
      generateMusicOptions({ tags, prompt, lyrics, duration }),
      generateCoverArtFromSong({ title, genre, lyrics }),
    ];

    // Add video generation if requested
    if (createVideo && videoPrompt) {
      tasks.push(generateMusicVideo({ prompt: videoPrompt, genre, lyrics }));
    }

    // Run all generations in parallel
    const results = await Promise.all(tasks);
    
    const [musicOptions, coverArtUrl, videoUrl] = results;

    return {
      title: title || 'Untitled Track',
      genre,
      lyrics,
      duration,
      coverArtUrl,
      musicOptions,
      videoUrl: createVideo ? videoUrl : null,
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
  generateMusicVideo,
  generateCompleteTrack,
};
