declare namespace App {
    namespace Data {
        export type ApiErrorData = {
            success: boolean;
            error: string;
            errors: Array<any> | null;
        };
        export type AuthResponseData = {
            success: boolean;
            token: string | null;
            user: App.Data.UserData | null;
            subscription: App.Data.SubscriptionData | null;
            error: string | null;
        };
        export type ConceptData = {
            id: number;
            title: string;
            description: string | null;
            image_url: string | null;
            sort_order: number;
        };
        export type DomainData = {
            id: string;
            number: number;
            name: string;
            description: string | null;
            weight: number;
            color_hex: string;
        };
        export type FlashcardData = {
            id: number;
            topic_id: number;
            domain_id: string;
            front: string;
            back: string;
            hint: string | null;
            sort_order: number;
        };
        export type QuizData = {
            id: number;
            topic_id: number;
            domain_id: string;
            question: string;
            options: string[];
            correct_index: number;
            explanation: string | null;
            difficulty: string;
            bloom_level: number | null;
            sub_domain_code: string | null;
            source_reference: string | null;
            status: string;
        };
        export type QuizRationaleData = {
            quiz_id: number;
            is_correct: boolean;
            picked_index: number;
            correct_index: number;
            explanation: string | null;
            option_a_rationale: string | null;
            option_b_rationale: string | null;
            option_c_rationale: string | null;
            option_d_rationale: string | null;
            common_trap: string | null;
            memory_hook_topic_id: number | null;
            memory_hook_topic_name: string | null;
        };
        export type SubscriptionData = {
            plan: string | null;
            status: string | null;
            expires_at: string | null;
            days_remaining: number | null;
        };
        export type TopicData = {
            id: number;
            name: string;
            subtitle: string | null;
            overview: string | null;
            image_url: string | null;
            topic_key: string;
            domain_id: string;
            sort_order: number;
            domain: App.Data.DomainData | null;
            concepts: App.Data.ConceptData[] | null;
            extras: App.Data.TopicExtraData[] | null;
            hook_text: string | null;
            hook_image_url: string | null;
            learning_objectives:
                | {
                      verb: string;
                      statement: string;
                      bloom_level: number;
                      sub_domain_code: string | null;
                  }[]
                | null;
            worked_example: any;
            field_application: any;
            mastery_threshold: number;
        };
        export type TopicExtraData = {
            id: number;
            extra_type: string;
            content_json: any;
        };
        export type UserData = {
            id: number;
            email: string;
            name: string;
            role: string;
            email_verified: boolean;
        };
    }
}
