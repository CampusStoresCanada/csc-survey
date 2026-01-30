export type QuestionType =
  | 'text'
  | 'textarea'
  | 'scale'
  | 'rating_group';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: {
    min?: number;
    max?: number;
    labels?: Record<string, string>;
    items?: string[]; // For rating groups
    includeNotAttended?: boolean; // For rating groups - adds "I didn't attend" option
  };
}

export interface SurveyPage {
  title: string;
  questions: Question[];
}

export interface SurveyConfig {
  delegate: SurveyPage[];
  exhibitor: SurveyPage[];
}

// Delegate flow: Overall thoughts → Logistics → Content → Final thoughts
// Exhibitor flow: Overall thoughts → Logistics 1 → Logistics 2 → Final thoughts

export const conference2026Survey: SurveyConfig = {
  delegate: [
    // Page 1: Overall thoughts & what stood out
    {
      title: 'Overall Thoughts',
      questions: [
        {
          id: 'overall_experience',
          type: 'scale',
          question: 'Overall, how was the conference for you?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'what_worked',
          type: 'textarea',
          question: 'What aspects of the conference were most valuable to you?',
          required: false
        },
        {
          id: 'waste_of_time',
          type: 'textarea',
          question: 'What aspects of the conference could be improved or eliminated?',
          required: false
        },
        {
          id: 'what_was_missing',
          type: 'textarea',
          question: 'What topics, sessions, or services were missing from the conference?',
          required: false
        }
      ]
    },
    // Page 2: Logistics
    {
      title: 'Logistics',
      questions: [
        {
          id: 'venue_rating',
          type: 'scale',
          question: 'How would you rate the venue?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'hotel_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the hotel?',
          required: false
        },
        {
          id: 'food_rating',
          type: 'scale',
          question: 'How would you rate the food?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'food_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the food?',
          required: false
        },
        {
          id: 'schedule_rating',
          type: 'scale',
          question: 'How would you rate the schedule?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'schedule_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the schedule?',
          required: false
        }
      ]
    },
    // Page 3: Content
    {
      title: 'Content',
      questions: [
        {
          id: 'sessions_rating',
          type: 'rating_group',
          question: 'Please rate the sessions you attended:',
          required: false,
          options: {
            items: [
              "Manager's & Director's Summit",
              'Meet & Greet Event',
              'JCWG Benchmarking Session',
              'Custom Orders Session',
              'Disrupt & Delight Session',
              'Hot Products Session',
              'Speed Pitch Session',
              'Trade Show'
            ],
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            },
            includeNotAttended: true
          }
        },
        {
          id: 'sessions_feedback',
          type: 'textarea',
          question: 'Did you have any feedback on any of the above sessions?',
          required: false
        }
      ]
    },
    // Page 4: Final thoughts
    {
      title: 'Final Thoughts',
      questions: [
        {
          id: 'one_thing_change',
          type: 'textarea',
          question: "If you were planning the 2027 conference, what changes would you make?",
          required: false
        },
        {
          id: 'honest_feedback',
          type: 'textarea',
          question: "Please share any additional feedback or suggestions you have for future conferences:",
          required: false
        }
      ]
    }
  ],
  exhibitor: [
    // Page 1: Overall thoughts
    {
      title: 'Overall Thoughts',
      questions: [
        {
          id: 'overall_experience',
          type: 'scale',
          question: 'Overall, how was the conference for you?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        }
      ]
    },
    // Page 2: Logistics 1
    {
      title: 'Logistics',
      questions: [
        {
          id: 'venue_rating',
          type: 'scale',
          question: 'How would you rate the venue?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'hotel_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the hotel?',
          required: false
        },
        {
          id: 'food_rating',
          type: 'scale',
          question: 'How would you rate the food?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'food_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the food?',
          required: false
        },
        {
          id: 'schedule_rating',
          type: 'scale',
          question: 'How would you rate the schedule?',
          required: true,
          options: {
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'schedule_feedback',
          type: 'textarea',
          question: 'Any specific feedback about the schedule?',
          required: false
        }
      ]
    },
    // Page 3: Logistics 2 (Services)
    {
      title: 'Logistics',
      questions: [
        {
          id: 'services_rating',
          type: 'rating_group',
          question: 'Let us know what you thought about the following:',
          required: false,
          options: {
            items: [
              'Sign up',
              'Your booth',
              'The name badges',
              'The map',
              'Communication with CSC',
              'Stronco (set up)',
              'Encore (lighting/electrical/AV)'
            ],
            min: 1,
            max: 5,
            labels: {
              '1': 'Poor',
              '2': 'Fair',
              '3': 'Good',
              '4': 'Very Good',
              '5': 'Excellent'
            }
          }
        },
        {
          id: 'services_feedback',
          type: 'textarea',
          question: 'Did you have any feedback on any of the above services from the conference?',
          required: false
        }
      ]
    },
    // Page 4: Final thoughts
    {
      title: 'Final Thoughts',
      questions: [
        {
          id: 'one_thing_change',
          type: 'textarea',
          question: "If you were planning the 2027 conference, what changes would you make?",
          required: false
        },
        {
          id: 'honest_feedback',
          type: 'textarea',
          question: "Please share any additional feedback or suggestions you have for future conferences:",
          required: false
        }
      ]
    }
  ]
};
