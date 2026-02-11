import { useReducer, useCallback, useEffect } from 'react';
import type { Platform } from '@/config/platforms';
import type { WorkflowStep } from '@/components/common/WorkflowStepper';
import type { ExtractionStage } from '@/api/extract';

// Stage → progress percentage mapping (module-level for reuse without recreation)
const STAGE_PROGRESS: Record<string, number> = {
  idle: 0,
  validating: 15,
  fetching: 40,
  processing: 75,
  complete: 100,
  error: 0,
};

// Types
export interface GeneratedPost {
  content: string;
  platform: Platform;
  isEdited: boolean;
  regenerationCount: number;
  createdAt: Date;
  characterCount: number;
}

export interface PostGeneratorState {
  // Workflow
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];

  // Input
  sourceUrl: string;
  inputText: string;

  // Platform Selection
  selectedPlatforms: Platform[];

  // Generated Content - Now supports multiple posts per platform
  postsByPlatform: Record<Platform, GeneratedPost[]>;

  // Editing State
  editingPost: {
    platform: Platform;
    index: number;
    content: string;
    originalContent: string;
  } | null;

  // Loading States
  isExtracting: boolean;
  isGenerating: Set<Platform>;
  extractionProgress: number;
  extractionStage: ExtractionStage | 'idle';
  generationProgress: {
    current: Platform | null;
    completed: number;
    total: number;
  };

  // Error States
  errors: {
    extraction?: string;
    generation?: Partial<Record<Platform, string>>;
  };

  // Meta
  lastSavedAt?: Date;
  isDirty: boolean;
}

// Action Types
type PostGeneratorAction =
  | { type: 'SET_STEP'; step: WorkflowStep }
  | { type: 'COMPLETE_STEP'; step: WorkflowStep }
  | { type: 'SET_SOURCE_URL'; url: string }
  | { type: 'SET_INPUT_TEXT'; text: string }
  | { type: 'TOGGLE_PLATFORM'; platform: Platform }
  | { type: 'SET_PLATFORMS'; platforms: Platform[] }
  | { type: 'START_EXTRACTION' }
  | { type: 'COMPLETE_EXTRACTION'; content: string }
  | { type: 'FAIL_EXTRACTION'; error: string }
  | { type: 'START_GENERATION'; platform: Platform }
  | { type: 'COMPLETE_GENERATION'; platform: Platform; post: GeneratedPost }
  | { type: 'FAIL_GENERATION'; platform: Platform; error: string }
  | { type: 'SET_GENERATION_PROGRESS'; current: Platform | null; completed: number; total: number }
  | { type: 'SET_EXTRACTION_PROGRESS'; progress: number }
  | { type: 'SET_EXTRACTION_STAGE'; stage: ExtractionStage | 'idle' }
  | { type: 'MARK_SAVED' }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'CLEAR_ERRORS' }
  // New editing actions
  | { type: 'START_EDIT'; platform: Platform; index: number; content: string }
  | { type: 'UPDATE_EDITING_CONTENT'; content: string }
  | { type: 'SAVE_EDIT' }
  | { type: 'CANCEL_EDIT' }
  | { type: 'DELETE_POST'; platform: Platform; index: number }
  | { type: 'REGENERATE_POST'; platform: Platform; index: number };

// Initial State
const initialState: PostGeneratorState = {
  currentStep: 'input',
  completedSteps: [],
  sourceUrl: '',
  inputText: '',
  selectedPlatforms: ['linkedin'],
  postsByPlatform: {
    linkedin: [],
    x: [],
    instagram: [],
  },
  editingPost: null,
  isExtracting: false,
  isGenerating: new Set(),
  extractionProgress: 0,
  extractionStage: 'idle',
  generationProgress: {
    current: null,
    completed: 0,
    total: 0,
  },
  errors: {},
  isDirty: false,
};

// Domain-specific reducer handlers

/**
 * Handles workflow navigation and step management actions.
 * Manages: SET_STEP, COMPLETE_STEP, RESET_WORKFLOW
 */
function handleWorkflowActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.step])] as WorkflowStep[],
      };

    case 'RESET_WORKFLOW':
      return initialState;

    default:
      return null;
  }
}

/**
 * Handles input configuration and platform selection actions.
 * Manages: SET_SOURCE_URL, SET_INPUT_TEXT, TOGGLE_PLATFORM, SET_PLATFORMS
 */
function handleInputActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'SET_SOURCE_URL':
      return {
        ...state,
        sourceUrl: action.url,
        isDirty: true,
      };

    case 'SET_INPUT_TEXT':
      return {
        ...state,
        inputText: action.text,
        isDirty: true,
      };

    case 'TOGGLE_PLATFORM': {
      const platforms = state.selectedPlatforms.includes(action.platform)
        ? state.selectedPlatforms.filter(p => p !== action.platform)
        : [...state.selectedPlatforms, action.platform];
      return {
        ...state,
        selectedPlatforms: platforms,
        isDirty: true,
      };
    }

    case 'SET_PLATFORMS':
      return {
        ...state,
        selectedPlatforms: action.platforms,
        isDirty: true,
      };

    default:
      return null;
  }
}

/**
 * Handles URL extraction lifecycle actions.
 * Manages: START_EXTRACTION, COMPLETE_EXTRACTION, FAIL_EXTRACTION, SET_EXTRACTION_PROGRESS
 */
function handleExtractionActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'START_EXTRACTION':
      return {
        ...state,
        isExtracting: true,
        extractionProgress: 0,
        extractionStage: 'idle',
        errors: { ...state.errors, extraction: undefined },
      };

    case 'COMPLETE_EXTRACTION':
      return {
        ...state,
        inputText: action.content,
        isExtracting: false,
        extractionProgress: 100,
        extractionStage: 'complete',
        completedSteps: [...new Set([...state.completedSteps, 'input'])] as WorkflowStep[],
        currentStep: 'generate',
        errors: { ...state.errors, extraction: undefined },
      };

    case 'FAIL_EXTRACTION':
      return {
        ...state,
        isExtracting: false,
        extractionProgress: 0,
        extractionStage: 'error',
        errors: { ...state.errors, extraction: action.error },
      };

    case 'SET_EXTRACTION_PROGRESS':
      return {
        ...state,
        extractionProgress: action.progress,
      };

    case 'SET_EXTRACTION_STAGE':
      return {
        ...state,
        extractionStage: action.stage,
        extractionProgress: STAGE_PROGRESS[action.stage] ?? state.extractionProgress,
      };

    default:
      return null;
  }
}

/**
 * Handles AI content generation lifecycle actions.
 * Manages: START_GENERATION, COMPLETE_GENERATION, FAIL_GENERATION, SET_GENERATION_PROGRESS
 */
function handleGenerationActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'START_GENERATION': {
      const newGenerating = new Set(state.isGenerating);
      newGenerating.add(action.platform);
      return {
        ...state,
        isGenerating: newGenerating,
        errors: {
          ...state.errors,
          generation: {
            ...state.errors.generation,
            [action.platform]: undefined,
          },
        },
      };
    }

    case 'COMPLETE_GENERATION': {
      const updatedGenerating = new Set(state.isGenerating);
      updatedGenerating.delete(action.platform);

      // Add the new post to postsByPlatform
      const existingPosts = state.postsByPlatform[action.platform] || [];
      const updatedPostsByPlatform = {
        ...state.postsByPlatform,
        [action.platform]: [...existingPosts, action.post],
      };

      // Check if all selected platforms have been generated
      const allGenerated = state.selectedPlatforms.every(
        p => (state.postsByPlatform[p]?.length ?? 0) > 0 || p === action.platform
      );

      return {
        ...state,
        postsByPlatform: updatedPostsByPlatform,
        isGenerating: updatedGenerating,
        completedSteps: allGenerated
          ? [...new Set([...state.completedSteps, 'generate'])] as WorkflowStep[]
          : state.completedSteps,
        currentStep: allGenerated ? 'share' : state.currentStep,
        errors: {
          ...state.errors,
          generation: {
            ...state.errors.generation,
            [action.platform]: undefined,
          },
        },
      };
    }

    case 'FAIL_GENERATION': {
      const failGenerating = new Set(state.isGenerating);
      failGenerating.delete(action.platform);
      return {
        ...state,
        isGenerating: failGenerating,
        errors: {
          ...state.errors,
          generation: {
            ...state.errors.generation,
            [action.platform]: action.error,
          },
        },
      };
    }

    case 'SET_GENERATION_PROGRESS':
      return {
        ...state,
        generationProgress: {
          current: action.current,
          completed: action.completed,
          total: action.total,
        },
      };

    default:
      return null;
  }
}

/**
 * Handles post editing and manipulation actions.
 * Manages: START_EDIT, UPDATE_EDITING_CONTENT, SAVE_EDIT, CANCEL_EDIT, DELETE_POST, REGENERATE_POST
 */
function handlePostEditingActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'START_EDIT':
      return {
        ...state,
        editingPost: {
          platform: action.platform,
          index: action.index,
          content: action.content,
          originalContent: action.content,
        },
      };

    case 'UPDATE_EDITING_CONTENT':
      if (!state.editingPost) return state;
      return {
        ...state,
        editingPost: {
          ...state.editingPost,
          content: action.content,
        },
      };

    case 'SAVE_EDIT': {
      if (!state.editingPost) return state;
      const { platform, index, content } = state.editingPost;
      const updatedPosts = [...(state.postsByPlatform[platform] || [])];

      if (updatedPosts[index]) {
        updatedPosts[index] = {
          ...updatedPosts[index],
          content,
          isEdited: true,
          characterCount: content.length,
        };
      }

      return {
        ...state,
        postsByPlatform: {
          ...state.postsByPlatform,
          [platform]: updatedPosts,
        },
        editingPost: null,
        isDirty: true,
      };
    }

    case 'CANCEL_EDIT':
      return {
        ...state,
        editingPost: null,
      };

    case 'DELETE_POST': {
      const postsAfterDelete = [...(state.postsByPlatform[action.platform] || [])];
      postsAfterDelete.splice(action.index, 1);

      return {
        ...state,
        postsByPlatform: {
          ...state.postsByPlatform,
          [action.platform]: postsAfterDelete,
        },
        isDirty: true,
      };
    }

    case 'REGENERATE_POST': {
      const postsToRegenerate = [...(state.postsByPlatform[action.platform] || [])];
      if (postsToRegenerate[action.index]) {
        postsToRegenerate[action.index] = {
          ...postsToRegenerate[action.index],
          regenerationCount: postsToRegenerate[action.index].regenerationCount + 1,
        };
      }

      return {
        ...state,
        postsByPlatform: {
          ...state.postsByPlatform,
          [action.platform]: postsToRegenerate,
        },
      };
    }

    default:
      return null;
  }
}

/**
 * Handles meta actions like saving and error management.
 * Manages: MARK_SAVED, CLEAR_ERRORS
 */
function handleMetaActions(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState | null {
  switch (action.type) {
    case 'MARK_SAVED':
      return {
        ...state,
        lastSavedAt: new Date(),
        isDirty: false,
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {},
      };

    default:
      return null;
  }
}

/**
 * Main reducer that composes domain-specific handlers.
 * Each handler processes its own domain; if it returns null, the action is passed to the next handler.
 * This pattern reduces cyclomatic complexity and makes the reducer easier to test and maintain.
 */
function postGeneratorReducer(
  state: PostGeneratorState,
  action: PostGeneratorAction
): PostGeneratorState {
  return (
    handleWorkflowActions(state, action) ??
    handleInputActions(state, action) ??
    handleExtractionActions(state, action) ??
    handleGenerationActions(state, action) ??
    handlePostEditingActions(state, action) ??
    handleMetaActions(state, action) ??
    state
  );
}

// Hook
export function usePostGeneratorState() {
  const [state, dispatch] = useReducer(postGeneratorReducer, initialState);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.isDirty && state.inputText) {
      const savedState = {
        inputText: state.inputText,
        sourceUrl: state.sourceUrl,
        selectedPlatforms: state.selectedPlatforms,
      };
      localStorage.setItem('postGeneratorDraft', JSON.stringify(savedState));
    }
  }, [state.isDirty, state.inputText, state.sourceUrl, state.selectedPlatforms]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('postGeneratorDraft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.inputText) {
          dispatch({ type: 'SET_INPUT_TEXT', text: parsed.inputText });
        }
        if (parsed.sourceUrl) {
          dispatch({ type: 'SET_SOURCE_URL', url: parsed.sourceUrl });
        }
        if (parsed.selectedPlatforms?.length) {
          dispatch({ type: 'SET_PLATFORMS', platforms: parsed.selectedPlatforms });
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Action creators
  const actions = {
    setStep: useCallback((step: WorkflowStep) => {
      dispatch({ type: 'SET_STEP', step });
    }, []),

    completeStep: useCallback((step: WorkflowStep) => {
      dispatch({ type: 'COMPLETE_STEP', step });
    }, []),

    setSourceUrl: useCallback((url: string) => {
      dispatch({ type: 'SET_SOURCE_URL', url });
    }, []),

    setInputText: useCallback((text: string) => {
      dispatch({ type: 'SET_INPUT_TEXT', text });
    }, []),

    togglePlatform: useCallback((platform: Platform) => {
      dispatch({ type: 'TOGGLE_PLATFORM', platform });
    }, []),

    startExtraction: useCallback(() => {
      dispatch({ type: 'START_EXTRACTION' });
    }, []),

    completeExtraction: useCallback((content: string) => {
      dispatch({ type: 'COMPLETE_EXTRACTION', content });
    }, []),

    failExtraction: useCallback((error: string) => {
      dispatch({ type: 'FAIL_EXTRACTION', error });
    }, []),

    startGeneration: useCallback((platform: Platform) => {
      dispatch({ type: 'START_GENERATION', platform });
    }, []),

    completeGeneration: useCallback((platform: Platform, post: GeneratedPost) => {
      dispatch({ type: 'COMPLETE_GENERATION', platform, post });
    }, []),

    failGeneration: useCallback((platform: Platform, error: string) => {
      dispatch({ type: 'FAIL_GENERATION', platform, error });
    }, []),

    setGenerationProgress: useCallback(
      (current: Platform | null, completed: number, total: number) => {
        dispatch({ type: 'SET_GENERATION_PROGRESS', current, completed, total });
      },
      []
    ),

    setExtractionProgress: useCallback((progress: number) => {
      dispatch({ type: 'SET_EXTRACTION_PROGRESS', progress });
    }, []),

    setExtractionStage: useCallback((stage: ExtractionStage | 'idle') => {
      dispatch({ type: 'SET_EXTRACTION_STAGE', stage });
    }, []),

    markSaved: useCallback(() => {
      dispatch({ type: 'MARK_SAVED' });
    }, []),

    resetWorkflow: useCallback(() => {
      localStorage.removeItem('postGeneratorDraft');
      dispatch({ type: 'RESET_WORKFLOW' });
    }, []),

    clearErrors: useCallback(() => {
      dispatch({ type: 'CLEAR_ERRORS' });
    }, []),

    // Editing actions
    startEdit: useCallback((platform: Platform, index: number, content: string) => {
      dispatch({ type: 'START_EDIT', platform, index, content });
    }, []),

    updateEditingContent: useCallback((content: string) => {
      dispatch({ type: 'UPDATE_EDITING_CONTENT', content });
    }, []),

    saveEdit: useCallback(() => {
      dispatch({ type: 'SAVE_EDIT' });
    }, []),

    cancelEdit: useCallback(() => {
      dispatch({ type: 'CANCEL_EDIT' });
    }, []),

    deletePost: useCallback((platform: Platform, index: number) => {
      dispatch({ type: 'DELETE_POST', platform, index });
    }, []),

    regeneratePost: useCallback((platform: Platform, index: number) => {
      dispatch({ type: 'REGENERATE_POST', platform, index });
    }, []),
  };

  // Computed values
  const computed = {
    canExtract: state.sourceUrl.trim().length > 0,
    canGenerate: state.inputText.trim().length > 0 && state.selectedPlatforms.length > 0,
    hasGeneratedPosts: Object.values(state.postsByPlatform).some(posts => posts.length > 0),
    isGeneratingAny: state.isGenerating.size > 0,
    allPlatformsGenerated: state.selectedPlatforms.every(p => (state.postsByPlatform[p]?.length ?? 0) > 0),
    isEditing: state.editingPost !== null,
    editingPlatform: state.editingPost?.platform,
    editingIndex: state.editingPost?.index,
    hasPostsForPlatform: (platform: Platform) => (state.postsByPlatform[platform]?.length ?? 0) > 0,
    totalPostsCount: Object.values(state.postsByPlatform).reduce((acc, posts) => acc + posts.length, 0),
  };

  return {
    state,
    actions,
    computed,
  };
}