import { v } from "convex/values";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

export const createImageAnalysisJob = mutation({
  args: {
    imageStorageId: v.id("_storage"),
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { imageStorageId, userId } = args;
    const imageUrl = await ctx.storage.getUrl(imageStorageId);
    if (!imageUrl) {
      throw new Error('Image URL not found');
    }
    const jobId: Id<"imageAnalysisJobs"> = await ctx.db.insert("imageAnalysisJobs", {
      imageStorageId,
      imageUrl,
      status: "pending",
      userId: args.userId,
      createdAt: args.date,
    });
    await ctx.scheduler.runAfter(0, internal.analyse.analyzeImage, { jobId, imageUrl });
    return jobId;
  },
});

export const analyzeImage = internalAction({
  args: {
    jobId: v.id("imageAnalysisJobs"),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, imageUrl } = args;

    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert specialized in analyzing food images and estimating protein content. Provide your analysis in JSON format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the meal in this photo. If no food is detected, return a JSON object with a single field 'error' set to 'No food detected'.

                Otherwise, provide the following in JSON format:
                {
                    name: string representing the meal name,
                    totalProteinEstimate: number representing total protein in grams,
                    totalCalories: number representing estimated calories,
                    ingredients: [{
                        name: string representing the ingredient name,
                        weight: number representing estimated weight in grams,
                        proteinPercentage: number representing protein percentage (0-100),
                        calories: number representing estimated calories for the ingredient,
                        aminoAcidMissing: array of strings representing essential amino acids missing
                    }],
                    aminoRecommendation: string suggesting one ingredient to add if profile is incomplete (empty string if complete)
                }
                Be very conservative in protein and weight estimates.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (content) {
        const result = JSON.parse(content);
        if (result.error) {
          result.totalProteinEstimate = 0;
          result.ingredients = [];
        }
        await ctx.runMutation(internal.analyse.storeAnalysisResult, {
          jobId,
          imageUrl,
          result,
          status: result.error ? 'failed' : 'completed',
        });
        return result;
      }
      throw new Error('No content in response');
    } catch (error) {
      console.error('Error analyzing image:', error);
      await ctx.runMutation(internal.analyse.storeAnalysisResult, {
        jobId,
        result: {
          name: "Error",
          totalProteinEstimate: 0,
          totalCalories: 0,
          aminoRecommendation: '',
          ingredients: [],
          error: 'Error analyzing image',
        },
        status: 'failed',
      });
      throw error;
    }
  },
});

export const storeAnalysisResult = internalMutation({
  args: {
    jobId: v.id("imageAnalysisJobs"),
    result: v.object({
      name: v.optional(v.string()),
      totalProteinEstimate: v.number(),
      totalCalories: v.optional(v.number()),
      aminoRecommendation: v.optional(v.string()),
      ingredients: v.array(v.object({
        name: v.string(),
        weight: v.number(),
        proteinPercentage: v.number(),
        calories: v.optional(v.number()),
        aminoAcidMissing: v.optional(v.array(v.string())),
      })),
      error: v.optional(v.string()),
    }),
    imageUrl: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, result, imageUrl, status } = args;

    try {
      // Recalculate totalProteinEstimate based on ingredients to ensure consistency
      const recalculatedProtein = result.ingredients.reduce(
        (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
        0
      );
      
      const updatedResult = {
        ...result,
        totalProteinEstimate: recalculatedProtein
      };

      await ctx.db.patch(jobId, { 
        result: updatedResult, 
        status: status || 'completed',
        imageUrl,
      });      
      
      const job = await ctx.db.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      const userId = job.userId;
      if (updatedResult.totalProteinEstimate) {
        await ctx.runMutation(api.protein.addProteinEntry, {
          userId,
          date: job.createdAt,
          name: updatedResult.name || undefined,
          totalProteinEstimate: updatedResult.totalProteinEstimate,
          totalCalories: updatedResult.totalCalories,
          ingredients: updatedResult.ingredients,
          aminoRecommendation: updatedResult.aminoRecommendation || undefined,
          imageUrl,
          entryMethod: 'image',
        });
      }
    } catch (error) {
      console.error('Error storing analysis result:', error);
      throw error;
    }
  },
});

export const getAnalysisJob = query({
  args: {
    jobId: v.id("imageAnalysisJobs"),
  },
  handler: async (ctx, args) => {
    const { jobId } = args;
    return await ctx.db.get(jobId);
  },
});

export const getRecentAnalysisJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("imageAnalysisJobs")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(3);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createTextAnalysisJob = mutation({
  args: {
    description: v.string(),
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { description, userId, date } = args;
    
    const jobId = await ctx.db.insert("imageAnalysisJobs", {
      status: "pending",
      userId,
      createdAt: date,
    });

    await ctx.scheduler.runAfter(0, internal.analyse.analyzeText, { 
      jobId,
      description,
    });

    return jobId;
  },
});

export const analyzeText = internalAction({
  args: {
    jobId: v.id("imageAnalysisJobs"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, description } = args;

    try {
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert specialized in analyzing food descriptions and estimating protein content. Provide your analysis in JSON format."
          },
          {
            role: "user",
            content: `Analyze this meal description: "${description}"
            
            Provide the following in JSON format:
            {
                name: string representing the meal name,
                totalProteinEstimate: number representing total protein in grams,
                totalCalories: number representing estimated calories,
                ingredients: [{
                    name: string representing the ingredient name,
                    weight: number representing estimated weight in grams,
                    proteinPercentage: number representing protein percentage (0-100),
                    calories: number representing estimated calories for the ingredient,
                    aminoAcidMissing: array of strings representing essential amino acids missing
                }],
                aminoRecommendation: string suggesting one ingredient to add if profile is incomplete (empty string if complete)
            }
            Be very conservative in protein and weight estimates.`
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in response');

      const result = JSON.parse(content);
      if (result.error) {
        result.totalProteinEstimate = 0;
        result.ingredients = [];
      }
      
      await ctx.runMutation(internal.analyse.storeAnalysisResult, {
        jobId,
        result,
        status: result.error ? 'failed' : 'completed',
      });

      return result;
    } catch (error) {
      console.error('Error analyzing text:', error);
      await ctx.runMutation(internal.analyse.storeAnalysisResult, {
        jobId,
        result: {
          name: "Error",
          totalProteinEstimate: 0,
          totalCalories: 0,
          aminoRecommendation: '',
          ingredients: [],
          error: 'Error analyzing text description',
        },
        status: 'failed',
      });
      throw error;
    }
  },
});

export const createFixJob = mutation({
  args: {
    entryId: v.id("proteinEntries"),
    instruction: v.string(),
  },
  handler: async (ctx, args) => {
    const { entryId, instruction } = args;
    
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error('Entry not found');

    const jobId = await ctx.db.insert("fixJobs", {
      entryId,
      userId: entry.userId,
      instruction,
      status: "pending",
      originalEntry: {
        name: entry.name,
        totalProteinEstimate: entry.totalProteinEstimate,
        ingredients: entry.ingredients,
        totalCalories: entry.totalCalories,
        aminoRecommendation: entry.aminoRecommendation,
      },
      createdAt: new Date().toISOString(),
    });

    await ctx.scheduler.runAfter(0, internal.analyse.fixEntryWithAI, { 
      jobId,
      entryId,
      instruction,
    });

    return jobId;
  },
});

export const fixEntryWithAI = internalAction({
  args: {
    jobId: v.id("fixJobs"),
    entryId: v.id("proteinEntries"),
    instruction: v.string(),
  },
  handler: async (ctx, args) => {
    const { jobId, instruction } = args;

    try {
      const job = await ctx.runQuery(api.analyse.getFixJob, { jobId });
      if (!job) throw new Error('Fix job not found');

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert helping to fix and adjust food entries. Provide your corrections in JSON format."
          },
          {
            role: "user",
            content: `Current entry: ${JSON.stringify(job.originalEntry, null, 2)}
            
            User instruction: "${instruction}"
            
            Update the entry based on the user's instruction. Return in JSON format:
            {
                name: string representing the meal name,
                totalProteinEstimate: number representing total protein in grams,
                totalCalories: number representing estimated calories,
                ingredients: [{
                    name: string representing the ingredient name,
                    weight: number representing estimated weight in grams,
                    proteinPercentage: number representing protein percentage (0-100),
                    calories: number representing estimated calories for the ingredient,
                    aminoAcidMissing: array of strings representing essential amino acids missing
                }],
                aminoRecommendation: string suggesting one ingredient to add if profile is incomplete (empty string if complete)
            }
            Be very conservative in protein and weight estimates.
            Preserve existing values when the instruction doesn't affect them.`
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content in response');

      const result = JSON.parse(content);
      
      await ctx.runMutation(internal.analyse.storeFixResult, {
        jobId,
        entryId: args.entryId,
        result,
      });

      return result;
    } catch (error) {
      console.error('Error fixing entry:', error);
      await ctx.runMutation(internal.analyse.updateFixJobStatus, {
        jobId,
        status: 'failed',
      });
      throw error;
    }
  },
});

export const storeFixResult = internalMutation({
  args: {
    jobId: v.id("fixJobs"),
    entryId: v.id("proteinEntries"),
    result: v.object({
      name: v.optional(v.string()),
      totalProteinEstimate: v.number(),
      ingredients: v.array(v.object({
        name: v.string(),
        weight: v.number(),
        proteinPercentage: v.number(),
        calories: v.optional(v.number()),
        aminoAcidMissing: v.optional(v.array(v.string())),
      })),
      totalCalories: v.optional(v.number()),
      aminoRecommendation: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { jobId, entryId, result } = args;

    // Recalculate totalProteinEstimate based on ingredients to ensure consistency
    const recalculatedProtein = result.ingredients.reduce(
      (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
      0
    );
    
    const updatedResult = {
      ...result,
      totalProteinEstimate: recalculatedProtein
    };

    // Update the fix job with the result
    await ctx.db.patch(jobId, {
      status: 'completed',
      result: updatedResult,
    });

    // Update the original entry
    await ctx.db.patch(entryId, {
      name: updatedResult.name,
      totalProteinEstimate: updatedResult.totalProteinEstimate,
      ingredients: updatedResult.ingredients,
      totalCalories: updatedResult.totalCalories,
      aminoRecommendation: updatedResult.aminoRecommendation,
    });
  },
});

export const updateFixJobStatus = internalMutation({
  args: {
    jobId: v.id("fixJobs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
    });
  },
});

export const getFixJob = query({
  args: {
    jobId: v.id("fixJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const getFixJobs = query({
  handler: async (ctx) => {
    // Get jobs from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    return await ctx.db
      .query("fixJobs")
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.and(
            q.gt(q.field("createdAt"), oneHourAgo),
            q.or(
              q.eq(q.field("status"), "completed"),
              q.eq(q.field("status"), "failed")
            )
          )
        )
      )
      .collect();
  },
});
