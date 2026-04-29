// Literal narrowings + module-style aliases for the generated DTOs.
// generated.d.ts is auto-emitted from PHP; this file is hand-maintained
// to add the unions the transformer can't infer from constructor docblocks.
//
// Consumers should import from this file:
//   import type { User, Topic, Concept, AuthResponse } from '...types/api'
//
// Re-run `composer types` (or `php artisan typescript:transform`) when the
// PHP DTOs in app/Data/ change shape.

/// <reference path="./generated.d.ts" />

declare namespace ApiLiterals {
  type Role = 'user' | 'admin' | 'superadmin';
  type Plan = 'demo' | 'monthly' | 'sixmonth' | 'yearly';
  type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';
  type ExtraType = 'mnemonic' | 'examtip' | 'formula' | 'regulation' | 'chapter' | 'diagram';
  type QuizDifficulty = 'easy' | 'medium' | 'hard';
}

// Re-export with cleaner names + tightened literal types where applicable.
export type Role = ApiLiterals.Role;
export type Plan = ApiLiterals.Plan;
export type SubscriptionStatus = ApiLiterals.SubscriptionStatus;
export type ExtraType = ApiLiterals.ExtraType;
export type QuizDifficulty = ApiLiterals.QuizDifficulty;

export type User = Omit<App.Data.UserData, 'role'> & { role: Role };
export type Domain = App.Data.DomainData;
export type Concept = App.Data.ConceptData;
export type Flashcard = App.Data.FlashcardData;
export type Quiz = Omit<App.Data.QuizData, 'difficulty'> & { difficulty: QuizDifficulty };
export type TopicExtra = Omit<App.Data.TopicExtraData, 'extra_type'> & { extra_type: ExtraType };
export type Topic = Omit<App.Data.TopicData, 'extras'> & { extras: TopicExtra[] | null };
export type Subscription = Omit<App.Data.SubscriptionData, 'plan' | 'status'> & {
  plan: Plan | null;
  status: SubscriptionStatus | null;
};
export type AuthResponse = Omit<App.Data.AuthResponseData, 'user' | 'subscription'> & {
  user: User | null;
  subscription: Subscription | null;
};
export type ApiError = App.Data.ApiErrorData;
