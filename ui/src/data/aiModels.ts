export interface ProviderDef {
  url: string
  models: string[]
  default_model?: string
  api_key?: string
  requires_key?: boolean
}

export interface VirtualProviderDef {
  id: string
  name: string
  type: string
  api_url: string
  api_key: string
  default_model: string
  models: string[]
}

export const OPENCODE_MODELS: string[] = [
  'big-pickle', 'deepseek-v4-flash-free', 'mimo-v2.5-free',
  'qwen3.6-plus-free', 'minimax-m3-free', 'nemotron-3-ultra-free',
  'north-mini-code-free', 'gpt-5-nano', 'gpt-4o-mini',
  'claude-3.5-haiku-free', 'gemini-2.5-flash-free',
  'deepseek-r1-free', 'llama-4-scout-free', 'mistral-large-free',
  'qwen-2.5-72b-free', 'phi-3-medium-free', 'solar-pro-free',
  'command-r-plus-free', 'falcon-180b-free', 'dbrx-instruct-free',
]

export const KEYLESSAI_MODELS: string[] = [
  'openai-fast', 'step-3.5-flash:free', 'gemma3-270m:free',
  'gpt-5-nano', 'gpt-4o-mini', 'gpt-3.5-turbo',
  'claude-3-haiku:free', 'claude-3-sonnet:free',
  'gemini-1.5-flash:free', 'gemini-1.5-pro:free',
  'mistral-small:free', 'mistral-medium:free',
  'llama-3.2-3b:free', 'llama-3.1-8b:free',
  'llama-3.3-70b:free', 'mixtral-8x7b:free',
  'deepseek-coder-33b:free', 'qwen-2.5-32b:free',
  'phi-3-mini:free', 'phi-3-medium:free',
  'yi-34b:free', 'solar-10.7b:free',
]

export const GROQ_MODELS: string[] = [
  'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
  'llama-3.2-3b-preview', 'llama-3.2-1b-preview',
  'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview',
  'mixtral-8x7b-32768', 'gemma2-9b-it', 'gemma-7b-it',
  'llama-guard-3-8b', 'llama3-70b-8192', 'llama3-8b-8192',
  'llama3-groq-70b-8192', 'llama3-groq-8b-8192',
  'deepseek-r1-distill-llama-70b', 'deepseek-r1-distill-qwen-32b',
  'qwen-2.5-32b', 'qwen-2.5-coder-32b',
  'distil-whisper-large-v3-en', 'whisper-large-v3',
  'llama-3.3-70b-specdec', 'llama-3.1-70b-versatile',
  'llama-3.2-11b-vision-instruct', 'llama-3.2-90b-vision-instruct',
]

export const HUGGINGFACE_MODELS: string[] = [
  'meta-llama/Llama-3.2-3B-Instruct',
  'meta-llama/Llama-3.2-1B-Instruct',
  'meta-llama/Llama-3.1-8B-Instruct',
  'meta-llama/Llama-3.1-70B-Instruct',
  'meta-llama/Llama-3.1-405B-Instruct',
  'meta-llama/Llama-3-8B-Instruct',
  'meta-llama/Llama-3-70B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'mistralai/Mixtral-8x22B-Instruct-v0.1',
  'mistralai/Mistral-Small-Instruct-2409',
  'HuggingFaceH4/zephyr-7b-beta',
  'HuggingFaceH4/zephyr-7b-gemma-v0.1',
  'google/gemma-2-9b-it', 'google/gemma-2-27b-it',
  'google/gemma-2-2b-it', 'google/gemma-7b-it',
  'google/gemma-2b-it',
  'microsoft/Phi-3-mini-4k-instruct',
  'microsoft/Phi-3.5-mini-instruct',
  'microsoft/Phi-3-small-8k-instruct',
  'microsoft/Phi-3-medium-4k-instruct',
  'Qwen/Qwen2.5-7B-Instruct',
  'Qwen/Qwen2.5-14B-Instruct',
  'Qwen/Qwen2.5-32B-Instruct',
  'Qwen/Qwen2.5-72B-Instruct',
  'Qwen/Qwen2.5-Coder-7B-Instruct',
  'Qwen/Qwen2.5-Coder-32B-Instruct',
  'Qwen/Qwen2-7B-Instruct', 'Qwen/Qwen2-72B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B',
  'deepseek-ai/deepseek-coder-33b-instruct',
  'tiiuae/falcon-7b-instruct', 'tiiuae/falcon-40b-instruct',
  'tiiuae/falcon-180B-instruct',
  'codellama/CodeLlama-7b-Instruct-hf',
  'codellama/CodeLlama-13b-Instruct-hf',
  'codellama/CodeLlama-34b-Instruct-hf',
  'stabilityai/stablelm-zephyr-3b',
  'openchat/openchat-3.5-0106',
  'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
  'NousResearch/Nous-Hermes-2-Yi-34B',
  'teknium/OpenHermes-2.5-Mistral-7B',
  'upstage/SOLAR-10.7B-Instruct-v1.0',
  'allenai/OLMo-7B-Instruct',
  'CohereForAI/aya-23-8B', 'CohereForAI/aya-23-35B',
  'CohereForAI/command-r-v01',
  'CohereForAI/command-r-plus-08-2024',
  '01-ai/Yi-34B-Chat', '01-ai/Yi-6B-Chat',
  '01-ai/Yi-1.5-9B-Chat', '01-ai/Yi-1.5-34B-Chat',
  'inflection/inflection-2.5',
]

export const CLOUDFLARE_MODELS: string[] = [
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/meta/llama-3.2-1b-instruct',
  '@cf/meta/llama-3.2-11b-vision-instruct',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.1-70b-instruct',
  '@cf/meta/llama-3-8b-instruct',
  '@cf/meta/llama-2-7b-chat-int8',
  '@cf/meta/llama-2-7b-chat-fp16',
  '@cf/meta/llama-2-13b-chat-int8',
  '@cf/mistral/mistral-7b-instruct-v0.1',
  '@cf/mistral/mixtral-8x7b-instruct',
  '@cf/mistral/mistral-7b-instruct-v0.2-lora',
  '@cf/google/gemma-2-9b-it',
  '@cf/google/gemma-7b-it', '@cf/google/gemma-2b-it',
  '@cf/microsoft/phi-3-mini-4k-instruct',
  '@cf/microsoft/phi-2',
  '@cf/qwen/qwen2.5-7b-instruct',
  '@cf/qwen/qwen2.5-14b-instruct',
  '@cf/qwen/qwen2.5-32b-instruct',
  '@cf/qwen/qwen2-7b-instruct',
  '@cf/qwen/qwen1.5-7b-chat-awq',
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
  '@hf/thebloke/mistral-7b-instruct-v0.1-gguf',
  '@hf/thebloke/llama-2-7b-chat-gguf',
  '@hf/thebloke/llama-2-13b-chat-gguf',
  '@hf/thebloke/codellama-7b-instruct-gguf',
  '@hf/thebloke/zephyr-7b-beta-gguf',
  '@hf/thebloke/neural-chat-7b-v3-1-gguf',
  '@cf/tiiuae/falcon-7b-instruct',
  '@cf/tiiuae/falcon-40b-instruct',
  '@cf/stabilityai/stablelm-zephyr-3b',
  '@cf/defog/sqlcoder-7b-2',
  '@cf/openchat/openchat-3.5-0106',
  '@cf/lykon/dolphin-2.2.1-mistral-7b',
  '@cf/undreamai/llamaguard-7b',
]

export const OPENAI_MODELS: string[] = [
  'gpt-4o', 'gpt-4o-mini', 'gpt-4o-audio-preview',
  'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4',
  'gpt-3.5-turbo', 'gpt-3.5-turbo-0125',
  'o1-preview', 'o1-mini', 'o3-mini',
  'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
  'chatgpt-4o-latest',
]

export const GEMINI_MODELS: string[] = [
  'gemini-2.5-pro-exp-03-25', 'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash', 'gemini-2.0-flash-lite',
  'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b',
  'gemini-1.0-pro', 'gemini-pro',
  'gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp-01-21',
  'learnlm-1.5-pro-experimental',
]

export const CLAUDE_MODELS: string[] = [
  'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229', 'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-4-opus', 'claude-4-sonnet',
  'claude-3-5-sonnet-v2', 'claude-3-5-haiku-v2',
]

export const PROVIDER_DEFAULTS: Record<string, ProviderDef> = {
  openai: { url: 'https://api.openai.com', models: OPENAI_MODELS, requires_key: true },
  gemini: { url: '', models: GEMINI_MODELS, requires_key: true },
  claude: { url: '', models: CLAUDE_MODELS, requires_key: true },
  groq: { url: 'https://api.groq.com/openai/v1', models: GROQ_MODELS, default_model: 'llama-3.3-70b-versatile', requires_key: true },
  huggingface: { url: 'https://api-inference.huggingface.co/v1', models: HUGGINGFACE_MODELS, default_model: 'meta-llama/Llama-3.2-3B-Instruct', requires_key: true },
  cloudflare: { url: '', models: CLOUDFLARE_MODELS, default_model: '@cf/meta/llama-3.2-3b-instruct', requires_key: true },
  opencode: { url: 'https://opencode.ai/zen', models: OPENCODE_MODELS, default_model: 'big-pickle', requires_key: false },
  ollama: { url: 'http://localhost:11434', models: [], requires_key: false },
}

export const VIRTUAL_PROVIDERS: VirtualProviderDef[] = [
  {
    id: '__opencode__', name: 'OpenCode Zen', type: 'openai',
    api_url: 'https://opencode.ai/zen', api_key: '',
    default_model: 'big-pickle',
    models: OPENCODE_MODELS,
  },
  {
    id: '__keylessai__', name: 'KeylessAI (free)', type: 'openai',
    api_url: 'https://keylessai.thryx.workers.dev/v1', api_key: 'not-needed',
    default_model: 'openai-fast',
    models: KEYLESSAI_MODELS,
  },
]

export const PROVIDER_TYPES: string[] = ['ollama', 'openai', 'gemini', 'claude', 'opencode', 'groq', 'huggingface', 'cloudflare']
