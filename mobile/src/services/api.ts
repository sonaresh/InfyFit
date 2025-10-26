import { z } from 'zod';
import { API_BASE_URL } from '../utils/constants';

type HttpMethod = 'GET' | 'POST';

interface RequestOptions<TBody> {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

async function request<TResponse, TBody = unknown>({
  path,
  method = 'GET',
  body,
  signal
}: RequestOptions<TBody>): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

const MealScanResponseSchema = z.object({
  meal_id: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      confidence: z.number(),
      calories: z.number()
    })
  ),
  total_calories: z.number(),
  confidence: z.number()
});

export type MealScanResponse = z.infer<typeof MealScanResponseSchema>;

export const mealScanApi = {
  async analyseImage(base64Image: string, signal?: AbortSignal) {
    const result = await request<MealScanResponse, { image: string }>({
      path: '/scan/meal',
      method: 'POST',
      body: { image: base64Image },
      signal
    });

    return MealScanResponseSchema.parse(result);
  }
};

const ProductCandidateSchema = z.object({
  name: z.string(),
  brand: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  ingredients: z.array(z.string())
});

const ProductScanResultSchema = z.object({
  candidate: ProductCandidateSchema,
  confidence: z.string(),
  lookup_strategy: z.string()
});

export type ProductScanResult = z.infer<typeof ProductScanResultSchema>;

const ProductScoreSchema = z.object({
  name: z.string(),
  brand: z.string().nullable().optional(),
  health_score: z.number(),
  reason: z.string(),
  better_alternatives: z.array(z.string()),
  nutrients: z.object({
    calories: z.number(),
    protein: z.number(),
    fat: z.number(),
    carbs: z.number(),
    serving_size_g: z.number()
  })
});

export type ProductScore = z.infer<typeof ProductScoreSchema>;

export const productApi = {
  async scan(requestBody: { barcode?: string; label_text?: string }, signal?: AbortSignal) {
    const result = await request<ProductScanResult, typeof requestBody>({
      path: '/scan/product',
      method: 'POST',
      body: requestBody,
      signal
    });
    return ProductScanResultSchema.parse(result);
  },
  async resolve(requestBody: { barcode?: string; ocr_text?: string; dietary_flags?: string[] }, signal?: AbortSignal) {
    const result = await request<ProductScore, typeof requestBody>({
      path: '/product/resolve',
      method: 'POST',
      body: requestBody,
      signal
    });
    return ProductScoreSchema.parse(result);
  }
};

const WorkoutPlanVariantSchema = z.object({
  label: z.string(),
  duration_minutes: z.number(),
  intensity: z.string(),
  estimated_burn_calories: z.number()
});

const WorkoutPlanSchema = z.object({
  options: z.array(WorkoutPlanVariantSchema)
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export const workoutApi = {
  async getPlan(signal?: AbortSignal) {
    const result = await request<WorkoutPlan, { goal: string; recent_intake: number; steps_today: number; sleep_quality: string }>(
      {
        path: '/workout/plan',
        method: 'POST',
        body: {
          goal: 'recomposition',
          recent_intake: 1900,
          steps_today: 6000,
          sleep_quality: 'good'
        },
        signal
      }
    );
    return WorkoutPlanSchema.parse(result);
  },
  async completeWorkout(variantId: string, signal?: AbortSignal) {
    return request<void, { event_name: string; duration_ms: number; metadata: Record<string, unknown> }>(
      {
        path: '/telemetry',
        method: 'POST',
        body: {
          event_name: 'workout_complete',
          duration_ms: 0,
          metadata: { variant_id: variantId }
        },
        signal
      }
    );
  }
};

const CoachCardSchema = z.object({
  title: z.string(),
  body: z.string(),
  category: z.string(),
  generated_for: z.string()
});

export type CoachCard = z.infer<typeof CoachCardSchema>;

export const coachApi = {
  async getToday(signal?: AbortSignal) {
    const result = await request<CoachCard, { day: string; total_calories: number; steps: number; sleep_quality: string }>(
      {
        path: '/coach/card',
        method: 'POST',
        body: {
          day: new Date().toISOString().slice(0, 10),
          total_calories: 1950,
          steps: 7200,
          sleep_quality: 'good'
        },
        signal
      }
    );

    return CoachCardSchema.parse(result);
  }
};

export const syncApi = {
  async push(queueSize: number, signal?: AbortSignal) {
    return request<void, { queue_size: number }>({
      path: '/sync/offline',
      method: 'POST',
      body: { queue_size: queueSize },
      signal
    });
  }
};
