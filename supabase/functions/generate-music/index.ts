// Supabase Edge Function to proxy Replicate API calls
// This avoids CORS issues and keeps the API key secure on the server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerationRequest {
  action: "generate_music_ace" | "generate_music_minimax" | "generate_cover_art" | "generate_complete";
  tags?: string;
  prompt?: string;
  lyrics?: string;
  duration?: number;
  title?: string;
  genre?: string;
}

// Wait for a prediction to complete
async function waitForPrediction(predictionId: string): Promise<any> {
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const prediction = await response.json();

    if (prediction.status === "succeeded") {
      return prediction.output;
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Prediction ${prediction.status}: ${prediction.error || "Unknown error"}`);
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error("Prediction timed out");
}

// Generate music with ACE-Step model
async function generateMusicAceStep(tags: string, lyrics: string, duration: number = 60): Promise<string> {
  const response = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1",
        input: {
          seed: -1,
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
        },
      }),
    }
  );

  const prediction = await response.json();
  
  if (prediction.error) {
    throw new Error(prediction.error);
  }

  return await waitForPrediction(prediction.id);
}

// Generate music with MiniMax model
async function generateMusicMiniMax(prompt: string, lyrics: string): Promise<string> {
  const response = await fetch(
    "https://api.replicate.com/v1/models/minimax/music-1.5/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          lyrics,
          prompt,
          bitrate: 256000,
          sample_rate: 44100,
          audio_format: "mp3",
        },
      }),
    }
  );

  const prediction = await response.json();
  
  if (prediction.error) {
    throw new Error(prediction.error);
  }

  return await waitForPrediction(prediction.id);
}

// Generate cover art with Seedream-4
async function generateCoverArt(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api.replicate.com/v1/models/bytedance/seedream-4/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          size: "1K",
          width: 1024,
          height: 1024,
          prompt: `Album cover art: ${prompt}. Professional music album artwork, high quality, artistic, visually striking.`,
          max_images: 1,
          image_input: [],
          aspect_ratio: "1:1",
          enhance_prompt: true,
          sequential_image_generation: "disabled",
        },
      }),
    }
  );

  const prediction = await response.json();
  
  if (prediction.error) {
    throw new Error(prediction.error);
  }

  const output = await waitForPrediction(prediction.id);
  
  // Return first image URL
  if (Array.isArray(output) && output[0]) {
    return typeof output[0] === "string" ? output[0] : output[0].url || output[0];
  }
  return output;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    const body: GenerationRequest = await req.json();
    let result: any;

    switch (body.action) {
      case "generate_music_ace":
        result = await generateMusicAceStep(
          body.tags || "",
          body.lyrics || "",
          body.duration || 60
        );
        break;

      case "generate_music_minimax":
        result = await generateMusicMiniMax(
          body.prompt || "",
          body.lyrics || ""
        );
        break;

      case "generate_cover_art":
        const coverPrompt = body.genre 
          ? `${body.genre} music album cover for a song called "${body.title || "Untitled"}". Abstract, artistic, modern design.`
          : body.prompt || "Abstract music album cover";
        result = await generateCoverArt(coverPrompt);
        break;

      case "generate_complete":
        // Run all three in parallel
        const [aceOutput, minimaxOutput, coverArtUrl] = await Promise.all([
          generateMusicAceStep(body.tags || "", body.lyrics || "", body.duration || 60),
          generateMusicMiniMax(body.prompt || "", body.lyrics || ""),
          generateCoverArt(
            `${body.genre || "Music"} album cover for "${body.title || "Untitled"}". Abstract, artistic, modern design.`
          ),
        ]);

        result = {
          title: body.title || "Untitled Track",
          genre: body.genre,
          lyrics: body.lyrics,
          duration: body.duration || 60,
          coverArtUrl,
          musicOptions: {
            option1: {
              url: aceOutput,
              model: "ace-step",
              description: "Electronic/Synth Style",
            },
            option2: {
              url: minimaxOutput,
              model: "minimax",
              description: "Polished/Smooth Style",
            },
          },
        };
        break;

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

